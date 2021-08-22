import { bytes } from "@zilliqa-js/util";

type Nets = "TESTNET" | "MAINNET" | "ISOLATED";

type EnvVariables = { env: { [key: string]: string } };

var proc: EnvVariables = { env: {} };

if (require("dotenv")) {
  const resolve = require("path").resolve;
  require("dotenv").config({ path: resolve(process.cwd(), ".env") });
}
if (process) {
  proc = process as EnvVariables;
} else {
  console.log(
    `Not in NodeJS env, waiting for env variables to be set using @setEnvVariables`
  );
}

/*
 * Add PRIV_${CUR_NETWORK}
 * and any
 * PRIV_${CUR_NETWORK}_${cur}
 * in ascending order starting from 1
 */
export function setEnvVariables(envConfig: {
  CUR_NETWORK: Nets;
  [key: string]: string;
}) {
  Object.entries(envConfig).forEach(([k, v]) => (proc.env[k] = v));
}

export function getCurNetwork() {
  return proc.env!.CUR_NETWORK as Nets;
}

const nodes: { [key in Nets]: string } = {
  TESTNET: "https://dev-api.zilliqa.com",
  MAINNET: "https://ssn.zillacracy.com/api",
  ISOLATED: "http://localhost:5555",
};

const version: { [key in Nets]: number } = {
  TESTNET: bytes.pack(333, 1),
  ISOLATED: bytes.pack(222, 3),
  MAINNET: bytes.pack(1, 1),
};

const networkName: { [key in Nets]: "testnet" | "mainnet" | "ISOLATED" } = {
  TESTNET: "testnet",
  ISOLATED: "ISOLATED",
  MAINNET: "mainnet",
};

export function getNetworkName(): "testnet" | "mainnet" | "ISOLATED" {
  return networkName[getCurNetwork()];
}

export function getVersion() {
  return version[getCurNetwork()];
}

export function getNode() {
  return nodes[getCurNetwork()];
}
