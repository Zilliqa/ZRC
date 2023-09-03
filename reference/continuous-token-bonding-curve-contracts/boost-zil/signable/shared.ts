import createHash from "create-hash";
import { Sendable } from "./types";
import { ByStr20 } from ".";

export abstract class Signable {
  abstract value: any;
  protected type?: string;
  contractAddress?: ByStr20;
  ADTname?: string;
  abstract toHash(): string;
  abstract toSend(): Sendable;
  setContractAddress(contractAddress: ByStr20) {
    this.contractAddress = contractAddress;
    return this;
  }
  setADTname(ADTname: string) {
    this.ADTname = ADTname;
    return this;
  }
  getType() {
    if (!this.type) {
      throw new Error("type was not defined!");
    }
    return this.type;
  }
}

/**
 * @param b
 * @returns hash of form `0x${sha.digest().toString("hex")}`
 */
export function sha256(b: string): string {
  const sha = createHash("sha256");
  sha.update(Buffer.from(b, "hex"));
  return `0x${sha.digest().toString("hex")}`;
}
