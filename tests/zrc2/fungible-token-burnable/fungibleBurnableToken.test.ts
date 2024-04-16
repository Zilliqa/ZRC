import { expect } from "@jest/globals";
import { scillaJSONParams } from "@zilliqa-js/scilla-json-utils";

import {
  getAccounts,
  runAllTestCases,
} from "../../testutils";

import {
  TX_PARAMS,
  CODE,
  FungibleBurnableToken_ERROR,
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
  TOKEN_INIT_SUPPLY,
} from "./config";
import { GENESIS_PRIVATE_KEY, JEST_WORKER_ID, zilliqa } from "../../globalConfig";

let globalContractAddress: string | undefined;

let globalTestAccounts: Array<{
  privateKey: string;
  address: string;
}> = [];
const CONTRACT_OWNER = 0;
const TOKEN_OWNER = 0;
const STRANGER_1 = 1;
const STRANGER_2 = 2;
const STRANGER_1_INITIAL_TOKENS = 1000;
const getTestAddr = (index) => globalTestAccounts[index]?.address as string;

beforeAll(async () => {
  globalTestAccounts = await getAccounts(4);

  console.table({
    JEST_WORKER_ID,
    GENESIS_PRIVATE_KEY,
    CONTRACT_OWNER: getTestAddr(CONTRACT_OWNER),
    TOKEN_OWNER: getTestAddr(TOKEN_OWNER),
    STRANGER_1: getTestAddr(STRANGER_1),
    STRANGER_2: getTestAddr(STRANGER_2),
  });
});

beforeEach(async () => {
  zilliqa.wallet.setDefault(getTestAddr(CONTRACT_OWNER));
  const init = scillaJSONParams({
    _scilla_version: ["Uint32", 0],
    contract_owner: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
    name: ["String", TOKEN_NAME],
    symbol: ["String", TOKEN_SYMBOL],
    decimals: ["Uint32", TOKEN_DECIMALS],
    init_supply: ["Uint128", TOKEN_INIT_SUPPLY],
  });
  const [contractDeploymentTransaction, contract] = await zilliqa.contracts
    .new(CODE, init)
    .deploy(TX_PARAMS, 33, 1000, true);
  globalContractAddress = contract.address;

  if (globalContractAddress === undefined) {
    throw new Error(JSON.stringify({
      message: "Failed to deploy FungibleToken-Burnable contract",
      receipt: contractDeploymentTransaction.getReceipt()
    }));
  }

  let stranger1InitialTokenTransferTx: any = await zilliqa.contracts.at(globalContractAddress).call(
    "Transfer",
    scillaJSONParams({
      to: ["ByStr20", getTestAddr(STRANGER_1)],
      amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
    }),
    TX_PARAMS
  );

  if (!stranger1InitialTokenTransferTx.receipt.success) {
    throw new Error("Initial transfer fund to STRANGER_1 failed");
  }
});

describe("Burn", () => {
  runAllTestCases(
    [
      {
        name: "throws CodeInsufficientFunds if not enough funds",
        transition: "Burn",
        getSender: () => getTestAddr(STRANGER_1),
        getParams: () => ({
          amount: ["Uint128", STRANGER_1_INITIAL_TOKENS * 2],
        }),
        error: FungibleBurnableToken_ERROR.CodeInsufficientFunds,
        want: undefined,
      },
      {
        name: "successfuly burns tokens",
        transition: "Burn",
        getSender: () => getTestAddr(STRANGER_1),
        getParams: () => ({
          amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
        }),
        error: undefined,
        want: {
          expectState: (state) => {
            expect(
              state.total_supply
            ).toEqual(`${TOKEN_INIT_SUPPLY - STRANGER_1_INITIAL_TOKENS}`);
          },
          events: [
            {
              name: "Burnt",
              getParams: () => ({
                burner: ["ByStr20", getTestAddr(STRANGER_1)],
                burn_account: ["ByStr20", getTestAddr(STRANGER_1)],
                amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
              }),
            },
          ],
          transitions: [
            {
              tag: "BurnSuccessCallBack",
              getParams: () => ({
                burner: ["ByStr20", getTestAddr(STRANGER_1)],
                amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
              }),
            },
          ],
        },
      },
    ],
    () => globalContractAddress!,
    TX_PARAMS
  )
});

describe("Transfer", () => {
  runAllTestCases(
    [
      {
        name: "throws CodeInsufficientFunds if not enough funds",
        transition: "Transfer",
        getSender: () => getTestAddr(STRANGER_1),
        getParams: () => ({
          to: ["ByStr20", getTestAddr(STRANGER_2)],
          amount: ["Uint128", STRANGER_1_INITIAL_TOKENS * 2],
        }),
        error: FungibleBurnableToken_ERROR.CodeInsufficientFunds,
        want: undefined,
      },
      {
        name: "successfuly transfer tokens",
        transition: "Transfer",
        getSender: () => getTestAddr(STRANGER_1),
        getParams: () => ({
          to: ["ByStr20", getTestAddr(STRANGER_2)],
          amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
        }),
        error: undefined,
        want: {
          expectState: (state) => {
            expect(
              state.total_supply
            ).toEqual(`${TOKEN_INIT_SUPPLY}`);

            console.log("balanceeees", state.balances);
          },
          events: [
            {
              name: "TransferSuccess",
              getParams: () => ({
                sender: ["ByStr20", getTestAddr(STRANGER_1)],
                recipient: ["ByStr20", getTestAddr(STRANGER_2)],
                amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
              }),
            },
          ],
          transitions: [
            {
              tag: "RecipientAcceptTransfer",
              getParams: () => ({
                sender: ["ByStr20", getTestAddr(STRANGER_1)],
                recipient: ["ByStr20", getTestAddr(STRANGER_2)],
                amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
              }),
            },
            {
              tag: "TransferSuccessCallBack",
              getParams: () => ({
                sender: ["ByStr20", getTestAddr(STRANGER_1)],
                recipient: ["ByStr20", getTestAddr(STRANGER_2)],
                amount: ["Uint128", STRANGER_1_INITIAL_TOKENS],
              }),
            },
          ],
        },
      },
    ],
    () => globalContractAddress!,
    TX_PARAMS
  )
});
