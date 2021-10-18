import { Zilliqa } from "@zilliqa-js/zilliqa";
import { expect } from "@jest/globals";

import {
  genAccounts,
  toErrorMsg,
  toMsgParam,
  useContractInfo,
  verifyTransitions,
  verifyEvents,
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
  FAUCET_PARAMS,
  BASE_URI,
  INITIAL_TOTAL_SUPPLY,
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
    Array.from({ length: INITIAL_TOTAL_SUPPLY }, () => toTestAddr(TOKEN_OWNER))
  );
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Token", () => {
  const testCases = [
    {
      name: "throws not found error",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "999",
        sale_price: "1000",
      }),
      error: ZRC6_ERROR.NotFoundError,
      want: undefined,
    },
    {
      name: "gets royalty info: (1, 1000) => 100",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
        sale_price: "1000",
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            getParams: () => [
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
      name: "gets royalty info: (1, 10) => 1",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
        sale_price: "10",
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            getParams: () => [
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
      name: "gets royalty info: (1, 1) => 0",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
        sale_price: "1",
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            getParams: () => [
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
    {
      name: "gets empty string for token URI as base URI is empty string",
      transition: "TokenURI",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
      }),
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [toMsgParam("String", "", "token_uri")],
            tag: "ZRC6_TokenURICallback",
          },
        ],
      },
    },
    {
      name: "throws not found error",
      transition: "TokenURI",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "999",
      }),
      want: undefined,
      error: ZRC6_ERROR.NotFoundError,
    },
    {
      name: "throws not found error",
      transition: "OwnerOf",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "999",
      }),
      want: undefined,
      error: ZRC6_ERROR.NotFoundError,
    },
    {
      name: "gets token owner",
      transition: "OwnerOf",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
      }),
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "token_owner"),
            ],
            tag: "ZRC6_OwnerOfCallback",
          },
        ],
      },
      error: ZRC6_ERROR.NotFoundError,
    },
    {
      name: "gets token name",
      transition: "Name",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({}),
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [toMsgParam("String", TOKEN_NAME, "name")],
            tag: "ZRC6_NameCallback",
          },
        ],
      },
    },
    {
      name: "gets token symbol",
      transition: "Symbol",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({}),
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [toMsgParam("String", TOKEN_SYMBOL, "symbol")],
            tag: "ZRC6_SymbolCallback",
          },
        ],
      },
    },
    {
      name: "gets total supply",
      transition: "TotalSupply",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({}),
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [
              toMsgParam("Uint256", INITIAL_TOTAL_SUPPLY, "total_supply"),
            ],
            tag: "ZRC6_TotalSupplyCallback",
          },
        ],
      },
    },
    {
      name: "gets balance of token owner",
      transition: "BalanceOf",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        address: toTestAddr(CONTRACT_OWNER),
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_BalanceOfCallback",
            getParams: () => [toMsgParam("Uint256", 3, "balance")],
          },
        ],
      },
    },
    {
      name: "gets balance of stranger",
      transition: "BalanceOf",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        address: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_BalanceOfCallback",
            getParams: () => [toMsgParam("Uint256", 0, "balance")],
          },
        ],
      },
    },

    {
      name: "throws not contract owner error",
      transition: "SetRoyaltyRecipient",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "sets stranger as recipient",
      transition: "SetRoyaltyRecipient",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.royalty_recipient === toTestAddr(STRANGER).toLowerCase(),
        events: [
          {
            name: "SetRoyaltyRecipientSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "royalty_recipient"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyRecipientCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "royalty_recipient"),
            ],
          },
        ],
      },
    },
    {
      name: "throws not contract owner error",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        feeBps: "1000",
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 10001",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "10001",
      }),
      error: ZRC6_ERROR.InvalidFeeBpsError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 0",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "0",
      }),
      error: ZRC6_ERROR.InvalidFeeBpsError,
      want: undefined,
    },
    {
      name: "sets fee bps: max",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "10000",
      }),
      error: undefined,
      want: {
        verifyState: (state) => state.royalty_fee_bps === "10000",
        events: [
          {
            name: "SetRoyaltyFeeBPSSuccess",
            getParams: () => [toMsgParam("Uint256", 10000, "royalty_fee_bps")],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => [toMsgParam("Uint256", 10000, "royalty_fee_bps")],
          },
        ],
      },
    },
    {
      name: "sets fee bps: min",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => state.royalty_fee_bps === "1",
        events: [
          {
            name: "SetRoyaltyFeeBPSSuccess",
            getParams: () => [toMsgParam("Uint256", 1, "royalty_fee_bps")],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => [toMsgParam("Uint256", 1, "royalty_fee_bps")],
          },
        ],
      },
    },
    {
      name: "throws not contract owner error",
      transition: "SetBaseURI",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        uri: BASE_URI,
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "sets new base URI",
      transition: "SetBaseURI",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        uri: "http://localhost:1111/testcase/1",
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.base_uri === "http://localhost:1111/testcase/1",
        events: [
          {
            name: "SetBaseURISuccess",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetBaseURICallback",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
              ),
            ],
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      let state = await zilliqa.contracts.at(globalContractAddress).getState();
      expect(state.base_uri).toBe("");

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )(testCase.transition, ...Object.values(testCase.getParams()));
      if (testCase.want === undefined) {
        // Nagative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        expect(verifyEvents(tx.receipt.event_logs, testCase.want.events)).toBe(
          true
        );
        expect(
          verifyTransitions(tx.receipt.transitions, testCase.want.transitions)
        ).toBe(true);

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(testCase.want.verifyState(state)).toBe(true);
      }
    });
  }
});

describe("Token with Base URI", () => {
  beforeEach(async () => {
    let tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )("SetBaseURI", BASE_URI);
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  const testCases = [
    {
      name: "gets token URI",
      transition: "TokenURI",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
      }),
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [
              toMsgParam("String", `${BASE_URI}1`, "token_uri"),
            ],
            tag: "ZRC6_TokenURICallback",
          },
        ],
      },
    },
    {
      name: "sets new base URI",
      transition: "SetBaseURI",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        uri: "http://localhost:1111/testcase/1",
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.base_uri === "http://localhost:1111/testcase/1",
        events: [
          {
            name: "SetBaseURISuccess",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetBaseURICallback",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
              ),
            ],
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      let state = await zilliqa.contracts.at(globalContractAddress).getState();
      expect(state.base_uri).toBe(BASE_URI);

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )(testCase.transition, ...Object.values(testCase.getParams()));
      if (testCase.want === undefined) {
        // Nagative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        expect(verifyEvents(tx.receipt.event_logs, testCase.want.events)).toBe(
          true
        );
        expect(
          verifyTransitions(tx.receipt.transitions, testCase.want.transitions)
        ).toBe(true);

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(testCase.want.verifyState(state)).toBe(true);
      }
    });
  }
});
