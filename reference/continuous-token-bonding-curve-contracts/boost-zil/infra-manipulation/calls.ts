import { BN, Zilliqa } from "@zilliqa-js/zilliqa";
import { getZil } from "./setup";
import { Contract } from "@zilliqa-js/contract";
import { TxParams } from "@zilliqa-js/account";
import { ByStr20 } from "../signable";

const sleep = async (mil: number) =>
  new Promise<void>((res, rej) => setTimeout(() => res(), mil));

export async function waitUntilBlock(target: string): Promise<void> {
  const secondsPerTxBlock = await getSecondsPerBlock();
  console.log(`Waiting ... target: ${target}`);
  console.log(`Current seconds per tx block is ${secondsPerTxBlock}`);
  const targetBNum = parseInt(target);
  while (true) {
    const cur = await getCurrentBlock();
    if (cur < targetBNum) {
      console.log(`Current block ${cur}`);
      await sleep(secondsPerTxBlock * 1000);
      continue;
    } else {
      break;
    }
  }
}

export async function getCurrentBlock(): Promise<number> {
  const zil = getZil();
  const txblock = await zil.blockchain.getLatestTxBlock();
  if (typeof txblock.result == "undefined") {
    throw new Error("Couldn't get tx block");
  }
  return parseInt(txblock.result.header.BlockNum);
}

export async function getSecondsPerBlock(): Promise<number> {
  const zil = getZil();
  const txblockRate = await zil.blockchain.getTxBlockRate();
  if (typeof txblockRate.result == "undefined") {
    throw new Error("Couldn't get tx block rate");
  }
  return Math.ceil(1 / txblockRate.result);
}

export async function getBlockNumber(secondsToAdd: number): Promise<string> {
  const curBlockNumber = await getCurrentBlock();
  const secondsPerTxBlock = await getSecondsPerBlock();
  const res =
    "" + (curBlockNumber + Math.round(secondsToAdd / secondsPerTxBlock));
  console.log(`Current block number: ${curBlockNumber}`);
  console.log(`Returned Block number: ${res}`);
  return res;
}

export async function getMinGasPrice() {
  const zil = getZil();
  const res = await zil.blockchain.getMinimumGasPrice();
  if (!res.result) {
    throw "no gas price";
  }
  return new BN(res.result);
}

export interface Value {
  vname: string;
  type: string;
  value: string | ADTValue | ADTValue[] | string[];
}
interface ADTValue {
  constructor: string;
  argtypes: string[];
  arguments: Value[] | string[];
}

export function newContract(
  zil: Zilliqa,
  code: string,
  init: Value[]
): Contract {
  //@ts-ignore
  return zil.contracts.new(code, init);
}

export function getContract(
  zil: Zilliqa,
  a: string
): Contract & {
  call: (
    transition: string,
    args: Value[],
    params: Pick<
      TxParams,
      "version" | "amount" | "gasPrice" | "gasLimit" | "nonce" | "pubKey"
    >,
    attempts?: number,
    interval?: number,
    toDs?: boolean
  ) => ReturnType<Contract["call"]>;
} {
  const address = new ByStr20(a).toSend();
  //@ts-ignore
  return zil.contracts.at(address);
}
