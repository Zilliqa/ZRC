import { Zilliqa } from "@zilliqa-js/zilliqa";
import { expect } from "@jest/globals";
import { getAddressFromPrivateKey, schnorr } from "@zilliqa-js/crypto";
import { getJSONParams } from "@zilliqa-js/scilla-json-utils";

import {
  getErrorMsg,
  expectTransitions,
  expectEvents,
  ZERO_ADDRESS,
} from "./testutils";

import {
  API,
  TX_PARAMS,
  CODE,
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

let globalContractAddress;

let globalTestAccounts: Array<{
  privateKey: string;
  address: string;
}> = [];
const CONTRACT_OWNER = 0;
const TOKEN_OWNER = 0;
const MINTER = 1;
const STRANGER = 2;
const getTestAddr = (index) => globalTestAccounts[index]?.address as string;

beforeAll(async () => {
  const accounts = Array.from({ length: 3 }, schnorr.generatePrivateKey).map(
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
    TOKEN_OWNER: getTestAddr(TOKEN_OWNER),
    MINTER: getTestAddr(MINTER),
    STRANGER: getTestAddr(STRANGER),
  });
});

beforeEach(async () => {
  zilliqa.wallet.setDefault(getTestAddr(CONTRACT_OWNER));
  const init = getJSONParams({
    _scilla_version: ["Uint32", 0],
    initial_contract_owner: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
    initial_base_uri: ["String", BASE_URI],
    name: ["String", TOKEN_NAME],
    symbol: ["String", TOKEN_SYMBOL],
  });
  const [, contract] = await zilliqa.contracts
    .new(CODE, init)
    .deploy(TX_PARAMS, 33, 1000, true);
  globalContractAddress = contract.address;

  if (globalContractAddress === undefined) {
    throw new Error();
  }

  let tx: any = await zilliqa.contracts.at(globalContractAddress).call(
    "AddMinter",
    getJSONParams({
      minter: ["ByStr20", getTestAddr(MINTER)],
    }),
    TX_PARAMS
  );

  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await zilliqa.contracts.at(globalContractAddress).call(
    "BatchMint",
    getJSONParams({
      to_token_uri_pair_list: [
        "List (Pair (ByStr20) (String))",
        [
          [getTestAddr(TOKEN_OWNER), ""],
          [getTestAddr(TOKEN_OWNER), ""],
          [getTestAddr(TOKEN_OWNER), ""],
        ],
      ],
    }),
    TX_PARAMS
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
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        minter: ["ByStr20", getTestAddr(STRANGER)],
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws MinterFoundError",
      transition: "AddMinter",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: ["ByStr20", getTestAddr(MINTER)],
      }),
      error: ZRC6_ERROR.MinterFoundError,
      want: undefined,
    },
    {
      name: "adds minter",
      transition: "AddMinter",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: ["ByStr20", getTestAddr(STRANGER)],
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.minters.hasOwnProperty(getTestAddr(STRANGER).toLowerCase()),
        events: [
          {
            name: "AddMinter",
            getParams: () => ({
              minter: ["ByStr20", getTestAddr(STRANGER)],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AddMinterCallback",
            getParams: () => ({
              minter: ["ByStr20", getTestAddr(STRANGER)],
            }),
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError by stranger",
      transition: "RemoveMinter",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        minter: ["ByStr20", getTestAddr(MINTER)],
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws MinterNotFoundError",
      transition: "RemoveMinter",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: ["ByStr20", getTestAddr(STRANGER)],
      }),
      error: ZRC6_ERROR.MinterNotFoundError,
      want: undefined,
    },
    {
      name: "removes minter",
      transition: "RemoveMinter",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        minter: ["ByStr20", getTestAddr(MINTER)],
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          !state.minters.hasOwnProperty(getTestAddr(STRANGER).toLowerCase()),
        events: [
          {
            name: "RemoveMinter",
            getParams: () => ({
              minter: ["ByStr20", getTestAddr(MINTER)],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RemoveMinterCallback",
            getParams: () => ({
              minter: ["ByStr20", getTestAddr(MINTER)],
            }),
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      zilliqa.wallet.setDefault(testCase.getSender());
      const tx: any = await zilliqa.contracts
        .at(globalContractAddress)
        .call(
          testCase.transition,
          getJSONParams(testCase.getParams()),
          TX_PARAMS
        );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          getErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        expectEvents(tx.receipt.event_logs, testCase.want.events);
        expectTransitions(tx.receipt.transitions, testCase.want.transitions);

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
      name: "throws ZeroAddressDestinationError",
      transition: "Mint",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        to: ["ByStr20", ZERO_ADDRESS],
        token_uri: ["String", ""],
      }),
      error: ZRC6_ERROR.ZeroAddressDestinationError,
      want: undefined,
    },
    {
      name: "throws ThisAddressDestinationError",
      transition: "Mint",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        to: ["ByStr20", globalContractAddress],
        token_uri: ["String", ""],
      }),
      error: ZRC6_ERROR.ThisAddressDestinationError,
      want: undefined,
    },
    {
      name: "throws NotMinterError",
      transition: "Mint",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(STRANGER)],
        token_uri: ["String", ""],
      }),
      error: ZRC6_ERROR.NotMinterError,
      want: undefined,
    },
    {
      name: "mints token by contract owner",
      transition: "Mint",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(STRANGER)],
        token_uri: ["String", ""],
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.token_owners[(INITIAL_TOTAL_SUPPLY + 1).toString()] ===
              getTestAddr(STRANGER).toLowerCase() &&
            state.token_id_count === (INITIAL_TOTAL_SUPPLY + 1).toString()
          );
        },
        events: [
          {
            name: "Mint",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(STRANGER)],
              token_id: ["Uint256", INITIAL_TOTAL_SUPPLY + 1],
              token_uri: ["String", ""],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptMint",
            getParams: () => ({}),
          },
          {
            tag: "ZRC6_MintCallback",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(STRANGER)],
              token_id: ["Uint256", INITIAL_TOTAL_SUPPLY + 1],
              token_uri: ["String", ""],
            }),
          },
        ],
      },
    },
    {
      name: "mints token by minter",
      transition: "Mint",
      getSender: () => getTestAddr(MINTER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(MINTER)],
        token_uri: ["String", ""],
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          return (
            state.token_owners[(INITIAL_TOTAL_SUPPLY + 1).toString()] ===
              getTestAddr(MINTER).toLowerCase() &&
            state.token_id_count === (INITIAL_TOTAL_SUPPLY + 1).toString()
          );
        },
        events: [
          {
            name: "Mint",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(MINTER)],
              token_id: ["Uint256", INITIAL_TOTAL_SUPPLY + 1],
              token_uri: ["String", ""],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptMint",
            getParams: () => ({}),
          },
          {
            tag: "ZRC6_MintCallback",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(MINTER)],
              token_id: ["Uint256", INITIAL_TOTAL_SUPPLY + 1],
              token_uri: ["String", ""],
            }),
          },
        ],
      },
    },
    {
      name: "mints a token with a URI by minter",
      transition: "Mint",
      getSender: () => getTestAddr(MINTER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(MINTER)],
        token_uri: [
          "String",
          "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL4",
        ],
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          if (
            JSON.stringify(state.token_uris) !==
            JSON.stringify({
              "4": "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL4",
            })
          ) {
            return false;
          }
          return (
            state.token_owners[(INITIAL_TOTAL_SUPPLY + 1).toString()] ===
              getTestAddr(MINTER).toLowerCase() &&
            state.token_id_count === (INITIAL_TOTAL_SUPPLY + 1).toString()
          );
        },
        events: [
          {
            name: "Mint",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(MINTER)],
              token_id: ["Uint256", INITIAL_TOTAL_SUPPLY + 1],
              token_uri: [
                "String",
                "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL4",
              ],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_RecipientAcceptMint",
            getParams: () => ({}),
          },
          {
            tag: "ZRC6_MintCallback",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(MINTER)],
              token_id: ["Uint256", INITIAL_TOTAL_SUPPLY + 1],
              token_uri: [
                "String",
                "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL4",
              ],
            }),
          },
        ],
      },
    },
    {
      name: "mints tokens with URIs in batches",
      transition: "BatchMint",
      getSender: () => getTestAddr(TOKEN_OWNER),
      getParams: () => ({
        to_token_uri_pair_list: [
          "List (Pair (ByStr20) (String))",
          [
            [
              getTestAddr(STRANGER),
              "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL4",
            ],
            [
              getTestAddr(STRANGER),
              "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL5",
            ],
            [
              getTestAddr(STRANGER),
              "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL6",
            ],
          ],
        ],
      }),
      error: undefined,
      want: {
        verifyState: (state) => {
          if (
            JSON.stringify(state.token_uris) !==
            JSON.stringify({
              "4": "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL4",
              "5": "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL5",
              "6": "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL6",
            })
          ) {
            return false;
          }
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
              getTestAddr(STRANGER).toLowerCase()
            ) {
              return false;
            }
          }
          return true;
        },
        events: [
          {
            name: "BatchMint",
            getParams: () => ({
              to_token_uri_pair_list: [
                "List (Pair (ByStr20) (String))",
                [
                  [
                    getTestAddr(STRANGER),
                    "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL4",
                  ],
                  [
                    getTestAddr(STRANGER),
                    "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL5",
                  ],
                  [
                    getTestAddr(STRANGER),
                    "https://ipfs.zilliqa.com/ipfs/Zme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pY0000ZIL6",
                  ],
                ],
              ],
              start_id: ["Uint256", 4],
              end_id: ["Uint256", 6],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_BatchMintCallback",
            getParams: () => ({}),
          },
        ],
      },
    },

    {
      name: "throws NotOwnerOrOperatorError",
      transition: "Burn",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        token_id: ["Uint256", 1],
      }),
      error: ZRC6_ERROR.NotOwnerOrOperatorError,
      want: undefined,
    },
    {
      name: "throws TokenNotFoundError",
      transition: "Burn",
      getSender: () => getTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id: ["Uint256", 999],
      }),
      error: ZRC6_ERROR.TokenNotFoundError,
      want: undefined,
    },
    {
      name: "burns a token",
      transition: "Burn",
      getSender: () => getTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id: ["Uint256", 1],
      }),
      error: undefined,
      want: {
        verifyState: (state) => !state.token_owners.hasOwnProperty("1"),
        events: [
          {
            name: "Burn",
            getParams: () => ({
              token_owner: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
              token_id: ["Uint256", 1],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_BurnCallback",
            getParams: () => ({
              token_owner: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
              token_id: ["Uint256", 1],
            }),
          },
        ],
      },
    },

    {
      name: "burns tokens in batches",
      transition: "BatchBurn",
      getSender: () => getTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id_list: ["List (Uint256)", [1, 2, 3]],
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
            getParams: () => ({
              token_id_list: ["List (Uint256)", [1, 2, 3]],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_BatchBurnCallback",
            getParams: () => ({}),
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      zilliqa.wallet.setDefault(testCase.getSender());
      const tx: any = await zilliqa.contracts
        .at(globalContractAddress)
        .call(
          testCase.transition,
          getJSONParams(testCase.getParams()),
          TX_PARAMS
        );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          getErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        expectEvents(tx.receipt.event_logs, testCase.want.events);
        expectTransitions(tx.receipt.transitions, testCase.want.transitions);

        const state = await zilliqa.contracts
          .at(globalContractAddress)
          .getState();

        expect(testCase.want.verifyState(state)).toBe(true);
      }
    });
  }
});
