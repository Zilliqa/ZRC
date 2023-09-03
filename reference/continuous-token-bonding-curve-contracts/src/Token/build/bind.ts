import {
  getZil,
  log,
  getVersion,
  getContract,
  newContract,
  getMinGasPrice,
} from "../../../boost-zil/infra-manipulation";
import { BN, Long } from "@zilliqa-js/util";
import { Transaction } from "@zilliqa-js/account";
import { Contract } from "@zilliqa-js/contract";
import * as T from "../../../boost-zil/signable";
import * as BOOST from "../../../boost-zil";
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
library Token

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
| CodeNotInitialized
| CodeAlreadyInitialized
| CodeInputNotInBounds
| CodeInputIsZero
| CodeUnauthorized
| CodeConnectorError
| CodeNotImplemented
| CodeSupplyOverflow

let make_error =
  fun (result : Error) =>
    let result_code = 
      match result with
      | CodeIsSender              => Int32 -1
      | CodeInsufficientFunds     => Int32 -2
      | CodeInsufficientAllowance => Int32 -3
      | CodeNotInitialized        => Int32 -4
      | CodeAlreadyInitialized    => Int32 -5
      | CodeInputNotInBounds      => Int32 -6
      | CodeInputIsZero           => Int32 -7
      | CodeUnauthorized          => Int32 -8
      | CodeConnectorError        => Int32 -9
      | CodeNotImplemented        => Int32 -10
      | CodeSupplyOverflow        => Int32 -11
      end
    in
    { _exception : "Error"; code : result_code }
  
let zero = Uint128 0
let zeroByStr20 = 0x0000000000000000000000000000000000000000
let false = False
let true = True


type Unit =
| Unit

let get_val =
  fun (some_val: Option Uint128) =>
  match some_val with
  | Some val => val
  | None => zero
  end

let uint128_to_uint256: Uint128 -> Uint256 =
  fun (x: Uint128) =>
    let ox256 = builtin to_uint256 x in
      match ox256 with
      | None =>
        
        let zero = Uint256 0 in
        builtin div zero zero
      | Some x256 => x256
      end


let get_reserve_ratio: Uint128 -> Uint128 -> Uint128 =
  fun(connector_balance: Uint128) => fun(market_cap: Uint128) =>
  
  let max = Uint256 340282366920938463463374607431768211456 in
  
  let fixed = Uint256 340282366920938463463374607431768211456000000 in
  let connector_balance_256 = uint128_to_uint256 connector_balance in
  let market_cap_256 = uint128_to_uint256 market_cap in
  let denom = builtin mul market_cap_256 max in
  let num = builtin mul connector_balance_256 fixed in
  let res_256 = builtin div num denom in
  let ores_128 = builtin to_uint128 res_256 in
  match ores_128 with
  | None => 
    
    let f2 = Uint128 42 in builtin div f2 zero
  | Some res_128 => res_128
  end


type ConnectorToken =
| ZIL
| ZRC2 of ByStr20 with contract field balances: Map ByStr20 Uint128 end 

let spread_denominator = Uint128 10000

type Uint128Pair =
| Uint128Pair of Uint128 Uint128
let uint128_to_uint256 : Uint128 -> Uint256 =
  fun (x : Uint128) =>
    let ox256 = builtin to_uint256 x in
      match ox256 with
      | None =>
        
        let zero = Uint256 0 in
        builtin div zero zero
      | Some x256 => x256
      end
let muldiv: Uint128 -> Uint128 -> Uint128 -> Uint128 =
    fun (x : Uint128) =>
    fun (y : Uint128) =>
    fun (z : Uint128) =>
      let x256 = uint128_to_uint256 x in
      let y256 = uint128_to_uint256 y in
      let z256 = uint128_to_uint256 z in
      let x_mul_y256 = builtin mul x256 y256 in
      let res256 = builtin div x_mul_y256 z256 in
      let ores128 = builtin to_uint128 res256 in
      match ores128 with
      | None =>
        
        let max_uint128 = Uint128 340282366920938463463374607431768211455 in
        let fourtytwo128 = Uint128 42 in
        builtin mul max_uint128 fourtytwo128
      | Some res128 =>
        res128
      end
let take_percentage_commission: Uint128 -> Uint128 -> Uint128Pair =
    fun (amount: Uint128) => fun (spread_numerator: Uint128) =>
    let commission = muldiv amount spread_numerator spread_denominator in
    let amount_sub_commission = builtin sub amount commission in
    let res = Uint128Pair amount_sub_commission commission in
    res




