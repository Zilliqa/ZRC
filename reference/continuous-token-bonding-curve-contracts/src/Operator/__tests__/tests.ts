import { TestingFunction, testRunner } from "../../../scillaTest/utill";
import { testMaker, getGasAvg } from "../../../scillaTest";
import { ByStr20, Uint128 } from "../../../boost-zil";
import * as sdk from "../build/bind";
import { Long, BN } from "@zilliqa-js/util";

export const testOperator: TestingFunction = async (code, ss) => {
  try {
    console.log("🙌 testOperator");
    const fillerAddr = new ByStr20(
      "0x1234567890123456789012345678901234567890"
    );
    const limit = Long.fromString("100000");
    const operator =
      sdk.hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855(
        fillerAddr
      ).run(limit);
    const testing = testRunner(ss)("Operator");
    const run = testing.runner;
    const make = testMaker(code)("1")(
      sdk
        .deploy(
          fillerAddr,
          fillerAddr,
          new Uint128("10"),
          new Uint128("50"),
          fillerAddr
        )
        .initToJSON()
    )("0")([])(fillerAddr);
    const differentAddr = new ByStr20(
      "0x3334567890123456789012345678901234567890"
    );
    const printState = (field: string) => (r: any) => {
      console.log(
        JSON.stringify(
          r.message.states.filter((s: any) => s.vname == field)[0],
          null,
          2
        )
      );
    };
    await run(
      make(operator.ChangeBeneficiary(differentAddr).toJSON()),
      printState("beneficiary")
    );
    await run(
      make(operator.ChangeSpread(new Uint128("49")).toJSON()),
      printState("spread")
    );
    await run(
      make(operator.UpgradeFormula(differentAddr).toJSON()),
      printState("bancor_formula_contract")
    );
    getGasAvg(testing.getAllResults());
  } catch (e) {
    throw e;
  }
};
