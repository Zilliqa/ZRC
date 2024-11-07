import { ByStr20, Value } from "../boost-zil";

type TransactionData = {
  /**
   * the signature hash of the source code of the contract that this data interacts with
   */
  contractSignature: string;
  /**
   * contract to send the transaction to
   */
  contractAddress: string;
  /**
   * zil amount to send
   */
  amount: string;
  /**
   * the name of the transition called in the target contract
   */
  contractTransitionName: string;
  data: any[];
};

export const testMaker =
  (code: string) =>
  (bNum: string) =>
  (init: Value[]) =>
  (_balance: string) =>
  (state: Value[]) =>
  (from: ByStr20) =>
  (t: TransactionData) => {
    return {
      code: code,
      init: JSON.stringify([
        {
          vname: "_this_address",
          type: "ByStr20",
          value: "0xabfeccdc9012345678901234567890f777567890",
        },
        {
          vname: "_creation_block",
          type: "BNum",
          value: "1",
        },
        ...init,
      ]),
      blockchain: JSON.stringify([
        {
          vname: "BLOCKNUMBER",
          type: "BNum",
          value: bNum,
        },
      ]),
      output: JSON.stringify([]),
      message: JSON.stringify({
        _tag: t.contractTransitionName,
        _amount: t.amount,
        _sender: from.toSend(),
        params: t.data,
        _origin: from.toSend(),
      }),
      state: JSON.stringify([
        ...state,
        {
          vname: "_balance",
          type: "Uint128",
          value: _balance,
        },
      ]),
    };
  };
