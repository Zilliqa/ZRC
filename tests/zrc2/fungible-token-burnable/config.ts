import fs from "fs";
import { Long, BN } from "@zilliqa-js/util";
import { GAS_PRICE, VERSION } from "../../globalConfig";


const CODE_PATH = "reference-contracts/FungibleToken-Burnable.scilla";
export const CODE = fs.readFileSync(CODE_PATH).toString();

export const FungibleBurnableToken_ERROR = {
  CodeIsSender: -1,
  CodeInsufficientFunds: -2,
  CodeInsufficientAllowance: -3,
  CodeNotOwner: -4
};

export const TOKEN_NAME = "TEST";
export const TOKEN_SYMBOL = "T";
export const TOKEN_DECIMALS = 6;
export const TOKEN_INIT_SUPPLY = 1000000000;

export const GAS_LIMIT = Long.fromNumber(100000);

export const TX_PARAMS = {
  version: VERSION,
  amount: new BN(0),
  gasPrice: GAS_PRICE,
  gasLimit: GAS_LIMIT,
};
