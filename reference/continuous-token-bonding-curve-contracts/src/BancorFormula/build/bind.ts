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



import IntUtils ListUtils
library BancorFormula

let c_MIN_PRECISION = Uint256 32
let c_MAX_PRECISION = Uint256 127
let c_MAX_WEIGHT = Uint256 1000000
let c_FIXED_1 = Uint256 170141183460469231731687303715884105728
let c_FIXED_2 = Uint256 340282366920938463463374607431768211456
let c_MAX_NUM = Uint256 680564733841876926926749214863536422912
let c_OPT_LOG_MAX_VAL = Uint256 462491687273110168575455517921668397539
let c_OPT_EXP_MAX_VAL = Uint256 2722258935367507707706996859454145691648
let c_LN2_NUMERATOR = Uint256 5275695611177340518812009417546793976
let c_LN2_DENOMINATOR = Uint256 7611219895485218073587121647846406784
let zero_uint128 = Uint128 0
let zero_uint256 = Uint256 0
let two_uint256 = Uint256 2

let one_msg = 
  fun (msg : Message) => 
  let nil_msg = Nil {Message} in
  Cons {Message} msg nil_msg

type Error =
| CodeInputIsZero
| CodeInputNotInBounds

let make_error =
  fun (result : Error) =>
    let result_code = 
      match result with
      | CodeInputIsZero => Int32 -1
      | CodeInputNotInBounds => Int32 -2
      end
    in
    { _exception : "Error"; code : result_code }


let muldiv: Uint256 -> Uint256 -> Uint256 -> Uint256 =
    fun(x: Uint256) => fun(y: Uint256) => fun(z: Uint256) =>
    let xy = builtin mul x y in
    builtin div xy z


let muladd: Uint256 -> Uint256 -> Uint256 -> Uint256 =
    fun(x: Uint256) => fun(y: Uint256) => fun(z: Uint256) =>
    let xy = builtin mul x y in
    builtin add xy z


let submuldivadd: Uint256 -> Uint256 -> Uint256 -> Uint256 -> Uint256 -> Uint256 =
    fun(x: Uint256) => fun(k: Uint256) => fun(b: Uint256) => fun(z: Uint256) => fun(r: Uint256) =>
    let k_sub_b = builtin sub k b in
    let tmp = muldiv x k_sub_b z in
    builtin add tmp r


let panic: Uint256 -> Uint256 =
    fun(numerator: Uint256) =>
    builtin div zero_uint256 zero_uint256


let panic_uint128: Uint128 -> Uint128 =
    fun(numerator: Uint128) =>
    let one = Uint128 1 in
    let zero = Uint128 0 in
    builtin div one zero

let uint128_to_uint256: Uint128 -> Uint256 =
    fun (x: Uint128) =>
    let ox256 = builtin to_uint256 x in
    match ox256 with
    | None =>
        
        panic zero_uint256
    | Some x256 => x256
    end
let uint256_to_uint32: Uint256 -> Uint32 =
    fun (x: Uint256) =>
    let ores32 = builtin to_uint32 x in
    match ores32 with
    | None =>
        
        let zero = Uint32 0 in
        let one = Uint32 1 in
        
        builtin div one zero
    | Some res32 =>
        res32
    end


let pow_uint256: Uint256 -> Uint256 -> Uint256 =
    fun(x: Uint256) => fun(y: Uint256) =>
    let y_32 = uint256_to_uint32 y in
    builtin pow x y_32

let uint256_to_uint128: Uint256 -> Uint128 =
    fun (x: Uint256) =>
    let ores128 = builtin to_uint128 x in
    match ores128 with
    | None =>
        
        let zero = Uint128 0 in
        panic_uint128 zero
    | Some res128 =>
        res128
    end


type ThresholdAndToAdd = | ThresholdAndToAdd of Uint256 Uint256
type XAndRes = | XAndRes of Uint256 Uint256
let optimalLog: Uint256 -> Uint256 =
    fun(x: Uint256) =>
    
    
        let threshold_val0 = Uint256 280515388193368458015406427511040113880 in
        let to_add0 = Uint256 85070591730234615865843651857942052864 in
    let threshold0 = ThresholdAndToAdd threshold_val0 to_add0 in 
        let threshold_val1 = Uint256 218465603988574474844591417643679820199 in
        let to_add1 = Uint256 42535295865117307932921825928971026432 in
    let threshold1 = ThresholdAndToAdd threshold_val1 to_add1 in 
        let threshold_val2 = Uint256 192795218841189805222451540510555621025 in
        let to_add2 = Uint256 21267647932558653966460912964485513216 in
    let threshold2 = ThresholdAndToAdd threshold_val2 to_add2 in 
        let threshold_val3 = Uint256 181114347027396448854165353426875372712 in
        let to_add3 = Uint256 10633823966279326983230456482242756608 in
    let threshold3 = ThresholdAndToAdd threshold_val3 to_add3 in 
        let threshold_val4 = Uint256 175542044379434494067323265867529472979 in
        let to_add4 = Uint256 5316911983139663491615228241121378304 in
    let threshold4 = ThresholdAndToAdd threshold_val4 to_add4 in 
        let threshold_val5 = Uint256 172820517236198538127967385733353125282 in
        let to_add5 = Uint256 2658455991569831745807614120560689152 in
    let threshold5 = ThresholdAndToAdd threshold_val5 to_add5 in 
        let threshold_val6 = Uint256 171475617301169790829459146906809945753 in
        let to_add6 = Uint256 1329227995784915872903807060280344576 in
    let threshold6 = ThresholdAndToAdd threshold_val6 to_add6 in 
        let threshold_val7 = Uint256 170807097224429000759274174605493073715 in
        let to_add7 = Uint256 664613997892457936451903530140172288 in
    let threshold7 = ThresholdAndToAdd threshold_val7 to_add7 in 

    let nil = Nil {ThresholdAndToAdd} in
    let l0 = Cons {ThresholdAndToAdd} threshold0 nil in
    let l1 = Cons {ThresholdAndToAdd} threshold1 l0 in
    let l2 = Cons {ThresholdAndToAdd} threshold2 l1 in
    let l3 = Cons {ThresholdAndToAdd} threshold3 l2 in
    let l4 = Cons {ThresholdAndToAdd} threshold4 l3 in
    let l5 = Cons {ThresholdAndToAdd} threshold5 l4 in
    let l6 = Cons {ThresholdAndToAdd} threshold6 l5 in
    let l7 = Cons {ThresholdAndToAdd} threshold7 l6 in

    let folder_stage_1 = fun(x_and_res: XAndRes) => fun(threshold_and_to_add: ThresholdAndToAdd) =>
        match x_and_res with 
        | XAndRes local_x local_res =>
            match threshold_and_to_add with
            | ThresholdAndToAdd threshold to_add =>
                let x_ge = uint256_ge local_x threshold in
                match x_ge with
                | True =>
                    let newRes = builtin add local_res to_add in
                    let newX = muldiv local_x c_FIXED_1 threshold in
                    XAndRes newX newRes
                | False => XAndRes local_x local_res
                end
            end
        end in

    let fold_stage_1 = @list_foldl ThresholdAndToAdd XAndRes in

    let xAndResInit = XAndRes x zero_uint256 in

    let stage_1_x_and_res = fold_stage_1 folder_stage_1 xAndResInit l7 in
    match stage_1_x_and_res with
    | XAndRes x_1 local_res_0 =>
        
        
        let y = builtin sub x_1 c_FIXED_1 in
        let z0 = y in
        let w = muldiv y y c_FIXED_1 in

        
            let numerator1 = Uint256 340282366920938463463374607431768211456 in
            let denominator1 = Uint256 340282366920938463463374607431768211456 in
        let local_res_1 = submuldivadd z0 numerator1 y denominator1 local_res_0 in let z1 = muldiv z0 w c_FIXED_1 in 
            let numerator2 = Uint256 226854911280625642308916404954512140970 in
            let denominator2 = Uint256 680564733841876926926749214863536422912 in
        let local_res_2 = submuldivadd z1 numerator2 y denominator2 local_res_1 in let z2 = muldiv z1 w c_FIXED_1 in 
            let numerator3 = Uint256 204169420152563078078024764459060926873 in
            let denominator3 = Uint256 1020847100762815390390123822295304634368 in
        let local_res_3 = submuldivadd z2 numerator3 y denominator3 local_res_2 in let z3 = muldiv z2 w c_FIXED_1 in 
            let numerator4 = Uint256 194447066811964836264785489961010406546 in
            let denominator4 = Uint256 1361129467683753853853498429727072845824 in
        let local_res_4 = submuldivadd z3 numerator4 y denominator4 local_res_3 in let z4 = muldiv z3 w c_FIXED_1 in 
            let numerator5 = Uint256 189045759400521368590763670795426784142 in
            let denominator5 = Uint256 1701411834604692317316873037158841057280 in
        let local_res_5 = submuldivadd z4 numerator5 y denominator5 local_res_4 in let z5 = muldiv z4 w c_FIXED_1 in 
            let numerator6 = Uint256 185608563775057343707295240417328115339 in
            let denominator6 = Uint256 2041694201525630780780247644590609268736 in
        let local_res_6 = submuldivadd z5 numerator6 y denominator6 local_res_5 in let z6 = muldiv z5 w c_FIXED_1 in 
            let numerator7 = Uint256 183228966803582249557201711694029036937 in
            let denominator7 = Uint256 2381976568446569244243622252022377480192 in
        let local_res_7 = submuldivadd z6 numerator7 y denominator7 local_res_6 in let z7 = muldiv z6 w c_FIXED_1 in 
            let numerator8 = Uint256 181483929024500513847133123963609712776 in
            let denominator8 = Uint256 2722258935367507707706996859454145691648 in
        let local_res_8 = submuldivadd z7 numerator8 y denominator8 local_res_7 in 
        
        local_res_8
    end


