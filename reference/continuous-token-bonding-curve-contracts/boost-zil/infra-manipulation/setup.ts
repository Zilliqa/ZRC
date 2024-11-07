import { Zilliqa } from "@zilliqa-js/zilliqa";
import { getNode, getCurNetwork, getNetworkName } from "./shared";

const color = "\x1b[41m\x1b[5m%s\x1b[0m";
const logColor = (s: string) => console.log(color, s);

logColor(`::: NETWORK => ${getCurNetwork()} !!!!`);

const isolatedServerAccounts = {
  d90f2e538ce0df89c8273cad3b63ec44a3c4ed82: {
    privateKey:
      "e53d1c3edaffc7a7bab5418eb836cf75819a82872b4a1a0f1c7fcf5c3e020b89",
    amount: "90000000000000000000000",
    nonce: 0,
  },
  "381f4008505e940ad7681ec3468a719060caf796": {
    privateKey:
      "d96e9eb5b782a80ea153c937fa83e5948485fbfc8b7e7c069d7b914dbc350aba",
    amount: "90000000000000000000000",
    nonce: 0,
  },
  b028055ea3bc78d759d10663da40d171dec992aa: {
    privateKey:
      "e7f59a4beb997a02a13e0d5e025b39a6f0adc64d37bb1e6a849a4863b4680411",
    amount: "90000000000000000000000",
    nonce: 0,
  },
};

var zil: Zilliqa;

export function getZil() {
  if (zil) {
    return zil;
  }
  const zils = new Zilliqa(getNode());
  if (getNetworkName() == "ISOLATED") {
    for (const [k, v] of Object.entries(isolatedServerAccounts)) {
      zils.wallet.addByPrivateKey(v.privateKey);
    }
  }
  zil = zils;
  return zils;
}

export function getDefaultAccount() {
  const zil = getZil();
  const def = zil.wallet.defaultAccount;
  if (!def) {
    throw new Error("No default account!");
  }
  return def;
}
