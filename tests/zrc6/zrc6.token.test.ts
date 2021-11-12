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
const CONTRACT_OWNER_CANDIDATE = 1;
const TOKEN_OWNER = 2;
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
    CONTRACT_OWNER_CANDIDATE: toTestAddr(CONTRACT_OWNER_CANDIDATE),
    TOKEN_OWNER: toTestAddr(TOKEN_OWNER),
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

describe("Token", () => {
  const testCases = [
    {
      name: "throws TokenNotFoundError",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "999",
        sale_price: "1000",
      }),
      error: ZRC6_ERROR.TokenNotFoundError,
      want: undefined,
    },
    {
      name: "gets royalty info: (999, 10%) -> 99",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
        sale_price: "999",
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            getParams: () => [
              toMsgParam("Uint256", "1", "token_id"),
              toMsgParam("Uint128", "999", "sale_price"),
              toMsgParam(
                "ByStr20",
                toTestAddr(CONTRACT_OWNER),
                "royalty_recipient"
              ),
              toMsgParam("Uint128", 99, "royalty_amount"),
            ],
          },
        ],
      },
    },
    {
      name: "gets royalty info: (10, 10%) -> 1",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
        sale_price: "10",
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            getParams: () => [
              toMsgParam("Uint256", "1", "token_id"),
              toMsgParam("Uint128", "10", "sale_price"),
              toMsgParam(
                "ByStr20",
                toTestAddr(CONTRACT_OWNER),
                "royalty_recipient"
              ),
              toMsgParam("Uint128", 1, "royalty_amount"),
            ],
          },
        ],
      },
    },
    {
      name: "gets royalty info: (1, 10%) -> 0",
      transition: "RoyaltyInfo",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
        sale_price: "1",
      }),
      error: undefined,
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            getParams: () => [
              toMsgParam("Uint256", "1", "token_id"),
              toMsgParam("Uint128", "1", "sale_price"),
              toMsgParam(
                "ByStr20",
                toTestAddr(CONTRACT_OWNER),
                "royalty_recipient"
              ),
              toMsgParam("Uint128", 0, "royalty_amount"),
            ],
          },
        ],
      },
    },
    {
      name: "gets token URI",
      transition: "TokenURI",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "1",
      }),
      want: {
        verifyState: () => true,
        events: undefined,
        transitions: [
          {
            getParams: () => [
              toMsgParam("Uint256", `1`, "token_id"),
              toMsgParam("String", `${BASE_URI}1`, "token_uri"),
            ],
            tag: "ZRC6_TokenURICallback",
          },
        ],
      },
    },
    {
      name: "throws TokenNotFoundError",
      transition: "TokenURI",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        token_id: "999",
      }),
      want: undefined,
      error: ZRC6_ERROR.TokenNotFoundError,
    },
    {
      name: "throws NotContractOwnerError",
      transition: "SetContractOwnerCandidate",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws SelfError",
      transition: "SetContractOwnerCandidate",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: toTestAddr(CONTRACT_OWNER),
      }),
      error: ZRC6_ERROR.SelfError,
      want: undefined,
    },
    {
      name: "sets stranger as contract owner candidate by contract owner",
      transition: "SetContractOwnerCandidate",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.contract_owner_candidate === toTestAddr(STRANGER).toLowerCase(),
        events: [
          {
            name: "SetContractOwnerCandidate",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "to"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetContractOwnerCandidateCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "to"),
            ],
          },
        ],
      },
    },

    {
      name: "throws NotContractOwnerError",
      transition: "SetRoyaltyRecipient",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "sets stranger as recipient",
      transition: "SetRoyaltyRecipient",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        to: toTestAddr(STRANGER),
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.royalty_recipient === toTestAddr(STRANGER).toLowerCase(),
        events: [
          {
            name: "SetRoyaltyRecipient",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "to"),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyRecipientCallback",
            getParams: () => [
              toMsgParam("ByStr20", toTestAddr(STRANGER), "to"),
            ],
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        feeBps: "1000",
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 10001",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "10001",
      }),
      error: ZRC6_ERROR.InvalidFeeBPSError,
      want: undefined,
    },
    {
      name: "throws invalid fee bps error: 0",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "0",
      }),
      error: ZRC6_ERROR.InvalidFeeBPSError,
      want: undefined,
    },
    {
      name: "sets fee bps: max",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "10000",
      }),
      error: undefined,
      want: {
        verifyState: (state) => state.royalty_fee_bps === "10000",
        events: [
          {
            name: "SetRoyaltyFeeBPS",
            getParams: () => [toMsgParam("Uint128", 10000, "royalty_fee_bps")],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => [toMsgParam("Uint128", 10000, "royalty_fee_bps")],
          },
        ],
      },
    },
    {
      name: "sets fee bps: min",
      transition: "SetRoyaltyFeeBPS",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        feeBps: "1",
      }),
      error: undefined,
      want: {
        verifyState: (state) => state.royalty_fee_bps === "1",
        events: [
          {
            name: "SetRoyaltyFeeBPS",
            getParams: () => [toMsgParam("Uint128", 1, "royalty_fee_bps")],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetRoyaltyFeeBPSCallback",
            getParams: () => [toMsgParam("Uint128", 1, "royalty_fee_bps")],
          },
        ],
      },
    },
    {
      name: "throws NotContractOwnerError",
      transition: "SetBaseURI",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({
        uri: BASE_URI,
      }),
      error: ZRC6_ERROR.NotContractOwnerError,
      want: undefined,
    },
    {
      name: "sets new base URI",
      transition: "SetBaseURI",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        uri: "http://localhost:1111/testcase/1",
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.base_uri === "http://localhost:1111/testcase/1",
        events: [
          {
            name: "SetBaseURI",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetBaseURICallback",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
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
            [toTestAddr(TOKEN_OWNER).toLowerCase()]:
              INITIAL_TOTAL_SUPPLY.toString(),
          },
          base_uri: BASE_URI,
          contract_owner: toTestAddr(CONTRACT_OWNER).toLowerCase(),
          contract_owner_candidate:
            "0x0000000000000000000000000000000000000000",
          is_paused: { argtypes: [], arguments: [], constructor: "False" },
          minters: {
            [toTestAddr(CONTRACT_OWNER).toLowerCase()]: {
              argtypes: [],
              arguments: [],
              constructor: "True",
            },
          },
          operators: {},
          royalty_fee_bps: "1000",
          royalty_recipient: toTestAddr(CONTRACT_OWNER).toLowerCase(),
          spenders: {},
          token_id_count: INITIAL_TOTAL_SUPPLY.toString(),
          token_name: TOKEN_NAME,
          token_owners: {
            "1": toTestAddr(TOKEN_OWNER).toLowerCase(),
            "2": toTestAddr(TOKEN_OWNER).toLowerCase(),
            "3": toTestAddr(TOKEN_OWNER).toLowerCase(),
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

describe("Accept Contract Ownership", () => {
  beforeEach(async () => {
    let tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )("SetContractOwnerCandidate", toTestAddr(CONTRACT_OWNER_CANDIDATE));
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  const testCases = [
    {
      name: "throws NotContractOwnerCandidateError",
      transition: "AcceptContractOwnership",
      getSender: () => toTestAddr(STRANGER),
      getParams: () => ({}),
      error: ZRC6_ERROR.NotContractOwnerCandidateError,
      want: undefined,
    },
    {
      name: "sets contract owner candidate as contract owner",
      transition: "AcceptContractOwnership",
      getSender: () => toTestAddr(CONTRACT_OWNER_CANDIDATE),
      getParams: () => ({}),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.contract_owner ===
          toTestAddr(CONTRACT_OWNER_CANDIDATE).toLowerCase(),
        events: [
          {
            name: "AcceptContractOwnership",
            getParams: () => [
              toMsgParam(
                "ByStr20",
                toTestAddr(CONTRACT_OWNER_CANDIDATE),
                "contract_owner"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_AcceptContractOwnershipCallback",
            getParams: () => [
              toMsgParam(
                "ByStr20",
                toTestAddr(CONTRACT_OWNER_CANDIDATE),
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
            [toTestAddr(TOKEN_OWNER).toLowerCase()]:
              INITIAL_TOTAL_SUPPLY.toString(),
          },
          base_uri: BASE_URI,
          contract_owner: toTestAddr(CONTRACT_OWNER).toLowerCase(),
          contract_owner_candidate: toTestAddr(
            CONTRACT_OWNER_CANDIDATE
          ).toLowerCase(),
          is_paused: { argtypes: [], arguments: [], constructor: "False" },
          minters: {
            [toTestAddr(CONTRACT_OWNER).toLowerCase()]: {
              argtypes: [],
              arguments: [],
              constructor: "True",
            },
          },
          operators: {},
          royalty_fee_bps: "1000",
          royalty_recipient: toTestAddr(CONTRACT_OWNER).toLowerCase(),
          spenders: {},
          token_id_count: INITIAL_TOTAL_SUPPLY.toString(),
          token_name: TOKEN_NAME,
          token_owners: {
            "1": toTestAddr(TOKEN_OWNER).toLowerCase(),
            "2": toTestAddr(TOKEN_OWNER).toLowerCase(),
            "3": toTestAddr(TOKEN_OWNER).toLowerCase(),
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

describe("Set Base URI", () => {
  beforeEach(async () => {
    let tx = await globalContractInfo.callGetter(
      zilliqa.contracts.at(globalContractAddress),
      TX_PARAMS
    )("SetBaseURI", BASE_URI);
    if (!tx.receipt.success) {
      throw new Error();
    }
  });

  const testCases = [
    {
      name: "sets new base URI",
      transition: "SetBaseURI",
      getSender: () => toTestAddr(CONTRACT_OWNER),
      getParams: () => ({
        uri: "http://localhost:1111/testcase/1",
      }),
      error: undefined,
      want: {
        verifyState: (state) =>
          state.base_uri === "http://localhost:1111/testcase/1",
        events: [
          {
            name: "SetBaseURI",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
              ),
            ],
          },
        ],
        transitions: [
          {
            tag: "ZRC6_SetBaseURICallback",
            getParams: () => [
              toMsgParam(
                "String",
                "http://localhost:1111/testcase/1",
                "base_uri"
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
            [toTestAddr(TOKEN_OWNER).toLowerCase()]:
              INITIAL_TOTAL_SUPPLY.toString(),
          },
          base_uri: BASE_URI,
          contract_owner: toTestAddr(CONTRACT_OWNER).toLowerCase(),
          contract_owner_candidate:
            "0x0000000000000000000000000000000000000000",
          is_paused: { argtypes: [], arguments: [], constructor: "False" },
          minters: {
            [toTestAddr(CONTRACT_OWNER).toLowerCase()]: {
              argtypes: [],
              arguments: [],
              constructor: "True",
            },
          },
          operators: {},
          royalty_fee_bps: "1000",
          royalty_recipient: toTestAddr(CONTRACT_OWNER).toLowerCase(),
          spenders: {},
          token_id_count: INITIAL_TOTAL_SUPPLY.toString(),
          token_name: TOKEN_NAME,
          token_owners: {
            "1": toTestAddr(TOKEN_OWNER).toLowerCase(),
            "2": toTestAddr(TOKEN_OWNER).toLowerCase(),
            "3": toTestAddr(TOKEN_OWNER).toLowerCase(),
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
