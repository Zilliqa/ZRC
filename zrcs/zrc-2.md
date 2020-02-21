| ZRC | Title                        | Status | Type  | Author                                                                                                                       | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Fungible Tokens | Draft  | Ready | Gareth Mensah <gareth@zilliqa.com> <br> Vaivaswatha Nagaraj <vaivaswatha@zilliqa.com> <br> Chua Han Wen <hanwen@zilliqa.com> | 2019-11-18           | 2020-02-12           |

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

| Name               | Description                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `contract_owner`   | The owner of the contract initialized by the creator of the contract.                                                           |
| `token_owner`      | A user (identified by an address) that owns tokens.                                                                             |
| `approved_spender` | A user (identified by an address) that can transfer tokens on behalf of the token_owner.                                        |
| `operator`         | A user (identified by an address) that is approved to operate all tokens owned by another user (identified by another address). |
| `default_operator` | A special user (identified by an address) that is approved to operate all tokens owned by all users (identified by addresses).  |

### B. Error Codes

The fungible token contract must define the following constants for use as error codes for the `Error` event.

| Name                    | Type    | Code | Description                                                       |
| ----------------------- | ------- | ---- | ----------------------------------------------------------------- |
| `CodeNotAuthorized`     | `Int32` | `-1` | Emit when the transition call is unauthorised for a given user.   |
| `CodeNotFound`          | `Int32` | `-2` | Emit when a requested value is missing.                           |
| `CodeInsufficientFunds` | `Int32` | `-3` | Emit when there is insufficient balance to authorise transaction. |

### C. Immutable Variables

| Name                | Type           | Description                                                               |
| ------------------- | -------------- | ------------------------------------------------------------------------- |
| `contract_owner`    | `ByStr20`      | The owner of the contract initialized by the creator of the contract.     |
| `name`              | `String`       | The name of the fungible token.                                           |
| `symbol`            | `String`       | The symbol of the fungible token.                                         |
| `decimals`          | `Uint32`       | The number of decimal places a token can be divided by.                   |
| `default_operators` | `List ByStr20` | The list of default operators initialized by the creator of the contract. |
| `init_supply`       | `Uint128`      | The initial supply of fungible tokens when contract is created.           |

### D. Mutable Fields

| Name                        | Type                                | Description                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `total_supply`              | `Uint128`                           | Total amount of tokens available.                                                                                                                                                                                            |
| `balances_map`              | `Map ByStr20 Uint128`               | Mapping between token owner to number of owned tokens.                                                                                                                                                                       |
| `operators_map`             | `Map ByStr20 (Map ByStr20 Unit)`    | Mapping from token owner to designated operators. A token owner can approve an address as an operator (as per the definition of operator given above).                                                                       |
| `revoked_default_operators` | `Map ByStr20 (Map ByStr20 Unit)`    | Mapping from token owner to revoked default operators. Default operators are intialised by the contract owner. A token owner can revoked a default operator (as per the definition of default operator given above) at will. |
| `allowances_map`            | `Map ByStr20 (Map ByStr20 Uint128)` | Mapping from token owner to approved spender address. Token owner can give an address an allowance of tokens to transfer tokens to other addresses.                                                                          |

### E. Getter Transitions

#### 1. IsOperatorFor()

```ocaml
(* @dev: Check if an address is an operator or default operator of a token_owner. Provide a Bool *)
(* @param operator:    Address of a potential operator.                                          *)
(* @param token_owner: Address of a token_owner.                                                 *)
transition IsOperatorFor(token_owner: ByStr20, operator: ByStr20)
```

**Arguments:**

|        | Name          | Type      | Description                                           |
| ------ | ------------- | --------- | ----------------------------------------------------- |
| @param | `token_owner` | `ByStr20` | An address of a particular token_owner.               |
| @param | `operator`    | `ByStr20` | An address of a particular operator of a token_owner. |

**Messages sent:**