type NAndRes = | NAndRes of Uint256 Uint256
let floorLog2: Uint256 -> Uint256 =
    fun(in_n: Uint256) =>
    let nil = Nil {Uint256} in
    let i_temp1 = Uint256 1 in let l1 = Cons {Uint256} i_temp1 nil in let i_temp2 = Uint256 2 in let l2 = Cons {Uint256} i_temp2 l1 in let i_temp3 = Uint256 4 in let l3 = Cons {Uint256} i_temp3 l2 in let i_temp4 = Uint256 8 in let l4 = Cons {Uint256} i_temp4 l3 in let i_temp5 = Uint256 16 in let l5 = Cons {Uint256} i_temp5 l4 in let i_temp6 = Uint256 32 in let l6 = Cons {Uint256} i_temp6 l5 in let i_temp7 = Uint256 64 in let l7 = Cons {Uint256} i_temp7 l6 in let i_temp8 = Uint256 128 in let l8 = Cons {Uint256} i_temp8 l7 in
    let uint256_256 = Uint256 256 in
    let in_n_lt_256 = uint256_lt in_n uint256_256 in
    let init = NAndRes in_n zero_uint256 in
    let result_n_and_res = match in_n_lt_256 with
    | True =>
        let folder: NAndRes -> Uint256 -> Option NAndRes =
            fun(local_n_and_res: NAndRes) => fun(index: Uint256) =>
                match local_n_and_res with
                | NAndRes local_n local_res =>
                    let one = Uint256 1 in
                    let local_n_gt_one = uint256_gt local_n one in
                    match local_n_gt_one with
                    | False => None {NAndRes}
                    | True =>
                        let new_n = builtin div local_n two_uint256 in
                        let new_res = builtin add local_res one in
                        let tmp = NAndRes new_n new_res in
                        Some {NAndRes} tmp
                    end
                end in
        let fold = @list_foldl_while Uint256 NAndRes in
        fold folder init l8
    | False =>
        let folder: NAndRes -> Uint256 -> NAndRes =
            fun(local_n_and_res: NAndRes) => fun(bits: Uint256) =>
                match local_n_and_res with
                | NAndRes local_n local_res =>
                    let two_pow_bits = pow_uint256 two_uint256 bits in
                    let n_ge_two_pow_bits = uint256_ge local_n two_pow_bits in
                    match n_ge_two_pow_bits with
                    | True =>
                        
                        let new_n = builtin div local_n two_pow_bits in
                        
                        let new_res = builtin add local_res bits in
                        NAndRes new_n new_res
                    | False => NAndRes local_n local_res
                    end
                end in
        let fold = @list_foldl Uint256 NAndRes in
        fold folder init l8
    end in
    match result_n_and_res with
    | NAndRes result_n result_res => result_res
    end