contract Token
(
  contract_owner: ByStr20,
  name: String,
  symbol: String,
  decimals: Uint32,
  init_supply: Uint128,
  operator_contract: ByStr20 with contract field bancor_formula_contract: ByStr20, field spread: Uint128, field beneficiary: ByStr20 end
)



field total_supply: Uint128 = init_supply
field current_supply: Uint128 = zero

field balances: Map ByStr20 Uint128 
  = Emp ByStr20 Uint128

field allowances: Map ByStr20 (Map ByStr20 Uint128) 
  = Emp ByStr20 (Map ByStr20 Uint128)

field connector_token_type: ConnectorToken = ZIL

field is_init: Bool = false


field tmp_reserve_ratio: Uint128 = zero


field tmp_connector_balance: Uint128 = zero


field smart_token_market_cap: Uint128 = zero


field tmp_from_balance: Uint128 = zero



field tmp_bancor_formula_target: ByStr20 = zeroByStr20


field tmp_is_smart_token_sell: Bool = false


field tmp_amount_and_commission: Uint128Pair = Uint128Pair zero zero





procedure ThrowError(err : Error)
  e = make_error err;
  throw e
end

procedure IncrementCurrentSupply(amt: Uint128)
  cur <- current_supply;
  total <- total_supply;
  cur_add_amt = builtin add cur amt;
  supply_overflow = uint128_lt total cur_add_amt;
  match supply_overflow with
  | True => e = CodeSupplyOverflow; ThrowError e
  | False => current_supply := cur_add_amt
  end
end

procedure DecrementCurrentSupply(amt: Uint128)
  cur <- current_supply;
  total <- total_supply;
  cur_sub_amt = builtin sub cur amt;
  
  current_supply := cur_sub_amt
end


procedure AssertIsInitialized()
  init <- is_init;
  match init with
  | True =>
  | False => e = CodeNotInitialized; ThrowError e
  end
end

procedure AssertIsNotInitialized()
  init <- is_init;
  match init with
  | False =>
  | True => e = CodeAlreadyInitialized; ThrowError e
  end
end

procedure AssertIsLE(i1: Uint128, i2: Uint128)
    is_le = uint128_le i1 i2;
    match is_le with
    | False => e = CodeInputNotInBounds; ThrowError e
    | True =>
    end
end

procedure AssertEQ(i1: Uint128, i2: Uint128)
    is_le = builtin eq i1 i2;
    match is_le with
    | False => e = CodeInputNotInBounds; ThrowError e
    | True =>
    end
end

procedure AssertNotZero(value: Uint128)
    is_zero = builtin eq zero value;
    match is_zero with
    | False => 
    | True => e = CodeInputIsZero; ThrowError e
    end
end

procedure AssertSenderIsAddress(address: ByStr20)
  is_authorized = builtin eq address _sender;
  match is_authorized with
  | True =>
  | False => e = CodeUnauthorized; ThrowError e
  end  
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

procedure GetConnectorBalance()
  connector <- connector_token_type;
  match connector with
  | ZIL =>
    connector_balance <- _balance;
    tmp_connector_balance := connector_balance
  | ZRC2 token_address =>
    o_connector_balance <-& token_address.balances[_this_address];
    match o_connector_balance with
    | Some connector_balance => 
      tmp_connector_balance := connector_balance 
    | None => e = CodeConnectorError; ThrowError e
    end
  end
end


procedure CalculateReserveRatio()
  market_cap <- smart_token_market_cap;
  GetConnectorBalance; connector_balance <- tmp_connector_balance;
  tmp = get_reserve_ratio connector_balance market_cap;
  tmp_reserve_ratio := tmp
end

procedure GetFromBalance(from: ByStr20)
  o_from_bal <- balances[from];
  bal = get_val o_from_bal;
  tmp_from_balance := bal
end



procedure AssertCanDoTransfer(from: ByStr20, from_balance: Uint128, amount: Uint128)
  can_do = uint128_le amount from_balance;
  match can_do with
  | True =>
  | False =>
    
    err = CodeInsufficientFunds;
    ThrowError err
  end
end

procedure SubtractAmountFromFromBalance(from: ByStr20, from_balance: Uint128, amount: Uint128)
  new_from_bal = builtin sub from_balance amount;
  balances[from] := new_from_bal 
end

