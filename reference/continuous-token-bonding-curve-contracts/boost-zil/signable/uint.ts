import { BN } from "@zilliqa-js/util";
import { Signable, sha256 } from "./shared";
import randomBytes from "randombytes";

abstract class UintSignable extends Signable {
  value: BN;
  constructor(v: string | BN) {
    super();
    this.value = new BN(v);
  }
}

export class Uint32 extends UintSignable {
  type = "Uint32";
  constructor(v: string | BN) {
    super(v);
  }
  toHash() {
    return sha256(this.value.toString("hex", 8));
  }
  toSend() {
    return this.value.toString();
  }
}

export class Uint128 extends UintSignable {
  type = "Uint128";
  constructor(v: string | BN) {
    super(v);
  }
  toHash() {
    return sha256(this.value.toString("hex", 32));
  }
  toSend() {
    return this.value.toString();
  }
  static getRandom() {
    return new Uint128(new BN(randomBytes(16).toString("hex"), "hex"));
  }
}
