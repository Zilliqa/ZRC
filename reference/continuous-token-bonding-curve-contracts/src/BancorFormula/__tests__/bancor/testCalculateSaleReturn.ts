import { saleReturnTestCases } from "../cases/saleReturnTestCases";
import { TestingFunction, testRunner } from "../../../../scillaTest/utill";
import { testMaker, getGasAvg } from "../../../../scillaTest";
import { ByStr20, Uint128 } from "../../../../boost-zil";
import * as sdk from "../../build/bind";
import { Long, BN } from "@zilliqa-js/util";
import { getError, getErrorStats } from "./utill";
import Big from "big.js";

export const testCalculateSaleReturn: TestingFunction = async (code, ss) => {
  try {
    console.log("🙌 testCalculateSaleReturn");
    const fillerAddr = new ByStr20(
      "0x1234567890123456789012345678901234567890"
    );
    const limit = Long.fromString("100000");
    const testing = testRunner(ss)("BancorFormula");
    const run = testing.runner;
    const make = testMaker(code)("1")(sdk.deploy().initToJSON())("0")([])(
      fillerAddr
    );
    const bancor = sdk
      .hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855(
        fillerAddr
      )
      .run(limit);
    async function runBatch(testCases: string[][]) {
      await Promise.all(
        testCases.map((test) =>
          run(
            make(
              bancor
                .CalculateSaleReturn(
                  new Uint128(test[0]),
                  new Uint128(test[1]),
                  new Uint128(test[2]),
                  new Uint128(test[3])
                )
                .toJSON()
            ),
            getError(test[4])
          )
        )
      );
    }

    await runBatch(saleReturnTestCases);
    getErrorStats(testing.getAllErrors() as { result: any; error: Big }[]);
    getGasAvg(testing.getAllResults());
  } catch (e) {
    throw e;
  }
};
