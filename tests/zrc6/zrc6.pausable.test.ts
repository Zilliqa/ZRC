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
  INITIAL_TOTAL_SUPPLY,
} from "./config";

const JEST_WORKER_ID = Number(process.env["JEST_WORKER_ID"]);
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
const MINTER = 1;
const STRANGER = 9;
const toTestAddr = (index) => globalTestAccounts[index]?.address as string;

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
    MINTER: toTestAddr(MINTER),
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

  let tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )("AddMinter", toTestAddr(MINTER));
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )(
    "BatchMint",
    Array.from({ length: INITIAL_TOTAL_SUPPLY }, () => undefined).map(() =>
      toTestAddr(TOKEN_OWNER)
    )
  );
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Unpaused", () => {
  const testCases = [
    {
      name: "Throws NotPausedError for the not paused contract",
      transition: "Unpause",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotPausedError,
      want: undefined,
    },
    {
      name: "Throws NotContractOwnerError",
      transition: "Pause",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "Pause the contract",
      transition: "Pause",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      want: {
        verifyState: (state) => {
          return (
            JSON.stringify(state.is_paused) ===
            JSON.stringify({ argtypes: [], arguments: [], constructor: "True" })
          );
        },
        events: [
          {
            name: "Pause",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
              toMsgParam("Bool", "True", "is_paused"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_PauseCallback",
            getParams: () => [toMsgParam("Bool", "True", "is_paused")],
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      const state = await zilliqa.contracts
        .at(globalContractAddress)
        .getState();

      expect(JSON.stringify(state.is_paused)).toBe(
        JSON.stringify({
          argtypes: [],
          arguments: [],
          constructor: "False",
        })
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )(testCase.transition, ...Object.values(testCase.getParams()));

      if (testCase.want === undefined) {
        // Negative Cases
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

describe("Paused", () => {
  beforeEach(async () => {
    let tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )("Pause", toTestAddr(CONTRACT_OWNER));
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  const testCases = [
    {
      name: "Throws PausedError for the paused contract",
      transition: "Pause",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "Throws NotContractOwnerError",
      transition: "Unpause",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "Unpause the contract",
      transition: "Unpause",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      want: {
        verifyState: (state) => {
          return (
            JSON.stringify(state.is_paused) ===
            JSON.stringify({
              argtypes: [],
              arguments: [],
              constructor: "False",
            })
          );
        },
        events: [
          {
            name: "Unpause",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
              toMsgParam("Bool", "False", "is_paused"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_UnpauseCallback",
            getParams: () => [toMsgParam("Bool", "False", "is_paused")],
          },
        ],
      },
    },
    {
      name: "throws PausedError for Mint()",
      transition: "Mint",
      getSender: () => toTestAddr(MINTER),
      getParams: () => ({
        to: toTestAddr(MINTER),
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for BatchMint()",
      transition: "BatchMint",
      getSender: () => toTestAddr(MINTER),
      getParams: () => ({
        to_list: [
          toTestAddr(STRANGER),
          toTestAddr(STRANGER),
          toTestAddr(STRANGER),
        ],
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for Burn()",
      transition: "Burn",
      getSender: () => toTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id: "1",
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for TransferFrom()",
      transition: "TransferFrom",
      getSender: () => toTestAddr(TOKEN_OWNER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
        token_id: "1",
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      const state = await zilliqa.contracts
        .at(globalContractAddress)
        .getState();

      expect(JSON.stringify(state.is_paused)).toBe(
        JSON.stringify({
          argtypes: [],
          arguments: [],
          constructor: "True",
        })
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )(testCase.transition, ...Object.values(testCase.getParams()));

      if (testCase.want === undefined) {
        // Negative Cases
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
