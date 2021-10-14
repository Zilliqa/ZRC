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
const MINTER = 1;
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
});

describe("Token", () => {
  beforeEach(async () => {
    const tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )(
      "BatchMint",
      [
        toTestAddr(TOKEN_OWNER),
        toTestAddr(TOKEN_OWNER),
        toTestAddr(TOKEN_OWNER),
      ],
      SAMPLE_TOKEN_URIS
    );
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  it("gets the total supply, name, symbol, token URI, and token owner", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        transition: "TotalSupply",
        params: {},
        want: {
          events: undefined,
          transitions: [
            {
              params: [
                toMsgParam("Uint256", SAMPLE_TOKEN_URIS.length, "total_supply"),
              ],
              tag: "ZRC6_TotalSupplyCallback",
            },
          ],
        },
      },
      {
        sender: toTestAddr(STRANGER),
        transition: "Name",
        params: {},
        want: {
          events: undefined,
          transitions: [
            {
              params: [toMsgParam("String", TOKEN_NAME, "name")],
              tag: "ZRC6_NameCallback",
            },
          ],
        },
      },
      {
        sender: toTestAddr(STRANGER),
        transition: "Symbol",
        params: {},
        want: {
          events: undefined,
          transitions: [
            {
              params: [toMsgParam("String", TOKEN_SYMBOL, "symbol")],
              tag: "ZRC6_SymbolCallback",
            },
          ],
        },
      },
      {
        sender: toTestAddr(STRANGER),
        transition: "TokenURI",
        params: {
          token_id: "1",
        },
        want: {
          events: undefined,
          transitions: [
            {
              params: [toMsgParam("String", SAMPLE_TOKEN_URIS[0], "token_uri")],
              tag: "ZRC6_TokenURICallback",
            },
          ],
        },
      },
      {
        sender: toTestAddr(STRANGER),
        transition: "TokenURI",
        params: {
          token_id: "999",
        },
        want: undefined,
        error: ZRC6_ERROR.NotFoundError,
      },
      {
        sender: toTestAddr(STRANGER),
        transition: "OwnerOf",
        params: {
          token_id: "1",
        },
        want: {
          events: undefined,
          transitions: [
            {
              params: [
                toMsgParam("ByStr20", toTestAddr(TOKEN_OWNER), "token_owner"),
              ],
              tag: "ZRC6_OwnerOfCallback",
            },
          ],
        },
        error: ZRC6_ERROR.NotFoundError,
      },
      {
        sender: toTestAddr(STRANGER),
        transition: "OwnerOf",
        params: {
          token_id: "999",
        },
        want: undefined,
        error: ZRC6_ERROR.NotFoundError,
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )(testCase.transition, ...Object.values(testCase.params));

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

  it("gets balance", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          address: toTestAddr(CONTRACT_OWNER),
        },
        error: undefined,
        want: {
          events: undefined,
          transitions: [
            {
              tag: "ZRC6_BalanceOfCallback",
              params: [toMsgParam("Uint256", 3, "balance")],
            },
          ],
        },
      },
      {
        sender: toTestAddr(STRANGER),
        params: {
          address: toTestAddr(STRANGER),
        },
        error: undefined,
        want: {
          events: undefined,
          transitions: [
            {
              tag: "ZRC6_BalanceOfCallback",
              params: [toMsgParam("Uint256", 0, "balance")],
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
      )("BalanceOf", ...Object.values(testCase.params));

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
});

describe("Mint", () => {
  beforeEach(async () => {
    const tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )("SetMinter", toTestAddr(MINTER));
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  it("adds minter", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          minter: toTestAddr(MINTER),
        },
        error: ZRC6_ERROR.NotContractOwnerError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          minter: toTestAddr(STRANGER),
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetMinterSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(STRANGER), "minter"),
                toMsgParam("Bool", "True", "is_minter"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetMinterCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(STRANGER), "minter"),
                toMsgParam("Bool", "True", "is_minter"),
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
      )("SetMinter", ...Object.values(testCase.params));

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
          state.minters.hasOwnProperty(testCase.params.minter.toLowerCase())
        ).toBe(true);
      }
    }
  });

  it("removes minter", async () => {
    const testCases = [
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          minter: toTestAddr(MINTER),
        },
        error: undefined,
        want: {
          events: [
            {
              name: "SetMinterSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(MINTER), "minter"),
                toMsgParam("Bool", "False", "is_minter"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_SetMinterCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(MINTER), "minter"),
                toMsgParam("Bool", "False", "is_minter"),
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
      )("SetMinter", ...Object.values(testCase.params));

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
          state.minters.hasOwnProperty(testCase.params.minter.toLowerCase())
        ).toBe(false);
      }
    }
  });

  it("mints a token", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          to: toTestAddr(STRANGER),
          tokenUri: "X",
        },
        error: ZRC6_ERROR.NotMinterError,
        want: undefined,
      },
      {
        sender: toTestAddr(CONTRACT_OWNER),
        params: {
          to: toTestAddr(STRANGER),
          tokenUri: "X",
        },
        error: undefined,
        want: {
          state: {
            token_id: "1",
          },
          events: [
            {
              name: "MintSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "by"),
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
                toMsgParam("String", "X", "token_uri"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_RecipientAcceptMint",
              params: [],
            },
            {
              tag: "ZRC6_MintCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
                toMsgParam("Uint256", 1, "token_id"),
                toMsgParam("String", "X", "token_uri"),
              ],
            },
          ],
        },
      },
      {
        sender: toTestAddr(MINTER),
        params: {
          to: toTestAddr(MINTER),
          tokenUri: "Y",
        },
        error: undefined,
        want: {
          state: {
            token_id: "2",
          },
          events: [
            {
              name: "MintSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(MINTER), "by"),
                toMsgParam("ByStr20", toTestAddr(MINTER), "recipient"),
                toMsgParam("Uint256", 2, "token_id"),
                toMsgParam("String", "Y", "token_uri"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_RecipientAcceptMint",
              params: [],
            },
            {
              tag: "ZRC6_MintCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(MINTER), "recipient"),
                toMsgParam("Uint256", 2, "token_id"),
                toMsgParam("String", "Y", "token_uri"),
              ],
            },
          ],
        },
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);

      const state = await zilliqa.contracts
        .at(globalContractAddress)
        .getState();
      const prevTokenIdCount = Number(state.token_id_count);

      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )("Mint", ...Object.values(testCase.params));

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

        expect(state.token_owners[testCase.want.state.token_id]).toBe(
          testCase.params.to.toLowerCase()
        );
        expect(state.token_uris[testCase.want.state.token_id]).toBe(
          testCase.params.tokenUri
        );
        expect(Number(state.token_id_count)).toBe(prevTokenIdCount + 1);
      }
    }
  });

  it("mints tokens in batches", async () => {
    let state = await zilliqa.contracts.at(globalContractAddress).getState();

    expect(Number(state.token_id_count)).toBe(0);

    const tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )(
      "BatchMint",
      [toTestAddr(STRANGER), toTestAddr(STRANGER), toTestAddr(STRANGER)],
      SAMPLE_TOKEN_URIS
    );

    expect(tx.receipt.success).toBe(true);
    checkEvents(
      tx.receipt.event_logs,
      SAMPLE_TOKEN_URIS.map((x, index) => ({
        name: "MintSuccess",
        params: [
          toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "by"),
          toMsgParam("ByStr20", toTestAddr(STRANGER), "recipient"),
          toMsgParam("Uint256", index + 1, "token_id"),
          toMsgParam("String", x, "token_uri"),
        ],
      })).reverse(),
      expect
    );
    const { msg } = tx.receipt.transitions.shift();
    expect(msg._tag).toBe("ZRC6_BatchMintCallback");
    expect(JSON.stringify(msg.params)).toBe(JSON.stringify([]));

    state = await zilliqa.contracts.at(globalContractAddress).getState();

    SAMPLE_TOKEN_URIS.forEach((uri, index) => {
      expect(state.token_owners.hasOwnProperty(index + 1)).toBe(true);
      expect(state.token_owners[index + 1]).toBe(
        toTestAddr(STRANGER).toLowerCase()
      );
      expect(state.token_uris[index + 1]).toBe(uri);
    });
    expect(Number(state.token_id_count)).toBe(SAMPLE_TOKEN_URIS.length);
  });
});