procedure AddAmountToToBalance(to: ByStr20, amount: Uint128)
  get_to_bal <- balances[to];
  new_to_bal = match get_to_bal with
  | Some bal => builtin add bal amount
  | None => amount
  end;
  balances[to] := new_to_bal
end

procedure MoveBalance(from: ByStr20, from_balance: Uint128, to: ByStr20, amount: Uint128)
  
  SubtractAmountFromFromBalance from from_balance amount;
  
  AddAmountToToBalance to amount
end



procedure CalculatePurchaseReturn(in_deposit_amount: Uint128)
  bancor <-& operator_contract.bancor_formula_contract;
  in_supply <- total_supply;
  
  CalculateReserveRatio; in_connector_weight <- tmp_reserve_ratio; in_connector_balance <- tmp_connector_balance;
  msg = let m = {
    _tag: "CalculatePurchaseReturn";
    _amount: zero;
    _recipient: bancor;
    in_supply: in_supply;
    in_connector_balance: in_connector_balance;
    in_connector_weight: in_connector_weight;
    in_deposit_amount: in_deposit_amount
  } in one_msg m;
  send msg
end
procedure CalculateSaleReturn(in_sell_amount: Uint128)
  bancor <-& operator_contract.bancor_formula_contract;
  in_supply <- total_supply;
  
  CalculateReserveRatio; in_connector_weight <- tmp_reserve_ratio; in_connector_balance <- tmp_connector_balance;
  msg = let m = {
    _tag: "CalculateSaleReturn";
    _amount: zero;
    _recipient: bancor;
    in_supply: in_supply;
    in_connector_balance: in_connector_balance;
    in_connector_weight: in_connector_weight;
    in_sell_amount: in_sell_amount
  } in one_msg m;
  send msg
end

procedure SendConnectedToken(to: ByStr20, amount: Uint128)
  connector <- connector_token_type;
  match connector with
  | ZRC2 token_address =>
    msg = let m = {
      _tag: "Transfer";
      _recipient: token_address;
      _amount: zero;
      to: to;
      amount: amount 
    } in one_msg m;
    send msg
  | ZIL =>
    msg = let m = { 
        _tag: "AddFunds";
        _recipient: to;
        _amount: amount
    } in one_msg m;
    send msg
  end
end

procedure TakeCommission(amount: Uint128)
  spread <-& operator_contract.spread;
  tmp = take_percentage_commission amount spread;
  tmp_amount_and_commission := tmp
end

procedure DoBuySmartToken(sender: ByStr20, deposit_amount: Uint128)
  tmp_bancor_formula_target := sender;
  CalculatePurchaseReturn deposit_amount
end

procedure BuySmartToken(sender: ByStr20, deposit_amount: Uint128)
  TakeCommission deposit_amount; amount_and_commission <- tmp_amount_and_commission;
  match amount_and_commission with
  | Uint128Pair new_amt commission =>
    is_zero = builtin eq commission zero;
    match is_zero with
    | True => DoBuySmartToken sender deposit_amount
    | False => 
      beneficiary <-& operator_contract.beneficiary;
      SendConnectedToken beneficiary commission;
      DoBuySmartToken sender new_amt
    end
  end
end





transition InitZIL(price: Uint128, connector_balance: Uint128)
  AssertSenderIsAddress contract_owner;
  AssertIsNotInitialized;
  AssertNotZero connector_balance;
  
  
  supply <- total_supply;
  market_cap = builtin mul price supply;
  smart_token_market_cap := market_cap;
  AssertIsLE connector_balance market_cap;
  accept;
  tmp = ZIL;
  connector_token_type := tmp;
  bal <- _balance;
  
  AssertEQ bal connector_balance;
  is_init := true
end

transition InitZRC2(price: Uint128, connector_balance: Uint128, token_address: ByStr20 with contract field balances: Map ByStr20 Uint128 end)
  AssertSenderIsAddress contract_owner;
  AssertIsNotInitialized;
  AssertNotZero connector_balance;
  
  
  supply <- total_supply;
  market_cap = builtin mul price supply;
  smart_token_market_cap := market_cap;
  AssertIsLE connector_balance market_cap;
  tmp = ZRC2 token_address;
  connector_token_type := tmp;
  
  msg = let m = {
    _tag: "TransferFrom";
    _amount: zero;
    _recipient: token_address;
    from: _sender;
    to: _this_address;
    amount: connector_balance
  } in one_msg m;
  send msg
  
end




