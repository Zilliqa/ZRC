import { exec } from "child_process";
import { promisify } from "util";
import { getAddressFromPrivateKey, schnorr } from "@zilliqa-js/crypto";

const execAsync = promisify(exec);

export const genAccounts = (n) =>
  Array.from({ length: n }, () => undefined)
    .map(schnorr.generatePrivateKey)
    .map((privateKey) => ({
      privateKey,
      address: getAddressFromPrivateKey(privateKey),
    }));

export const toErrorMsg = (code) =>
  `Exception thrown: (Message [(_exception : (String "Error")) ; (code : (Int32 ${code}))])`;

export const toMsgParam = (type, value, vname) => {
  value = value.toString();
  if (type.includes("ByStr")) {
    value = value.toLowerCase();
  }
  if (type === "Bool") {
    value = { argtypes: [], arguments: [], constructor: value };
  }
  return {
    type,
    value,
    vname,
  };
};

const initParamsGetter =
  (contractInfo) =>
  (...params) => {
    const res = contractInfo.params.map((cur, index) => {
      if (params[index] === undefined) {
        throw new Error("invalid params");
      }
      return { ...cur, value: params[index] };
    });
    const versionParam = {
      vname: "_scilla_version",
      type: "Uint32",
      value: contractInfo.scilla_major_version,
    };
    return [...res, versionParam];
  };

const transitionParamsGetter =
  (contractInfo) =>
  (name, ...params) => {
    const transition = contractInfo.transitions.find(
      (cur) => cur.vname === name
    );
    if (transition === undefined) {
      throw new Error("invalid transition name");
    }
    const res = transition.params.map((cur, index) => {
      if (params[index] === undefined) {
        throw new Error("invalid params");
      }
      return {
        ...cur,
        type: cur.type.replace("(", "").replace(")", ""),
        value: params[index],
      };
    });
    return res;
  };

export const useContractInfo = async (container, src, gasLimit) => {
  try {
    const contractFilename = src.split("/").pop();
    const scillaPath = "/scilla/0/";
    const paths = {
      checker: `${scillaPath}bin/scilla-checker`,
      stdlib: `${scillaPath}src/stdlib`,
      dest: `${scillaPath}${contractFilename}`,
    };

    await execAsync(`docker cp ${src} ${container}:${paths.dest}`);

    const cmd = [
      "docker exec",
      container,
      paths.checker,
      "-libdir",
      paths.stdlib,
      "-gaslimit",
      gasLimit,
      paths.dest,
      "-contractinfo",
    ].join(" ");

    const res = await execAsync(cmd);
    const msg = JSON.parse(res.stdout);
    const contractInfo = msg.contract_info;

    return {
      contractInfo,
      getInitParams: initParamsGetter(contractInfo),
      getTransitionParams: transitionParamsGetter(contractInfo),
      callGetter:
        (contract, txParams) =>
        (transitionName, ...args) => {
          return contract.call(
            transitionName,
            transitionParamsGetter(contractInfo)(transitionName, ...args),
            txParams
          );
        },
    };
  } catch (error) {
    console.error(error);
  }
};

export const checkEvents = (events, want, fn) => {
  if (events === undefined) {
    fn(events).toBe(want);
  } else {
    events.forEach((event, index) => {
      fn(event._eventname).toBe(want[index].name);
      fn(JSON.stringify(event.params)).toBe(
        JSON.stringify(want[index].getParams())
      );
    });
  }
};

export const checkTransitions = (transitions, want, fn) => {
  if (transitions === undefined) {
    fn(transitions).toBe(want);
  } else {
    transitions.forEach((transition, index) => {
      const { msg } = transition;
      fn(msg._tag).toBe(want[index].tag);
      fn(JSON.stringify(msg.params)).toBe(
        JSON.stringify(want[index].getParams())
      );
    });
  }
};