describe("Burn", () => {
  beforeEach(async () => {
    const tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )(
      "BatchMint",
      [
        toTestAddr(TOKEN_OWNER),
        toTestAddr(TOKEN_OWNER),
        toTestAddr(TOKEN_OWNER),
      ],
      SAMPLE_TOKEN_URIS
    );
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  it("burns a token", async () => {
    const testCases = [
      {
        sender: toTestAddr(STRANGER),
        params: {
          token_id: "1",
        },
        error: ZRC6_ERROR.NotOwnerOrOperatorError,
        want: undefined,
      },
      {
        sender: toTestAddr(TOKEN_OWNER),
        params: {
          token_id: "999",
        },
        error: ZRC6_ERROR.NotFoundError,
        want: undefined,
      },
      {
        sender: toTestAddr(TOKEN_OWNER),
        params: {
          token_id: "1",
        },
        error: undefined,
        want: {
          events: [
            {
              name: "BurnSuccess",
              params: [
                toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
                toMsgParam(
                  "ByStr20",
                  toTestAddr(CONTRACT_OWNER),
                  "burn_address"
                ),
                toMsgParam("Uint256", 1, "token_id"),
              ],
            },
          ],
          transitions: [
            {
              tag: "ZRC6_BurnCallback",
              params: [
                toMsgParam("ByStr20", toTestAddr(CONTRACT_OWNER), "initiator"),
                toMsgParam(
                  "ByStr20",
                  toTestAddr(CONTRACT_OWNER),
                  "burn_address"
                ),
                toMsgParam("Uint256", 1, "token_id"),
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
      )("Burn", ...Object.values(testCase.params));

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
          state.token_owners.hasOwnProperty(testCase.params.token_id)
        ).toBe(false);
      }
    }
  });
});
