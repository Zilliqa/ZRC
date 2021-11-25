import { Zilliqa } from "@zilliqa-js/zilliqa";
import { expect } from "@jest/globals";
import { getAddressFromPrivateKey, schnorr } from "@zilliqa-js/crypto";

import {
  getErrorMsg,
  getJSONParam,
  useContractInfo,
  verifyTransitions,
  verifyEvents,
  getJSONValue,
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
const STRANGER_A = 4;
const STRANGER_B = 5;
const getTestAddr = (index) => globalTestAccounts[index]?.address as string;

beforeAll(async () => {
  const accounts = Array.from({ length: 6 }, schnorr.generatePrivateKey).map(
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
  globalTestAccounts = accounts;

  console.table({
    JEST_WORKER_ID,
    GENESIS_PRIVATE_KEY,
    CONTRACT_OWNER: getTestAddr(CONTRACT_OWNER),
    TOKEN_OWNER_A: getTestAddr(TOKEN_OWNER_A),
    TOKEN_OWNER_B: getTestAddr(TOKEN_OWNER_B),
    OPERATOR: getTestAddr(OPERATOR),
    SPENDER: getTestAddr(SPENDER),
    STRANGER_A: getTestAddr(STRANGER_A),
    STRANGER_B: getTestAddr(STRANGER_B),
  });

  globalContractInfo = await useContractInfo(CONTAINER, CODE_PATH, GAS_LIMIT);
});

beforeEach(async () => {
  zilliqa.wallet.setDefault(getTestAddr(CONTRACT_OWNER));
  const init = globalContractInfo.getInitParams(
    getTestAddr(CONTRACT_OWNER),
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
    getTestAddr(TOKEN_OWNER_A),
    getTestAddr(TOKEN_OWNER_B),
    getTestAddr(TOKEN_OWNER_B),
    getTestAddr(TOKEN_OWNER_B),
  ]);
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )("SetSpender", getTestAddr(SPENDER), "1");
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )("AddOperator", getTestAddr(OPERATOR));
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Approval", () => {
  const testCases = [
    {
      name: "throws TokenNotFoundError",
      transition: "SetSpender",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: getTestAddr(STRANGER_A),
        token_id: 999, // Non-existing token
      }),
      error: ZRC6_ERROR.TokenNotFoundError,
      want: undefined,
    },
    {
      name: "throws NotOwnerOrOperatorError",
      transition: "SetSpender",
      getSender: () => getTestAddr(STRANGER_A), // Not a token owner
      getParams: () => ({
        spender: getTestAddr(STRANGER_B),
        token_id: 1,
      }),
      error: ZRC6_ERROR.NotOwnerOrOperatorError,
      want: undefined,
    },
    {
      name: "throws SelfError",
      transition: "SetSpender",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: getTestAddr(TOKEN_OWNER_A),
        token_id: 1,
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "throws SpenderFoundError",
      transition: "SetSpender",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: getTestAddr(SPENDER),
        token_id: 1,
      }),
      error: ZRC6_ERROR.SpenderFoundError,
      want: undefined,
    },
    {
      name: "sets stranger as spender for token #1",
      transition: "SetSpender",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: getTestAddr(STRANGER_A),
        token_id: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return state.spenders["1"] === getTestAddr(STRANGER_A).toLowerCase();
        },
        events: [
          {
            name: "SetSpender",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "spender"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetSpenderCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "spender"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "sets zero address as spender for token #1",
      transition: "SetSpender",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        spender: "0x0000000000000000000000000000000000000000",
        token_id: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.spenders["1"] === "0x0000000000000000000000000000000000000000"
          );
        },
        events: [
          {
            name: "SetSpender",
            getParams: () => [
              getJSONParam(
                "ByStr20",
                "0x0000000000000000000000000000000000000000",
                "spender"
              ),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetSpenderCallback",
            getParams: () => [
              getJSONParam(
                "ByStr20",
                "0x0000000000000000000000000000000000000000",
                "spender"
              ),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "throws NotTokenOwnerError by stranger)",
      transition: "AddOperator",
      getSender: () => getTestAddr(STRANGER_B),
      getParams: () => ({
        operator: getTestAddr(STRANGER_A),
      }),
      error: ZRC6_ERROR.NotTokenOwnerError,
      want: undefined,
    },
    {
      name: "throws SelfError",
      transition: "AddOperator",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: getTestAddr(TOKEN_OWNER_A), // Self
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "throws OperatorFoundError for operator by token owner A",
      transition: "AddOperator",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: getTestAddr(OPERATOR),
      }),
      error: ZRC6_ERROR.OperatorFoundError,
      want: undefined,
    },
    {
      name: "adds stranger A as operator by token owner A",
      transition: "AddOperator",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: getTestAddr(STRANGER_A),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return Object.keys(
            state.operators[getTestAddr(TOKEN_OWNER_A).toLowerCase()]
          ).includes(getTestAddr(STRANGER_A).toLowerCase());
        },
        events: [
          {
            name: "AddOperator",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "operator"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AddOperatorCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "operator"),
            ],
          },
        ],
      },
    },
    {
      name: "throws OperatorNotFoundError",
      transition: "RemoveOperator",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: getTestAddr(STRANGER_A),
      }),
      error: ZRC6_ERROR.OperatorNotFoundError,
      want: undefined,
    },
    {
      name: "throws OperatorNotFoundError for stranger by token owner A",
      transition: "RemoveOperator",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: getTestAddr(STRANGER_A),
      }),
      error: ZRC6_ERROR.OperatorNotFoundError,
      want: undefined,
    },
    {
      name: "removes operator by token owner A",
      transition: "RemoveOperator",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        operator: getTestAddr(OPERATOR),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            Object.keys(
              state.operators[getTestAddr(TOKEN_OWNER_A).toLowerCase()]
            ).length === 0
          );
        },
        events: [
          {
            name: "RemoveOperator",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(OPERATOR), "operator"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RemoveOperatorCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(OPERATOR), "operator"),
            ],
          },
        ],
      },
    },
    {
      name: "throws SelfError by self giving",
      transition: "TransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: getTestAddr(TOKEN_OWNER_A), // Self
        token_id: 1,
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "throws NotAllowedToTransferError by stranger",
      transition: "TransferFrom",
      getSender: () => getTestAddr(STRANGER_A), // Not Owner
      getParams: () => ({
        to: getTestAddr(STRANGER_A),
        token_id: 1,
      }),
      error: ZRC6_ERROR.NotAllowedToTransferError,
      want: undefined,
    },
    {
      name: "throws ZeroAddressDestinationError",
      transition: "TransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: "0x0000000000000000000000000000000000000000",
        token_id: 1,
      }),
      error: ZRC6_ERROR.ZeroAddressDestinationError,
      want: undefined,
    },
    {
      name: "throws ThisAddressDestinationError",
      transition: "TransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: globalContractAddress,
        token_id: 1,
      }),
      error: ZRC6_ERROR.ThisAddressDestinationError,
      want: undefined,
    },
    {
      name: "token owner -> stranger by token owner",
      transition: "TransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: getTestAddr(STRANGER_A),
        token_id: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[getTestAddr(STRANGER_A).toLowerCase()] === "1" &&
            state.token_owners["1"] === getTestAddr(STRANGER_A).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> stranger by spender",
      transition: "TransferFrom",
      getSender: () => getTestAddr(SPENDER),
      getParams: () => ({
        to: getTestAddr(STRANGER_A),
        token_id: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[getTestAddr(STRANGER_A).toLowerCase()] === "1" &&
            state.token_owners["1"] === getTestAddr(STRANGER_A).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> stranger by operator",
      transition: "TransferFrom",
      getSender: () => getTestAddr(OPERATOR),
      getParams: () => ({
        to: getTestAddr(STRANGER_A),
        token_id: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[getTestAddr(STRANGER_A).toLowerCase()] === "1" &&
            state.token_owners["1"] === getTestAddr(STRANGER_A).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(STRANGER_A), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> spender by spender",
      transition: "TransferFrom",
      getSender: () => getTestAddr(SPENDER),
      getParams: () => ({
        to: getTestAddr(SPENDER),
        token_id: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[getTestAddr(SPENDER).toLowerCase()] === "1" &&
            state.token_owners["1"] === getTestAddr(SPENDER).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(SPENDER), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(SPENDER), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(SPENDER), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "token owner -> operator by operator",
      transition: "TransferFrom",
      getSender: () => getTestAddr(OPERATOR),
      getParams: () => ({
        to: getTestAddr(OPERATOR),
        token_id: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.balances[getTestAddr(OPERATOR).toLowerCase()] === "1" &&
            state.token_owners["1"] === getTestAddr(OPERATOR).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(OPERATOR), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(OPERATOR), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(TOKEN_OWNER_A), "from"),
              getJSONParam("ByStr20", getTestAddr(OPERATOR), "to"),
              getJSONParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "throws SelfError",
      transition: "BatchTransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER_B),
      getParams: () => ({
        to_token_id_pair_list: [
          [getTestAddr(TOKEN_OWNER_A), 2],
          [getTestAddr(TOKEN_OWNER_B), 3],
          [getTestAddr(STRANGER_A), 4],
        ].map((cur) => getJSONValue(cur, "Pair ByStr20 Uint256")),
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "token owner B transfers (token owner A, #2), (stranger A, #3), (stranger A, #4)",
      transition: "BatchTransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER_B),
      getParams: () => ({
        to_token_id_pair_list: [
          [getTestAddr(TOKEN_OWNER_A), 2],
          [getTestAddr(STRANGER_A), 3],
          [getTestAddr(STRANGER_A), 4],
        ].map((cur) => getJSONValue(cur, "Pair ByStr20 Uint256")),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          const isTokenOwnerValid =
            JSON.stringify(state.token_owners) ===
            JSON.stringify({
              "1": getTestAddr(TOKEN_OWNER_A).toLowerCase(),
              "2": getTestAddr(TOKEN_OWNER_A).toLowerCase(),
              "3": getTestAddr(STRANGER_A).toLowerCase(),
              "4": getTestAddr(STRANGER_A).toLowerCase(),
            });

          const isBalanceValid = [
            [TOKEN_OWNER_A, 2],
            [TOKEN_OWNER_B, 0],
            [STRANGER_A, 2],
          ].every((x) => {
            const [tokenOwner, balance] = x;
            return (
              state.balances[getTestAddr(tokenOwner).toLowerCase()] ===
              balance?.toString()
            );
          });
          return isTokenOwnerValid && isBalanceValid;
        },
        events: [
          {
            name: "BatchTransferFrom",
            getParams: () => [
              getJSONParam(
                "List (Pair (ByStr20) (Uint256))",
                [
                  [getTestAddr(TOKEN_OWNER_A), 2],
                  [getTestAddr(STRANGER_A), 3],
                  [getTestAddr(STRANGER_A), 4],
                ],
                "to_token_id_pair_list"
              ),
            ],
          },
        ],
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
          getErrorMsg(testCase.error)
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
