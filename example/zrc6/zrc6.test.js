const { Zilliqa } = require("@zilliqa-js/zilliqa");
const { BN, Long, bytes, units } = require("@zilliqa-js/util");
const fs = require("fs");

const { schnorr, getAddressFromPrivateKey } = require("@zilliqa-js/crypto");
const { expect } = require("@jest/globals");
const { useContractInfo, toMsgParam } = require("./testutil");

const API = `http://localhost:${process.env["PORT"]}`; // Zilliqa Isolated Server
const CHAIN_ID = 222;
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

const zilliqa = new Zilliqa(API);

const privateKey =
  "e53d1c3edaffc7a7bab5418eb836cf75819a82872b4a1a0f1c7fcf5c3e020b89";
zilliqa.wallet.addByPrivateKey(privateKey);

const codePath = "../../reference/zrc6.scilla";
const code = fs.readFileSync(codePath).toString();

const gasPrice = units.toQa("2000", units.Units.Li);
const gasLimit = Long.fromNumber(25000);

jest.setTimeout(60 * 1000); // 1 min

let globalContractInfo;
let globalContractAddress;

let globalContractOwner;
let globalApprovedSpender;
let globalOperator;

const zrc6Error = {
  NotFoundError: -1,
  ConflictError: -2,
  SelfError: -3,
  NotContractOwnerError: -4,
  NotTokenOwnerError: -5,
  NotMinterError: -6,
  NotApprovedError: -7,
  NotApprovedForAllError: -8,
  NotOwnerOrOperatorError: -9,
  NotApprovedSpenderOrOperatorError: -10,
  InvalidFeeBpsError: -11,
};

const toScillaErrorMsg = (code) =>
  `Exception thrown: (Message [(_exception : (String "Error")) ; (code : (Int32 ${code}))])`;

const globalTestAccounts = [];
const container = process.env["CONTAINER"];

const tokenName = "TEST";
const tokenSymbol = "T";
const sampleTokens = ["foo", "bar", "baz"];

const txParams = {
  version: VERSION,
  amount: new BN(0),
  gasPrice,
  gasLimit,
};

const callGlobalContract = async (transitionName, ...args) => {
  const tx = await zilliqa.contracts
    .at(globalContractAddress)
    .call(
      transitionName,
      globalContractInfo.getTransitionParams(transitionName, ...args),
      txParams
    );
  return tx;
};

beforeAll(async () => {
  for (let i = 0; i < 10; i++) {
    const privateKey = await schnorr.generatePrivateKey();
    zilliqa.wallet.addByPrivateKey(privateKey);
    const address = await getAddressFromPrivateKey(privateKey);
    const tx = await zilliqa.blockchain.createTransaction(
      zilliqa.transactions.new(
        {
          version: VERSION,
          toAddr: address,
          amount: new BN(units.toQa("100000000", units.Units.Zil)),
          gasPrice: units.toQa("2000", units.Units.Li),
          gasLimit: Long.fromNumber(50),
        },
        false
      )
    );

    if (!tx.receipt.success) {
      throw new Error();
    }
    globalTestAccounts.push({ address, privateKey });
  }

  globalContractOwner = globalTestAccounts[0].address;
  globalOperator = globalTestAccounts[1].address;
  globalApprovedSpender = globalTestAccounts[2].address;
  globalMinter = globalTestAccounts[1].address;

  globalContractInfo = await useContractInfo(container, codePath, gasLimit);
});

beforeEach(async () => {
  zilliqa.wallet.setDefault(globalContractOwner);
  const init = globalContractInfo.getInitParams(
    globalContractOwner,
    tokenName,
    tokenSymbol
  );
  const [, contract] = await zilliqa.contracts
    .new(code, init)
    .deploy(txParams, 33, 1000, true);
  globalContractAddress = contract.address;

  if (globalContractAddress === undefined) {
    throw new Error();
  }

  let tx = await callGlobalContract(
    "BatchMint",
    [globalContractOwner, globalContractOwner, globalContractOwner],
    sampleTokens
  );
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await callGlobalContract("SetApproval", globalApprovedSpender, "1");
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await callGlobalContract("SetApprovalForAll", globalOperator);
  if (!tx.receipt.success) {
    throw new Error();
  }

  tx = await callGlobalContract("SetMinter", globalMinter);
  if (!tx.receipt.success) {
    throw new Error();
  }
});

