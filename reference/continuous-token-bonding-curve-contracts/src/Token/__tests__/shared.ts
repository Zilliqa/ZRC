import * as operatorSDK from "../../Operator/build/bind";
import * as formulaSDK from "../../BancorFormula/build/bind";
import { ByStr20, Uint128 } from "../../../boost-zil";
import { Long } from "@zilliqa-js/util";

export async function deployFormulaAndOperator(adminAddr: ByStr20) {
  const limit = Long.fromString("100000");
  const thirdIsolatedServerAddress = new ByStr20(
    "0xB028055EA3BC78D759d10663Da40D171dec992Aa"
  );
  const [, , formulaAddr] = await formulaSDK.deploy().send(limit);
  const [, , operatorAddr] = await operatorSDK
    .deploy(
      adminAddr,
      formulaAddr,
      new Uint128("10"), // 1% spread
      new Uint128("50"), // max 5% spread
      thirdIsolatedServerAddress
    )
    .send(limit);
  return { operatorAddr };
}