transition IncreaseAllowance(spender: ByStr20, amount: Uint128)
  AssertIsInitialized;
  IsNotSender spender;
  some_current_allowance <- allowances[_sender][spender];
  current_allowance = get_val some_current_allowance;
  new_allowance = builtin add current_allowance amount;
  allowances[_sender][spender] := new_allowance;
  e = {_eventname : "IncreasedAllowance"; token_owner : _sender; spender: spender; new_allowance : new_allowance};
  event e
end




transition DecreaseAllowance(spender: ByStr20, amount: Uint128)
  AssertIsInitialized;
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

procedure DoTransferFrom(from: ByStr20, to: ByStr20, amount: Uint128)
  GetFromBalance from; from_balance <- tmp_from_balance;
  AssertCanDoTransfer from from_balance amount;
  is_smart_token_sell = builtin eq to _this_address;
  tmp_is_smart_token_sell := is_smart_token_sell;
  match is_smart_token_sell with
  | True =>
    
    SubtractAmountFromFromBalance from from_balance amount;
    DecrementCurrentSupply amount;
    
    tmp_bancor_formula_target := from;
    CalculateSaleReturn amount
  | False =>
    MoveBalance from from_balance to amount
  end
end







transition Transfer(to: ByStr20, amount: Uint128)
  AssertIsInitialized;
  DoTransferFrom _sender to amount; is_smart_token_sell <- tmp_is_smart_token_sell;
  
  e = {_eventname : "TransferSuccess"; sender : _sender; recipient : to; amount : amount};
  event e;
  match is_smart_token_sell with
  | True => 
  | False =>
    
    msg_to_recipient = {_tag : "RecipientAcceptTransfer"; _recipient : to; _amount : zero; 
    sender : _sender; recipient : to; amount : amount};
    msg_to_sender = {_tag : "TransferSuccessCallBack"; _recipient : _sender; _amount : zero; 
    sender : _sender; recipient : to; amount : amount};
    msgs = two_msgs msg_to_recipient msg_to_sender;
    send msgs
  end
end






transition TransferFrom(from: ByStr20, to: ByStr20, amount: Uint128)
  AssertIsInitialized;
  o_spender_allowed <- allowances[from][_sender];
  allowed = get_val o_spender_allowed;
  can_do = uint128_le amount allowed;
  match can_do with
  | True =>
    DoTransferFrom from to amount; is_smart_token_sell <- tmp_is_smart_token_sell;
    e = {_eventname : "TransferFromSuccess"; initiator : _sender; sender : from; recipient : to; amount : amount};
    event e;
    new_allowed = builtin sub allowed amount;
    allowances[from][_sender] := new_allowed;
    match is_smart_token_sell with
    | True => 
    | False =>
      
      msg_to_recipient = {_tag: "RecipientAcceptTransferFrom"; _recipient : to; _amount: zero; 
                          initiator: _sender; sender : from; recipient: to; amount: amount};
      msg_to_sender = {_tag: "TransferFromSuccessCallBack"; _recipient: _sender; _amount: zero; 
                      initiator: _sender; sender: from; recipient: to; amount: amount};
      msgs = two_msgs msg_to_recipient msg_to_sender;
      send msgs
    end
  | False =>
    err = CodeInsufficientAllowance;
    ThrowError err
  end
end


transition RecipientAcceptTransfer(sender: ByStr20, recipient: ByStr20, amount: Uint128)
  AssertIsInitialized;
  connector <- connector_token_type;
  match connector with
  | ZIL => e = CodeNotImplemented; ThrowError e
  | ZRC2 token_address =>
    AssertSenderIsAddress token_address;
    BuySmartToken sender amount
  end
end
transition RecipientAcceptTransferFrom(initiator: ByStr20, sender: ByStr20, recipient: ByStr20, amount: Uint128) 
  init <- is_init;
  match init with
  | False => 
    is_init := true
  | True =>
    
    connector <- connector_token_type;
    match connector with
    | ZIL => e = CodeNotImplemented; ThrowError e
    | ZRC2 token_address =>
      AssertSenderIsAddress token_address;
      BuySmartToken sender amount
    end 
  end
end

transition TransferSuccessCallBack(sender: ByStr20, recipient: ByStr20, amount: Uint128) 
  AssertIsInitialized
end

transition TransferFromSuccessCallBack(initiator: ByStr20, sender: ByStr20, recipient: ByStr20, amount: Uint128) 
  AssertIsInitialized 
end

