import { ScillaServer } from "./ScillaServer";

const scillaServerUrl = "https://scilla-server.zilliqa.com";
export const scillaServer = new ScillaServer(scillaServerUrl);
export * from "./ScillaServer";
export * from "./testMaker";
export { getGasAvg } from "./utill";