|        | Name                    | Description                                                                                                                                             | Callback Parameters                                                                                                            |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `IsOperatorForCallBack` | Provide the sender a True or False statement depending on whether the operator address is indeed the an approved operator of the specified token_owner. | `is_operator_for` of type `Bool` representing the status of the operator as an approved operator of the specified token_owner. |

### F. Interface Transitions

#### 1. Mint() (Optional)

```ocaml
(* @dev: Optional transition. Mint new tokens. Only contract_owner can mint. *)
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
| `_tag` | `recipientAcceptMint` | Dummy callback to prevent invalid recipient contract. | `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `minter` is the address of the minter, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens minted. |
| `_tag` | `mintSuccessCallBack` | Provide the sender the status of the mint.            | `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `minter` is the address of the minter, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens minted. |

**Events:**

|              | Name     | Description                | Event Parameters                                                                                                                                                                                                                  |
| ------------ | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Minted` | Minting is successful.     | `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `minter` is the address of the minter, `recipient` is the address whose balance will be increased, and `amount` is the amount of fungible tokens minted. |
| `_eventname` | `Error`  | Minting is not successful. | - emit `CodeNotAuthorized` if the transition is not called by the contract_owner.                                                                                                                                                 |

#### 2. Burn() (Optional)

```ocaml
(* @dev: Optional transition. Burn existing tokens. Only contract_owner can burn. *)
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

**Events:**

|              | Name    | Description                | Event Parameters                                                                                                                                                                                                                        |
| ------------ | ------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Burnt` | Burning is successful.     | `burner` : `ByStr20`, `burn_account`: `ByStr20`, `amount`: `Uint128`, where `burner` is the address of the burner, `burn_account` is the address whose balance will be decreased, and `amount` is the amount of fungible tokens burned. |
| `_eventname` | `Error` | Burning is not successful. | - emit `CodeNotAuthorized` if the transition is not called by the contract_owner. <br> - emit `CodeInsufficientFunds` if the amount to be burned is more than the balance of the token_owner.                                           |

#### 3. AuthorizeOperator()

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

**Events:**

|              | Name                                 | Description                    | Event Parameters                                                                                                                                                                          |
| ------------ | ------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AuthorizeOperatorSuccess`           | Authorizing is successful.     | `authorizer`: `ByStr20` which is the caller's address, and `authorized_operator`: `ByStr20` which is the address to be authorized as an operator of the token_owner.                      |
| `_eventname` | `ReAuthorizedDefaultOperatorSuccess` | Authorizing is successful.     | `authorizer`: `ByStr20` which is the caller's address., and `reauthorized_default_operator`: `ByStr20` which is the address to be re-authorized as a default_operator of the token_owner. |
| `_eventname` | `Error`                              | Authorizing is not successful. | - emit `CodeNotAuthorized` if the user is trying to authorize himself as an operator.                                                                                                     |

#### 4. RevokeOperator()

```ocaml
(* @dev: Revoke an address from being an operator or default_operator of the caller. *)
(* @param operator: Address to be removed as operator or default_operator.           *)
transition RevokeOperator(operator: ByStr20)
```

**Arguments:**

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `operator` | `ByStr20` | Address to be unset as operator. |

**Events:**

