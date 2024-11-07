import { scillaServer } from "../../../scillaTest";
import { testOperator } from "./tests";
import { code } from "../build/bind";

(async () => {
  try {
    await testOperator(code, scillaServer);
  } catch (e) {
    console.error(e);
  }
  console.info("Done!");
  process.exit();
})();
