import { Signable, sha256 } from "./shared";
import { normaliseAddress } from "../utill";

abstract class ByStrSignable extends Signable {
  value: string;
  constructor(v: string) {
    super();
    this.value = v;
  }
}

abstract class AnyByStr extends ByStrSignable {
  constructor(v: string) {
    let toSet = v.startsWith("0x") ? v : `0x${v}`;
    super(toSet);
  }
  toHash() {
    return sha256(this.value.toLowerCase().replace("0x", ""));
  }
  toSend() {
    return this.value.toLowerCase();
  }
}

export class ByStr20 extends ByStrSignable {
  type = "ByStr20";
  protected zero = "0x" + new Array(40).fill(0).join("");
  static getZeroByStr20() {
    return new ByStr20("0x" + new Array(40).fill(0).join(""));
  }
  constructor(v: string) {
    super(v);
  }
  toHash() {
    return sha256(normaliseAddress(this.value).replace("0x", ""));
  }
  toSend() {
    if (this.value == this.zero) {
      return this.zero;
    }
    const res = normaliseAddress(this.value);
    if (!res) {
      throw new Error("spooky undefined address");
    }
    return res;
  }
}

export class ByStr33 extends AnyByStr {
  type = "ByStr33";
}
export class ByStr64 extends AnyByStr {
  type = "ByStr64";
}
export class ByStr extends AnyByStr {
  type = "ByStr";
}
