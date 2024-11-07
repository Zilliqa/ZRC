import {
  getZil,
  log,
  getVersion,
  getContract,
  newContract,
  getMinGasPrice,
} from "../../../../boost-zil/infra-manipulation";
import { BN, Long } from "@zilliqa-js/util";
import { Transaction } from "@zilliqa-js/account";
import { Contract } from "@zilliqa-js/contract";
import * as T from "../../../../boost-zil/signable";
import * as BOOST from "../../../../boost-zil";
import { Zilliqa } from "@zilliqa-js/zilliqa";

/**
 * general interface of the data returned by toJSON() on the transitions
 */
export type TransactionData = {
  /**
   * the signature hash of the source code of the contract that this data interacts with
   */
  contractSignature: string,
  /**
   * contract to send the transaction to
   */
  contractAddress: string,
  /**
   * zil amount to send
   */
  amount: string,
  /**
   * the name of the transition called in the target contract
   */
  contractTransitionName: string,
  data: any[],
};

export const code = `
(* sourceCodeHash=0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 *)
(* sourceCodeHashKey=hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 *)
scilla_version 0




import IntUtils
library ZRC2

let one_msg = 
  fun (msg : Message) => 
  let nil_msg = Nil {Message} in
  Cons {Message} msg nil_msg

let two_msgs =
fun (msg1 : Message) =>
fun (msg2 : Message) =>
  let msgs_tmp = one_msg msg2 in
  Cons {Message} msg1 msgs_tmp


type Error =
| CodeIsSender
| CodeInsufficientFunds
| CodeInsufficientAllowance

let make_error =
  fun (result : Error) =>
    let result_code = 
      match result with
      | CodeIsSender              => Int32 -1
      | CodeInsufficientFunds     => Int32 -2
      | CodeInsufficientAllowance => Int32 -3
      end
    in
    { _exception : "Error"; code : result_code }
  
let zero = Uint128 0


type Unit =
| Unit

let get_val =
  fun (some_val: Option Uint128) =>
  match some_val with
  | Some val => val
  | None => zero
  end





contract ZRC2
(
  contract_owner: ByStr20,
  name : String,
  symbol: String,
  decimals: Uint32,
  init_supply : Uint128
)



field total_supply : Uint128 = init_supply

field balances: Map ByStr20 Uint128 
  = let emp_map = Emp ByStr20 Uint128 in
    builtin put emp_map contract_owner init_supply

field allowances: Map ByStr20 (Map ByStr20 Uint128) 
  = Emp ByStr20 (Map ByStr20 Uint128)





procedure ThrowError(err : Error)
  e = make_error err;
  throw e
end

procedure IsNotSender(address: ByStr20)
  is_sender = builtin eq _sender address;
  match is_sender with
  | True =>
    err = CodeIsSender;
    ThrowError err
  | False =>
  end
end

procedure AuthorizedMoveIfSufficientBalance(from: ByStr20, to: ByStr20, amount: Uint128)
  o_from_bal <- balances[from];
  bal = get_val o_from_bal;
  can_do = uint128_le amount bal;
  match can_do with
  | True =>
    
    new_from_bal = builtin sub bal amount;
    balances[from] := new_from_bal;
    
    get_to_bal <- balances[to];
    new_to_bal = match get_to_bal with
    | Some bal => builtin add bal amount
    | None => amount
    end;
    balances[to] := new_to_bal
  | False =>
    
    err = CodeInsufficientFunds;
    ThrowError err
  end
end








transition IncreaseAllowance(spender: ByStr20, amount: Uint128)
  IsNotSender spender;
  some_current_allowance <- allowances[_sender][spender];
  current_allowance = get_val some_current_allowance;
  new_allowance = builtin add current_allowance amount;
  allowances[_sender][spender] := new_allowance;
  e = {_eventname : "IncreasedAllowance"; token_owner : _sender; spender: spender; new_allowance : new_allowance};
  event e
end




transition DecreaseAllowance(spender: ByStr20, amount: Uint128)
  IsNotSender spender;
  some_current_allowance <- allowances[_sender][spender];
  current_allowance = get_val some_current_allowance;
  new_allowance =
    let amount_le_allowance = uint128_le amount current_allowance in
      match amount_le_allowance with
      | True => builtin sub current_allowance amount
      | False => zero
      end;
  allowances[_sender][spender] := new_allowance;
  e = {_eventname : "DecreasedAllowance"; token_owner : _sender; spender: spender; new_allowance : new_allowance};
  event e
end





transition Transfer(to: ByStr20, amount: Uint128)
  AuthorizedMoveIfSufficientBalance _sender to amount;
  e = {_eventname : "TransferSuccess"; sender : _sender; recipient : to; amount : amount};
  event e;
  
  msg_to_recipient = {_tag : "RecipientAcceptTransfer"; _recipient : to; _amount : zero; 
                      sender : _sender; recipient : to; amount : amount};
  msg_to_sender = {_tag : "TransferSuccessCallBack"; _recipient : _sender; _amount : zero; 
                  sender : _sender; recipient : to; amount : amount};
  msgs = two_msgs msg_to_recipient msg_to_sender;
  send msgs
end






transition TransferFrom(from: ByStr20, to: ByStr20, amount: Uint128)
  o_spender_allowed <- allowances[from][_sender];
  allowed = get_val o_spender_allowed;
  can_do = uint128_le amount allowed;
  match can_do with
  | True =>
    AuthorizedMoveIfSufficientBalance from to amount;
    e = {_eventname : "TransferFromSuccess"; initiator : _sender; sender : from; recipient : to; amount : amount};
    event e;
    new_allowed = builtin sub allowed amount;
    allowances[from][_sender] := new_allowed;
    
    msg_to_recipient = {_tag: "RecipientAcceptTransferFrom"; _recipient : to; _amount: zero; 
                        initiator: _sender; sender : from; recipient: to; amount: amount};
    msg_to_sender = {_tag: "TransferFromSuccessCallBack"; _recipient: _sender; _amount: zero; 
                    initiator: _sender; sender: from; recipient: to; amount: amount};
    msgs = two_msgs msg_to_recipient msg_to_sender;
    send msgs
  | False =>
    err = CodeInsufficientAllowance;
    ThrowError err
  end
end`;
export const deploy = (
  __contract_owner: T.ByStr20,
  __name: T.ScillaString,
  __symbol: T.ScillaString,
  __decimals: T.Uint32,
  __init_supply: T.Uint128
) => {
  const initData = [
    {
      type: `Uint32`,
      vname: `_scilla_version`,
      value: "0",
    },
    {
      type: `ByStr20`,
      vname: `contract_owner`,
      value: __contract_owner.toSend(),
    },
    {
      type: `String`,
      vname: `name`,
      value: __name.toSend(),
    },
    {
      type: `String`,
      vname: `symbol`,
      value: __symbol.toSend(),
    },
    {
      type: `Uint32`,
      vname: `decimals`,
      value: __decimals.toSend(),
    },
    {
      type: `Uint128`,
      vname: `init_supply`,
      value: __init_supply.toSend(),
    },
  ];
  return {
    initToJSON: () => initData,
    send: async function (
      gasLimit: Long
    ): Promise<[Transaction, Contract, T.ByStr20]> {
      const zil = getZil();
      const gasPrice = await getMinGasPrice();

      const contract = newContract(zil, code, initData);
      const [tx, con] = await contract.deploy(
        {
          version: getVersion(),
          gasPrice,
          gasLimit,
        },
        33,
        1000
      );
      log.txLink(tx, "Deploy");
      if (!con.address) {
        if (con.error) {
          throw new Error(JSON.stringify(con.error, null, 2));
        }
        throw new Error("Contract failed to deploy");
      }
      return [tx, con, new T.ByStr20(con.address)];
    },
  };
};

