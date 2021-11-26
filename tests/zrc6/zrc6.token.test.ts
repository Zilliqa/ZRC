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

  const tx = await globalContractInfo.callGetter(
    zilliqa.contracts.at(globalContractAddress),
    TX_PARAMS
  )(
    "BatchMint",
    Array.from({ length: INITIAL_TOTAL_SUPPLY }, () => getTestAddr(TOKEN_OWNER))
  );
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Contract Contraint", () => {
  const testCases = [
    {
      name: "invalid initial contract owner: zero address",
      getInitParams: () => [
        "0x0000000000000000000000000000000000000000",
        BASE_URI,
        TOKEN_NAME,
        TOKEN_SYMBOL,
      ],
    },
    {
      name: "invalid initial base URI: empty string",
      getInitParams: () => [
        getTestAddr(CONTRACT_OWNER),
        "",
        TOKEN_NAME,
        TOKEN_SYMBOL,
      ],
    },
    {
      name: "invalid name: empty string",
      getInitParams: () => [
        getTestAddr(CONTRACT_OWNER),
        BASE_URI,
        "",
        TOKEN_SYMBOL,
      ],
    },
    {
      name: "invalid symbol: empty string",
      getInitParams: () => [
        getTestAddr(CONTRACT_OWNER),
        BASE_URI,
        TOKEN_NAME,
        "",
      ],
    },
  ];

  for (const testCase of testCases) {
    it(`${testCase.name}`, async () => {
      zilliqa.wallet.setDefault(getTestAddr(CONTRACT_OWNER));
      const init = globalContractInfo.getInitParams(
        ...testCase.getInitParams()
      );
      const [tx] = await zilliqa.contracts
        .new(CODE, init)
        .deploy(TX_PARAMS, 33, 1000, true);
      expect(tx.txParams.receipt?.success).toBe(false);
      expect(JSON.stringify(tx.txParams.receipt?.exceptions)).toBe(
        JSON.stringify([
          { line: 0, message: "Contract constraint violation.\n" },
        ])
      );
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
        to: getTestAddr(STRANGER),
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws ZeroAddressDestinationError",
      transition: "SetRoyaltyRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: "0x0000000000000000000000000000000000000000",
      }),
      error: ZRC6_ERROR.ZeroAddressDestinationError,
      want: undefined,
    },
    {
      name: "throws ThisAddressDestinationError",
      transition: "SetRoyaltyRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: globalContractAddress,
      }),
      error: ZRC6_ERROR.ThisAddressDestinationError,
      want: undefined,
    },
    {
      name: "sets stranger as recipient",
      transition: "SetRoyaltyRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: getTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.royalty_recipient === getTestAddr(STRANGER).toLowerCase(),
        events: [
          {
            name: "SetRoyaltyRecipient",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER), "to"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyRecipientCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER), "to"),
            ],
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        feeBps: 1000,
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 10001",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: 10001,
      }),
      error: ZRC6_ERROR.InvalidFeeBPSError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 0",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "0",
      }),
      error: ZRC6_ERROR.InvalidFeeBPSError,
      want: undefined,
    },
    {
      name: "sets fee bps: max",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: 10000,
      }),
      error: undefined,
      want: {
        verifyState: (state) => state.royalty_fee_bps === "10000",
        events: [
          {
            name: "SetRoyaltyFeeBPS",
            getParams: () => [
              getJSONParam("Uint128", 10000, "royalty_fee_bps"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => [
              getJSONParam("Uint128", 10000, "royalty_fee_bps"),
            ],
          },
        ],
      },
    },
    {
      name: "sets fee bps: min",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: 1,
      }),
      error: undefined,
      want: {
        verifyState: (state) => state.royalty_fee_bps === "1",
        events: [
          {
            name: "SetRoyaltyFeeBPS",
            getParams: () => [getJSONParam("Uint128", 1, "royalty_fee_bps")],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => [getJSONParam("Uint128", 1, "royalty_fee_bps")],
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError",
      transition: "SetBaseURI",
      getSender: () => getTestAddr(STRANGER),
      getParams: () => ({
        uri: BASE_URI,
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "sets new base URI",
      transition: "SetBaseURI",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        uri: "https://gateway.zilliqa.com/ipfs/hash/1",
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.base_uri === "https://gateway.zilliqa.com/ipfs/hash/1",
        events: [
          {
            name: "SetBaseURI",
            getParams: () => [
              getJSONParam(
                "String",
                "https://gateway.zilliqa.com/ipfs/hash/1",
                "base_uri"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetBaseURICallback",
            getParams: () => [
              getJSONParam(
                "String",
                "https://gateway.zilliqa.com/ipfs/hash/1",
                "base_uri"
              ),
            ],
          },
        ],
      },
    },
    {
      name: "throws SelfError",
      transition: "SetContractOwnershipRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: getTestAddr(CONTRACT_OWNER),
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "sets stranger as contract owner candidate by contract owner",
      transition: "SetContractOwnershipRecipient",
      getSender: () => getTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: getTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.contract_ownership_recipient ===
          getTestAddr(STRANGER).toLowerCase(),
        events: [
          {
            name: "SetContractOwnershipRecipient",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER), "to"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetContractOwnershipRecipientCallback",
            getParams: () => [
              getJSONParam("ByStr20", getTestAddr(STRANGER), "to"),
            ],
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
          contract_ownership_recipient:
            "0x0000000000000000000000000000000000000000",
          is_paused: getJSONValue(false),
          minters: {
            [getTestAddr(CONTRACT_OWNER).toLowerCase()]: getJSONValue(true),
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
          total_supply: INITIAL_TOTAL_SUPPLY.toString(),
        })
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )(testCase.transition, ...Object.values(testCase.getParams()));
      if (testCase.want === undefined) {
        // Nagative Cases
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

describe("Accept Contract Ownership", () => {
  beforeEach(async () => {
    let tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )(
      "SetContractOwnershipRecipient",
      getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT)
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
        verifyState: (state) =>
          state.contract_owner ===
          getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT).toLowerCase(),
        events: [
          {
            name: "AcceptContractOwnership",
            getParams: () => [
              getJSONParam(
                "ByStr20",
                getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT),
                "contract_owner"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AcceptContractOwnershipCallback",
            getParams: () => [
              getJSONParam(
                "ByStr20",
                getTestAddr(CONTRACT_OWNERSHIP_RECIPIENT),
                "contract_owner"
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
          is_paused: getJSONValue(false),
          minters: {
            [getTestAddr(CONTRACT_OWNER).toLowerCase()]: getJSONValue(true),
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
          total_supply: INITIAL_TOTAL_SUPPLY.toString(),
        })
      );

      zilliqa.wallet.setDefault(testCase.getSender());
      const tx = await globalContractInfo.callGetter(
        zilliqa.contracts.at(globalContractAddress),
        TX_PARAMS
      )(testCase.transition, ...Object.values(testCase.getParams()));
      if (testCase.want === undefined) {
        // Nagative Cases
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
        verifyState: (state) => {
          return (
            JSON.stringify(state.is_paused) ===
            JSON.stringify(getJSONValue(true))
          );
        },
        events: [
          {
            name: "Pause",
            getParams: () => [getJSONParam("Bool", true, "is_paused")],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_PauseCallback",
            getParams: () => [getJSONParam("Bool", true, "is_paused")],
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
        JSON.stringify(getJSONValue(false))
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

describe("Paused", () => {
  beforeEach(async () => {
    let tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )("Pause", getTestAddr(CONTRACT_OWNER));
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
        verifyState: (state) => {
          return (
            JSON.stringify(state.is_paused) ===
            JSON.stringify(getJSONValue(false))
          );
        },
        events: [
          {
            name: "Unpause",
            getParams: () => [getJSONParam("Bool", false, "is_paused")],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_UnpauseCallback",
            getParams: () => [getJSONParam("Bool", false, "is_paused")],
          },
        ],
      },
    },
    {
      name: "throws PausedError for Mint()",
      transition: "Mint",
      getSender: () => getTestAddr(MINTER),
      getParams: () => ({
        to: getTestAddr(MINTER),
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for BatchMint()",
      transition: "BatchMint",
      getSender: () => getTestAddr(MINTER),
      getParams: () => ({
        to_list: [
          getTestAddr(STRANGER),
          getTestAddr(STRANGER),
          getTestAddr(STRANGER),
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
        token_id: 1,
      }),
      error: ZRC6_ERROR.PausedError,
      want: undefined,
    },
    {
      name: "throws PausedError for TransferFrom()",
      transition: "TransferFrom",
      getSender: () => getTestAddr(TOKEN_OWNER),
      getParams: () => ({
        to: getTestAddr(STRANGER),
        token_id: 1,
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
        JSON.stringify(getJSONValue(true))
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