type ResAndX = | ResAndX of Uint256 Uint256
let generalLog: Uint256 -> Uint256 =
    fun(x: Uint256) =>
    
    let x_ge_two = uint256_ge x c_FIXED_2 in
    let res_and_x = match x_ge_two with
        | True => 
            let x_div_c_FIXED_1 = builtin div x c_FIXED_1 in
            let count = floorLog2 x_div_c_FIXED_1 in
            let two_pow_count = pow_uint256 two_uint256 count in
            let xshifted = builtin div x two_pow_count in 
            let newRes = builtin mul count c_FIXED_1 in
            ResAndX newRes xshifted
        | False => ResAndX zero_uint256 x
        end in
    match res_and_x with
    | ResAndX res1 x1 =>
        
        let x1_gt_c_FIXED_1 = uint256_gt x1 c_FIXED_1 in
        match x1_gt_c_FIXED_1 with
        | True =>
            
                let nil = Nil {Uint256} in
                let i_temp1 = Uint256 1 in let l1 = Cons {Uint256} i_temp1 nil in let i_temp2 = Uint256 2 in let l2 = Cons {Uint256} i_temp2 l1 in let i_temp3 = Uint256 3 in let l3 = Cons {Uint256} i_temp3 l2 in let i_temp4 = Uint256 4 in let l4 = Cons {Uint256} i_temp4 l3 in let i_temp5 = Uint256 5 in let l5 = Cons {Uint256} i_temp5 l4 in let i_temp6 = Uint256 6 in let l6 = Cons {Uint256} i_temp6 l5 in let i_temp7 = Uint256 7 in let l7 = Cons {Uint256} i_temp7 l6 in let i_temp8 = Uint256 8 in let l8 = Cons {Uint256} i_temp8 l7 in let i_temp9 = Uint256 9 in let l9 = Cons {Uint256} i_temp9 l8 in let i_temp10 = Uint256 10 in let l10 = Cons {Uint256} i_temp10 l9 in let i_temp11 = Uint256 11 in let l11 = Cons {Uint256} i_temp11 l10 in let i_temp12 = Uint256 12 in let l12 = Cons {Uint256} i_temp12 l11 in let i_temp13 = Uint256 13 in let l13 = Cons {Uint256} i_temp13 l12 in let i_temp14 = Uint256 14 in let l14 = Cons {Uint256} i_temp14 l13 in let i_temp15 = Uint256 15 in let l15 = Cons {Uint256} i_temp15 l14 in let i_temp16 = Uint256 16 in let l16 = Cons {Uint256} i_temp16 l15 in let i_temp17 = Uint256 17 in let l17 = Cons {Uint256} i_temp17 l16 in let i_temp18 = Uint256 18 in let l18 = Cons {Uint256} i_temp18 l17 in let i_temp19 = Uint256 19 in let l19 = Cons {Uint256} i_temp19 l18 in let i_temp20 = Uint256 20 in let l20 = Cons {Uint256} i_temp20 l19 in let i_temp21 = Uint256 21 in let l21 = Cons {Uint256} i_temp21 l20 in let i_temp22 = Uint256 22 in let l22 = Cons {Uint256} i_temp22 l21 in
                let i_temp23 = Uint256 23 in let l23 = Cons {Uint256} i_temp23 l22 in let i_temp24 = Uint256 24 in let l24 = Cons {Uint256} i_temp24 l23 in let i_temp25 = Uint256 25 in let l25 = Cons {Uint256} i_temp25 l24 in let i_temp26 = Uint256 26 in let l26 = Cons {Uint256} i_temp26 l25 in let i_temp27 = Uint256 27 in let l27 = Cons {Uint256} i_temp27 l26 in let i_temp28 = Uint256 28 in let l28 = Cons {Uint256} i_temp28 l27 in let i_temp29 = Uint256 29 in let l29 = Cons {Uint256} i_temp29 l28 in let i_temp30 = Uint256 30 in let l30 = Cons {Uint256} i_temp30 l29 in let i_temp31 = Uint256 31 in let l31 = Cons {Uint256} i_temp31 l30 in let i_temp32 = Uint256 32 in let l32 = Cons {Uint256} i_temp32 l31 in let i_temp33 = Uint256 33 in let l33 = Cons {Uint256} i_temp33 l32 in let i_temp34 = Uint256 34 in let l34 = Cons {Uint256} i_temp34 l33 in let i_temp35 = Uint256 35 in let l35 = Cons {Uint256} i_temp35 l34 in let i_temp36 = Uint256 36 in let l36 = Cons {Uint256} i_temp36 l35 in let i_temp37 = Uint256 37 in let l37 = Cons {Uint256} i_temp37 l36 in let i_temp38 = Uint256 38 in let l38 = Cons {Uint256} i_temp38 l37 in let i_temp39 = Uint256 39 in let l39 = Cons {Uint256} i_temp39 l38 in let i_temp40 = Uint256 40 in let l40 = Cons {Uint256} i_temp40 l39 in let i_temp41 = Uint256 41 in let l41 = Cons {Uint256} i_temp41 l40 in let i_temp42 = Uint256 42 in let l42 = Cons {Uint256} i_temp42 l41 in let i_temp43 = Uint256 43 in let l43 = Cons {Uint256} i_temp43 l42 in
                let i_temp44 = Uint256 44 in let l44 = Cons {Uint256} i_temp44 l43 in let i_temp45 = Uint256 45 in let l45 = Cons {Uint256} i_temp45 l44 in let i_temp46 = Uint256 46 in let l46 = Cons {Uint256} i_temp46 l45 in let i_temp47 = Uint256 47 in let l47 = Cons {Uint256} i_temp47 l46 in let i_temp48 = Uint256 48 in let l48 = Cons {Uint256} i_temp48 l47 in let i_temp49 = Uint256 49 in let l49 = Cons {Uint256} i_temp49 l48 in let i_temp50 = Uint256 50 in let l50 = Cons {Uint256} i_temp50 l49 in let i_temp51 = Uint256 51 in let l51 = Cons {Uint256} i_temp51 l50 in let i_temp52 = Uint256 52 in let l52 = Cons {Uint256} i_temp52 l51 in let i_temp53 = Uint256 53 in let l53 = Cons {Uint256} i_temp53 l52 in let i_temp54 = Uint256 54 in let l54 = Cons {Uint256} i_temp54 l53 in let i_temp55 = Uint256 55 in let l55 = Cons {Uint256} i_temp55 l54 in let i_temp56 = Uint256 56 in let l56 = Cons {Uint256} i_temp56 l55 in let i_temp57 = Uint256 57 in let l57 = Cons {Uint256} i_temp57 l56 in let i_temp58 = Uint256 58 in let l58 = Cons {Uint256} i_temp58 l57 in let i_temp59 = Uint256 59 in let l59 = Cons {Uint256} i_temp59 l58 in let i_temp60 = Uint256 60 in let l60 = Cons {Uint256} i_temp60 l59 in let i_temp61 = Uint256 61 in let l61 = Cons {Uint256} i_temp61 l60 in let i_temp62 = Uint256 62 in let l62 = Cons {Uint256} i_temp62 l61 in let i_temp63 = Uint256 63 in let l63 = Cons {Uint256} i_temp63 l62 in let i_temp64 = Uint256 64 in let l64 = Cons {Uint256} i_temp64 l63 in
                let i_temp65 = Uint256 65 in let l65 = Cons {Uint256} i_temp65 l64 in let i_temp66 = Uint256 66 in let l66 = Cons {Uint256} i_temp66 l65 in let i_temp67 = Uint256 67 in let l67 = Cons {Uint256} i_temp67 l66 in let i_temp68 = Uint256 68 in let l68 = Cons {Uint256} i_temp68 l67 in let i_temp69 = Uint256 69 in let l69 = Cons {Uint256} i_temp69 l68 in let i_temp70 = Uint256 70 in let l70 = Cons {Uint256} i_temp70 l69 in let i_temp71 = Uint256 71 in let l71 = Cons {Uint256} i_temp71 l70 in let i_temp72 = Uint256 72 in let l72 = Cons {Uint256} i_temp72 l71 in let i_temp73 = Uint256 73 in let l73 = Cons {Uint256} i_temp73 l72 in let i_temp74 = Uint256 74 in let l74 = Cons {Uint256} i_temp74 l73 in let i_temp75 = Uint256 75 in let l75 = Cons {Uint256} i_temp75 l74 in let i_temp76 = Uint256 76 in let l76 = Cons {Uint256} i_temp76 l75 in let i_temp77 = Uint256 77 in let l77 = Cons {Uint256} i_temp77 l76 in let i_temp78 = Uint256 78 in let l78 = Cons {Uint256} i_temp78 l77 in let i_temp79 = Uint256 79 in let l79 = Cons {Uint256} i_temp79 l78 in let i_temp80 = Uint256 80 in let l80 = Cons {Uint256} i_temp80 l79 in let i_temp81 = Uint256 81 in let l81 = Cons {Uint256} i_temp81 l80 in let i_temp82 = Uint256 82 in let l82 = Cons {Uint256} i_temp82 l81 in let i_temp83 = Uint256 83 in let l83 = Cons {Uint256} i_temp83 l82 in let i_temp84 = Uint256 84 in let l84 = Cons {Uint256} i_temp84 l83 in let i_temp85 = Uint256 85 in let l85 = Cons {Uint256} i_temp85 l84 in 
                let i_temp86 = Uint256 86 in let l86 = Cons {Uint256} i_temp86 l85 in let i_temp87 = Uint256 87 in let l87 = Cons {Uint256} i_temp87 l86 in let i_temp88 = Uint256 88 in let l88 = Cons {Uint256} i_temp88 l87 in let i_temp89 = Uint256 89 in let l89 = Cons {Uint256} i_temp89 l88 in let i_temp90 = Uint256 90 in let l90 = Cons {Uint256} i_temp90 l89 in let i_temp91 = Uint256 91 in let l91 = Cons {Uint256} i_temp91 l90 in let i_temp92 = Uint256 92 in let l92 = Cons {Uint256} i_temp92 l91 in let i_temp93 = Uint256 93 in let l93 = Cons {Uint256} i_temp93 l92 in let i_temp94 = Uint256 94 in let l94 = Cons {Uint256} i_temp94 l93 in let i_temp95 = Uint256 95 in let l95 = Cons {Uint256} i_temp95 l94 in let i_temp96 = Uint256 96 in let l96 = Cons {Uint256} i_temp96 l95 in let i_temp97 = Uint256 97 in let l97 = Cons {Uint256} i_temp97 l96 in let i_temp98 = Uint256 98 in let l98 = Cons {Uint256} i_temp98 l97 in let i_temp99 = Uint256 99 in let l99 = Cons {Uint256} i_temp99 l98 in let i_temp100 = Uint256 100 in let l100 = Cons {Uint256} i_temp100 l99 in let i_temp101 = Uint256 101 in let l101 = Cons {Uint256} i_temp101 l100 in let i_temp102 = Uint256 102 in let l102 = Cons {Uint256} i_temp102 l101 in let i_temp103 = Uint256 103 in let l103 = Cons {Uint256} i_temp103 l102 in let i_temp104 = Uint256 104 in let l104 = Cons {Uint256} i_temp104 l103 in let i_temp105 = Uint256 105 in let l105 = Cons {Uint256} i_temp105 l104 in
                let i_temp106 = Uint256 106 in let l106 = Cons {Uint256} i_temp106 l105 in let i_temp107 = Uint256 107 in let l107 = Cons {Uint256} i_temp107 l106 in let i_temp108 = Uint256 108 in let l108 = Cons {Uint256} i_temp108 l107 in let i_temp109 = Uint256 109 in let l109 = Cons {Uint256} i_temp109 l108 in let i_temp110 = Uint256 110 in let l110 = Cons {Uint256} i_temp110 l109 in let i_temp111 = Uint256 111 in let l111 = Cons {Uint256} i_temp111 l110 in let i_temp112 = Uint256 112 in let l112 = Cons {Uint256} i_temp112 l111 in let i_temp113 = Uint256 113 in let l113 = Cons {Uint256} i_temp113 l112 in let i_temp114 = Uint256 114 in let l114 = Cons {Uint256} i_temp114 l113 in let i_temp115 = Uint256 115 in let l115 = Cons {Uint256} i_temp115 l114 in let i_temp116 = Uint256 116 in let l116 = Cons {Uint256} i_temp116 l115 in let i_temp117 = Uint256 117 in let l117 = Cons {Uint256} i_temp117 l116 in let i_temp118 = Uint256 118 in let l118 = Cons {Uint256} i_temp118 l117 in let i_temp119 = Uint256 119 in let l119 = Cons {Uint256} i_temp119 l118 in let i_temp120 = Uint256 120 in let l120 = Cons {Uint256} i_temp120 l119 in let i_temp121 = Uint256 121 in let l121 = Cons {Uint256} i_temp121 l120 in let i_temp122 = Uint256 122 in let l122 = Cons {Uint256} i_temp122 l121 in let i_temp123 = Uint256 123 in let l123 = Cons {Uint256} i_temp123 l122 in let i_temp124 = Uint256 124 in let l124 = Cons {Uint256} i_temp124 l123 in
                let i_temp125 = Uint256 125 in let l125 = Cons {Uint256} i_temp125 l124 in let i_temp126 = Uint256 126 in let l126 = Cons {Uint256} i_temp126 l125 in let i_temp127 = Uint256 127 in let l127 = Cons {Uint256} i_temp127 l126 in
            let folder = fun(cur_res_and_x: ResAndX) => fun(i: Uint256) =>
                match cur_res_and_x with
                | ResAndX local_res local_x =>
                    let new_x = muldiv local_x local_x c_FIXED_1 in 
                    let new_x_ge_two = uint256_ge new_x c_FIXED_2 in
                    match new_x_ge_two with
                    | True =>
                        let shiftedX = builtin div new_x two_uint256 in
                        let one = Uint256 1 in
                        let i_minus_one = builtin sub i one in
                        let two_pow_i_minus_one = pow_uint256 two_uint256 i_minus_one in
                        let oneShifted = builtin mul one two_pow_i_minus_one in
                        let newRes = builtin add local_res oneShifted in
                        ResAndX newRes shiftedX
                    | False => ResAndX local_res new_x
                    end
                end in
            let fold = @list_foldl Uint256 ResAndX in
            let init = ResAndX res1 x1 in
            let result_res_and_x = fold folder init l127 in
            match result_res_and_x with
            | ResAndX res2 x2 =>
                muldiv res2 c_LN2_NUMERATOR c_LN2_DENOMINATOR
            end
        | False => muldiv res1 c_LN2_NUMERATOR c_LN2_DENOMINATOR
        end
    end


