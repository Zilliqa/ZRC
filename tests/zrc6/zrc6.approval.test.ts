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
  FAUCET_PARAMS,
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
const OPERATOR = 1;
const SPENDER = 2;
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

describe("Approval", () => {
  beforeEach(async () => {
    let tx = await globalContractInfo.callGetter(
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

  it("adds spender", async () => {
    const testCases = [
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(STRANGER),
          token_id: "999", // Non-existing token
        },
        error: ZRC6_ERROR.NotFoundError,
        want: undefined,
      },
      {
        sender: toTestAddr(STRANGER), // Not a token owner
        params: {
          to: toTestAddr(STRANGER),
          token_id: "1",
        },
        error: ZRC6_ERROR.NotOwnerOrOperatorError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(STRANGER),
          token_id: "2",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetApprovalSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "spender"),
                toMsgParam("Uint256", 2, "token_id"),
                toMsgParam("Bool", "True", "is_spender"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetApprovalCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(STRANGER), "spender"),
                toMsgParam("Uint256", 2, "token_id"),
                toMsgParam("Bool", "True", "is_spender"),
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
      )("SetApproval", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(state.token_approvals[testCase.params.token_id]).toBe(
          testCase.params.to.toLowerCase()
        );
      }
    }
  });

  it("adds operator", async () => {
    const testCases = [
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(CONTRACT_OWNER), // Self
        },
        error: ZRC6_ERROR.SelfError,
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
              name: "SetApprovalForAllSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "operator"),
                toMsgParam("Bool", "True", "is_operator"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetApprovalForAllCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(STRANGER), "operator"),
                toMsgParam("Bool", "True", "is_operator"),
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
      )("SetApprovalForAll", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(
          Object.keys(
            state.operator_approvals[testCase.sender.toLowerCase()]
          ).includes(testCase.params.to.toLowerCase())
        ).toBe(true);
      }
    }
  });

  it("updates or removes spender", async () => {
    const testCases = [
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(STRANGER),
          token_id: "1",
        },
        // SPENDER should be removed first to update it.
        // It throws NotApprovedError if there is SPENDER in the token_approvals.
        error: ZRC6_ERROR.NotApprovedError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(SPENDER),
          token_id: "1",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetApprovalSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
                toMsgParam("ByStr20", toTestAddr(SPENDER), "spender"),
                toMsgParam("Uint256", 1, "token_id"),
                toMsgParam("Bool", "False", "is_spender"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetApprovalCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(SPENDER), "spender"),
                toMsgParam("Uint256", 1, "token_id"),
                toMsgParam("Bool", "False", "is_spender"),
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
      )("SetApproval", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(state.token_approvals[testCase.params.token_id]).toBe(undefined);
      }
    }
  });

  it("removes operator", async () => {
    const testCases = [
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(OPERATOR),
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetApprovalForAllSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
                toMsgParam("ByStr20", toTestAddr(OPERATOR), "operator"),
                toMsgParam("Bool", "False", "is_operator"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetApprovalForAllCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(OPERATOR), "operator"),
                toMsgParam("Bool", "False", "is_operator"),
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
      )("SetApprovalForAll", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(
          Object.keys(state.operator_approvals[testCase.sender.toLowerCase()])
            .length
        ).toBe(0);
      }
    }
  });

  it("gets approved spender", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          token_id: "999",
        },
        error: ZRC6_ERROR.NotApprovedError,
        want: undefined,
      },
      {
        sender: toTestAddr(STRANGER),
        params: {
          token_id: "1",
        },
        error: undefined,
        want: {
          events: undefined,
          transitions: [
            {
              params: [
                toMsgParam("ByStr20", toTestAddr(SPENDER), "approved_address"),
                toMsgParam("Uint256", 1, "token_id"),
              ],
              tag: "ZRC6_GetApprovedCallback",
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
      )("GetApproved", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(state.token_approvals[testCase.params.token_id]).toBe(
          toTestAddr(SPENDER).toLowerCase()
        );
      }
    }
  });

  it("checks operator", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          tokenOwner: toTestAddr(CONTRACT_OWNER),
          operator: toTestAddr(STRANGER),
        },
        error: ZRC6_ERROR.NotApprovedForAllError,
        want: undefined,
      },
      {
        sender: toTestAddr(STRANGER),
        params: {
          tokenOwner: toTestAddr(CONTRACT_OWNER),
          operator: toTestAddr(OPERATOR),
        },
        error: undefined,
        want: {
          events: undefined,
          transitions: [
            {
              params: [
                toMsgParam(
                  "ByStr20",
                  toTestAddr(CONTRACT_OWNER),
                  "token_owner"
                ),
                toMsgParam("ByStr20", toTestAddr(OPERATOR), "operator"),
              ],
              tag: "ZRC6_IsApprovedForAllCallback",
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
      )("IsApprovedForAll", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(
          Object.keys(
            state.operator_approvals[testCase.params.tokenOwner.toLowerCase()]
          ).includes(testCase.params.operator.toLowerCase())
        ).toBe(true);
      }
    }
  });

  it("transfers token (token owner only)", async () => {
    const testCases = [
      {
        sender: toTestAddr(TOKEN_OWNER),
        params: {
          to: toTestAddr(TOKEN_OWNER), // Self
          token_id: "1",
        },
        error: ZRC6_ERROR.SelfError,
        want: undefined,
      },
      {
        sender: toTestAddr(OPERATOR), // Not Owner
        params: {
          to: toTestAddr(TOKEN_OWNER),
          token_id: "1",
        },
        error: ZRC6_ERROR.NotTokenOwnerError,
        want: undefined,
      },
      {
        sender: toTestAddr(TOKEN_OWNER),
        params: {
          to: toTestAddr(SPENDER),
          token_id: "1",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "TransferSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(SPENDER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_RecipientAcceptTransfer",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(SPENDER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
              ],
            },
            {
              tag: "ZRC6_TransferCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(SPENDER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
              ],
            },
          ],
        },
      },
    ];

    for (const testCase of testCases) {
      const state = await zilliqa.contracts
        .at(globalContractAddress)
        .getState();
      const prevOwnedTokenCount = state.owned_token_count;

      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )("Transfer", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(state.token_owners[testCase.params.token_id]).toBe(
          testCase.params.to.toLowerCase()
        );

        expect(
          Number(state.owned_token_count[testCase.sender.toLowerCase()])
        ).toBe(Number(prevOwnedTokenCount[testCase.sender.toLowerCase()]) - 1);

        expect(
          Number(state.owned_token_count[testCase.params.to.toLowerCase()])
        ).toBe(
          Number(prevOwnedTokenCount[testCase.params.to.toLowerCase()] || 0) + 1
        );
      }
    }
  });

  it("transfers token (spender or operator only)", async () => {
    const testCases = [
      {
        sender: toTestAddr(SPENDER),
        params: {
          to: toTestAddr(TOKEN_OWNER), // Self
          token_id: "1",
        },
        error: ZRC6_ERROR.SelfError,
        want: undefined,
      },
      {
        sender: toTestAddr(SPENDER),
        params: {
          to: toTestAddr(STRANGER),
          token_id: "1",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "TransferFromSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_RecipientAcceptTransferFrom",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
              ],
            },
            {
              tag: "ZRC6_TransferFromCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
              ],
            },
          ],
        },
      },
      {
        sender: toTestAddr(OPERATOR),
        params: {
          to: toTestAddr(STRANGER),
          token_id: "2",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "TransferFromSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 2, "token_id"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_RecipientAcceptTransferFrom",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 2, "token_id"),
              ],
            },
            {
              tag: "ZRC6_TransferFromCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "from"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 2, "token_id"),
              ],
            },
          ],
        },
      },
    ];

    for (const testCase of testCases) {
      const state = await zilliqa.contracts
        .at(globalContractAddress)
        .getState();
      const prevOwnedTokenCount = state.owned_token_count;

      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )("TransferFrom", ...Object.values(testCase.params));

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

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(state.token_owners[testCase.params.token_id]).toBe(
          testCase.params.to.toLowerCase()
        );

        expect(
          Number(state.owned_token_count[testCase.sender.toLowerCase()])
        ).toBe(Number(prevOwnedTokenCount[testCase.sender.toLowerCase()]) - 1);

        expect(
          Number(state.owned_token_count[testCase.params.to.toLowerCase()])
        ).toBe(
          Number(prevOwnedTokenCount[testCase.params.to.toLowerCase()] || 0) + 1
        );
      }
    }
  });
});
