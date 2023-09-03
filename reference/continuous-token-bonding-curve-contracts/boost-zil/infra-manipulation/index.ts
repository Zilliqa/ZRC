export * from "./shared";
export * from "./setup";
export * as log from "./Logger";
export * from "./calls";

export const sleep = (milis: number) =>
  new Promise((res) => setTimeout(res, milis));