|              | Name                            | Description                 | Event Parameters                                                                                                                                                                 |
| ------------ | ------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RevokeOperatorSuccess`         | Revoking is successful.     | `revoker`: `ByStr20` which is the caller's address, and `revoked_operator`: `ByStr20` which is the address to be removed as an operator of the token_owner.                      |
| `_eventname` | `RevokedDefaultOperatorSuccess` | Revoking is successful.     | `revoker`: `ByStr20` which is the caller's address, and `revoked_default_operator`: `ByStr20` which is the address to be removed as a default_operator of the token_owner.       |
| `_eventname` | `Error`                         | Revoking is not successful. | - emit `CodeNotAuthorized` if the user is trying to authorize himself as an operator. <br> - emit `CodeNotFound` if the specified address is not an operator of the token_owner. |

#### 5. IncreaseAllowance()

```ocaml
(* @dev: Increase the allowance of an approved_spender over the caller’s tokens. Only token_owner allowed to invoke. *)
(* param spender:      Address of the designated approved_spender.                                                   *)
(* param amount:       Number of tokens to be increased as allowance for the approved_spender.                       *)
transition IncreaseAllowance(spender: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name      | Type      | Description                                                                     |
| ------ | --------- | --------- | ------------------------------------------------------------------------------- |
| @param | `spender` | `ByStr20` | Address of an approved_spender.                                                 |
| @param | `amount`  | `Uint128` | Number of tokens to be increased as spending allowance of the approved_spender. |

**Events:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                  |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `IncreasedAllowance` | Increasing of allowance of an approved_spender is successful. | `token_owner`: `ByStr20` which is the address the token_owner, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowance` is the new spending allowance of the approved_spender for the token_owner. |
| `_eventname` | `Error`              | Increasing of allowance is not successful.                    | - emit `CodeNotAuthorized` if the user is trying to authorize himself as an approved_spender.                                                                                                                                                     |

#### 6. DecreaseAllowance()

```ocaml
(* @dev: Decrease the allowance of an approved_spender over the caller’s tokens. Only token_owner allowed to invoke. *)
(* param spender:      Address of the designated approved_spender.                                                   *)
(* param amount:       Number of tokens to be decreased as allowance for the approved_spender.                       *)
transition DecreaseAllowance(spender: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name      | Type      | Description                                                                     |
| ------ | --------- | --------- | ------------------------------------------------------------------------------- |
| @param | `spender` | `ByStr20` | Address of an approved_spender.                                                 |
| @param | `amount`  | `Uint128` | Number of tokens to be decreased as spending allowance of the approved_spender. |

**Events:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                  |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `DecreasedAllowance` | Decreasing of allowance of an approved_spender is successful. | `token_owner`: `ByStr20` which is the address the token_owner, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowance` is the new spending allowance of the approved_spender for the token_owner. |
| `_eventname` | `Error`              | Decreasing of allowance is not successful.                    | - emit `CodeNotAuthorized` if the user is trying to authorize himself as an approved_spender.                                                                                                                                                     |

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

**Events:**

|              | Name       | Description                | Event Parameters                                                                                                                                                                        |
| ------------ | ---------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Transfer` | Sending is successful.     | `sender`: `ByStr20` which is the sender's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens transferred. |
| `_eventname` | `Error`    | Sending is not successful. | - emit `CodeNotFound` if the balance is not found. <br> - emit `CodeInsufficientFunds` if the balance of the token_owner is insufficient.                                               |

#### 8. OperatorSend()

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
| `_tag` | `OperatorSendSuccessCallBack` | Provide the sender the status of the transfer.        | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an operator,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                           |
| ------------ | --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `OperatorSendSuccess` | Sending is successful.     | `initiator`: `ByStr20` which is the operator's address, `sender`: `ByStr20` which is the token_owner's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeNotAuthorized` if sender is not an operator for the token_owner <br> emit `CodeNotFound` if the balance is not found. <br> - emit `CodeInsufficientFunds` if the balance of the token_owner is insufficient.                                   |

#### 9. TransferFrom()

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
| `_tag` | `TransferFromSuccessCallBack` | Provide the sender the status of the transfer.        | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                                                                             |
| ------------ | --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `TransferFromSuccess` | Sending is successful.     | `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeNotAuthorized` if sender is not an approved_spender for the token_owner <br> emit `CodeNotFound` if the balance is not found. <br> - emit `CodeInsufficientFunds` if the balance of the token_owner or the allowance of the approved_spender is insufficient.                                    |

## V. Existing Implementation(s)

- [Fungible Token Reference contract](../reference/FungibleToken.scilla)

To test the reference contract, simply go to the [`example`](../example) folder and run one of the JS scripts. For example, to deploy the contract, run:

```shell
yarn deploy.js
```

> **NOTE:** Please change the `privkey` in the script to your own private key. You can generate a testnet wallet and request for testnet \$ZIL at the [Nucleus Faucet](https://dev-wallet.zilliqa.com/home).

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
