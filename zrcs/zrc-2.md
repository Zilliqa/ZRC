| ZRC | Title                        | Status      | Type     | Author                                                                               | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------ | -------------------- | -------------------- |
| 2   | Standard for Fungible Tokens | Implemented | Standard | Vaivaswatha Nagaraj <vaivaswatha@zilliqa.com> <br> Chua Han Wen <hanwen@zilliqa.com> | 2019-11-18           | 2024-08-27           |

## I. What are Fungible Tokens?

The Fungible Token is an open standard for creating currencies. Fungibility is the property of goods or commodities whose individual units are essentially interchangeable, and each of its parts is indistinguishable from another part.

## II. Abstract

ZRC-2 defines a minimum interface that a smart contract must implement to allow fungible tokens to be managed, tracked, owned, and traded peer-to-peer via wallets or exchanges.

## III. Motivation

A standard for fungible tokens can serve as an interface for developers to create currencies, utility tokens or stable coins. Generally, fungible tokens can be used to represent interchangeable, identical and divisible assets as tokens.

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
| `CodeNotOwner`              | `Int32` | `-4` | Emit when the sender is not contract_owner. This error code is optional.                       |
| `CodeNotApprovedOperator`   | `Int32` | `-5` | Emit when caller is not an approved operator or default_operator. This error code is optional. |

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
(* @dev: Burn existing tokens. Only the owner of the tokens can burn.             *)
(* @param burn_account: Address of the token_owner whose balance is to decrease.  *)
(* @param amount:       Number of tokens to be burned.                            *)
transition Burn(amount: Uint128)
```

**Arguments:**

|        | Name           | Type      | Description                                              |
| ------ | -------------- | --------- | -------------------------------------------------------- |
| @param | `amount`       | `Uint128` | Number of tokens to be burned.                           |

**Messages sent:**

|        | Name                  | Description                                | Callback Parameters                                                                                                                                                                                                                     |
| ------ | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `BurnSuccessCallBack` | Provide the sender the status of the burn. | `burner` : `ByStr20`, `amount`: `Uint128`, where `burner` is the address of the burner, and `amount` is the amount of fungible tokens burned. |

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
| `_tag` | `TransferFromSuccessCallBack` | Provide the initiator the status of the transfer.     | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

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
| `_tag` | `OperatorSendSuccessCallBack` | Provide the operator the status of the transfer.      | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an operator,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events/Errors:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                           |
| ------------ | --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `OperatorSendSuccess` | Sending is successful.     | `initiator`: `ByStr20` which is the operator's address, `sender`: `ByStr20` which is the token_owner's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeNotApprovedOperator` if sender is not an approved operator for the token_owner <br> - emit `CodeInsufficientFunds` if the balance of the token_owner is lesser than the specified amount that is to be transferred.                            |

## V. Existing Implementation(s)

- [ZRC2 Reference contract](../reference-contracts/FungibleToken.scilla)
- [ZRC2-Mintable Reference contract](../reference-contracts/FungibleToken-Mintable.scilla)
- [ZRC2-Operator Reference contract](../reference-contracts/FungibleToken-Operator.scilla)

To test the reference contract, simply go to the [`example`](../example) folder and run one of the JS scripts. For example, to deploy the contract, run:

```shell
yarn deploy.js
```

> **NOTE:** Please change the `privkey` in the script to your own private key. You can generate a testnet wallet and request for testnet \$ZIL at the [Nucleus Faucet](https://dev-wallet.zilliqa.com/home).

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
