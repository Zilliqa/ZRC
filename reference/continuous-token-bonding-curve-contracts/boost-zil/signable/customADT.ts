import { Signable } from "./shared";
import { getHashed } from "../utill";
import { Sendable } from "./types";
import { ByStr20 } from "./bystr";

/**
 * {
    tname: string;
    tparams: string[];
    tmap: {
        cname: string;
        argtypes: string[];
    }[];
    {
        constructor: `${addr}.Uint128Pair`,
        argtypes: [],
        arguments: [threshold.toString(), discount.toString()],
    }
}
 */
export class CustomADT<T extends Signable[]> extends Signable {
  value: T;
  constructor(...v: T) {
    super();
    this.value = v;
  }
  toHash() {
    return getHashed(...this.value);
  }
  toSend() {
    return {
      constructor: this.getType(),
      argtypes: [],
      arguments: this.value.map((v) => v.toSend()),
    } as unknown as Sendable;
  }
  setADTname(s: string) {
    this.type = s;
    this.ADTname = s;
    this.value.forEach((v) => v.setADTname(s));
    return this;
  }
  setContractAddress(a: ByStr20) {
    this.contractAddress = a;
    this.value.forEach((v) => v.setContractAddress(a));
    return this;
  }
  getType() {
    if (!this.contractAddress) {
      throw new Error("Contract name not set!");
    }
    if (!this.ADTname) {
      throw new Error("Custom ADT name not set!");
    }
    return `${this.contractAddress.toSend().toLowerCase()}.${this.ADTname}`;
  }
}