describe("Token", () => {
  it("gets the total supply, name, and symbol", async () => {
    const testCases = [
      {
        transition: "TotalSupply",
        want: [
          {
            params: [
              toMsgParam("Uint256", sampleTokens.length, "total_supply"),
            ],
            tag: "ZRC6_TotalSupplyCallback",
          },
        ],
      },
      {
        transition: "Name",
        want: [
          {
            params: [toMsgParam("String", tokenName, "name")],
            tag: "ZRC6_NameCallback",
          },
        ],
      },
      {
        transition: "Symbol",
        want: [
          {
            params: [toMsgParam("String", tokenSymbol, "symbol")],
            tag: "ZRC6_SymbolCallback",
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract(testCase.transition, []);

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("gets token URI", async () => {
    const testCases = [
      {
        transition: "TokenURI",
        params: {
          token_id: "1",
        },
        want: [
          {
            params: [toMsgParam("String", sampleTokens[0], "token_uri")],
            tag: "ZRC6_TokenURICallback",
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract(
        testCase.transition,
        testCase.params.token_id
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("gets balance", async () => {
    const testCases = [
      {
        params: {
          address: globalContractOwner,
        },
        want: [
          {
            params: [toMsgParam("Uint256", 3, "balance")],
            tag: "ZRC6_BalanceOfCallback",
          },
        ],
      },
      {
        params: {
          address: globalTestAccounts[9].address,
        },
        want: [
          {
            params: [toMsgParam("Uint256", 0, "balance")],
            tag: "ZRC6_BalanceOfCallback",
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract("BalanceOf", testCase.params.address);

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });
});

describe("Mint & Burn", () => {
  it("removes a minter", async () => {
    const tx = await callGlobalContract("SetMinter", globalMinter);
    expect(tx.receipt.success).toBe(true);
    const { msg } = tx.receipt.transitions.pop();
    expect(msg._tag).toBe("ZRC6_SetMinterCallback");
    expect(JSON.stringify(msg.params)).toBe(
      JSON.stringify([
        toMsgParam("ByStr20", globalMinter, "minter"),
        toMsgParam("Bool", "False", "is_minter"),
      ])
    );
  });

  it("adds a minter", async () => {
    const tx = await callGlobalContract(
      "SetMinter",
      globalTestAccounts[9].address
    );
    expect(tx.receipt.success).toBe(true);
    const { msg } = tx.receipt.transitions.pop();
    expect(msg._tag).toBe("ZRC6_SetMinterCallback");
    expect(JSON.stringify(msg.params)).toBe(
      JSON.stringify([
        toMsgParam("ByStr20", globalTestAccounts[9].address, "minter"),
        toMsgParam("Bool", "True", "is_minter"),
      ])
    );
  });

  it("mints a token", async () => {
    const testCases = [
      {
        sender: globalContractOwner,
        params: {
          tokenUri: "X",
          address: globalContractOwner,
        },
        want: [
          {
            tag: "ZRC6_RecipientAcceptMint",
            params: [],
          },
          {
            tag: "ZRC6_MintCallback",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "recipient"),
              toMsgParam("Uint256", 4, "token_id"),
              toMsgParam("String", "X", "token_uri"),
            ],
          },
        ],
      },
      {
        sender: globalMinter, // Minter
        params: {
          tokenUri: "Y",
          address: globalMinter,
        },
        want: [
          {
            tag: "ZRC6_RecipientAcceptMint",
            params: [],
          },
          {
            tag: "ZRC6_MintCallback",
            params: [
              toMsgParam("ByStr20", globalMinter, "recipient"),
              toMsgParam("Uint256", 5, "token_id"),
              toMsgParam("String", "Y", "token_uri"),
            ],
          },
        ],
      },
      {
        sender: globalTestAccounts[9].address, // Not a minter
        params: {
          tokenUri: "Z",
          address: globalTestAccounts[9].address,
        },
        want: undefined,
        error: zrc6Error.NotMinterError,
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await callGlobalContract(
        "Mint",
        testCase.params.address,
        testCase.params.tokenUri
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);

        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("mints tokens in batches", async () => {
    const tx = await callGlobalContract(
      "BatchMint",
      [globalContractOwner, globalContractOwner, globalContractOwner],
      sampleTokens
    );

    expect(tx.receipt.success).toBe(true);
    const { msg } = tx.receipt.transitions.pop();
    expect(msg._tag).toBe("ZRC6_BatchMintCallback");
    expect(JSON.stringify(msg.params)).toBe(JSON.stringify([]));
  });

  it("burns a token", async () => {
    const testCases = [
      {
        params: {
          token_id: "1",
        },

        want: [
          {
            tag: "ZRC6_BurnCallback",

            params: [
              toMsgParam("ByStr20", globalContractOwner, "initiator"),
              toMsgParam("ByStr20", globalContractOwner, "burn_address"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
      {
        params: {
          token_id: "1",
        },
        want: undefined,
        error: zrc6Error.NotFoundError,
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract("Burn", testCase.params.token_id);

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });
});

describe("Transfer", () => {
  it("gets approved spender", async () => {
    const testCases = [
      {
        transition: "GetApproved",
        params: {
          token_id: "999",
        },
        want: undefined,
        error: zrc6Error.NotApprovedError,
      },
      {
        transition: "GetApproved",
        params: {
          token_id: "1",
        },
        want: [
          {
            params: [
              toMsgParam("ByStr20", globalApprovedSpender, "approved_address"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
            tag: "ZRC6_GetApprovedCallback",
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract(
        testCase.transition,
        testCase.params.token_id
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("checks token owner", async () => {
    const testCases = [
      {
        params: {
          token_id: "1",
          address: globalTestAccounts[9].address,
        },
        want: undefined,
        error: zrc6Error.NotTokenOwnerError,
      },
      {
        params: {
          token_id: "1",
          address: globalContractOwner,
        },
        want: [
          {
            params: [],
            tag: "ZRC6_IsTokenOwnerCallback",
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract(
        "CheckTokenOwner",
        testCase.params.token_id,
        testCase.params.address
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("checks operator", async () => {
    const testCases = [
      {
        params: {
          tokenOwner: globalContractOwner,
          operator: globalTestAccounts[9].address,
        },
        want: undefined,
        error: zrc6Error.NotApprovedForAllError,
      },
      {
        params: {
          tokenOwner: globalContractOwner,
          operator: globalOperator,
        },
        want: [
          {
            params: [
              toMsgParam("ByStr20", globalContractOwner, "token_owner"),
              toMsgParam("ByStr20", globalOperator, "operator"),
            ],
            tag: "ZRC6_IsApprovedForAllCallback",
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract(
        "CheckApprovedForAll",
        testCase.params.tokenOwner,
        testCase.params.operator
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("sets approved spender", async () => {
    const testCases = [
      {
        sender: globalContractOwner,
        params: {
          to: globalTestAccounts[9].address,
          token_id: "999", // Non-existing token
        },
        want: undefined,
        error: zrc6Error.NotFoundError,
      },
      {
        sender: globalTestAccounts[9].address, // Not a token owner
        params: {
          to: globalTestAccounts[9].address,
          token_id: "1",
        },
        want: undefined,
        error: zrc6Error.NotOwnerOrOperatorError,
      },
      {
        sender: globalContractOwner,
        params: {
          to: globalTestAccounts[9].address,
          token_id: "1",
        },
        want: undefined,
        // globalApprovedSpender should be removed first to update it
        // since there is globalApprovedSpender in the token_approvals.
        error: zrc6Error.NotApprovedError,
      },
      {
        sender: globalContractOwner,
        params: {
          to: globalApprovedSpender,
          token_id: "1",
        },
        want: [
          {
            tag: "ZRC6_SetApprovalCallback",
            params: [
              toMsgParam("ByStr20", globalApprovedSpender, "approved_spender"),
              toMsgParam("Uint256", 1, "token_id"),
              toMsgParam("Bool", "False", "is_approved_spender"),
            ],
          },
        ],
      },
      {
        sender: globalContractOwner,
        params: {
          to: globalTestAccounts[9].address,
          token_id: "2",
        },
        want: [
          {
            tag: "ZRC6_SetApprovalCallback",
            params: [
              toMsgParam(
                "ByStr20",
                globalTestAccounts[9].address,
                "approved_spender"
              ),
              toMsgParam("Uint256", 2, "token_id"),
              toMsgParam("Bool", "True", "is_approved_spender"),
            ],
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await callGlobalContract(
        "SetApproval",
        testCase.params.to,
        testCase.params.token_id
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);

        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("sets operator", async () => {
    const testCases = [
      {
        sender: globalContractOwner,
        params: {
          to: globalContractOwner, // Self
        },
        want: undefined,
        error: zrc6Error.SelfError,
      },
      {
        sender: globalContractOwner,
        params: {
          to: globalOperator,
        },
        want: [
          {
            tag: "ZRC6_SetApprovalForAllCallback",
            params: [
              toMsgParam("ByStr20", globalOperator, "operator"),
              toMsgParam("Bool", "False", "is_operator"),
            ],
          },
        ],
      },
      {
        sender: globalContractOwner,
        params: {
          to: globalTestAccounts[9].address,
        },
        want: [
          {
            tag: "ZRC6_SetApprovalForAllCallback",
            params: [
              toMsgParam("ByStr20", globalTestAccounts[9].address, "operator"),
              toMsgParam("Bool", "True", "is_operator"),
            ],
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await callGlobalContract(
        "SetApprovalForAll",
        testCase.params.to
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);

        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("transfers token (token owner only)", async () => {
    const testCases = [
      {
        sender: globalContractOwner,
        params: {
          to: globalContractOwner, // Self
          token_id: "1",
        },
        want: undefined,
        error: zrc6Error.SelfError,
      },
      {
        sender: globalOperator, // Not Owner
        params: {
          to: globalContractOwner,
          token_id: "1",
        },
        want: undefined,
        error: zrc6Error.NotTokenOwnerError,
      },
      {
        sender: globalContractOwner,
        params: {
          to: globalApprovedSpender,
          token_id: "1",
        },
        want: [
          {
            tag: "ZRC6_RecipientAcceptTransfer",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "from"),
              toMsgParam("ByStr20", globalApprovedSpender, "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferCallback",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "from"),
              toMsgParam("ByStr20", globalApprovedSpender, "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await callGlobalContract(
        "Transfer",
        testCase.params.to,
        testCase.params.token_id
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);

        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("transfers token (approved spender or operator only)", async () => {
    const testCases = [
      {
        sender: globalApprovedSpender,
        params: {
          to: globalContractOwner, // Self (token owner)
          token_id: "1",
        },
        want: undefined,
        error: zrc6Error.SelfError,
      },
      {
        sender: globalApprovedSpender,
        params: {
          to: globalTestAccounts[9].address,
          token_id: "1",
        },
        want: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "from"),
              toMsgParam("ByStr20", globalTestAccounts[9].address, "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "from"),
              toMsgParam("ByStr20", globalTestAccounts[9].address, "recipient"),
              toMsgParam("Uint256", 1, "token_id"),
            ],
          },
        ],
      },
      {
        sender: globalOperator,
        params: {
          to: globalTestAccounts[9].address,
          token_id: "2",
        },
        want: [
          {
            tag: "ZRC6_RecipientAcceptTransferFrom",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "from"),
              toMsgParam("ByStr20", globalTestAccounts[9].address, "recipient"),
              toMsgParam("Uint256", 2, "token_id"),
            ],
          },
          {
            tag: "ZRC6_TransferFromCallback",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "from"),
              toMsgParam("ByStr20", globalTestAccounts[9].address, "recipient"),
              toMsgParam("Uint256", 2, "token_id"),
            ],
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      zilliqa.wallet.setDefault(testCase.sender);
      const tx = await callGlobalContract(
        "TransferFrom",
        testCase.params.to,
        testCase.params.token_id
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);

        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });
});

describe("Royalty", () => {
  it("gets royalty info", async () => {
    const testCases = [
      {
        params: {
          token_id: "999",
          sale_price: 1000,
        },
        want: undefined,
        error: zrc6Error.NotFoundError,
      },
      {
        params: {
          token_id: "1",
          sale_price: 1000,
        },
        want: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "royalty_recipient"),
              toMsgParam("Uint256", 100, "royalty_amount"),
            ],
          },
        ],
      },
      {
        params: {
          token_id: "1",
          sale_price: 10,
        },
        want: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "royalty_recipient"),
              toMsgParam("Uint256", 1, "royalty_amount"),
            ],
          },
        ],
      },
      {
        params: {
          token_id: "1",
          sale_price: 1,
        },
        want: [
          {
            tag: "ZRC6_RoyaltyInfoCallback",
            params: [
              toMsgParam("ByStr20", globalContractOwner, "royalty_recipient"),
              toMsgParam("Uint256", 0, "royalty_amount"),
            ],
          },
        ],
      },
    ];

    for (const testCase of testCases) {
      const tx = await callGlobalContract(
        "RoyaltyInfo",
        testCase.params.token_id,
        testCase.params.sale_price.toString()
      );

      if (testCase.want === undefined) {
        // Negative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);
        tx.receipt.transitions.forEach((cur, index) => {
          const { msg } = cur;
          expect(msg._tag).toBe(testCase.want[index].tag);
          expect(JSON.stringify(msg.params)).toBe(
            JSON.stringify(testCase.want[index].params)
          );
        });
      }
    }
  });

  it("sets royalty fee BPS", async () => {
    const initialFeeBps = "1000";

    const contract = zilliqa.contracts.at(globalContractAddress);
    const state = await contract.getState();
    expect(state.royalty_fee_bps).toBe(initialFeeBps);

    const testCases = [
      {
        feeBps: 10001,
        want: undefined,
        error: zrc6Error.InvalidFeeBpsError,
      },
      {
        feeBps: 0,
        want: undefined,
        error: zrc6Error.InvalidFeeBpsError,
      },
      {
        feeBps: 10000,
        want: 10000,
      },
      {
        feeBps: 1,
        want: 1,
      },
    ];
    for (const testCase of testCases) {
      const tx = await callGlobalContract(
        "SetRoyaltyFeeBPS",
        testCase.feeBps.toString()
      );
      if (testCase.want === undefined) {
        // Nagative Cases
        expect(tx.receipt.success).toBe(false);
        expect(tx.receipt.exceptions[0].message).toBe(
          toScillaErrorMsg(testCase.error)
        );
      } else {
        // Positive Cases
        expect(tx.receipt.success).toBe(true);

        const state = await contract.getState();
        expect(state.royalty_fee_bps).toBe(testCase.want.toString());
      }
    }
  });

  it("sets a new royalty recipient", async () => {
    const oldRecipient = globalContractOwner;
    const newRecipient = globalTestAccounts[9].address.toLowerCase();

    const contract = zilliqa.contracts.at(globalContractAddress);
    let state = await contract.getState();
    expect(state.royalty_recipient).toBe(oldRecipient.toLowerCase());

    const tx = await callGlobalContract("SetRoyaltyRecipient", newRecipient);

    expect(tx.receipt.success).toBe(true);

    state = await contract.getState();
    expect(state.royalty_recipient).toBe(newRecipient);
  });
});
