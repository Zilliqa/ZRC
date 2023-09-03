export interface Value {
  vname: string;
  type: string;
  value: string | ADTValue | ADTValue[] | string[];
}
interface ADTValue {
  constructor: string;
  argtypes: string[];
  arguments: Value[] | string[];
}

export type Sendable =
  | Value["value"]
  | {
      constructor: string;
      argtypes: string[];
      arguments: Value[] | string[];
    }[]
  | string[];
