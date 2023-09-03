import { Signable } from "./shared";
import createHash from "create-hash";

function sha256String(s: string): string {
  const sha = createHash("sha256");
  sha.update(s);
  return `0x${sha.digest().toString("hex")}`;
}

abstract class StringSignable extends Signable {
  value: string;
  constructor(v: string) {
    super();
    this.value = v;
  }
}

export class BNum extends StringSignable {
  type = "BNum";
  constructor(v: string) {
    super(v);
  }
  toHash() {
    return sha256String(this.value);
  }
  toSend() {
    return this.value;
  }
}

export class ScillaString extends StringSignable {
  type = "String";
  constructor(v: string) {
    super(v);
  }
  toHash() {
    return sha256String(this.value);
  }
  toSend() {
    return this.value;
  }
}
