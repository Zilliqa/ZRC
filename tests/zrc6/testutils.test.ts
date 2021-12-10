import { extractTypes, getJSONParams, getJSONValue } from "./testutils";

describe("extractTypes", () => {
  const testCases = [
    {
      type: "Option (ByStr20)",
      want: ["ByStr20"],
    },
    {
      type: "Pair (ByStr20) (Uint256)",
      want: ["ByStr20", "Uint256"],
    },
    {
      type: "Pair (Pair (ByStr20) (Uint256)) (Pair (ByStr20) (String))",
      want: ["Pair (ByStr20) (Uint256)", "Pair (ByStr20) (String)"],
    },
    {
      type: "Pair (List (ByStr20)) (Uint256)",
      want: ["List (ByStr20)", "Uint256"],
    },
    {
      type: "List (Pair (ByStr20) (Uint256))",
      want: ["Pair (ByStr20) (Uint256)"],
    },
    {
      type: "List (List (Pair (ByStr20) (Uint256)))",
      want: ["List (Pair (ByStr20) (Uint256))"],
    },
  ];

  for (const testCase of testCases) {
    const { type, want } = testCase;
    it(type, () => {
      const res = extractTypes(type);
      expect(JSON.stringify(res)).toBe(JSON.stringify(want));
    });
  }
});

describe("getJSONValue", () => {
  const testCases = [
    {
      type: "Uint256",
      value: 1,
      want: "1",
    },
    {
      type: "Int256",
      value: -1,
      want: "-1",
    },
    {
      type: "String",
      value: "Test",
      want: "Test",
    },
    {
      type: "ByStr20",
      value: "0x0000000000000000000000000000000000000ABC",
      want: "0x0000000000000000000000000000000000000abc",
    },
    {
      type: "Bool",
      value: false,
      want: { argtypes: [], arguments: [], constructor: "False" },
    },
    {
      type: "Bool",
      value: true,
      want: { argtypes: [], arguments: [], constructor: "True" },
    },
    {
      type: "Option (ByStr20)",
      value: undefined,
      want: { argtypes: ["ByStr20"], arguments: [], constructor: "None" },
    },
    {
      type: "Option (ByStr20)",
      value: "0x0000000000000000000000000000000000000000",
      want: {
        argtypes: ["ByStr20"],
        arguments: ["0x0000000000000000000000000000000000000000"],
        constructor: "Some",
      },
    },
    {
      type: "List (ByStr20)",
      value: [
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000001",
      ],
      want: [
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000001",
      ],
    },
    {
      type: "List (Pair (ByStr20) (Uint256))",
      value: [
        ["0x0000000000000000000000000000000000000000", 1],
        ["0x0000000000000000000000000000000000000001", 2],
      ],
      want: [
        {
          argtypes: ["ByStr20", "Uint256"],
          arguments: ["0x0000000000000000000000000000000000000000", "1"],
          constructor: "Pair",
        },
        {
          argtypes: ["ByStr20", "Uint256"],
          arguments: ["0x0000000000000000000000000000000000000001", "2"],
          constructor: "Pair",
        },
      ],
    },
    {
      type: "Pair (ByStr20) (Uint256)",
      value: ["0x0000000000000000000000000000000000000000", 1],
      want: {
        argtypes: ["ByStr20", "Uint256"],
        arguments: ["0x0000000000000000000000000000000000000000", "1"],
        constructor: "Pair",
      },
    },
    {
      type: "Pair (List (ByStr20)) (Uint256)",
      value: [
        [
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000001",
        ],
        1,
      ],
      want: {
        argtypes: ["List (ByStr20)", "Uint256"],
        arguments: [
          [
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000001",
          ],
          "1",
        ],
        constructor: "Pair",
      },
    },
  ];

  for (const testCase of testCases) {
    const { value, type, want } = testCase;
    it(type, () => {
      const res = getJSONValue(value, type);
      expect(JSON.stringify(res)).toBe(JSON.stringify(want));
    });
  }
});

describe("getJSONParams", () => {
  const testCases = [
    {
      param: {},
      want: [],
    },
    {
      param: {
        x: ["ByStr20", "0x0000000000000000000000000000000000000000"],
        y: ["Uint256", 1],
      },
      want: [
        {
          type: "ByStr20",
          value: "0x0000000000000000000000000000000000000000",
          vname: "x",
        },
        {
          type: "Uint256",
          value: "1",
          vname: "y",
        },
      ],
    },
  ];

  for (const testCase of testCases) {
    const { param, want } = testCase;
    it(JSON.stringify(param), () => {
      const res = getJSONParams(param);
      expect(JSON.stringify(res)).toBe(JSON.stringify(want));
    });
  }
});
