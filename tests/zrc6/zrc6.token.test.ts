import { Zilliqa } from "@zilliqa-js/zilliqa";
import { expect } from "@jest/globals";
import { getAddressFromPrivateKey, schnorr } from "@zilliqa-js/crypto";

import { scillaJSONVal, scillaJSONParams } from "@zilliqa-js/scilla-json-utils";

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
  BASE_URI,
  INITIAL_TOTAL_SUPPLY,
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
const MINTER = 0;
const CONTRACT_OWNERSHIP_RECIPIENT = 1;
const TOKEN_OWNER = 2;
const STRANGER = 3;
const getTestAddr = (index) => globalTestAccounts[index]?.address as string;

beforeAll(async () => {
  const accounts = Array.from({ length: 4 }, schnorr.generatePrivateKey).map(
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
    CONTRACT_OWNERSHIP_RECIPIENT: getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT),
    TOKEN_OWNER: getTestAddr(TOKEN_OWNER),
    STRANGER: getTestAddr(STRANGER),
  });
});

beforeEach(async () => {
  zilliqa.wallet.setDefault(getTestAddr(CONTRACT_OWNER));
  const init = scillaJSONParams({
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

  const tx: any = await zilliqa.contracts.at(globalContractAddress).call(
    "BatchMint",
    scillaJSONParams({
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

describe("Contract Contraint", () => {
  const testCases = [
    {
      name: "invalid initial contract owner: zero address",
      getParams: () => ({
        _scilla_version: ["Uint32", 0],
        initial_contract_owner: ["ByStr20", ZERO_ADDRESS],
        initial_base_uri: ["String", BASE_URI],
        name: ["String", TOKEN_NAME],
        symbol: ["String", TOKEN_SYMBOL],
      }),
      want: false,
    },
    {
      name: "valid initial base URI: empty string",
      getParams: () => ({
        _scilla_version: ["Uint32", 0],
        initial_contract_owner: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
        initial_base_uri: ["String", ""],
        name: ["String", TOKEN_NAME],
        symbol: ["String", TOKEN_SYMBOL],
      }),
      want: true,
    },
    {
      name: "invalid name: empty string",
      getParams: () => ({
        _scilla_version: ["Uint32", 0],
        initial_contract_owner: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
        initial_base_uri: ["String", BASE_URI],
        name: ["String", ""],
        symbol: ["String", TOKEN_SYMBOL],
      }),
      want: false,
    },
    {
      name: "invalid symbol: empty string",
      getParams: () => ({
        _scilla_version: ["Uint32", 0],
        initial_contract_owner: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
        initial_base_uri: ["String", BASE_URI],
        name: ["String", TOKEN_NAME],
        symbol: ["String", ""],
      }),
      want: false,
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.name}`, async () => {
      zilliqa.wallet.setDefault(getTestAddr(CONTRACT_OWNER));
      const init = scillaJSONParams(testCase.getParams());
      const [tx] = await zilliqa.contracts
        .new(CODE, init)
        .deploy(TX_PARAMS, 33, 1000, true);
      expect(tx.txParams.receipt?.success).toBe(testCase.want);
      if (testCase.want === false) {
        expect(JSON.stringify(tx.txParams.receipt?.exceptions)).toBe(
          JSON.stringify([
            { line: 0, message: "Contract constraint violation.\n" },
          ])
        );
      }
    });
  }
});

describe("Contract", () => {
  const testCases = [
    {
      name: "throws NotContractOwnerError",
      transition: "SetRoyaltyRecipient",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(STRANGER)],
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws ZeroAddressDestinationError",
      transition: "SetRoyaltyRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: ["ByStr20", ZERO_ADDRESS],
      }),
      error: ZRC6_ERROR.ZeroAddressDestinationError,
      want: undefined,
    },
    {
      name: "throws ThisAddressDestinationError",
      transition: "SetRoyaltyRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: ["ByStr20", globalContractAddress],
      }),
      error: ZRC6_ERROR.ThisAddressDestinationError,
      want: undefined,
    },
    {
      name: "sets stranger as recipient",
      transition: "SetRoyaltyRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(STRANGER)],
      }),
      error: undefined,
      want: {
        expectState: (state) => {
          expect(state.royalty_recipient).toBe(
            getTestAddr(STRANGER).toLowerCase()
          );
        },
        events: [
          {
            name: "SetRoyaltyRecipient",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(STRANGER)],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyRecipientCallback",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(STRANGER)],
            }),
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        fee_bps: ["Uint128", 1000],
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 10001",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        fee_bps: ["Uint128", 10001],
      }),
      error: ZRC6_ERROR.InvalidFeeBPSError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 0",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        fee_bps: ["Uint128", 0],
      }),
      error: ZRC6_ERROR.InvalidFeeBPSError,
      want: undefined,
    },
    {
      name: "sets fee bps: max",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        fee_bps: ["Uint128", 10000],
      }),
      error: undefined,
      want: {
        expectState: (state) => {
          expect(state.royalty_fee_bps).toBe("10000");
        },
        events: [
          {
            name: "SetRoyaltyFeeBPS",
            getParams: () => ({
              royalty_fee_bps: ["Uint128", 10000],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => ({
              royalty_fee_bps: ["Uint128", 10000],
            }),
          },
        ],
      },
    },
    {
      name: "sets fee bps: min",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        fee_bps: ["Uint128", 1],
      }),
      error: undefined,
      want: {
        expectState: (state) => {
          expect(state.royalty_fee_bps).toBe("1");
        },
        events: [
          {
            name: "SetRoyaltyFeeBPS",
            getParams: () => ({
              royalty_fee_bps: ["Uint128", 1],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => ({
              royalty_fee_bps: ["Uint128", 1],
            }),
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError",
      transition: "SetBaseURI",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        uri: ["String", BASE_URI],
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "sets new base URI",
      transition: "SetBaseURI",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        uri: ["String", "https://gateway.zilliqa.com/ipfs/hash/1"],
      }),
      error: undefined,
      want: {
        expectState: (state) => {
          expect(state.base_uri).toBe(
            "https://gateway.zilliqa.com/ipfs/hash/1"
          );
        },

        events: [
          {
            name: "SetBaseURI",
            getParams: () => ({
              base_uri: ["String", "https://gateway.zilliqa.com/ipfs/hash/1"],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetBaseURICallback",
            getParams: () => ({
              base_uri: ["String", "https://gateway.zilliqa.com/ipfs/hash/1"],
            }),
          },
        ],
      },
    },
    {
      name: "throws SelfError",
      transition: "SetContractOwnershipRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(CONTRACT_OWNER)],
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "sets stranger as contract owner candidate by contract owner",
      transition: "SetContractOwnershipRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(STRANGER)],
      }),
      error: undefined,
      want: {
        expectState: (state) => {
          expect(state.contract_ownership_recipient).toBe(
            getTestAddr(STRANGER).toLowerCase()
          );
        },
        events: [
          {
            name: "SetContractOwnershipRecipient",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(STRANGER)],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetContractOwnershipRecipientCallback",
            getParams: () => ({
              to: ["ByStr20", getTestAddr(STRANGER)],
            }),
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      let state = await zilliqa.contracts.at(globalContractAddress).getState();
      expect(JSON.stringify(state)).toBe(
        JSON.stringify({
          _balance: "0",
          balances: {
            [getTestAddr(TOKEN_OWNER).toLowerCase()]:
              INITIAL_TOTAL_SUPPLY.toString(),
          },
          base_uri: BASE_URI,
          contract_owner: getTestAddr(CONTRACT_OWNER).toLowerCase(),
          contract_ownership_recipient: ZERO_ADDRESS,
          is_paused: scillaJSONVal("Bool", false),
          minters: {
            [getTestAddr(CONTRACT_OWNER).toLowerCase()]: scillaJSONVal(
              "Bool",
              true
            ),
          },
          operators: {},
          royalty_fee_bps: "1000",
          royalty_recipient: getTestAddr(CONTRACT_OWNER).toLowerCase(),
          spenders: {},
          token_id_count: INITIAL_TOTAL_SUPPLY.toString(),
          token_name: TOKEN_NAME,
          token_owners: {
            "1": getTestAddr(TOKEN_OWNER).toLowerCase(),
            "2": getTestAddr(TOKEN_OWNER).toLowerCase(),
            "3": getTestAddr(TOKEN_OWNER).toLowerCase(),
          },
          token_symbol: TOKEN_SYMBOL,
          token_uris: {},
          total_supply: INITIAL_TOTAL_SUPPLY.toString(),
        })
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx: any = await zilliqa.contracts
        .at(globalContractAddress)
        .call(
          testCase.transition,
          scillaJSONParams(testCase.getParams()),
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

        testCase.want.expectState(state);
      }
    });
  }
});

describe("Accept Contract Ownership", () => {
  beforeEach(async () => {
    const tx: any = await zilliqa.contracts.at(globalContractAddress).call(
      "SetContractOwnershipRecipient",
      scillaJSONParams({
        to: ["ByStr20", getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT)],
      }),
      TX_PARAMS
    );
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  const testCases = [
    {
      name: "throws NotContractOwnershipRecipientError",
      transition: "AcceptContractOwnership",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotContractOwnershipRecipientError,
      want: undefined,
    },
    {
      name: "sets contract owner candidate as contract owner",
      transition: "AcceptContractOwnership",
      getSender: () => getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT),
      getParams: () => ({}),
      error: undefined,
      want: {
        expectState: (state) => {
          expect(state.contract_owner).toBe(
            getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT).toLowerCase()
          );
        },
        events: [
          {
            name: "AcceptContractOwnership",
            getParams: () => ({
              contract_owner: [
                "ByStr20",
                getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT),
              ],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AcceptContractOwnershipCallback",
            getParams: () => ({
              contract_owner: [
                "ByStr20",
                getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT),
              ],
            }),
          },
        ],
      },
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.transition}: ${testCase.name}`, async () => {
      let state = await zilliqa.contracts.at(globalContractAddress).getState();

      expect(JSON.stringify(state)).toBe(
        JSON.stringify({
          _balance: "0",
          balances: {
            [getTestAddr(TOKEN_OWNER).toLowerCase()]:
              INITIAL_TOTAL_SUPPLY.toString(),
          },
          base_uri: BASE_URI,
          contract_owner: getTestAddr(CONTRACT_OWNER).toLowerCase(),
          contract_ownership_recipient: getTestAddr(
            CONTRACT_OWNERSHIP_RECIPIENT
          ).toLowerCase(),
          is_paused: scillaJSONVal("Bool", false),
          minters: {
            [getTestAddr(CONTRACT_OWNER).toLowerCase()]: scillaJSONVal(
              "Bool",
              true
            ),
          },
          operators: {},
          royalty_fee_bps: "1000",
          royalty_recipient: getTestAddr(CONTRACT_OWNER).toLowerCase(),
          spenders: {},
          token_id_count: INITIAL_TOTAL_SUPPLY.toString(),
          token_name: TOKEN_NAME,
          token_owners: {
            "1": getTestAddr(TOKEN_OWNER).toLowerCase(),
            "2": getTestAddr(TOKEN_OWNER).toLowerCase(),
            "3": getTestAddr(TOKEN_OWNER).toLowerCase(),
          },
          token_symbol: TOKEN_SYMBOL,
          token_uris: {},
          total_supply: INITIAL_TOTAL_SUPPLY.toString(),
        })
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx: any = await zilliqa.contracts
        .at(globalContractAddress)
        .call(
          testCase.transition,
          scillaJSONParams(testCase.getParams()),
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

        testCase.want.expectState(state);
      }
    });
  }
});

describe("Unpaused", () => {
  const testCases = [
    {
      name: "Throws NotPausedError for the not paused contract",
      transition: "Unpause",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotPausedError,
      want: undefined,
    },
    {
      name: "Throws NotContractOwnerError",
      transition: "Pause",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "Pause the contract",
      transition: "Pause",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      want: {
        expectState: (state) => {
          expect(JSON.stringify(state.is_paused)).toBe(
            JSON.stringify(scillaJSONVal("Bool", true))
          );
        },
        events: [
          {
            name: "Pause",
            getParams: () => ({
              is_paused: ["Bool", true],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_PauseCallback",
            getParams: () => ({
              is_paused: ["Bool", true],
            }),
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
        JSON.stringify(scillaJSONVal("Bool", false))
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx: any = await zilliqa.contracts
        .at(globalContractAddress)
        .call(
          testCase.transition,
          scillaJSONParams(testCase.getParams()),
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

        testCase.want.expectState(state);
      }
    });
  }
});

describe("Paused", () => {
  beforeEach(async () => {
    let tx: any = await zilliqa.contracts
      .at(globalContractAddress)
      .call("Pause", [], TX_PARAMS);

    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  const testCases = [
    {
      name: "Throws PausedError for the paused contract",
      transition: "Pause",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "Throws NotContractOwnerError",
      transition: "Unpause",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "Unpause the contract",
      transition: "Unpause",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({}),
      want: {
        expectState: (state) => {
          expect(JSON.stringify(state.is_paused)).toBe(
            JSON.stringify(scillaJSONVal("Bool", false))
          );
        },
        events: [
          {
            name: "Unpause",
            getParams: () => ({
              is_paused: ["Bool", false],
            }),
          },
        ],
        transitions: [
          {
            tag: "ZRC6_UnpauseCallback",
            getParams: () => ({
              is_paused: ["Bool", false],
            }),
          },
        ],
      },
    },
    {
      name: "throws PausedError for Mint()",
      transition: "Mint",
      getSender: () => getTestAddr(MINTER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(MINTER)],
        token_uri: ["String", ""],
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for BatchMint()",
      transition: "BatchMint",
      getSender: () => getTestAddr(MINTER),
      getParams: () => ({
        to_token_uri_pair_list: [
          "List (Pair (ByStr20) (String))",
          [
            [getTestAddr(TOKEN_OWNER), ""],
            [getTestAddr(TOKEN_OWNER), ""],
            [getTestAddr(TOKEN_OWNER), ""],
          ],
        ],
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for Burn()",
      transition: "Burn",
      getSender: () => getTestAddr(TOKEN_OWNER),
      getParams: () => ({
        token_id: ["Uint256", 1],
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for TransferFrom()",
      transition: "TransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER),
      getParams: () => ({
        to: ["ByStr20", getTestAddr(STRANGER)],
        token_id: ["Uint256", 1],
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
        JSON.stringify(scillaJSONVal("Bool", true))
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx: any = await zilliqa.contracts
        .at(globalContractAddress)
        .call(
          testCase.transition,
          scillaJSONParams(testCase.getParams()),
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

        testCase.want.expectState(state);
      }
    });
  }
});