let log: Uint256 -> Uint256 = 
    fun(base: Uint256) =>
    let can_do_optimal_log = uint256_lt base c_OPT_LOG_MAX_VAL in
    match can_do_optimal_log with
    | True => optimalLog base
    | False => generalLog base
    end



type PowerResultAndPrecision =
| PowerResultAndPrecision of Uint256 Uint256


let panic_if_uint256_not_lt_uint256: Uint256 -> Uint256 -> Bool =
    fun(i1: Uint256) => fun(i2: Uint256) =>
    let is_less_than = uint256_lt i1 i2 in
    let tmp = match is_less_than with | True => zero_uint256 | False => panic zero_uint256 end in
    is_less_than

 
let optimalExp: Uint256 -> Uint256 = fun(x: Uint256) =>
    let res1 = Uint256 0 in
    let two_pow_minus_three = Uint256 21267647932558653966460912964485513216 in
    let z1 = builtin rem x two_pow_minus_three in 
    let y = z1 in
    let z2 = muldiv z1 y c_FIXED_1 in let tmp2 = Uint256 1216451004088320000 in let res2 = muladd z2 tmp2 res1 in 
    let z3 = muldiv z2 y c_FIXED_1 in let tmp3 = Uint256 405483668029440000 in let res3 = muladd z3 tmp3 res2 in 
    let z4 = muldiv z3 y c_FIXED_1 in let tmp4 = Uint256 101370917007360000 in let res4 = muladd z4 tmp4 res3 in 
    let z5 = muldiv z4 y c_FIXED_1 in let tmp5 = Uint256 20274183401472000 in let res5 = muladd z5 tmp5 res4 in 
    let z6 = muldiv z5 y c_FIXED_1 in let tmp6 = Uint256 3379030566912000 in let res6 = muladd z6 tmp6 res5 in 
    let z7 = muldiv z6 y c_FIXED_1 in let tmp7 = Uint256 482718652416000 in let res7 = muladd z7 tmp7 res6 in 
    let z8 = muldiv z7 y c_FIXED_1 in let tmp8 = Uint256 60339831552000 in let res8 = muladd z8 tmp8 res7 in 
    let z9 = muldiv z8 y c_FIXED_1 in let tmp9 = Uint256 6704425728000 in let res9 = muladd z9 tmp9 res8 in 
    let z10 = muldiv z9 y c_FIXED_1 in let tmp10 = Uint256 670442572800 in let res10 = muladd z10 tmp10 res9 in 
    let z11 = muldiv z10 y c_FIXED_1 in let tmp11 = Uint256 60949324800 in let res11 = muladd z11 tmp11 res10 in 
    let z12 = muldiv z11 y c_FIXED_1 in let tmp12 = Uint256 5079110400 in let res12 = muladd z12 tmp12 res11 in 
    let z13 = muldiv z12 y c_FIXED_1 in let tmp13 = Uint256 390700800 in let res13 = muladd z13 tmp13 res12 in 
    let z14 = muldiv z13 y c_FIXED_1 in let tmp14 = Uint256 27907200 in let res14 = muladd z14 tmp14 res13 in 
    let z15 = muldiv z14 y c_FIXED_1 in let tmp15 = Uint256 1860480 in let res15 = muladd z15 tmp15 res14 in 
    let z16 = muldiv z15 y c_FIXED_1 in let tmp16 = Uint256 116280 in let res16 = muladd z16 tmp16 res15 in 
    let z17 = muldiv z16 y c_FIXED_1 in let tmp17 = Uint256 6840 in let res17 = muladd z17 tmp17 res16 in 
    let z18 = muldiv z17 y c_FIXED_1 in let tmp18 = Uint256 380 in let res18 = muladd z18 tmp18 res17 in 
    let z19 = muldiv z18 y c_FIXED_1 in let tmp19 = Uint256 20 in let res19 = muladd z19 tmp19 res18 in 
    let z20 = muldiv z19 y c_FIXED_1 in let tmp20 = Uint256 1 in let res20 = muladd z20 tmp20 res19 in 
    let y_add_c_FIXED_1 = builtin add y c_FIXED_1 in
    let fac20 = Uint256 2432902008176640000 in
    let res_div_fac_20 = builtin div res20 fac20 in
    let res21 = builtin add res_div_fac_20 y_add_c_FIXED_1 in 
    
    
    let if_contains_muldiv: Uint256 -> Uint256 -> Uint256 -> Uint256 -> Uint256 -> Uint256 =
    fun(local_x: Uint256) => fun(bits: Uint256) => fun(res: Uint256) => fun(numerator: Uint256) => fun(denominator: Uint256) =>
    let one = Uint256 1 in
    let bits_add_one = builtin add bits one in 
    let two_pow_bits_add_one = pow_uint256 two_uint256 bits_add_one in
    let x_mod_condition = builtin rem local_x two_pow_bits_add_one in
    let two_pow_bits = pow_uint256 two_uint256 bits in
    let modded_div_bits = builtin div x_mod_condition two_pow_bits in
    let x_not_contains = builtin eq zero_uint256 modded_div_bits in
    match x_not_contains with
    | True => res
    | False => muldiv res numerator denominator
    end in
    
    
    let res22 = let bits = Uint256 124 in let numerator = Uint256 600596269623765960634066700837880239609 in let denominator = Uint256 530024347646835984032474664511850276726 in if_contains_muldiv x bits res21 numerator denominator in
    
    let res23 = let bits = Uint256 125 in let numerator = Uint256 530024347646835984032474664511850276728 in let denominator = Uint256 412783376994266390547521411024565284564 in if_contains_muldiv x bits res22 numerator denominator in
    
    let res24 = let bits = Uint256 126 in let numerator = Uint256 412783376994266390547521411024565284565 in let denominator = Uint256 250365773966741064234501452596301656607 in if_contains_muldiv x bits res23 numerator denominator in
    
    let res25 = let bits = Uint256 127 in let numerator = Uint256 250365773966741064234501452596301656606 in let denominator = Uint256 92104421015340344839251721785254237641 in if_contains_muldiv x bits res24 numerator denominator in
    
    let res26 = let bits = Uint256 128 in let numerator = Uint256 92104421015340344839251721785254237637 in let denominator = Uint256 12464977905455307901915658421775307242 in if_contains_muldiv x bits res25 numerator denominator in
    
    let res27 = let bits = Uint256 129 in let numerator = Uint256 12464977905455307901915658421775307223 in let denominator = Uint256 228304034072369565894155946646425149 in if_contains_muldiv x bits res26 numerator denominator in
    
    let res28 = let bits = Uint256 130 in let numerator = Uint256 228304034072369565894155946646422279 in let denominator = Uint256 76587471230661696290698490699025 in if_contains_muldiv x bits res27 numerator denominator in
    res28