/**
 * this string is the signature of the hash of the source code
 * that was used to generate this sdk
 */
export const contractSignature =
  "hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

/**
 * will try to send a transaction to the contract
 * @warning WILL NOT THROW ERRORS IF CONTRACT SIGNATURES ARE INVALID
 */
export async function dangerousFromJSONTransaction(
  zil: Zilliqa,
  t: TransactionData,
  gasLimit: Long
) {
  const gasPrice = await getMinGasPrice();
  const contract = getContract(zil, new T.ByStr20(t.contractAddress).toSend());

  const tx = await contract.call(
    t.contractTransitionName,
    t.data,
    {
      version: getVersion(),
      amount: new BN(t.amount),
      gasPrice,
      gasLimit,
    },
    33,
    1000
  );
  log.txLink(tx, t.contractTransitionName);
  return tx;
}
/**
 * Will throw error if contract signatures are incompatible!
 */
export async function safeFromJSONTransaction(
  zil: Zilliqa,
  t: TransactionData,
  gasLimit: Long
) {
  if (t.contractSignature != contractSignature) {
    throw new Error("Incompatible contract signatures!");
  }
  await dangerousFromJSONTransaction(zil, t, gasLimit);
}

/**
 * interface for scilla contract with source code hash:
 * 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
 * generated on:
 * 2021-08-22T16:54:08.771Z
 */
