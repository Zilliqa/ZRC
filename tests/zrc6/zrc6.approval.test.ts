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
const TOKEN_OWNER_A = 0;
const TOKEN_OWNER_B = 1;
const OPERATOR = 2;
const SPENDER = 3;
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
    TOKEN_OWNER_A: toTestAddr(TOKEN_OWNER_A),
    TOKEN_OWNER_B: toTestAddr(TOKEN_OWNER_B),
    OPERATOR: toTestAddr(OPERATOR),
    SPENDER: toTestAddr(SPENDER),
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
  )("BatchMint", [toTestAddr(TOKEN_OWNER_A), toTestAddr(TOKEN_OWNER_B)]);
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )("SetApproval", toTestAddr(SPENDER), "1");
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )("SetApprovalForAll", toTestAddr(OPERATOR));
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Approval", () => {
  const testCases = [
    {
      name: "throws not found error",
      transition: "SetApproval",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(STRANGER),
        token_id: "999", // Non-existing token
      }),
      error: ZRC6_ERROR.NotFoundError,
      want: undefined,
    },
    {
      name: "throws not a owner or operator error",
      transition: "SetApproval",
      getSender: () => toTestAddr(STRANGER), // Not a token owner
      getParams: () => ({
        to: toTestAddr(STRANGER),
        token_id: "1",
      }),
      error: ZRC6_ERROR.NotOwnerOrOperatorError,
      want: undefined,
    },
    {
      name: "adds stranger as spender of token #1 by token owner A",
      transition: "SetApproval",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(STRANGER),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.token_approvals["1"] === toTestAddr(STRANGER).toLowerCase()
          );
        },
        events: [
          {
            name: "SetApprovalSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "initiator"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
              toMsgParam("Bool", "True", "is_spender"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetApprovalCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
              toMsgParam("Bool", "True", "is_spender"),
            ],
          },
        ],
      },
    },
    {
      name: "adds stranger as spender of token #2 by token owner B",
      transition: "SetApproval",
      getSender: () => toTestAddr(TOKEN_OWNER_B),
      getParams: () => ({
        to: toTestAddr(STRANGER),
        token_id: "2",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.token_approvals["2"] === toTestAddr(STRANGER).toLowerCase()
          );
        },
        events: [
          {
            name: "SetApprovalSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_B), "initiator"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "spender"),
              toMsgParam("Uint256", 2, "token_id"),
              toMsgParam("Bool", "True", "is_spender"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetApprovalCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "spender"),
              toMsgParam("Uint256", 2, "token_id"),
              toMsgParam("Bool", "True", "is_spender"),
            ],
          },
        ],
      },
    },
    {
      name: "removes spender",
      transition: "SetApproval",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(SPENDER),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return state.token_approvals["1"] === undefined;
        },
        events: [
          {
            name: "SetApprovalSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "initiator"),
              toMsgParam("ByStr20", toTestAddr(SPENDER), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
              toMsgParam("Bool", "False", "is_spender"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetApprovalCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(SPENDER), "spender"),
              toMsgParam("Uint256", 1, "token_id"),
              toMsgParam("Bool", "False", "is_spender"),
            ],
          },
        ],
      },
    },
    {
      name: "throws self error",
      transition: "SetApprovalForAll",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(TOKEN_OWNER_A), // Self
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "adds stranger as operator",
      transition: "SetApprovalForAll",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return Object.keys(
            state.operator_approvals[toTestAddr(TOKEN_OWNER_A).toLowerCase()]
          ).includes(toTestAddr(STRANGER).toLowerCase());
        },
        events: [
          {
            name: "SetApprovalForAllSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "initiator"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "operator"),
              toMsgParam("Bool", "True", "is_operator"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetApprovalForAllCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "operator"),
              toMsgParam("Bool", "True", "is_operator"),
            ],
          },
        ],
      },
    },
    {
      name: "removes operator",
      transition: "SetApprovalForAll",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(OPERATOR),
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            Object.keys(
              state.operator_approvals[toTestAddr(TOKEN_OWNER_A).toLowerCase()]
            ).length === 0
          );
        },
        events: [
          {
            name: "SetApprovalForAllSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "initiator"),
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "operator"),
              toMsgParam("Bool", "False", "is_operator"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetApprovalForAllCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "operator"),
              toMsgParam("Bool", "False", "is_operator"),
            ],
          },
        ],
      },
    },
    {
      name: "throws not found error",
      transition: "GetApproved",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "999",
      }),
      error: ZRC6_ERROR.NotFoundError,
      want: undefined,
    },
    {
      name: "throws not approved error",
      transition: "GetApproved",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "2",
      }),
      error: ZRC6_ERROR.NotApprovedError,
      want: undefined,
    },
    {
      name: "gets approved address of a token",
      transition: "GetApproved",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.token_approvals["1"] === toTestAddr(SPENDER).toLowerCase()
          );
        },
        events: undefined,
        transitions: [
          {
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(SPENDER), "approved_address"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
            tag: "ZRC6_GetApprovedCallback",
          },
        ],
      },
    },
    {
      name: "checks if stranger is not approved",
      transition: "IsApprovedForAll",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        tokenOwner: toTestAddr(TOKEN_OWNER_A),
        operator: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [toMsgParam("Bool", "False", "is_operator")],
            tag: "ZRC6_IsApprovedForAllCallback",
          },
        ],
      },
    },
    {
      name: "checks if operator is approved",
      transition: "IsApprovedForAll",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        tokenOwner: toTestAddr(TOKEN_OWNER_A),
        operator: toTestAddr(OPERATOR),
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [toMsgParam("Bool", "True", "is_operator")],
            tag: "ZRC6_IsApprovedForAllCallback",
          },
        ],
      },
    },
    {
      name: "throws not token owner error",
      transition: "Transfer",
      getSender: () => toTestAddr(STRANGER), // Not Owner
      getParams: () => ({
        to: toTestAddr(TOKEN_OWNER_A),
        token_id: "1",
      }),
      error: ZRC6_ERROR.NotTokenOwnerError,
      want: undefined,
    },
    {
      name: "throws self error",
      transition: "Transfer",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(TOKEN_OWNER_A), // Self
        token_id: "1",
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "token owner -> stranger by token owner",
      transition: "Transfer",
      getSender: () => toTestAddr(TOKEN_OWNER_A),
      getParams: () => ({
        to: toTestAddr(STRANGER),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.owned_token_count[toTestAddr(STRANGER).toLowerCase()] ===
              "1" &&
            state.token_owners["1"] === toTestAddr(STRANGER).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransfer",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    },
    {
      name: "throws not approved error",
      transition: "TransferFrom",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        to: toTestAddr(SPENDER),
        token_id: "1",
      }),
      error: ZRC6_ERROR.NotApprovedError,
      want: undefined,
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
            state.owned_token_count[toTestAddr(SPENDER).toLowerCase()] ===
              "1" &&
            state.token_owners["1"] === toTestAddr(SPENDER).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFromSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(SPENDER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(SPENDER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(SPENDER), "recipient"),
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
            state.owned_token_count[toTestAddr(OPERATOR).toLowerCase()] ===
              "1" &&
            state.token_owners["1"] === toTestAddr(OPERATOR).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFromSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(OPERATOR), "recipient"),
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
        to: toTestAddr(STRANGER),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.owned_token_count[toTestAddr(STRANGER).toLowerCase()] ===
              "1" &&
            state.token_owners["1"] === toTestAddr(STRANGER).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFromSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
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
        to: toTestAddr(STRANGER),
        token_id: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.owned_token_count[toTestAddr(STRANGER).toLowerCase()] ===
              "1" &&
            state.token_owners["1"] === toTestAddr(STRANGER).toLowerCase()
          );
        },
        events: [
          {
            name: "TransferFromSuccess",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER_A), "from"),
              toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
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
