import Big from "big.js";
import { ScillaServer } from ".";
import { BN } from "@zilliqa-js/zilliqa";

const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const Reset = "\x1b[0m";
const FgCyan = "\x1b[36m";
const FgMagenta = "\x1b[35m";
const InjectReset = "%s" + Reset;
export const RED = FgRed + InjectReset;
export const GREEN = FgGreen + InjectReset;
export const YELLOW = FgYellow + InjectReset;
export const CYAN = FgCyan + InjectReset;
export const MAGENTA = FgMagenta + InjectReset;

export type TestingFunction = (code: string, ss: ScillaServer) => Promise<void>;

export function printResult(result: { result: "error" | "success" }) {
  process.stdout.write(result.result == "error" ? " ❌" : " ✅");
}

export const testRunner = (ss: ScillaServer) => (scope: string) => {
  const allResults: any[] = [];
  const allErrors: { result: any; error: Big | unknown }[] = [];
  return {
    getAllResults: () => {
      console.log("");
      return allResults;
    },
    getAllErrors: () => {
      console.log("");
      return allErrors;
    },
    runner: async (
      testBody: any,
      errorEval = (response: any) =>
        console.log(response) as unknown as any
    ) => {
      try {
        const result = await ss.runTest({ testBody });
        allResults.push(result);
        allErrors.push({ result, error: errorEval(result) });
        printResult(result);
        return result;
      } catch (e) {
        throw e;
      }
    },
  };
};

export function getGasAvg(results: any[]) {
  const limit = new BN("100000");
  console.log(
    `Average gas across ${results.length} tests: `,
    results
      .map((r) => limit.sub(new BN(r.message.gas_remaining)))
      .reduce((prev, cur) => prev.add(cur), new BN(0))
      .div(new BN(results.length))
      .toString()
  );
}
