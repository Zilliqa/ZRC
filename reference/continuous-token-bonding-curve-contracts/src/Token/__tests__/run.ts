import { scillaServer } from "../../../scillaTest";
import { testDeployAndInitTokenWithZIL } from "./testDeployAndInitTokenWithZIL";
import { testDeployAndInitTokenWithZRC2 } from "./testDeployAndInitTokenWithZRC2";
import { code } from "../build/bind";

(async () => {
  try {
    await testDeployAndInitTokenWithZIL(code, scillaServer);
    await testDeployAndInitTokenWithZRC2(code, scillaServer);
  } catch (e) {
    console.error(e);
  }
  console.info("Done!");
  process.exit();
})();
