import { scillaServer } from "../../../scillaTest";
import { testCalculatePurchaseReturn } from "./bancor/testCalculatePurchaseReturn";
import { testCalculateSaleReturn } from "./bancor/testCalculateSaleReturn";
import { testCalculateCrossConnectorReturn } from "./bancor/testCalculateCrossConnectorReturn";
import { code } from "../build/bind";

(async () => {
  try {
    await testCalculatePurchaseReturn(code, scillaServer);
    await testCalculateSaleReturn(code, scillaServer);
    await testCalculateCrossConnectorReturn(code, scillaServer);
  } catch (e) {
    console.error(e);
  }
  console.info("Done!");
  process.exit();
})();