type PrecisionAndMax = | PrecisionAndMax of Uint256 Uint256
let findPositionInMaxExpArray: Uint256 -> Uint256 = fun(x: Uint256) =>
let res31 = PrecisionAndMax zero_uint256 zero_uint256 in
let setNewIfXSmaller: PrecisionAndMax -> Uint256 -> Uint256 -> PrecisionAndMax =
 fun(prev: PrecisionAndMax) => fun(arrIndex: Uint256) => fun(val: Uint256) =>
 let x_lt_val = uint256_lt x val in
 match x_lt_val with | True => PrecisionAndMax arrIndex val | False => prev end in
	let res32 = let arrIndex = Uint256 32 in let val = Uint256 9599678685041259184274752310158947254271 in setNewIfXSmaller res31 arrIndex val in
	let res33 = let arrIndex = Uint256 33 in let val = Uint256 9204759687141885226475603015507577405439 in setNewIfXSmaller res32 arrIndex val in
	let res34 = let arrIndex = Uint256 34 in let val = Uint256 8826087172077985712041017634911355404287 in setNewIfXSmaller res33 arrIndex val in
	let res35 = let arrIndex = Uint256 35 in let val = Uint256 8462992779488582574159642900919291478015 in setNewIfXSmaller res34 arrIndex val in
	let res36 = let arrIndex = Uint256 36 in let val = Uint256 8114835644520100661580084966409403105279 in setNewIfXSmaller res35 arrIndex val in
	let res37 = let arrIndex = Uint256 37 in let val = Uint256 7781001266736647064069662172832600162303 in setNewIfXSmaller res36 arrIndex val in
	let res38 = let arrIndex = Uint256 38 in let val = Uint256 7460900425488323202194551465008353509375 in setNewIfXSmaller res37 arrIndex val in
	let res39 = let arrIndex = Uint256 39 in let val = Uint256 7153968139937914349310206877837545177087 in setNewIfXSmaller res38 arrIndex val in
	let res40 = let arrIndex = Uint256 40 in let val = Uint256 6859662671868001546166128217910528704511 in setNewIfXSmaller res39 arrIndex val in
	let res41 = let arrIndex = Uint256 41 in let val = Uint256 6577464569506365633454696454958677491711 in setNewIfXSmaller res40 arrIndex val in
	let res42 = let arrIndex = Uint256 42 in let val = Uint256 6306875750689218484600399768107450630143 in setNewIfXSmaller res41 arrIndex val in
	let res43 = let arrIndex = Uint256 43 in let val = Uint256 6047418623741353042663269283551730728959 in setNewIfXSmaller res42 arrIndex val in
	let res44 = let arrIndex = Uint256 44 in let val = Uint256 5798635244522972732941736303310812479487 in setNewIfXSmaller res43 arrIndex val in
	let res45 = let arrIndex = Uint256 45 in let val = Uint256 5560086508154074440893281558760167309311 in setNewIfXSmaller res44 arrIndex val in
	let res46 = let arrIndex = Uint256 46 in let val = Uint256 5331351373990447379730864460340651884543 in setNewIfXSmaller res45 arrIndex val in
	let res47 = let arrIndex = Uint256 47 in let val = Uint256 5112026122483163422598731111238626967551 in setNewIfXSmaller res46 arrIndex val in
	let res48 = let arrIndex = Uint256 48 in let val = Uint256 4901723642609993464238960471454494228479 in setNewIfXSmaller res47 arrIndex val in
	let res49 = let arrIndex = Uint256 49 in let val = Uint256 4700072748620998500994433661760029327359 in setNewIfXSmaller res48 arrIndex val in
	let res50 = let arrIndex = Uint256 50 in let val = Uint256 4506717524892375150236886652795301658623 in setNewIfXSmaller res49 arrIndex val in
	let res51 = let arrIndex = Uint256 51 in let val = Uint256 4321316697732212547034601541953113817087 in setNewIfXSmaller res50 arrIndex val in
	let res52 = let arrIndex = Uint256 52 in let val = Uint256 4143543033029384782309349805264440655871 in setNewIfXSmaller res51 arrIndex val in
	let res53 = let arrIndex = Uint256 53 in let val = Uint256 3973082758682431363936722477132055314431 in setNewIfXSmaller res52 arrIndex val in
	let res54 = let arrIndex = Uint256 54 in let val = Uint256 3809635010789003168527049097368437784575 in setNewIfXSmaller res53 arrIndex val in
	let res55 = let arrIndex = Uint256 55 in let val = Uint256 3652911302618395401280222488042819026943 in setNewIfXSmaller res54 arrIndex val in
	let res56 = let arrIndex = Uint256 56 in let val = Uint256 3502635015429898674229017626613836152831 in setNewIfXSmaller res55 arrIndex val in
	let res57 = let arrIndex = Uint256 57 in let val = Uint256 3358540910238258030536300376569398951935 in setNewIfXSmaller res56 arrIndex val in
	let res58 = let arrIndex = Uint256 58 in let val = Uint256 3220374659664501751807634855053158776831 in setNewIfXSmaller res57 arrIndex val in
	let res59 = let arrIndex = Uint256 59 in let val = Uint256 3087892399045852422628542596524428754943 in setNewIfXSmaller res58 arrIndex val in
	let res60 = let arrIndex = Uint256 60 in let val = Uint256 2960860296012425255212778080756987592703 in setNewIfXSmaller res59 arrIndex val in
	let res61 = let arrIndex = Uint256 61 in let val = Uint256 2839054137771012724926516325250418868223 in setNewIfXSmaller res60 arrIndex val in
	let res62 = let arrIndex = Uint256 62 in let val = Uint256 2722258935367507707706996859454145691647 in setNewIfXSmaller res61 arrIndex val in
	let res63 = let arrIndex = Uint256 63 in let val = Uint256 2610268544229484780765045556213696167935 in setNewIfXSmaller res62 arrIndex val in
	let res64 = let arrIndex = Uint256 64 in let val = Uint256 2502885300319193958571922333378000453631 in setNewIfXSmaller res63 arrIndex val in
	let res65 = let arrIndex = Uint256 65 in let val = Uint256 2399919671254773659805118819743970623487 in setNewIfXSmaller res64 arrIndex val in
	let res66 = let arrIndex = Uint256 66 in let val = Uint256 2301189921783908737703717501630802821119 in setNewIfXSmaller res65 arrIndex val in
	let res67 = let arrIndex = Uint256 67 in let val = Uint256 2206521793019491601704439134261549727743 in setNewIfXSmaller res66 arrIndex val in
	let res68 = let arrIndex = Uint256 68 in let val = Uint256 2115748194871134515168564783402692116479 in setNewIfXSmaller res67 arrIndex val in
	let res69 = let arrIndex = Uint256 69 in let val = Uint256 2028708911129671949307566740521183346687 in setNewIfXSmaller res68 arrIndex val in
	let res70 = let arrIndex = Uint256 70 in let val = Uint256 1945250316684124513375052119057996185599 in setNewIfXSmaller res69 arrIndex val in
	let res71 = let arrIndex = Uint256 71 in let val = Uint256 1865225106372009884014199587421481336831 in setNewIfXSmaller res70 arrIndex val in
	let res72 = let arrIndex = Uint256 72 in let val = Uint256 1788492034984419117666073304513300660223 in setNewIfXSmaller res71 arrIndex val in
	let res73 = let arrIndex = Uint256 73 in let val = Uint256 1714915667966964990208967912165996494847 in setNewIfXSmaller res72 arrIndex val in
	let res74 = let arrIndex = Uint256 74 in let val = Uint256 1644366142376587317378242124992063995903 in setNewIfXSmaller res73 arrIndex val in
	let res75 = let arrIndex = Uint256 75 in let val = Uint256 1576718937672301888428671268411708276735 in setNewIfXSmaller res74 arrIndex val in
	let res76 = let arrIndex = Uint256 76 in let val = Uint256 1511854655935336643558907106913628979199 in setNewIfXSmaller res75 arrIndex val in
	let res77 = let arrIndex = Uint256 77 in let val = Uint256 1449658811130741678082357454851673161727 in setNewIfXSmaller res76 arrIndex val in
	let res78 = let arrIndex = Uint256 78 in let val = Uint256 1390021627038517938156314751863424548863 in setNewIfXSmaller res77 arrIndex val in
	let res79 = let arrIndex = Uint256 79 in let val = Uint256 1332837843497611250583009129150422188031 in setNewIfXSmaller res78 arrIndex val in
	let res80 = let arrIndex = Uint256 80 in let val = Uint256 1278006530620790610545644364558728429567 in setNewIfXSmaller res79 arrIndex val in
	let res81 = let arrIndex = Uint256 81 in let val = Uint256 1225430910652498332846748256431392161791 in setNewIfXSmaller res80 arrIndex val in
	let res82 = let arrIndex = Uint256 82 in let val = Uint256 1175018187155249585623915264673694351359 in setNewIfXSmaller res81 arrIndex val in
	let res83 = let arrIndex = Uint256 83 in let val = Uint256 1126679381223093780446468558216906145791 in setNewIfXSmaller res82 arrIndex val in
	let res84 = let arrIndex = Uint256 84 in let val = Uint256 1080329174433053119456411494679599644671 in setNewIfXSmaller res83 arrIndex val in
	let res85 = let arrIndex = Uint256 85 in let val = Uint256 1035885758257346189907937735244580388863 in setNewIfXSmaller res84 arrIndex val in
	let res86 = let arrIndex = Uint256 86 in let val = Uint256 993270689670607839608468400662101622783 in setNewIfXSmaller res85 arrIndex val in
	let res87 = let arrIndex = Uint256 87 in let val = Uint256 952408752697250790372885759853747765247 in setNewIfXSmaller res86 arrIndex val in
	let res88 = let arrIndex = Uint256 88 in let val = Uint256 913227825654598849673391073164504596479 in setNewIfXSmaller res87 arrIndex val in
	let res89 = let arrIndex = Uint256 89 in let val = Uint256 875658753857474668265023456619450597375 in setNewIfXSmaller res88 arrIndex val in
	let res90 = let arrIndex = Uint256 90 in let val = Uint256 839635227559564507480479102760887779327 in setNewIfXSmaller res89 arrIndex val in
	let res91 = let arrIndex = Uint256 91 in let val = Uint256 805093664916125437948904238798044397567 in setNewIfXSmaller res90 arrIndex val in
	let res92 = let arrIndex = Uint256 92 in let val = Uint256 771973099761463105605096142810743046143 in setNewIfXSmaller res91 arrIndex val in
	let res93 = let arrIndex = Uint256 93 in let val = Uint256 740215074003106313787373698556008333311 in setNewIfXSmaller res92 arrIndex val in
	let res94 = let arrIndex = Uint256 94 in let val = Uint256 709763534442753181219281418466841591807 in setNewIfXSmaller res93 arrIndex val in
	let res95 = let arrIndex = Uint256 95 in let val = Uint256 680564733841876926926749214863536422911 in setNewIfXSmaller res94 arrIndex val in
	let res96 = let arrIndex = Uint256 96 in let val = Uint256 652567136057371195186997586203332575231 in setNewIfXSmaller res95 arrIndex val in
	let res97 = let arrIndex = Uint256 97 in let val = Uint256 625721325079798489641586010116704960511 in setNewIfXSmaller res96 arrIndex val in
	let res98 = let arrIndex = Uint256 98 in let val = Uint256 599979917813693414950432886451725139967 in setNewIfXSmaller res97 arrIndex val in
	let res99 = let arrIndex = Uint256 99 in let val = Uint256 575297480445977184425850753341355720703 in setNewIfXSmaller res98 arrIndex val in
	let res100 = let arrIndex = Uint256 100 in let val = Uint256 551630448254872900425972804456347074559 in setNewIfXSmaller res99 arrIndex val in
	let res101 = let arrIndex = Uint256 101 in let val = Uint256 528937048717783628792119060092411707391 in setNewIfXSmaller res100 arrIndex val in
	let res102 = let arrIndex = Uint256 102 in let val = Uint256 507177227782417987326846600868857380863 in setNewIfXSmaller res101 arrIndex val in
	let res103 = let arrIndex = Uint256 103 in let val = Uint256 486312579171031128343732298613950251007 in setNewIfXSmaller res102 arrIndex val in
	let res104 = let arrIndex = Uint256 104 in let val = Uint256 466306276593002471003532891264408092671 in setNewIfXSmaller res103 arrIndex val in
	let res105 = let arrIndex = Uint256 105 in let val = Uint256 447123008746104779416515886102660251647 in setNewIfXSmaller res104 arrIndex val in
	let res106 = let arrIndex = Uint256 106 in let val = Uint256 428728916991741247552240490495652921343 in setNewIfXSmaller res105 arrIndex val in
	let res107 = let arrIndex = Uint256 107 in let val = Uint256 411091535594146829344560212836376117247 in setNewIfXSmaller res106 arrIndex val in
	let res108 = let arrIndex = Uint256 108 in let val = Uint256 394179734418075472107167272299635146751 in setNewIfXSmaller res107 arrIndex val in
	let res109 = let arrIndex = Uint256 109 in let val = Uint256 377963663983834160889726215582593318911 in setNewIfXSmaller res108 arrIndex val in
	let res110 = let arrIndex = Uint256 110 in let val = Uint256 362414702782685419520589203652335239167 in setNewIfXSmaller res109 arrIndex val in
	let res111 = let arrIndex = Uint256 111 in let val = Uint256 347505406759629484539078662328460836863 in setNewIfXSmaller res110 arrIndex val in
	let res112 = let arrIndex = Uint256 112 in let val = Uint256 333209460874402812645752271223906598911 in setNewIfXSmaller res111 arrIndex val in
	let res113 = let arrIndex = Uint256 113 in let val = Uint256 319501632655197652636411056021540225023 in setNewIfXSmaller res112 arrIndex val in
	let res114 = let arrIndex = Uint256 114 in let val = Uint256 306357727663124583211687061200571318271 in setNewIfXSmaller res113 arrIndex val in
	let res115 = let arrIndex = Uint256 115 in let val = Uint256 293754546788812396405978813098581970943 in setNewIfXSmaller res114 arrIndex val in
	let res116 = let arrIndex = Uint256 116 in let val = Uint256 281669845305773445111617137421885345791 in setNewIfXSmaller res115 arrIndex val in
	let res117 = let arrIndex = Uint256 117 in let val = Uint256 270082293608263279864102872957453496319 in setNewIfXSmaller res116 arrIndex val in
	let res118 = let arrIndex = Uint256 118 in let val = Uint256 258971439564336547476984432763364437503 in setNewIfXSmaller res117 arrIndex val in
	let res119 = let arrIndex = Uint256 119 in let val = Uint256 248317672417651959902117100034610719743 in setNewIfXSmaller res118 arrIndex val in
	let res120 = let arrIndex = Uint256 120 in let val = Uint256 238102188174312697593221439720218478079 in setNewIfXSmaller res119 arrIndex val in
	let res121 = let arrIndex = Uint256 121 in let val = Uint256 228306956413649712418347768277622232511 in setNewIfXSmaller res120 arrIndex val in
	let res122 = let arrIndex = Uint256 122 in let val = Uint256 218914688464368667066255864092044292831 in setNewIfXSmaller res121 arrIndex val in
	let res123 = let arrIndex = Uint256 123 in let val = Uint256 209908806889891126870119775672831054607 in setNewIfXSmaller res122 arrIndex val in
	let res124 = let arrIndex = Uint256 124 in let val = Uint256 201273416229031359487226059686877220919 in setNewIfXSmaller res123 arrIndex val in
	let res125 = let arrIndex = Uint256 125 in let val = Uint256 192993274940365776401274035698589299391 in setNewIfXSmaller res124 arrIndex val in
	let res126 = let arrIndex = Uint256 126 in let val = Uint256 185053768500776578446843424638883162041 in setNewIfXSmaller res125 arrIndex val in
	let res127 = let arrIndex = Uint256 127 in let val = Uint256 177440883610688295304820354615089591270 in setNewIfXSmaller res126 arrIndex val in
