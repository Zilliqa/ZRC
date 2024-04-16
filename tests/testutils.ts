import { scillaJSONParams } from "@zilliqa-js/scilla-json-utils";
import { getAddressFromPrivateKey, schnorr } from "@zilliqa-js/zilliqa";
import { FAUCET_PARAMS, zilliqa } from "./globalConfig";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function getAccounts(numberOfAccounts: number) {
  const accounts = Array.from({ length: numberOfAccounts }, schnorr.generatePrivateKey).map(
    (privateKey) => ({
      privateKey,
      address: getAddressFromPrivateKey(privateKey),
    })
  );

  for (const { privateKey, address } of accounts) {
    zilliqa.wallet.addByPrivateKey(privateKey);
    const tx = await zilliqa.blockchain.createTransaction(
      zilliqa.transactions.new(
        {
          ...FAUCET_PARAMS,
          toAddr: address,
        },
        false
      )
    );
    if (!tx.getReceipt()?.success) {
      throw new Error();
    }
  }

  return accounts;
}

export type ContractTestCaseDefinition = {
  name: string,
  transition: string,
  getSender: () => string,
  getParams: () => Record<string, Array<unknown>>,
  error: number | undefined,
  want: {
    expectState: (state: any) => void,
    events: Array<{
      name: string,
      getParams: () => Record<string, Array<unknown>>,
    }>,
    transitions: Array<{
      tag: string,
      getParams: () => Record<string, Array<unknown>>,
    }>,
  } | undefined,
}

export const expectEvents = (events, want) => {
  if (events === undefined) {
    expect(undefined).toBe(want);
  }

  for (const [index, event] of events.entries()) {
    expect(event._eventname).toBe(want[index].name);
    const wantParams = scillaJSONParams(want[index].getParams());
    expect(JSON.stringify(event.params)).toBe(JSON.stringify(wantParams));
  }
};

export const expectTransitions = (
  receiptTransitions: Array<{ msg: { params: any } }> | undefined,
  expectedTransitions: Array<{
    tag: string,
    getParams: () => Record<string, Array<unknown>>,
  }>
) => {
  if (!receiptTransitions && expectedTransitions.length > 0) {
    fail("Expected transitions but got none");
    return;
  }

  expect(receiptTransitions!.length).toBe(expectedTransitions.length);

  for (const [index, transition] of receiptTransitions!.entries()) {
    const { msg } = transition;
    expect(expectedTransitions[index]!.tag).toBe(expectedTransitions[index]!.tag);
    const wantParams = scillaJSONParams(expectedTransitions[index]!.getParams());
    expect(JSON.stringify(msg.params)).toBe(JSON.stringify(wantParams));
  }
};

export const getErrorMsg = (code) =>
  `Exception thrown: (Message [(_exception : (String "Error")) ; (code : (Int32 ${code}))])`;

export function runAllTestCases(
  testCases: Array<ContractTestCaseDefinition>,
  testedContractAddress: () => string,
  txParams: any
) {
  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      zilliqa.wallet.setDefault(testCase.getSender());
      const tx: any = await zilliqa.contracts
        .at(testedContractAddress())
        .call(
          testCase.transition,
          scillaJSONParams(testCase.getParams()),
          txParams
        );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          getErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        expectEvents(tx.receipt.event_logs, testCase.want.events);
        expectTransitions(tx.receipt.transitions, testCase.want.transitions);

        const state = await zilliqa.contracts
          .at(testedContractAddress())
          .getState();

        testCase.want.expectState(state);
      }
    });
  }
}