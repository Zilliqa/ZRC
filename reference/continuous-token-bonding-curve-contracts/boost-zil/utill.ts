import { fromBech32Address, toChecksumAddress } from "@zilliqa-js/zilliqa";
import { validation } from "@zilliqa-js/util";
import { Signable } from "./signable/shared";

export const normaliseAddress = (address: string): string => {
  if (validation.isBech32(address)) {
    return fromBech32Address(address);
  }
  if (!validation.isAddress(address.replace("0x", ""))) {
    throw Error(
      "Wrong address format, should be either bech32 or checksummed address"
    );
  }
  return toChecksumAddress(address);
};

export function concatHashed(...hashes: string[]): string {
  return `0x${hashes.reduce((prev, cur) => prev + cur.replace("0x", ""), "")}`;
}

export function getHashed(...hashes: Signable[]): string {
  return concatHashed(...hashes.map((a) => a.toHash()));
}