match res127 with | PrecisionAndMax precision max =>
let precision_is_zero = builtin eq zero_uint256 precision in
match precision_is_zero with
| True =>  panic zero_uint256
| False => precision
end
end
 

let generalExp: Uint256 -> Uint256 -> Uint256 =
fun(x: Uint256) => fun(precision: Uint256) =>
let two_pow_precision = pow_uint256 two_uint256 precision in
let res1 = Uint256 0 in
let xi1 = x in
    
    let xi2 = muldiv xi1 x two_pow_precision in let res2 = let fac = Uint256 4341658809405943247759097200640000000 in muladd xi2 fac res1 in
    
    let xi3 = muldiv xi2 x two_pow_precision in let res3 = let fac = Uint256 1447219603135314415919699066880000000 in muladd xi3 fac res2 in
    
    let xi4 = muldiv xi3 x two_pow_precision in let res4 = let fac = Uint256 361804900783828603979924766720000000 in muladd xi4 fac res3 in
    
    let xi5 = muldiv xi4 x two_pow_precision in let res5 = let fac = Uint256 72360980156765720795984953344000000 in muladd xi5 fac res4 in
    
    let xi6 = muldiv xi5 x two_pow_precision in let res6 = let fac = Uint256 12060163359460953465997492224000000 in muladd xi6 fac res5 in
    
    let xi7 = muldiv xi6 x two_pow_precision in let res7 = let fac = Uint256 1722880479922993352285356032000000 in muladd xi7 fac res6 in
    
    let xi8 = muldiv xi7 x two_pow_precision in let res8 = let fac = Uint256 215360059990374169035669504000000 in muladd xi8 fac res7 in
    
    let xi9 = muldiv xi8 x two_pow_precision in let res9 = let fac = Uint256 23928895554486018781741056000000 in muladd xi9 fac res8 in
    
    let xi10 = muldiv xi9 x two_pow_precision in let res10 = let fac = Uint256 2392889555448601878174105600000 in muladd xi10 fac res9 in
    
    let xi11 = muldiv xi10 x two_pow_precision in let res11 = let fac = Uint256 217535414131691079834009600000 in muladd xi11 fac res10 in
    
    let xi12 = muldiv xi11 x two_pow_precision in let res12 = let fac = Uint256 18127951177640923319500800000 in muladd xi12 fac res11 in
    
    let xi13 = muldiv xi12 x two_pow_precision in let res13 = let fac = Uint256 1394457782895455639961600000 in muladd xi13 fac res12 in
    
    let xi14 = muldiv xi13 x two_pow_precision in let res14 = let fac = Uint256 99604127349675402854400000 in muladd xi14 fac res13 in
    
    let xi15 = muldiv xi14 x two_pow_precision in let res15 = let fac = Uint256 6640275156645026856960000 in muladd xi15 fac res14 in
    
    let xi16 = muldiv xi15 x two_pow_precision in let res16 = let fac = Uint256 415017197290314178560000 in muladd xi16 fac res15 in
    
    let xi17 = muldiv xi16 x two_pow_precision in let res17 = let fac = Uint256 24412776311194951680000 in muladd xi17 fac res16 in
    
    let xi18 = muldiv xi17 x two_pow_precision in let res18 = let fac = Uint256 1356265350621941760000 in muladd xi18 fac res17 in
    
    let xi19 = muldiv xi18 x two_pow_precision in let res19 = let fac = Uint256 71382386874839040000 in muladd xi19 fac res18 in
    
    let xi20 = muldiv xi19 x two_pow_precision in let res20 = let fac = Uint256 3569119343741952000 in muladd xi20 fac res19 in
    
    let xi21 = muldiv xi20 x two_pow_precision in let res21 = let fac = Uint256 169958063987712000 in muladd xi21 fac res20 in
    
    let xi22 = muldiv xi21 x two_pow_precision in let res22 = let fac = Uint256 7725366544896000 in muladd xi22 fac res21 in
    
    let xi23 = muldiv xi22 x two_pow_precision in let res23 = let fac = Uint256 335885501952000 in muladd xi23 fac res22 in
    
    let xi24 = muldiv xi23 x two_pow_precision in let res24 = let fac = Uint256 13995229248000 in muladd xi24 fac res23 in
    
    let xi25 = muldiv xi24 x two_pow_precision in let res25 = let fac = Uint256 559809169920 in muladd xi25 fac res24 in
    
    let xi26 = muldiv xi25 x two_pow_precision in let res26 = let fac = Uint256 21531121920 in muladd xi26 fac res25 in
    
    let xi27 = muldiv xi26 x two_pow_precision in let res27 = let fac = Uint256 797448960 in muladd xi27 fac res26 in
    
    let xi28 = muldiv xi27 x two_pow_precision in let res28 = let fac = Uint256 28480320 in muladd xi28 fac res27 in
    
    let xi29 = muldiv xi28 x two_pow_precision in let res29 = let fac = Uint256 982080 in muladd xi29 fac res28 in
    
    let xi30 = muldiv xi29 x two_pow_precision in let res30 = let fac = Uint256 32736 in muladd xi30 fac res29 in
    
    let xi31 = muldiv xi30 x two_pow_precision in let res31 = let fac = Uint256 1056 in muladd xi31 fac res30 in
    
    let xi32 = muldiv xi31 x two_pow_precision in let res32 = let fac = Uint256 33 in muladd xi32 fac res31 in
    
    let xi33 = muldiv xi32 x two_pow_precision in let res33 = let fac = Uint256 1 in muladd xi33 fac res32 in

