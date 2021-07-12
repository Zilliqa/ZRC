| ZRC | Title                        | Status   | Type     | Author                                                                               | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------- | -------- | -------- | ------------------------------------------------------------------------------------ | -------------------- | -------------------- |
| 3   | Standard for Metatransactions | Draft | Standard | Cameron Sajedi <cameron@starlingfoundries.com> | 2019-10-15           | 2021-06-29           |

## I. What are Metatransactions?

[The concept of metatransactions](https://medium.com/builders-of-zilliqa/zrc3s-grand-rewrite-22558797ea0) is intended to allow wallets to sign incomplete transactions that represent the authorization to spend a certain amount of tokens. These are valuable to users who do not wish to go through KYC, etc to get a trivial amount of ZIL in order to pay for a transaction. Developers may choose to include this pattern to give an easier onboarding UX, or also to enable transactions to be paid for in the native token. This standard includes an example of ZRC-2 integrated with metatransactions, but there are many situations where authorizing an effect via a signed message is valuable.  The drawback is a metatransaction cannot easily be cancelled, so signers of metatransactions should view them as transactions that have already been processed, and if the relayer censors them they should re-send the same exact metatransaction to another relayer to void the original censored transaction.

## II. Abstract

ZRC-3 defines a basic supplement to another contract with the ability to perform transitions with metatransactions. In this provided standard we build on ZRC-2 to enable metatransaction transfers. 

## III. Motivation
Metatransactions provide an alternative flow for users just getting started with their cryptocurrency and wallets. It allows for gasless transactions, cutting out the barrier of getting ZIL from an exchange or via mining before a Dapp user can interact with the smart contract. 
It can also be seen as a way to defer the processing of transactions or even to guard a transition that requires multiparty authorization, although those applications are left to implementations and future standards. This contract adds a `metatransfer` transition to the existing ZRC-2. It does this in a way that maintains compatibility with the Operator and Mintable variants of ZRC-2 as well as the Zilswap exchange, and hopefully future OpFi tools.
## IV. Specification

The fungible token contract specification describes:

1. the global error codes to be declared in the library part of the contract;
2. the names and types of the immutable and mutable variables (aka `fields`);
3. the transitions that will allow the changing of values of the mutable variables;
4. the events to be emitted by them.

### A. Roles

| Name               | Description                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `contract_owner`   | The owner of the contract initialized by the creator of the contract.                                                                                  |
| `token_owner`      | A user (identified by an address) that owns tokens.                                                                                                    |
| `approved_spender` | A user (identified by an address) that can transfer tokens on behalf of the token_owner.                                                               |
| `operator`         | A user (identified by an address) that is approved to operate all tokens owned by another user (identified by another address). This role is optional. |
| `default_operator` | A special user (identified by an address) that is approved to operate all tokens owned by all users (identified by addresses). This role is optional.  |

### B. Error Codes

The fungible token contract must define the following constants for use as error codes for the `Error` exception.

| Name                        | Type    | Code | Description                                                                                    |
| --------------------------- | ------- | ---- | ---------------------------------------------------------------------------------------------- |
| `CodeIsSender`              | `Int32` | `-1` | Emit when an address is same as is the sender.                                                 |
| `CodeInsufficientFunds`     | `Int32` | `-2` | Emit when there is insufficient balance to authorise transaction.                              |
| `CodeInsufficientAllowance` | `Int32` | `-3` | Emit when there is insufficient allowance to authorise transaction.                            |
| `CodeChequeVoid`            | `Int32` | `-4` | Emit when the metatransaction cheque is improperly formed.                                     |
| `CodeSignatureInvalid`      | `Int32` | `-5` | Emit when a metatransaction signature does not match the cheque parameters.                    |
| `CodeInvalidSigner`      | `Int32` | `-6` | Emit when a metatransaction signer is not the owner of the tokens they try to move. |
| `CodeNotOwner`              | `Int32` | `-7` | Emit when the sender is not contract_owner. This error code is optional.                       |
| `CodeNotApprovedOperator`   | `Int32` | `-8` | Emit when caller is not an approved operator or default_operator. This error code is optional. |


### C. Immutable Variables

| Name                | Type           | Description                                                                                                    |
| ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `contract_owner`    | `ByStr20`      | The owner of the contract initialized by the creator of the contract.                                          |
| `name`              | `String`       | The name of the fungible token.                                                                                |
| `symbol`            | `String`       | The symbol of the fungible token.                                                                              |
| `decimals`          | `Uint32`       | The number of decimal places a token can be divided by.                                                        |
| `init_supply`       | `Uint128`      | The initial supply of fungible tokens when contract is created.                                                |
| `default_operators` | `List ByStr20` | The list of default operators initialized by the creator of the contract. This immutable variable is optional. |

### D. Mutable Fields

| Name                        | Type                                | Description                                                                                                                                                                                                                                            |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `total_supply`              | `Uint128`                           | Total amount of tokens available.                                                                                                                                                                                                                      |
| `balances`                  | `Map ByStr20 Uint128`               | Mapping between token owner to number of owned tokens.                                                                                                                                                                                                 |
| `allowances`                | `Map ByStr20 (Map ByStr20 Uint128)` | Mapping from token owner to approved spender address. Token owner can give an address an allowance of tokens to transfer tokens to other addresses.                                                                                                    |
| `operators`                 | `Map ByStr20 (Map ByStr20 Unit)`    | Mapping from token owner to designated operators. A token owner can approve an address as an operator (as per the definition of operator given above). This mapping is optional.                                                                       |
| `revoked_default_operators` | `Map ByStr20 (Map ByStr20 Unit)`    | Mapping from token owner to revoked default operators. Default operators are intialised by the contract owner. A token owner can revoked a default operator (as per the definition of default operator given above) at will. This mapping is optional. |
| `void_cheques` | `Map ByStr ByStr20` | Mapping of the hashes of the metatransaction that has been processed, and the relayer wallet that submitted it to the chain. |

### E. Getter Transitions

#### 1. IsOperatorFor() (Optional)

```ocaml
(* @dev: Check if an address is an operator or default operator of a token_owner. Throw if not. *)
(* @param operator:    Address of a potential operator.                                         *)
(* @param token_owner: Address of a token_owner.                                                *)
transition IsOperatorFor(token_owner: ByStr20, operator: ByStr20)
```

**Arguments:**

|        | Name          | Type      | Description                                           |
| ------ | ------------- | --------- | ----------------------------------------------------- |
| @param | `token_owner` | `ByStr20` | An address of a particular token_owner.               |
| @param | `operator`    | `ByStr20` | An address of a particular operator of a token_owner. |

**Messages sent:**

|        | Name                    | Description                                                                                                 | Callback Parameters                                                                                                                                          |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `IsOperatorForCallBack` | Provide the sender a callback if specified address is indeed an approved operator of specified token_owner. | `token_owner` : `ByStr20`, `operator`: `ByStr20`, where `token_owner` is the address of the token_owner, `operator` is the address of the approved operator. |

### F. Interface Transitions

#### 1. Mint() (Optional)

```ocaml
(* @dev: Mint new tokens. Only contract_owner can mint.                      *)
(* @param recipient: Address of the recipient whose balance is to increase.  *)
(* @param amount:    Number of tokens to be minted.                          *)
transition Mint(recipient: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name        | Type      | Description                                            |
| ------ | ----------- | --------- | ------------------------------------------------------ |
| @param | `recipient` | `ByStr20` | Address of the recipient whose balance is to increase. |
| @param | `amount`    | `Uint128` | Number of tokens to be minted.                         |

**Messages sent:**

|        | Name                  | Description                                           | Callback Parameters                                                                                                                                                                                                |
| ------ | --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract. | `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `minter` is the address of the minter, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens minted. |
| `_tag` | `MintSuccessCallBack` | Provide the sender the status of the mint.            | `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `minter` is the address of the minter, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens minted. |

**Events/Errors:**

|              | Name     | Description                | Event Parameters                                                                                                                                                                                                                  |
| ------------ | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Minted` | Minting is successful.     | `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `minter` is the address of the minter, `recipient` is the address whose balance will be increased, and `amount` is the amount of fungible tokens minted. |
| `_eventname` | `Error`  | Minting is not successful. | - emit `CodeNotOwner` if the transition is not called by the contract_owner.                                                                                                                                                      |

#### 2. Burn() (Optional)

```ocaml
(* @dev: Burn existing tokens. Only contract_owner can burn.                      *)
(* @param burn_account: Address of the token_owner whose balance is to decrease.  *)
(* @param amount:       Number of tokens to be burned.                            *)
transition Burn(burn_account: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name           | Type      | Description                                              |
| ------ | -------------- | --------- | -------------------------------------------------------- |
| @param | `burn_account` | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `amount`       | `Uint128` | Number of tokens to be burned.                           |

**Messages sent:**

|        | Name                  | Description                                | Callback Parameters                                                                                                                                                                                                                     |
| ------ | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `BurnSuccessCallBack` | Provide the sender the status of the burn. | `burner` : `ByStr20`, `burn_account`: `ByStr20`, `amount`: `Uint128`, where `burner` is the address of the burner, `burn_account` is the address whose balance will be decreased, and `amount` is the amount of fungible tokens burned. |

**Events/Errors:**

|              | Name    | Description                | Event Parameters                                                                                                                                                                                                                                                |
| ------------ | ------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Burnt` | Burning is successful.     | `burner` : `ByStr20`, `burn_account`: `ByStr20`, `amount`: `Uint128`, where `burner` is the address of the burner, `burn_account` is the address whose balance will be decreased, and `amount` is the amount of fungible tokens burned.                         |
| `_eventname` | `Error` | Burning is not successful. | - emit `CodeNotOwner` if the transition is not called by the contract_owner. <br> - emit `CodeNoBalance` if balance of token_owner does not exists. <br> - emit `CodeInsufficientFunds` if the amount to be burned is more than the balance of the token_owner. |

#### 3. AuthorizeOperator() (Optional)

```ocaml
(* @dev: Make an address an operator of the caller.             *)
(* @param operator: Address to be authorize as operator or      *)
(* Re-authorize as default_operator. Cannot be calling address. *)
transition AuthorizeOperator(operator: ByStr20)
```

**Arguments:**

|        | Name       | Type      | Description                                                                                         |
| ------ | ---------- | --------- | --------------------------------------------------------------------------------------------------- |
| @param | `operator` | `ByStr20` | Address to be authorize as operator or re-authorize as default_operator. Cannot be calling address. |

**Events/Errors:**

|              | Name                       | Description                    | Event Parameters                                                                                                                                                     |
| ------------ | -------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AuthorizeOperatorSuccess` | Authorizing is successful.     | `authorizer`: `ByStr20` which is the caller's address, and `authorized_operator`: `ByStr20` which is the address to be authorized as an operator of the token_owner. |
| `_eventname` | `Error`                    | Authorizing is not successful. | - emit `CodeIsSender` if the user is trying to authorize himself as an operator.                                                                                     |

#### 4. RevokeOperator() (Optional)

```ocaml
(* @dev: Revoke an address from being an operator or default_operator of the caller. *)
(* @param operator: Address to be removed as operator or default_operator.           *)
transition RevokeOperator(operator: ByStr20)
```

**Arguments:**

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `operator` | `ByStr20` | Address to be unset as operator. |

**Events/Errors:**

|              | Name                    | Description                 | Event Parameters                                                                                                                                            |
| ------------ | ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RevokeOperatorSuccess` | Revoking is successful.     | `revoker`: `ByStr20` which is the caller's address, and `revoked_operator`: `ByStr20` which is the address to be removed as an operator of the token_owner. |
| `_eventname` | `Error`                 | Revoking is not successful. | - emit `CodeNotApprovedOperator` if the specified address is not an existing operator or default_operator of the token_owner.                               |

#### 5. IncreaseAllowance()

```ocaml
(* @dev: Increase the allowance of an approved_spender over the caller tokens. Only token_owner allowed to invoke.   *)
(* param spender:      Address of the designated approved_spender.                                                   *)
(* param amount:       Number of tokens to be increased as allowance for the approved_spender.                       *)
transition IncreaseAllowance(spender: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name      | Type      | Description                                                                     |
| ------ | --------- | --------- | ------------------------------------------------------------------------------- |
| @param | `spender` | `ByStr20` | Address of an approved_spender.                                                 |
| @param | `amount`  | `Uint128` | Number of tokens to be increased as spending allowance of the approved_spender. |

**Events/Errors:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                  |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `IncreasedAllowance` | Increasing of allowance of an approved_spender is successful. | `token_owner`: `ByStr20` which is the address the token_owner, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowance` is the new spending allowance of the approved_spender for the token_owner. |
| `_eventname` | `Error`              | Increasing of allowance is not successful.                    | - emit `CodeIsSelf` if the user is trying to authorize himself as an approved_spender.                                                                                                                                                            |

#### 6. DecreaseAllowance()

```ocaml
(* @dev: Decrease the allowance of an approved_spender over the caller tokens. Only token_owner allowed to invoke. *)
(* param spender:      Address of the designated approved_spender.                                                 *)
(* param amount:       Number of tokens to be decreased as allowance for the approved_spender.                     *)
transition DecreaseAllowance(spender: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name      | Type      | Description                                                                     |
| ------ | --------- | --------- | ------------------------------------------------------------------------------- |
| @param | `spender` | `ByStr20` | Address of an approved_spender.                                                 |
| @param | `amount`  | `Uint128` | Number of tokens to be decreased as spending allowance of the approved_spender. |

**Events/Errors:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                  |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `DecreasedAllowance` | Decreasing of allowance of an approved_spender is successful. | `token_owner`: `ByStr20` which is the address the token_owner, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowance` is the new spending allowance of the approved_spender for the token_owner. |
| `_eventname` | `Error`              | Decreasing of allowance is not successful.                    | - emit `CodeIsSelf` if the user is trying to authorize himself as an approved_spender.                                                                                                                                                            |

#### 7. Transfer()

```ocaml
(* @dev: Moves an amount tokens from _sender to the recipient. Used by token_owner. *)
(* @dev: Balance of recipient will increase. Balance of _sender will decrease.      *)
(* @param to:  Address of the recipient whose balance is increased.                 *)
(* @param amount:     Amount of tokens to be sent.                                  *)
transition Transfer(to: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                            |
| ------ | -------- | --------- | ------------------------------------------------------ |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase. |
| @param | `amount` | `Uint128` | Amount of tokens to be sent.                           |

**Messages sent:**

|        | Name                      | Description                                           | Callback Parameters                                                                                                                                                                                                           |
| ------ | ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptTransfer` | Dummy callback to prevent invalid recipient contract. | `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `sender` is the address of the sender, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_tag` | `TransferSuccessCallBack` | Provide the sender the status of the transfer.        | `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `sender` is the address of the sender, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events/Errors:**

|              | Name              | Description                | Event Parameters                                                                                                                                                                        |
| ------------ | ----------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferSuccess` | Sending is successful.     | `sender`: `ByStr20` which is the sender's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens transferred. |
| `_eventname` | `Error`           | Sending is not successful. | - emit `CodeInsufficientFunds` if the balance of the token_owner lesser than the specified amount that is to be transferred.                                                            |

#### 8. TransferFrom()

```ocaml
(* @dev: Move a given amount of tokens from one address to another using the allowance mechanism. The caller must be an approved_spender. *)
(* @dev: Balance of recipient will increase. Balance of token_owner will decrease.                                                        *)
(* @param from:    Address of the token_owner whose balance is decreased.                                                                 *)
(* @param to:      Address of the recipient whose balance is increased.                                                                   *)
(* @param amount:  Amount of tokens to be transferred.                                                                                    *)
transition TransferFrom(from: ByStr20, to: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                              |
| ------ | -------- | --------- | -------------------------------------------------------- |
| @param | `from`   | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase.   |
| @param | `amount` | `Uint128` | Number of tokens to be transferred.                      |

**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `RecipientAcceptTransferFrom` | Dummy callback to prevent invalid recipient contract. | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_tag` | `TransferFromSuccessCallBack` | Provide the initiator the status of the transfer.        | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                                                                             |
| ------------ | --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `TransferFromSuccess` | Sending is successful.     | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeInsufficientAllowance` if the allowance of approved_spender is lesser than the specified amount that is to be transferred. <br> - emit `CodeInsufficientFunds` if the balance of the token_owner lesser than the specified amount that is to be transferred.                                     |

#### 9. OperatorSend() (Optional)

```ocaml
(* @dev: Moves amount tokens from token_owner to recipient. _sender must be an operator of token_owner. *)
(* @dev: Balance of recipient will increase. Balance of token_owner will decrease.                      *)
(* @param from:        Address of the token_owner whose balance is decreased.                           *)
(* @param to:          Address of the recipient whose balance is increased.                             *)
(* @param amount:      Amount of tokens to be sent.                                                     *)
transition OperatorSend(from: ByStr20, to: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                              |
| ------ | -------- | --------- | -------------------------------------------------------- |
| @param | `from`   | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase.   |
| @param | `amount` | `Uint128` | Amount of tokens to be sent.                             |

**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptOperatorSend` | Dummy callback to prevent invalid recipient contract. | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an operator,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_tag` | `OperatorSendSuccessCallBack` | Provide the operator the status of the transfer.        | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an operator,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events/Errors:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                           |
| ------------ | --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `OperatorSendSuccess` | Sending is successful.     | `initiator`: `ByStr20` which is the operator's address, `sender`: `ByStr20` which is the token_owner's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeNotApprovedOperator` if sender is not an approved operator for the token_owner <br> - emit `CodeInsufficientFunds` if the balance of the token_owner is lesser than the specified amount that is to be transferred.                            |

#### 10. ChequeSend()

```ocaml
(* @dev: Moves amount tokens from token_owner to recipient.                                             *)
(* @dev: Balance of recipient will increase. Balance of token_owner will decrease.                      *)
(* @param pubkey:      Public Key of the token_owner whose balance is decreased.                        *)
(* @param to:          Address of the recipient whose balance is increased.                             *)
(* @param amount:      Amount of tokens to be sent.                                                     *)
(* @param fee:         Reward taken from the cheque senders balance for the relayer.                    *)
(* @param nonce:       A random value included in the cheque to make each unique.                       *)
(* @param signature:   The signature of the cheque by the token owner to authorize spend.               *)
transition ChequeSend(pubkey: ByStr20, to: ByStr20, amount: Uint128, fee: Uint128, nonce:Uint218, signature: ByStr64)
```

**Arguments:**

|        | Name       | Type      | Description                                                        |
| ------ | --------   | --------- | --------------------------------------------------------           |
| @param | `pubkey`   | `ByStr33` | Public Key of the token_owner whose balance is to decrease.        |
| @param | `to`       | `ByStr20` | Address of the recipient whose balance is to increase.             |
| @param | `amount`   | `Uint128` | Amount of tokens to be sent.                                       |
| @param | `fee`      | `Uint128` | Reward taken from the cheque senders balance for the relayer.      |
| @param | `nonce`    | `Uint128` | A random value included in the cheque to make each unique.         |
| @param | `signature`| `ByStr64` | The signature of the cheque by the token owner to authorize spend. |
**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptChequeSend` | Dummy callback to prevent invalid recipient contract. | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an operator,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_tag` | `ChequeSendSuccessCallBack` | Provide the relayer the status of the transfer.        | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an relayer,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events/Errors:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                           |
| ------------ | --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `ChequeSendSuccess` | Sending is successful.     | `initiator`: `ByStr20` which is the operator's address, `sender`: `ByStr20` which is the token_owner's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeChequeVoid` if the cheque submitted has already been transferred.<br>- emit `CodeInsufficientFunds` if the balance of the token_owner is lesser than the specified amount that is to be transferred.<br> - emit `CodeSignatureInvalid` if the signature of the cheque does not match the cheque parameters. <br> - emit `CodeInvalidSigner` if the signer of the metatransaction is not the owner of the tokens to be moved.  |

#### 11. ChequeVoid() (Optional)

```ocaml

(* @dev: Voids a cheque that _sender does not wish to be processed                                      *)
(* @dev: Balance of recipient will remain the same.                                                     *)
(* @param pubkey:      Public Key of the token_owner within the cheque.                                 *)
(* @param to:          Address of the recipient within the cheque.                                      *)
(* @param amount:      Amount of tokens which would have been sent within the cheque.                   *)
(* @param fee:         Reward to be taken from the cheque senders balance if the cheque was processed.  *)
(* @param nonce:       A random value included in the cheque to make each unique.                       *)
(* @param signature:   The signature of the cheque by the token owner that authorized the spend.        *)
transition ChequeVoid(pubkey: ByStr33, from: ByStr20, to: ByStr20, amount: Uint128, fee: Uint128, nonce:Uint128, signature: ByStr64)
```

**Arguments:**

|        | Name       | Type      | Description                                                        |
| ------ | --------   | --------- | --------------------------------------------------------           |
| @param | `pubkey`   | `ByStr33` | Public Key of the token_owner within the cheque.         |
| @param | `to`       | `ByStr20` | Address of the recipient within the cheque.             |
| @param | `amount`   | `Uint128` |  Amount of tokens which would have been sent within the cheque.                                       |
| @param | `fee`      | `Uint128` | Reward to be taken from the cheque senders balance if the cheque was processed.      |
| @param | `nonce`    | `Uint128` | A random value included in the cheque to make each unique.         |
| @param | `signature`| `ByStr64` | The signature of the cheque by the token owner that authorized the spend. |
**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Events/Errors:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                           |
| ------------ | --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `ChequeVoidSuccess` | Broadcast if voiding is successful.     | `initiator`: `ByStr20` which is the operator's address, `sender`: `ByStr20` which is the token_owner's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeChequeVoid` if the cheque submitted has already been transferred.<br>- emit `CodeInsufficientFunds` if the balance of the token_owner is lesser than the specified amount that is to be transferred.<br> - emit `CodeSignatureInvalid` if the signature of the cheque does not match the cheque parameters. <br> - emit `CodeInvalidSigner` if the signer of the metatransaction is not the owner of the tokens to be moved.  |

## V. Existing Implementation(s)

- [ZRC3 Reference contract](../reference/MetaFungibleToken.scilla)
- [ZRC3 Reference Relayer ](https://github.com/starling-foundries/relay.js)
To test the reference contract, simply go to the [`example`](../example) folder and run one of the JS scripts. For example, to deploy the contract, run:

```shell
yarn deploy.js
```

> **NOTE:** Please change the `privkey` in the script to your own private key. You can generate a testnet wallet and request for testnet \$ZIL at the [Nucleus Faucet](https://dev-wallet.zilliqa.com/home).

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
