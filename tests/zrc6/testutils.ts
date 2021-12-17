import { getJSONParams } from "@zilliqa-js/scilla-json-utils";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const expectEvents = (events, want) => {
  if (events === undefined) {
    expect(undefined).toBe(want);
  }

  for (const [index, event] of events.entries()) {
    expect(event._eventname).toBe(want[index].name);
    const wantParams = getJSONParams(want[index].getParams());
    expect(JSON.stringify(event.params)).toBe(JSON.stringify(wantParams));
  }
};

export const expectTransitions = (transitions, want) => {
  if (transitions === undefined) {
    expect(undefined).toBe(want);
  }
  for (const [index, transition] of transitions.entries()) {
    const { msg } = transition;
    expect(want[index].tag).toBe(want[index].tag);
    const wantParams = getJSONParams(want[index].getParams());
    expect(JSON.stringify(msg.params)).toBe(JSON.stringify(wantParams));
  }
};

export const getErrorMsg = (code) =>
  `Exception thrown: (Message [(_exception : (String "Error")) ; (code : (Int32 ${code}))])`;
