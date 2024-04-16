import fs from "fs";
import { Long, BN } from "@zilliqa-js/util";
import { GAS_PRICE, VERSION } from "../globalConfig";


const CODE_PATH = "reference-contracts/zrc6.scilla";
export const CODE = fs.readFileSync(CODE_PATH).toString();

export const ZRC6_ERROR = {
  NotPausedError: -1,
  PausedError: -2,
  SelfError: -3,
  NotContractOwnerError: -4,
  NotTokenOwnerError: -5,
  NotMinterError: -6,
  NotOwnerOrOperatorError: -7,
  MinterNotFoundError: -8,
  MinterFoundError: -9,
  SpenderFoundError: -10,
  OperatorNotFoundError: -11,
  OperatorFoundError: -12,
  NotAllowedToTransferError: -13,
  TokenNotFoundError: -14,
  InvalidFeeBPSError: -15,
  ZeroAddressDestinationError: -16,
  ThisAddressDestinationError: -17,
  NotContractOwnershipRecipientError: -18,
};

export const TOKEN_NAME = "TEST";
export const TOKEN_SYMBOL = "T";
export const BASE_URI = "https://creatures-api.zilliqa.com/api/creature/";

export const GAS_LIMIT = Long.fromNumber(100000);

export const TX_PARAMS = {
  version: VERSION,
  amount: new BN(0),
  gasPrice: GAS_PRICE,
  gasLimit: GAS_LIMIT,
};
