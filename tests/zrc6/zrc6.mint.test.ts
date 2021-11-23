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
  BASE_URI,
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
    BASE_URI,
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

describe("Minter", () => {
  const testCases = [
    {
      name: "throws NotContractOwnerError by stranger",
      transition: "AddMinter",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        minter: toTestAddr(STRANGER),
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws MinterFoundError",
      transition: "AddMinter",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: toTestAddr(MINTER),
      }),
      error: ZRC6_ERROR.MinterFoundError,
      want: undefined,
    },
    {
      name: "adds minter",
      transition: "AddMinter",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.minters.hasOwnProperty(toTestAddr(STRANGER).toLowerCase()),
        events: [
          {
            name: "AddMinter",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "minter"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AddMinterCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "minter"),
            ],
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError by stranger",
      transition: "RemoveMinter",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        minter: toTestAddr(MINTER),
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws MinterNotFoundError",
      transition: "RemoveMinter",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: toTestAddr(STRANGER),
      }),
      error: ZRC6_ERROR.MinterNotFoundError,
      want: undefined,
    },
    {
      name: "removes minter",
      transition: "RemoveMinter",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: toTestAddr(MINTER),
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          !state.minters.hasOwnProperty(toTestAddr(STRANGER).toLowerCase()),
        events: [
          {
            name: "RemoveMinter",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(MINTER), "minter"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RemoveMinterCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(MINTER), "minter"),
            ],
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
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

describe("Mint & Burn", () => {
  const testCases = [
    {
      name: "throws NotMinterError",
      transition: "Mint",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: ZRC6_ERROR.NotMinterError,
      want: undefined,
    },
    {
      name: "mints token by contract owner",
      transition: "Mint",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.token_owners[(INITIAL_TOTAL_SUPPLY + 1).toString()] ===
              toTestAddr(STRANGER).toLowerCase() &&
            state.token_id_count === (INITIAL_TOTAL_SUPPLY + 1).toString()
          );
        },
        events: [
          {
            name: "Mint",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "to"),
              toMsgParam(
                "Uint256",
                (INITIAL_TOTAL_SUPPLY + 1).toString(),
                "token_id"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptMint",
            getParams: () => [],
          },
          {
            tag: "ZRC6_MintCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "to"),
              toMsgParam(
                "Uint256",
                (INITIAL_TOTAL_SUPPLY + 1).toString(),
                "token_id"
              ),
            ],
          },
        ],
      },
    },
    {
      name: "mints token by minter",
      transition: "Mint",
      getSender: () => toTestAddr(MINTER),
      getParams: () => ({
        to: toTestAddr(MINTER),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.token_owners[(INITIAL_TOTAL_SUPPLY + 1).toString()] ===
              toTestAddr(MINTER).toLowerCase() &&
            state.token_id_count === (INITIAL_TOTAL_SUPPLY + 1).toString()
          );
        },
        events: [
          {
            name: "Mint",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(MINTER), "to"),
              toMsgParam(
                "Uint256",
                (INITIAL_TOTAL_SUPPLY + 1).toString(),
                "token_id"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptMint",
            getParams: () => [],
          },
          {
            tag: "ZRC6_MintCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(MINTER), "to"),
              toMsgParam(
                "Uint256",
                (INITIAL_TOTAL_SUPPLY + 1).toString(),
                "token_id"
              ),
            ],
          },
        ],
      },
    },
    {
      name: "mints tokens in batches",
      transition: "BatchMint",
      getSender: () => toTestAddr(TOKEN_OWNER),
      getParams: () => ({
        to_list: [
          toTestAddr(STRANGER),
          toTestAddr(STRANGER),
          toTestAddr(STRANGER),
        ],
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          if (state.token_id_count !== (INITIAL_TOTAL_SUPPLY * 2).toString()) {
            return false;
          }
          for (
            let i = INITIAL_TOTAL_SUPPLY + 1;
            i <= INITIAL_TOTAL_SUPPLY * 2;
            i++
          ) {
            if (!state.token_owners.hasOwnProperty(i.toString())) {
              return false;
            }
            if (
              state.token_owners[i.toString()] !==
              toTestAddr(STRANGER).toLowerCase()
            ) {
              return false;
            }
          }
          return true;
        },
        events: [
          {
            name: "BatchMint",
            getParams: () => [
              toMsgParam(
                "List (ByStr20)",
                [STRANGER, STRANGER, STRANGER].map((cur) =>
                  toTestAddr(cur).toLowerCase()
                ),
                "to_list"
              ),
              toMsgParam("Uint256", "4", "start_id"),
              toMsgParam("Uint256", "6", "end_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_BatchMintCallback",
            getParams: () => [],
          },
        ],
      },
    },

    {
      name: "throws NotOwnerOrOperatorError",
      transition: "Burn",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
      }),
      error: ZRC6_ERROR.NotOwnerOrOperatorError,
      want: undefined,
    },
    {
      name: "throws TokenNotFoundError",
      transition: "Burn",
      getSender: () => toTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id: "999",
      }),
      error: ZRC6_ERROR.TokenNotFoundError,
      want: undefined,
    },
    {
      name: "burns a token",
      transition: "Burn",
      getSender: () => toTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => !state.token_owners.hasOwnProperty("1"),
        events: [
          {
            name: "Burn",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "token_owner"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_BurnCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "token_owner"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },

    {
      name: "burns tokens in batches",
      transition: "BatchBurn",
      getSender: () => toTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id_list: ["1", "2", "3"],
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          if (state.total_supply !== "0") {
            return false;
          }
          return JSON.stringify(state.token_owners) === "{}";
        },
        events: [
          {
            name: "BatchBurn",
            getParams: () => [
              toMsgParam("List (Uint256)", ["1", "2", "3"], "token_id_list"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_BatchBurnCallback",
            getParams: () => [],
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
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
