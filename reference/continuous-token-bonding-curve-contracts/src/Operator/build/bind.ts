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


import IntUtils BoolUtils
library Operator
type Error =
| NotAuthorized
| NoStagedAdmin
| SpreadTooBig

let make_error =
fun (result: Error) =>
let result_code =
match result with
| NotAuthorized => Int32 -1
| NoStagedAdmin => Int32 -2
| SpreadTooBig  => Int32 -3
end
in
{ _exception: "Error"; code: result_code }

let spread_denominator = Uint128 10000
let zeroByStr20 = 0x0000000000000000000000000000000000000000
let option_value = tfun 'A => fun( default: 'A ) => fun( input: Option 'A) =>
  match input with
  | Some v => v
  | None => default end
let option_bystr20_value = let f = @option_value ByStr20 in f zeroByStr20


contract Operator(
    init_admin: ByStr20,
    init_bancor_formula: ByStr20,
    init_spread: Uint128,
    max_spread: Uint128,
    init_beneficiary: ByStr20
)
with
    let valid_spread = uint128_le init_spread max_spread in
    let valid_max_spread = uint128_lt max_spread spread_denominator in
    andb valid_spread valid_max_spread
=>
field admin: ByStr20 = init_admin
field staging_admin: Option ByStr20 = None {ByStr20}
field bancor_formula_contract: ByStr20 = init_bancor_formula
field spread: Uint128 = init_spread
field beneficiary: ByStr20 = init_beneficiary

procedure ThrowError(err: Error)
    e = make_error err;
    throw e
end



procedure AssertAddrEquality(ad1: ByStr20, ad2: ByStr20)
    is_same = builtin eq ad1 ad2;
    match is_same with
    | False => e = NotAuthorized; ThrowError e
    | True =>
    end 
end
procedure IsAdmin()
    tmp <- admin;
    AssertAddrEquality tmp _sender
end
transition SetStagedAdmin(staged: ByStr20)
    IsAdmin;
    opt_staged = Some {ByStr20} staged;
    staging_admin := opt_staged
end
transition ClaimStagedAdmin()
    option_staged <- staging_admin;
    staged = option_bystr20_value option_staged;
    staged_is_sender = builtin eq _sender staged;
    match staged_is_sender with
    | False => e = NotAuthorized; ThrowError e
    | True => admin := staged
    end
end



transition UpgradeFormula(new: ByStr20)
    IsAdmin;
    bancor_formula_contract := new 
end

transition ChangeSpread(new: Uint128)
    IsAdmin;
    is_valid = uint128_le new max_spread;
    match is_valid with
    | False => e = SpreadTooBig; ThrowError e
    | True =>
        spread := new
    end
end

transition ChangeBeneficiary(new: ByStr20)
    IsAdmin;
    beneficiary := new
end`;
export const deploy = (
  __init_admin: T.ByStr20,
  __init_bancor_formula: T.ByStr20,
  __init_spread: T.Uint128,
  __max_spread: T.Uint128,
  __init_beneficiary: T.ByStr20
) => {
  const initData = [
    {
      type: `Uint32`,
      vname: `_scilla_version`,
      value: "0",
    },
    {
      type: `ByStr20`,
      vname: `init_admin`,
      value: __init_admin.toSend(),
    },
    {
      type: `ByStr20`,
      vname: `init_bancor_formula`,
      value: __init_bancor_formula.toSend(),
    },
    {
      type: `Uint128`,
      vname: `init_spread`,
      value: __init_spread.toSend(),
    },
    {
      type: `Uint128`,
      vname: `max_spread`,
      value: __max_spread.toSend(),
    },
    {
      type: `ByStr20`,
      vname: `init_beneficiary`,
      value: __init_beneficiary.toSend(),
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
 * 2021-08-22T17:35:10.774Z
 */
export const hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 =
  (a: T.ByStr20) => ({
    state: () => ({
      get: async function (
        field:
          | "admin"
          | "staging_admin"
          | "bancor_formula_contract"
          | "spread"
          | "beneficiary"
      ) {
        const zil = getZil();
        return (
          await zil.blockchain.getSmartContractSubState(a.toSend(), field)
        ).result;
      },
      log: async function (
        field:
          | "admin"
          | "staging_admin"
          | "bancor_formula_contract"
          | "spread"
          | "beneficiary"
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
      SetStagedAdmin: (__staged: T.ByStr20) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `SetStagedAdmin`,
          data: [
            {
              type: `ByStr20`,
              vname: `staged`,
              value: __staged.toSend(),
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
            log.txLink(tx, "SetStagedAdmin");
            return tx;
          },
        };
      },

      ClaimStagedAdmin: () => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `ClaimStagedAdmin`,
          data: [],
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
            log.txLink(tx, "ClaimStagedAdmin");
            return tx;
          },
        };
      },

      UpgradeFormula: (__new: T.ByStr20) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `UpgradeFormula`,
          data: [
            {
              type: `ByStr20`,
              vname: `new`,
              value: __new.toSend(),
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
            log.txLink(tx, "UpgradeFormula");
            return tx;
          },
        };
      },

      ChangeSpread: (__new: T.Uint128) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `ChangeSpread`,
          data: [
            {
              type: `Uint128`,
              vname: `new`,
              value: __new.toSend(),
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
            log.txLink(tx, "ChangeSpread");
            return tx;
          },
        };
      },

      ChangeBeneficiary: (__new: T.ByStr20) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `ChangeBeneficiary`,
          data: [
            {
              type: `ByStr20`,
              vname: `new`,
              value: __new.toSend(),
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
            log.txLink(tx, "ChangeBeneficiary");
            return tx;
          },
        };
      },
    }),
  });
