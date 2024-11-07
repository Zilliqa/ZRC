import { Signable } from "./shared";
import { getHashed } from "../utill";
import { Sendable } from "./types";
import { ByStr20 } from "./bystr";

export class Pair<F extends Signable, S extends Signable> extends Signable {
  value: [F, S];
  constructor(...v: [F, S]) {
    super();
    this.value = v;
  }
  toHash() {
    return getHashed(...this.value);
  }
  toSend() {
    return {
      constructor: "Pair",
      argtypes: this.value.map((v) => v.getType()),
      arguments: this.value.map((v) => v.toSend()),
    } as unknown as Sendable;
  }
  setADTname(s: string) {
    this.ADTname = s;
    this.value.forEach((v) => v.setADTname(s));
    return this;
  }
  setContractAddress(a: ByStr20) {
    this.contractAddress = a;
    this.value.forEach((v) => v.setContractAddress(a));
    return this;
  }
}