export const hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 =
  (a: T.ByStr20) => ({
    state: () => ({
      get: async function (field: "total_supply" | "balances" | "allowances") {
        const zil = getZil();
        return (
          await zil.blockchain.getSmartContractSubState(a.toSend(), field)
        ).result;
      },
      log: async function (
        field: "total_supply" | "balances" | "allowances" | "_balance"
      ) {
        const zil = getZil();
        if (field == "_balance") {
          console.log((await zil.blockchain.getBalance(a.toSend())).result);
          return;
        }
        console.log(
          (await zil.blockchain.getSmartContractSubState(a.toSend(), field))
            .result
        );
      },
    }),
    run: (gasLimit: Long) => ({
      IncreaseAllowance: (__spender: T.ByStr20, __amount: T.Uint128) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `IncreaseAllowance`,
          data: [
            {
              type: `ByStr20`,
              vname: `spender`,
              value: __spender.toSend(),
            },
            {
              type: `Uint128`,
              vname: `amount`,
              value: __amount.toSend(),
            },
          ],
          amount: new BN(0).toString(),
        };
        return {
          /**
           * get data needed to perform this transaction
           * */
          toJSON: () => transactionData,
          /**
           * send the transaction to the blockchain
           * */
          send: async () => {
            const zil = getZil();
            const gasPrice = await getMinGasPrice();
            const contract = getContract(zil, a.toSend());

            const tx = await contract.call(
              transactionData.contractTransitionName,
              transactionData.data,
              {
                version: getVersion(),
                amount: new BN(transactionData.amount),
                gasPrice,
                gasLimit,
              },
              33,
              1000
            );
            log.txLink(tx, "IncreaseAllowance");
            return tx;
          },
        };
      },

      DecreaseAllowance: (__spender: T.ByStr20, __amount: T.Uint128) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `DecreaseAllowance`,
          data: [
            {
              type: `ByStr20`,
              vname: `spender`,
              value: __spender.toSend(),
            },
            {
              type: `Uint128`,
              vname: `amount`,
              value: __amount.toSend(),
            },
          ],
          amount: new BN(0).toString(),
        };
        return {
          /**
           * get data needed to perform this transaction
           * */
          toJSON: () => transactionData,
          /**
           * send the transaction to the blockchain
           * */
          send: async () => {
            const zil = getZil();
            const gasPrice = await getMinGasPrice();
            const contract = getContract(zil, a.toSend());

            const tx = await contract.call(
              transactionData.contractTransitionName,
              transactionData.data,
              {
                version: getVersion(),
                amount: new BN(transactionData.amount),
                gasPrice,
                gasLimit,
              },
              33,
              1000
            );
            log.txLink(tx, "DecreaseAllowance");
            return tx;
          },
        };
      },

      Transfer: (__to: T.ByStr20, __amount: T.Uint128) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `Transfer`,
          data: [
            {
              type: `ByStr20`,
              vname: `to`,
              value: __to.toSend(),
            },
            {
              type: `Uint128`,
              vname: `amount`,
              value: __amount.toSend(),
            },
          ],
          amount: new BN(0).toString(),
        };
        return {
          /**
           * get data needed to perform this transaction
           * */
          toJSON: () => transactionData,
          /**
           * send the transaction to the blockchain
           * */
          send: async () => {
            const zil = getZil();
            const gasPrice = await getMinGasPrice();
            const contract = getContract(zil, a.toSend());

            const tx = await contract.call(
              transactionData.contractTransitionName,
              transactionData.data,
              {
                version: getVersion(),
                amount: new BN(transactionData.amount),
                gasPrice,
                gasLimit,
              },
              33,
              1000
            );
            log.txLink(tx, "Transfer");
            return tx;
          },
        };
      },

      TransferFrom: (
        __from: T.ByStr20,
        __to: T.ByStr20,
        __amount: T.Uint128
      ) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `TransferFrom`,
          data: [
            {
              type: `ByStr20`,
              vname: `from`,
              value: __from.toSend(),
            },
            {
              type: `ByStr20`,
              vname: `to`,
              value: __to.toSend(),
            },
            {
              type: `Uint128`,
              vname: `amount`,
              value: __amount.toSend(),
            },
          ],
          amount: new BN(0).toString(),
        };
        return {
          /**
           * get data needed to perform this transaction
           * */
          toJSON: () => transactionData,
          /**
           * send the transaction to the blockchain
           * */
          send: async () => {
            const zil = getZil();
            const gasPrice = await getMinGasPrice();
            const contract = getContract(zil, a.toSend());

            const tx = await contract.call(
              transactionData.contractTransitionName,
              transactionData.data,
              {
                version: getVersion(),
                amount: new BN(transactionData.amount),
                gasPrice,
                gasLimit,
              },
              33,
              1000
            );
            log.txLink(tx, "TransferFrom");
            return tx;
          },
        };
      },
    }),
  });