let fac33 = Uint256 8683317618811886495518194401280000000 in
let res_div_fac33 = builtin div res33 fac33 in
let x_add_two_pow_precision = builtin add x two_pow_precision in
builtin add res_div_fac33 x_add_two_pow_precision

let power: Uint256 -> Uint256 -> Uint256 -> Uint256 -> PowerResultAndPrecision =
    fun(in_baseN: Uint256) => fun(in_baseD: Uint256) => fun(in_expN: Uint256) => fun(in_expD: Uint256) =>
    let is_smaller = panic_if_uint256_not_lt_uint256 in_baseN c_MAX_NUM in
    let base = muldiv in_baseN c_FIXED_1 in_baseD in
    let baseLog = log base in
    let baseLogTimesExp = muldiv baseLog in_expN in_expD in
    
    let baseLogTimesExp_lt_max_val = uint256_lt baseLogTimesExp c_OPT_EXP_MAX_VAL in
    match baseLogTimesExp_lt_max_val with
    | True =>
        let exp_res = optimalExp baseLogTimesExp in
        PowerResultAndPrecision exp_res c_MAX_PRECISION 
    | False =>
        let precision = findPositionInMaxExpArray baseLogTimesExp in
        let max_sub_precision = builtin sub c_MAX_PRECISION precision in
        let two_pow_max_sub_precision = pow_uint256 two_uint256 max_sub_precision in
        let baseLogTimesExpShifted = builtin div baseLogTimesExp two_pow_max_sub_precision in
        let exp_res = generalExp baseLogTimesExpShifted precision in
        PowerResultAndPrecision exp_res precision
    end

    


contract BancorFormula()

procedure ThrowError(err : Error)
  e = make_error err;
  throw e
end

procedure AssertNotZero(value: Uint256)
    is_zero = builtin eq zero_uint256 value;
    match is_zero with
    | False => 
    | True => e = CodeInputIsZero; ThrowError e
    end
end

procedure AssertIsLE(i1: Uint256, i2: Uint256)
    is_le = uint256_le i1 i2;
    match is_le with
    | False => e = CodeInputNotInBounds; ThrowError e
    | True =>
    end
end

procedure SendCalculatePurchaseReturnCallback(result: Uint128)
    msg = let m = {
        _tag: "CalculatePurchaseReturnCallback";
        _recipient: _sender;
        _amount: zero_uint128;
        result: result
    } in one_msg m;
    send msg
end

