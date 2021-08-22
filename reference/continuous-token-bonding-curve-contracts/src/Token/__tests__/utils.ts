import { units } from "@zilliqa-js/util";
import { Uint128 } from "../../../boost-zil";

export function zils(s: string) {
  return new Uint128(units.toQa(s, units.Units.Zil));
}
