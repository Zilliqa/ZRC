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
  NotPausedError: -1,
  PausedError: -2,
  SelfError: -3,
  NotContractOwnerError: -4,
  NotContractOwnerCandidateError: -5,
  NotTokenOwnerError: -6,
  NotMinterError: -7,
  NotOwnerOrOperatorError: -8,
  MinterNotFoundError: -9,
  MinterFoundError: -10,
  SpenderNotFoundError: -11,
  SpenderFoundError: -12,
  OperatorNotFoundError: -13,
  OperatorFoundError: -14,
  NotAllowedToTransferError: -15,
  TokenNotFoundError: -16,
  InvalidFeeBPSError: -17,
  ZeroAddressDestinationError: -18,
  ThisAddressDestinationError: -19,
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