transition CalculatePurchaseReturn(in_supply: Uint128, in_connector_balance: Uint128, in_connector_weight: Uint128, in_deposit_amount: Uint128)
    
    supply = uint128_to_uint256 in_supply;
    connector_balance = uint128_to_uint256 in_connector_balance;
    connector_weight = uint128_to_uint256 in_connector_weight;
    deposit_amount = uint128_to_uint256 in_deposit_amount;
    
    AssertNotZero supply;
    AssertNotZero connector_balance;
    AssertNotZero connector_weight;
    AssertIsLE connector_weight c_MAX_WEIGHT;
    deposit_is_zero = builtin eq deposit_amount zero_uint256;
    match deposit_is_zero with
    | True =>
        
        SendCalculatePurchaseReturnCallback zero_uint128
    | False =>
        connector_weight_is_c_MAX_WEIGHT = builtin eq connector_weight c_MAX_WEIGHT;
        match connector_weight_is_c_MAX_WEIGHT with
        | True =>
            
            result_uint256 = muldiv supply deposit_amount connector_balance;
            result = uint256_to_uint128 result_uint256;
            SendCalculatePurchaseReturnCallback result
        | False =>
            baseN = builtin add deposit_amount connector_balance;
            power_result_and_precision = power baseN connector_balance connector_weight c_MAX_WEIGHT;
            match power_result_and_precision with
            | PowerResultAndPrecision power_result precision =>
                two_pow_precision = pow_uint256 two_uint256 precision;
                tmp = muldiv supply power_result two_pow_precision;
                result_uint256 = builtin sub tmp supply;
                result = uint256_to_uint128 result_uint256;
                SendCalculatePurchaseReturnCallback result
            end
        end
    end
end

procedure SendCalculateSaleReturnCallback(result: Uint128)
    msg = let m = {
        _tag: "CalculateSaleReturnCallback";
        _recipient: _sender;
        _amount: zero_uint128;
        result: result
    } in one_msg m;
    send msg
end

transition CalculateSaleReturn(in_supply: Uint128, in_connector_balance: Uint128, in_connector_weight: Uint128, in_sell_amount: Uint128)
    
    supply = uint128_to_uint256 in_supply;
    connector_balance = uint128_to_uint256 in_connector_balance;
    connector_weight = uint128_to_uint256 in_connector_weight;
    sell_amount = uint128_to_uint256 in_sell_amount;
    
    AssertNotZero supply;
    AssertNotZero connector_balance;
    AssertNotZero connector_weight;
    AssertIsLE connector_weight c_MAX_WEIGHT;
    AssertIsLE sell_amount supply;
    sell_is_zero = builtin eq sell_amount zero_uint256;
    match sell_is_zero with
    | True =>
        
        SendCalculateSaleReturnCallback zero_uint128
    | False =>
        selling_entire_supply = builtin eq sell_amount supply;
        match selling_entire_supply with
        | True => SendCalculateSaleReturnCallback in_connector_balance 
        | False =>
            connector_weight_is_c_MAX_WEIGHT = builtin eq connector_weight c_MAX_WEIGHT;
            match connector_weight_is_c_MAX_WEIGHT with
            | True =>
                
                result_uint256 = muldiv connector_balance sell_amount supply;
                result = uint256_to_uint128 result_uint256;
                SendCalculateSaleReturnCallback result
            | False =>
                baseD = builtin sub supply sell_amount;
                power_result_and_precision = power supply baseD c_MAX_WEIGHT connector_weight;
                match power_result_and_precision with
                | PowerResultAndPrecision power_result precision =>
                    two_pow_precision = pow_uint256 two_uint256 precision;
                    temp1 = builtin mul connector_balance power_result;
                    temp2 = builtin mul connector_balance two_pow_precision;
                    temp1_sub_temp2 = builtin sub temp1 temp2;
                    result_uint256 = builtin div temp1_sub_temp2 power_result;
                    result = uint256_to_uint128 result_uint256;
                    SendCalculateSaleReturnCallback result
                end
            end
        end
    end
end

procedure SendCalculateCrossConnectorReturnCallback(result: Uint128)
    msg = let m = {
        _tag: "CalculateCrossConnectorReturn";
        _recipient: _sender;
        _amount: zero_uint128;
        result: result
    } in one_msg m;
    send msg
end

transition CalculateCrossConnectorReturn(in_from_connector_balance: Uint128, in_from_connector_weight: Uint128, in_to_connector_balance: Uint128, in_to_connector_weight: Uint128, in_amount: Uint128)
    
    from_connector_balance = uint128_to_uint256 in_from_connector_balance;
    from_connector_weight = uint128_to_uint256 in_from_connector_weight;
    to_connector_balance = uint128_to_uint256 in_to_connector_balance;
    to_connector_weight = uint128_to_uint256 in_to_connector_weight;
    amount = uint128_to_uint256 in_amount;
    
    AssertNotZero from_connector_balance;
    AssertNotZero from_connector_weight;
    AssertIsLE from_connector_weight c_MAX_WEIGHT;
    AssertNotZero to_connector_balance;
    AssertNotZero to_connector_weight;
    AssertIsLE to_connector_weight c_MAX_WEIGHT;

    weights_equal = builtin eq to_connector_weight from_connector_weight;
    match weights_equal with
    | True =>
        from_connector_balance_add_amount = builtin add from_connector_balance amount;
        result_uint256 = muldiv to_connector_balance amount from_connector_balance_add_amount;
        result = uint256_to_uint128 result_uint256;
        SendCalculateCrossConnectorReturnCallback result
    | False =>
        baseN = builtin add from_connector_balance amount;
        power_result_and_precision = power baseN from_connector_balance from_connector_weight to_connector_weight;
        match power_result_and_precision with
        | PowerResultAndPrecision power_result precision =>
            two_pow_precision = pow_uint256 two_uint256 precision;
            temp1 = builtin mul to_connector_balance power_result;
            temp2 = builtin mul to_connector_balance two_pow_precision;
            temp1_sub_temp2 = builtin sub temp1 temp2;
            result_uint256 = builtin div temp1_sub_temp2 power_result;
            result = uint256_to_uint128 result_uint256;
            SendCalculateCrossConnectorReturnCallback result
        end 
    end
end
`;
export const deploy = () => {
  const initData = [
    {
      type: `Uint32`,
      vname: `_scilla_version`,
      value: "0",
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
 * 2021-08-22T17:34:32.735Z
 */
export const hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 =
  (a: T.ByStr20) => ({
    state: () => ({
      get: async function (field: string) {
        const zil = getZil();
        return (
          await zil.blockchain.getSmartContractSubState(a.toSend(), field)
        ).result;
      },
      log: async function (field: string | "_balance") {
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
      CalculatePurchaseReturn: (
        __in_supply: T.Uint128,
        __in_connector_balance: T.Uint128,
        __in_connector_weight: T.Uint128,
        __in_deposit_amount: T.Uint128
      ) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `CalculatePurchaseReturn`,
          data: [
            {
              type: `Uint128`,
              vname: `in_supply`,
              value: __in_supply.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_connector_balance`,
              value: __in_connector_balance.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_connector_weight`,
              value: __in_connector_weight.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_deposit_amount`,
              value: __in_deposit_amount.toSend(),
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
            log.txLink(tx, "CalculatePurchaseReturn");
            return tx;
          },
        };
      },

      CalculateSaleReturn: (
        __in_supply: T.Uint128,
        __in_connector_balance: T.Uint128,
        __in_connector_weight: T.Uint128,
        __in_sell_amount: T.Uint128
      ) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `CalculateSaleReturn`,
          data: [
            {
              type: `Uint128`,
              vname: `in_supply`,
              value: __in_supply.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_connector_balance`,
              value: __in_connector_balance.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_connector_weight`,
              value: __in_connector_weight.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_sell_amount`,
              value: __in_sell_amount.toSend(),
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
            log.txLink(tx, "CalculateSaleReturn");
            return tx;
          },
        };
      },

      CalculateCrossConnectorReturn: (
        __in_from_connector_balance: T.Uint128,
        __in_from_connector_weight: T.Uint128,
        __in_to_connector_balance: T.Uint128,
        __in_to_connector_weight: T.Uint128,
        __in_amount: T.Uint128
      ) => {
        const transactionData = {
          contractSignature,
          contractAddress: a.toSend(),
          contractTransitionName: `CalculateCrossConnectorReturn`,
          data: [
            {
              type: `Uint128`,
              vname: `in_from_connector_balance`,
              value: __in_from_connector_balance.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_from_connector_weight`,
              value: __in_from_connector_weight.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_to_connector_balance`,
              value: __in_to_connector_balance.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_to_connector_weight`,
              value: __in_to_connector_weight.toSend(),
            },
            {
              type: `Uint128`,
              vname: `in_amount`,
              value: __in_amount.toSend(),
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
            log.txLink(tx, "CalculateCrossConnectorReturn");
            return tx;
          },
        };
      },
    }),
  });
