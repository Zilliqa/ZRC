import { bytes, units } from "@zilliqa-js/util";
import fs from "fs";
import { Long, BN } from "@zilliqa-js/util";

export const CONTAINER = process.env["CONTAINER"];

export const API = `http://localhost:${process.env["PORT"]}`; // Zilliqa Isolated Server
export const CHAIN_ID = 222;
export const MSG_VERSION = 1;
export const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

export const CODE_PATH = "reference/zrc6.scilla";
export const CODE = fs.readFileSync(CODE_PATH).toString();

export const ZRC6_ERROR = {
  SelfError: -1,
  NotContractOwnerError: -2,
  NotContractOwnerCandidateError: -3,
  NotTokenOwnerError: -4,
  NotMinterError: -5,
  NotOwnerOrOperatorError: -6,
  MinterNotFoundError: -7,
  MinterFoundError: -8,
  SpenderNotFoundError: -9,
  SpenderFoundError: -10,
  OperatorNotFoundError: -11,
  OperatorFoundError: -12,
  NotAllowedToTransferError: -13,
  TokenNotFoundError: -14,
  InvalidFeeBpsError: -15,
};

export const TOKEN_NAME = "TEST";
export const TOKEN_SYMBOL = "T";
export const BASE_URI = "https://creatures-api.zilliqa.com/api/creature/";
export const INITIAL_TOTAL_SUPPLY = 3;

export const GAS_LIMIT = Long.fromNumber(100000);
export const GAS_PRICE = units.toQa("2000", units.Units.Li);

export const TX_PARAMS = {
  version: VERSION,
  amount: new BN(0),
  gasPrice: GAS_PRICE,
  gasLimit: GAS_LIMIT,
};

export const FAUCET_PARAMS = {
  version: VERSION,
  amount: new BN(units.toQa("100000000", units.Units.Zil)),
  gasPrice: GAS_PRICE,
  gasLimit: Long.fromNumber(50),
};
