import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const getErrorMsg = (code) =>
  `Exception thrown: (Message [(_exception : (String "Error")) ; (code : (Int32 ${code}))])`;

export const getJSONValue = (value, type?) => {
  value = typeof value === "number" ? value.toString() : value;

  if (
    typeof type === "string" &&
    type.startsWith("ByStr") &&
    typeof value === "string"
  ) {
    return value.toLowerCase();
  }

  if (
    typeof type === "string" &&
    type.startsWith("List") &&
    Array.isArray(value)
  ) {
    const types = type.replace(/[()]/g, "").split(" ").slice(1);
    return value.map((x) => getJSONValue(x, types.join(" ")));
  }

  if (
    typeof type === "string" &&
    type.startsWith("Pair") &&
    Array.isArray(value)
  ) {
    const types = type.replace(/[()]/g, "").split(" ").slice(1);
    return {
      argtypes: types,
      arguments: value.map((x, i) => getJSONValue(x, types[i])),
      constructor: "Pair",
    };
  }

  if (typeof value === "boolean") {
    return {
      argtypes: [],
      arguments: [],
      constructor: value ? "True" : "False",
    };
  }

  return value;
};

export const getJSONParam = (type, value, vname) => {
  return {
    type,
    value: getJSONValue(value, type),
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

      let type = cur.type;

      // ByStr20 with <address contents> end -> ByStr20
      if (type.startsWith("ByStr")) {
        type = type.split(" ").shift();
      }

      return {
        ...cur,
        type,
        value: getJSONValue(params[index], type),
      };
    });
    return res;
  };

export const useContractInfo = async (
  container,
  src,
  gasLimit
): Promise<any> => {
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

const logDelta = (want, got) =>
  console.log(
    "\x1b[32m",
    `\nExpected: ${want}`,
    "\x1b[31m",
    `\nReceived: ${got}`
  );

export const verifyEvents = (events, want) => {
  if (events === undefined) {
    return want === undefined;
  }
  for (const [index, event] of events.entries()) {
    if (event._eventname !== want[index].name) {
      logDelta(want[index].name, event._eventname);
      return false;
    }
    if (
      JSON.stringify(event.params) !== JSON.stringify(want[index].getParams())
    ) {
      logDelta(
        JSON.stringify(want[index].getParams()),
        JSON.stringify(event.params)
      );
      return false;
    }
  }
  return true;
};

export const verifyTransitions = (transitions, want) => {
  if (transitions === undefined) {
    return want === undefined;
  }
  for (const [index, transition] of transitions.entries()) {
    const { msg } = transition;
    if (msg._tag !== want[index].tag) {
      logDelta(want[index].tag, msg._tag);
      return false;
    }
    if (
      JSON.stringify(msg.params) !== JSON.stringify(want[index].getParams())
    ) {
      logDelta(
        JSON.stringify(want[index].getParams()),
        JSON.stringify(msg.params)
      );
      return false;
    }
  }
  return true;
};
