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
const TOKEN_OWNER_A = 0;
const TOKEN_OWNER_B = 1;
const OPERATOR = 2;
const SPENDER = 3;
const STRANGER_A = 8;
const STRANGER_B = 9;
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
    TOKEN_OWNER_A: toTestAddr(TOKEN_OWNER_A),
    TOKEN_OWNER_B: toTestAddr(TOKEN_OWNER_B),
    OPERATOR: toTestAddr(OPERATOR),
    SPENDER: toTestAddr(SPENDER),
    STRANGER_A: toTestAddr(STRANGER_A),
    STRANGER_B: toTestAddr(STRANGER_B),
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
  )("BatchMint", [
    toTestAddr(TOKEN_OWNER_A),
    toTestAddr(TOKEN_OWNER_B),
    toTestAddr(TOKEN_OWNER_B),
    toTestAddr(TOKEN_OWNER_B),
  ]);
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )("AddSpender", toTestAddr(SPENDER), "1");
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )("AddOperator", toTestAddr(OPERATOR));
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Approval", () => {
  const testCases = [
    {
      name: "throws TokenNotFoundError",
      transition: "AddSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: toTestAddr(STRANGER_A),
        token_id: "999", // Non-existing token
      }),
      error: ZRC6_ERROR.TokenNotFoundError,
      want: undefined,
    },
    {
      name: "throws NotOwnerOrOperatorError",
      transition: "AddSpender",
      getSender: () => toTestAddr(STRANGER_A), // Not a token owner
      getParams: () => ({
        spender: toTestAddr(STRANGER_B),
        token_id: "1",
      }),
      error: ZRC6_ERROR.NotOwnerOrOperatorError,
      want: undefined,
    },
    {
      name: "throws SelfError",
      transition: "AddSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: toTestAddr(TOKEN_OWNER_A),
        token_id: "1",
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "throws SpenderFoundError",
      transition: "AddSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: toTestAddr(SPENDER),
        token_id: "1",
      }),
      error: ZRC6_ERROR.SpenderFoundError,
      want: undefined,
    },
    {
      name: "adds stranger as spender of token #1 by token owner A",
      transition: "AddSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: toTestAddr(STRANGER_A),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return state.spenders["1"] === toTestAddr(STRANGER_A).toLowerCase();
        },
        events: [
          {
            name: "AddSpender",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AddSpenderCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "adds stranger as spender of token #2 by token owner B",
      transition: "AddSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_B),
      getParams: () => ({
        spender: toTestAddr(STRANGER_A),
        token_id: "2",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return state.spenders["2"] === toTestAddr(STRANGER_A).toLowerCase();
        },
        events: [
          {
            name: "AddSpender",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "spender"),
              toMsgParam("Uint256", 2, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AddSpenderCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "spender"),
              toMsgParam("Uint256", 2, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "throws TokenNotFoundError",
      transition: "RemoveSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: toTestAddr(STRANGER_A),
        token_id: "999", // Non-existing token
      }),
      error: ZRC6_ERROR.TokenNotFoundError,
      want: undefined,
    },
    {
      name: "throws NotOwnerOrOperatorError",
      transition: "RemoveSpender",
      getSender: () => toTestAddr(STRANGER_A), // Not a token owner
      getParams: () => ({
        spender: toTestAddr(STRANGER_A),
        token_id: "1",
      }),
      error: ZRC6_ERROR.NotOwnerOrOperatorError,
      want: undefined,
    },
    {
      name: "throws SpenderNotFoundError for token #2 by token owner B",
      transition: "RemoveSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_B),
      getParams: () => ({
        spender: toTestAddr(STRANGER_A),
        token_id: "2",
      }),
      error: ZRC6_ERROR.SpenderNotFoundError,
      want: undefined,
    },
    {
      name: "removes spender of token #1 by token owner A",
      transition: "RemoveSpender",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: toTestAddr(SPENDER),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return state.spenders["1"] === undefined;
        },
        events: [
          {
            name: "RemoveSpender",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(SPENDER), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RemoveSpenderCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(SPENDER), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "throws NotTokenOwnerError by stranger)",
      transition: "AddOperator",
      getSender: () => toTestAddr(STRANGER_B),
      getParams: () => ({
        operator: toTestAddr(STRANGER_A),
      }),
      error: ZRC6_ERROR.NotTokenOwnerError,
      want: undefined,
    },
    {
      name: "throws SelfError",
      transition: "AddOperator",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: toTestAddr(TOKEN_OWNER_A), // Self
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "throws OperatorFoundError for operator by token owner A",
      transition: "AddOperator",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: toTestAddr(OPERATOR),
      }),
      error: ZRC6_ERROR.OperatorFoundError,
      want: undefined,
    },
    {
      name: "adds stranger A as operator by token owner A",
      transition: "AddOperator",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: toTestAddr(STRANGER_A),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return Object.keys(
            state.operators[toTestAddr(TOKEN_OWNER_A).toLowerCase()]
          ).includes(toTestAddr(STRANGER_A).toLowerCase());
        },
        events: [
          {
            name: "AddOperator",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "operator"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AddOperatorCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "operator"),
            ],
          },
        ],
      },
    },
    {
      name: "throws OperatorNotFoundError",
      transition: "RemoveOperator",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: toTestAddr(STRANGER_A),
      }),
      error: ZRC6_ERROR.OperatorNotFoundError,
      want: undefined,
    },
    {
      name: "throws OperatorNotFoundError for stranger by token owner A",
      transition: "RemoveOperator",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: toTestAddr(STRANGER_A),
      }),
      error: ZRC6_ERROR.OperatorNotFoundError,
      want: undefined,
    },
    {
      name: "removes operator by token owner A",
      transition: "RemoveOperator",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: toTestAddr(OPERATOR),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            Object.keys(
              state.operators[toTestAddr(TOKEN_OWNER_A).toLowerCase()]
            ).length === 0
          );
        },
        events: [
          {
            name: "RemoveOperator",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "operator"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RemoveOperatorCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "operator"),
            ],
          },
        ],
      },
    },
    {
      name: "throws SelfError by self giving",
      transition: "TransferFrom",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(TOKEN_OWNER_A), // Self
        token_id: "1",
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "throws NotAllowedToTransferError by stranger",
      transition: "TransferFrom",
      getSender: () => toTestAddr(STRANGER_A), // Not Owner
      getParams: () => ({
        to: toTestAddr(STRANGER_A),
        token_id: "1",
      }),
      error: ZRC6_ERROR.NotAllowedToTransferError,
      want: undefined,
    },
    {
      name: "throws ZeroAddressDestinationError",
      transition: "TransferFrom",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: "0x0000000000000000000000000000000000000000",
        token_id: "1",
      }),
      error: ZRC6_ERROR.ZeroAddressDestinationError,
      want: undefined,
    },
    {
      name: "throws ThisAddressDestinationError",
      transition: "TransferFrom",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: globalContractAddress,
        token_id: "1",
      }),
      error: ZRC6_ERROR.ThisAddressDestinationError,
      want: undefined,
    },
    {
      name: "token owner -> stranger by token owner",
      transition: "TransferFrom",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(STRANGER_A),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[toTestAddr(STRANGER_A).toLowerCase()] === "1" &&
            state.token_owners["1"] === toTestAddr(STRANGER_A).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> stranger by spender",
      transition: "TransferFrom",
      getSender: () => toTestAddr(SPENDER),
      getParams: () => ({
        to: toTestAddr(STRANGER_A),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[toTestAddr(STRANGER_A).toLowerCase()] === "1" &&
            state.token_owners["1"] === toTestAddr(STRANGER_A).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> stranger by operator",
      transition: "TransferFrom",
      getSender: () => toTestAddr(OPERATOR),
      getParams: () => ({
        to: toTestAddr(STRANGER_A),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[toTestAddr(STRANGER_A).toLowerCase()] === "1" &&
            state.token_owners["1"] === toTestAddr(STRANGER_A).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER_A), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> spender by spender",
      transition: "TransferFrom",
      getSender: () => toTestAddr(SPENDER),
      getParams: () => ({
        to: toTestAddr(SPENDER),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[toTestAddr(SPENDER).toLowerCase()] === "1" &&
            state.token_owners["1"] === toTestAddr(SPENDER).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(SPENDER), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(SPENDER), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(SPENDER), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> operator by operator",
      transition: "TransferFrom",
      getSender: () => toTestAddr(OPERATOR),
      getParams: () => ({
        to: toTestAddr(OPERATOR),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[toTestAddr(OPERATOR).toLowerCase()] === "1" &&
            state.token_owners["1"] === toTestAddr(OPERATOR).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "to"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "throws SelfError",
      transition: "BatchTransferFrom",
      getSender: () => toTestAddr(TOKEN_OWNER_B),
      getParams: () => ({
        to_token_id_pair_list: [
          {
            constructor: "Pair",
            argtypes: ["ByStr20", "Uint256"],
            arguments: [toTestAddr(TOKEN_OWNER_A), "2"],
          },
          {
            constructor: "Pair",
            argtypes: ["ByStr20", "Uint256"],
            arguments: [toTestAddr(TOKEN_OWNER_B), "3"],
          },
          {
            constructor: "Pair",
            argtypes: ["ByStr20", "Uint256"],
            arguments: [toTestAddr(STRANGER_A), "4"],
          },
        ],
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "token owner B transfers (token owner A, #2), (stranger A, #3), (stranger A, #4)",
      transition: "BatchTransferFrom",
      getSender: () => toTestAddr(TOKEN_OWNER_B),
      getParams: () => ({
        to_token_id_pair_list: [
          {
            constructor: "Pair",
            argtypes: ["ByStr20", "Uint256"],
            arguments: [toTestAddr(TOKEN_OWNER_A), "2"],
          },
          {
            constructor: "Pair",
            argtypes: ["ByStr20", "Uint256"],
            arguments: [toTestAddr(STRANGER_A), "3"],
          },
          {
            constructor: "Pair",
            argtypes: ["ByStr20", "Uint256"],
            arguments: [toTestAddr(STRANGER_A), "4"],
          },
        ],
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          const isTokenOwnerValid =
            JSON.stringify(state.token_owners) ===
            JSON.stringify({
              "1": toTestAddr(TOKEN_OWNER_A).toLowerCase(),
              "2": toTestAddr(TOKEN_OWNER_A).toLowerCase(),
              "3": toTestAddr(STRANGER_A).toLowerCase(),
              "4": toTestAddr(STRANGER_A).toLowerCase(),
            });

          const isBalanceValid = [
            [TOKEN_OWNER_A, 2],
            [TOKEN_OWNER_B, 0],
            [STRANGER_A, 2],
          ].every((x) => {
            const [tokenOwner, balance] = x;
            return (
              state.balances[toTestAddr(tokenOwner).toLowerCase()] ===
              balance?.toString()
            );
          });
          return isTokenOwnerValid && isBalanceValid;
        },
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_BatchTransferFromCallback",
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