transition AddFunds() 
  AssertIsInitialized;
  connector <- connector_token_type;
  match connector with
  | ZRC2 token_address => e = CodeNotImplemented; ThrowError e
  | ZIL =>
    prev_balance <- _balance;
    accept;
    cur_balance <- _balance;
    deposit_amount = builtin sub cur_balance prev_balance;
    BuySmartToken _sender deposit_amount
  end
end




transition CalculatePurchaseReturnCallback(result: Uint128)
  target <- tmp_bancor_formula_target;
  bancor <-& operator_contract.bancor_formula_contract;
  AssertSenderIsAddress bancor;
  AddAmountToToBalance target result;
  IncrementCurrentSupply result
end

transition CalculateSaleReturnCallback(result: Uint128)
  target <- tmp_bancor_formula_target;
  bancor <-& operator_contract.bancor_formula_contract;
  AssertSenderIsAddress bancor;
  SendConnectedToken target result
end`;
export const deploy = (
  __contract_owner: T.ByStr20,
  __name: T.ScillaString,
  __symbol: T.ScillaString,
  __decimals: T.Uint32,
  __init_supply: T.Uint128,
  __operator_contract: T.ByStr20
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
    {
      type: `ByStr20`,
      vname: `operator_contract`,
      value: __operator_contract.toSend(),
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
 * 2021-08-22T17:35:51.500Z
 */
export const hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 =
  (a: T.ByStr20) => ({
    state: () => ({
      get: async function (
        field:
          | "total_supply"
          | "current_supply"
          | "balances"
          | "allowances"
          | "connector_token_type"
          | "is_init"
          | "tmp_reserve_ratio"
          | "tmp_connector_balance"
          | "smart_token_market_cap"
          | "tmp_from_balance"
          | "tmp_bancor_formula_target"
          | "tmp_is_smart_token_sell"
          | "tmp_amount_and_commission"
      ) {
        const zil = getZil();
        return (
          await zil.blockchain.getSmartContractSubState(a.toSend(), field)
        ).result;
      },
      log: async function (
        field:
          | "total_supply"
          | "current_supply"
          | "balances"
          | "allowances"
          | "connector_token_type"
          | "is_init"
          | "tmp_reserve_ratio"
          | "tmp_connector_balance"
          | "smart_token_market_cap"
          | "tmp_from_balance"
          | "tmp_bancor_formula_target"
          | "tmp_is_smart_token_sell"
          | "tmp_amount_and_commission"
          | "_balance"
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
      InitZIL: (
        amount: T.Uint128,
        __price: T.Uint128,
        __connector_balance: T.Uint128
      ) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `InitZIL`,
          data: [
            {
              type: `Uint128`,
              vname: `price`,
              value: __price.toSend(),
            },
            {
              type: `Uint128`,
              vname: `connector_balance`,
              value: __connector_balance.toSend(),
            },
          ],
          amount: amount.value.toString(),
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
            log.txLink(tx, "InitZIL");
            return tx;
          },
        };
      },

      InitZRC2: (
        __price: T.Uint128,
        __connector_balance: T.Uint128,
        __token_address: T.ByStr20
      ) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `InitZRC2`,
          data: [
            {
              type: `Uint128`,
              vname: `price`,
              value: __price.toSend(),
            },
            {
              type: `Uint128`,
              vname: `connector_balance`,
              value: __connector_balance.toSend(),
            },
            {
              type: `ByStr20`,
              vname: `token_address`,
              value: __token_address.toSend(),
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
            log.txLink(tx, "InitZRC2");
            return tx;
          },
        };
      },

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

      AddFunds: (amount: T.Uint128) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `AddFunds`,
          data: [],
          amount: amount.value.toString(),
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
            log.txLink(tx, "AddFunds");
            return tx;
          },
        };
      },

      CalculatePurchaseReturnCallback: (__result: T.Uint128) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `CalculatePurchaseReturnCallback`,
          data: [
            {
              type: `Uint128`,
              vname: `result`,
              value: __result.toSend(),
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
            log.txLink(tx, "CalculatePurchaseReturnCallback");
            return tx;
          },
        };
      },

      CalculateSaleReturnCallback: (__result: T.Uint128) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `CalculateSaleReturnCallback`,
          data: [
            {
              type: `Uint128`,
              vname: `result`,
              value: __result.toSend(),
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
            log.txLink(tx, "CalculateSaleReturnCallback");
            return tx;
          },
        };
      },
    }),
  });
