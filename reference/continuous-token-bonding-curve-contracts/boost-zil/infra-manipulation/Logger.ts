import { Transaction } from "@zilliqa-js/account";
import { getNetworkName } from "./shared";
import { units, BN, toBech32Address } from "@zilliqa-js/zilliqa";

const RED = "\x1B[31m%s\x1b[0m";
const CYAN = "\x1B[36m%s\x1b[0m";
const GREEN = "\x1B[32m%s\x1b[0m";
const MAGENTA = "\x1B[35m%s\x1b[0m";

export function state(v: {}) {
  const color = "\x1b[33m%s\x1b[0m";
  console.log(color, JSON.stringify(v, null, 4));
}

export function balance(inQa: BN) {
  const color = "\x1b[35m%s\x1b[0m";
  console.log(
    color,
    `In Zil: ${units.fromQa(inQa, units.Units.Zil).toString()}`
  );
  console.log(color, `In Li: ${units.fromQa(inQa, units.Units.Li).toString()}`);
  console.log(color, `In Qa: ${inQa.toString()}`);
}

export function txLink(t: Transaction, msg: string) {
  const id = t.id;
  const url = `https://viewblock.io/zilliqa/tx/0x${id}?network=${getNetworkName()}`;
  console.log(MAGENTA, msg);
  const receipt = t.getReceipt();
  if (receipt) {
    if (receipt.success) {
      console.log(GREEN, "Success.");
    } else {
      console.log(RED, "Failed.");
      console.log(RED, JSON.stringify(receipt, null, 2));
      if (receipt.event_logs)
        receipt.event_logs.forEach((e) =>
          console.log(GREEN, JSON.stringify(e, null, 2))
        );
    }
  }
  if (!(getNetworkName() == "ISOLATED")) {
    console.log(CYAN, url);
  } else console.log(CYAN, t.txParams.toAddr);
}

export function contractLink(a: string, msg: string) {
  console.log(RED, msg);
  if (!(getNetworkName() == "ISOLATED")) {
    const url = `https://viewblock.io/zilliqa/address/${a}?network=${getNetworkName()}&tab=state`;
    console.log(RED, url);
  }
}

export function logAccount(a: string) {
  console.log(RED, `Bech32: ${toBech32Address(a)}`);
  console.log(RED, `20 byte: ${a}`);
  const url = `https://viewblock.io/zilliqa/address/${a}?network=${getNetworkName()}`;
  console.log(CYAN, url);
}
