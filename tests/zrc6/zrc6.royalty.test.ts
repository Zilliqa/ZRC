import { Zilliqa } from "@zilliqa-js/zilliqa";
import { expect } from "@jest/globals";

import {
  genAccounts,
  toErrorMsg,
  toMsgParam,
  useContractInfo,
  checkTransitions,
  checkEvents,
} from "./testutil";

import {
  CONTAINER,
  API,
  TX_PARAMS,
  CODE,
  CODE_PATH,
  GAS_LIMIT,
  ZRC6_ERROR,
  TOKEN_NAME,
  TOKEN_SYMBOL,
  SAMPLE_TOKEN_URIS,
  FAUCET_PARAMS,
} from "./config";

const JEST_WORKER_ID = Number(process.env.JEST_WORKER_ID);
const GENESIS_PRIVATE_KEY = global.GENESIS_PRIVATE_KEYS[JEST_WORKER_ID - 1];

const zilliqa = new Zilliqa(API);
zilliqa.wallet.addByPrivateKey(GENESIS_PRIVATE_KEY);

let globalContractInfo;
let globalContractAddress;

let globalTestAccounts: Array<{
  privateKey: string;
  address: string;
}> = [];
const CONTRACT_OWNER = 0;
const TOKEN_OWNER = 0;
const STRANGER = 9;

const toTestAddr = (index) => globalTestAccounts[index].address;

beforeAll(async () => {
  const accounts = genAccounts(10);
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
  globalTestAccounts = accounts;

  console.table({
    JEST_WORKER_ID,
    GENESIS_PRIVATE_KEY,
    CONTRACT_OWNER: toTestAddr(CONTRACT_OWNER),
    TOKEN_OWNER: toTestAddr(TOKEN_OWNER),
    STRANGER: toTestAddr(STRANGER),
  });

  globalContractInfo = await useContractInfo(CONTAINER, CODE_PATH, GAS_LIMIT);
});

beforeEach(async () => {
  zilliqa.wallet.setDefault(toTestAddr(CONTRACT_OWNER));
  const init = globalContractInfo.getInitParams(
    toTestAddr(CONTRACT_OWNER),
    TOKEN_NAME,
    TOKEN_SYMBOL
  );
  const [, contract] = await zilliqa.contracts
    .new(CODE, init)
    .deploy(TX_PARAMS, 33, 1000, true);
  globalContractAddress = contract.address;

  if (globalContractAddress === undefined) {
    throw new Error();
  }

  const tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )(
    "BatchMint",
    [toTestAddr(TOKEN_OWNER), toTestAddr(TOKEN_OWNER), toTestAddr(TOKEN_OWNER)],
    SAMPLE_TOKEN_URIS
  );
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Royalty", () => {
  it("gets royalty info", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          token_id: "999",
          sale_price: "1000",
        },
        error: ZRC6_ERROR.NotFoundError,
        want: undefined,
      },
      {
        sender: toTestAddr(STRANGER),
        params: {
          token_id: "1",
          sale_price: "1000",
        },
        error: undefined,
        want: {
          events: undefined,
          transitions: [
            {
              tag: "ZRC6_RoyaltyInfoCallback",
              params: [
                toMsgParam(
                  "ByStr20",
                  toTestAddr(CONTRACT_OWNER),
                  "royalty_recipient"
                ),
                toMsgParam("Uint256", 100, "royalty_amount"),
              ],
            },
          ],
        },
      },
      {
        sender: toTestAddr(STRANGER),
        params: {
          token_id: "1",
          sale_price: "10",
        },
        error: undefined,
        want: {
          events: undefined,
          transitions: [
            {
              tag: "ZRC6_RoyaltyInfoCallback",
              params: [
                toMsgParam(
                  "ByStr20",
                  toTestAddr(CONTRACT_OWNER),
                  "royalty_recipient"
                ),
                toMsgParam("Uint256", 1, "royalty_amount"),
              ],
            },
          ],
        },
      },
      {
        sender: toTestAddr(STRANGER),
        params: {
          token_id: "1",
          sale_price: "1",
        },
        error: undefined,
        want: {
          events: undefined,
          transitions: [
            {
              tag: "ZRC6_RoyaltyInfoCallback",
              params: [
                toMsgParam(
                  "ByStr20",
                  toTestAddr(CONTRACT_OWNER),
                  "royalty_recipient"
                ),
                toMsgParam("Uint256", 0, "royalty_amount"),
              ],
            },
          ],
        },
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )("RoyaltyInfo", ...Object.values(testCase.params));

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        checkEvents(tx.receipt.event_logs, testCase.want.events, expect);
        checkTransitions(
          tx.receipt.transitions,
          testCase.want.transitions,
          expect
        );
      }
    }
  });

  it("sets royalty fee BPS", async () => {
    const initialFeeBps = "1000";

    const state = await zilliqa.contracts.at(globalContractAddress).getState();
    expect(state.royalty_fee_bps).toBe(initialFeeBps);

    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          feeBps: "1000",
        },
        error: ZRC6_ERROR.NotContractOwnerError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          feeBps: "10001",
        },
        error: ZRC6_ERROR.InvalidFeeBpsError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          feeBps: "0",
        },
        error: ZRC6_ERROR.InvalidFeeBpsError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          feeBps: "10000",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetRoyaltyFeeBPSSuccess",
              params: [toMsgParam("Uint256", 10000, "royalty_fee_bps")],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetRoyaltyFeeBPSCallback",
              params: [toMsgParam("Uint256", 10000, "royalty_fee_bps")],
            },
          ],
        },
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          feeBps: "1",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetRoyaltyFeeBPSSuccess",
              params: [toMsgParam("Uint256", 1, "royalty_fee_bps")],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetRoyaltyFeeBPSCallback",
              params: [toMsgParam("Uint256", 1, "royalty_fee_bps")],
            },
          ],
        },
      },
    ];
    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )("SetRoyaltyFeeBPS", ...Object.values(testCase.params));
      if (testCase.want === undefined) {
        // Nagative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        checkEvents(tx.receipt.event_logs, testCase.want.events, expect);
        checkTransitions(
          tx.receipt.transitions,
          testCase.want.transitions,
          expect
        );

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(state.royalty_fee_bps).toBe(testCase.params.feeBps);
      }
    }
  });

  it("sets a new royalty recipient", async () => {
    const oldRecipient = toTestAddr(CONTRACT_OWNER);

    let state = await zilliqa.contracts.at(globalContractAddress).getState();
    expect(state.royalty_recipient).toBe(oldRecipient.toLowerCase());

    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          to: toTestAddr(STRANGER),
        },
        error: ZRC6_ERROR.NotContractOwnerError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(STRANGER),
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetRoyaltyRecipientSuccess",
              params: [
                toMsgParam(
                  "ByStr20",
                  toTestAddr(STRANGER),
                  "royalty_recipient"
                ),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetRoyaltyRecipientCallback",
              params: [
                toMsgParam(
                  "ByStr20",
                  toTestAddr(STRANGER),
                  "royalty_recipient"
                ),
              ],
            },
          ],
        },
      },
    ];
    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )("SetRoyaltyRecipient", ...Object.values(testCase.params));
      if (testCase.want === undefined) {
        // Nagative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        checkEvents(tx.receipt.event_logs, testCase.want.events, expect);
        checkTransitions(
          tx.receipt.transitions,
          testCase.want.transitions,
          expect
        );

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(state.royalty_recipient).toBe(testCase.params.to.toLowerCase());
      }
    }
  });
});
