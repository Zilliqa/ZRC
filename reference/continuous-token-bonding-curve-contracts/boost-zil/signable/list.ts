import { Signable } from "./shared";
import { getHashed } from "../utill";
import { Sendable } from "./types";
import { ByStr20 } from "./bystr";

export class List<T extends Signable> extends Signable {
  value: T[];
  constructor(v: T[]) {
    super();
    this.value = v;
  }
  toHash() {
    return getHashed(...this.value);
  }
  toSend() {
    return this.value.map((v) => v.toSend()) as unknown as Sendable;
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
  getType() {
    return `List (${this.value[0].getType()})`;
  }
}
