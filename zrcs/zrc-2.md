| ZRC | Title                        | Status | Type  | Author                                                                                                                       | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Fungible Tokens | Draft  | Ready | Gareth Mensah <gareth@zilliqa.com> <br> Vaivaswatha Nagaraj <vaivaswatha@zilliqa.com> <br> Chua Han Wen <hanwen@zilliqa.com> | 2019-11-18           | 2020-01-06           |

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

| Name                | Type    | Code | Description                                                     |
| ------------------- | ------- | ---- | --------------------------------------------------------------- |
| `CodeNotAuthorized` | `Int32` | `-1` | Emit when the transition call is unauthorised for a given user. |
| `CodeNotFound`      | `Int32` | `-2` | Emit when a requested value is missing.                         |
| `CodeNotAllowed`    | `Int32` | `-3` | Emit when logic of transition call is incorrect.                |

### C. Immutable Variables

| Name                | Type           | Description                                                               |
| ------------------- | -------------- | ------------------------------------------------------------------------- |
| `contract_owner`    | `ByStr20`      | The owner of the contract initialized by the creator of the contract.     |
| `name`              | `String`       | The name of the fungible token.                                           |
| `symbol`            | `String`       | The symbol of the fungible token.                                         |
| `decimals`          | `Uint32`       | The number of decimal places a token can be divided by.                   |
| `default_operators` | `List ByStr20` | The list of default operators initialized by the creator of the contract. |

### D. Mutable Fields

| Name                        | Type                                                                    | Description                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `total_tokens`              | `Uint128 = Uint128 0`                                                   | Total amount of tokens.                                                                                                                                                                                                      |
| `balances_map`              | `Map ByStr20 Uint128 = Emp ByStr20 Uint128`                             | Mapping between token owner to number of owned tokens.                                                                                                                                                                       |
| `operators_map`             | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)`       | Mapping from token owner to designated operators. A token owner can approve an address as an operator (as per the definition of operator given above).                                                                       |
| `revoked_default_operators` | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)`       | Mapping from token owner to revoked default operators. Default operators are intialised by the contract owner. A token owner can revoked a default operator (as per the definition of default operator given above) at will. |
| `allowances_map`            | `Map ByStr20 (Map ByStr20 Uint128) = Emp ByStr20 (Map ByStr20 Uint128)` | Mapping from token owner to approved spender address. Token owner can give an address an allowance of tokens to transfer tokens to other addresses.                                                                          |

### E. Transitions

#### 1. Send

```ocaml
(* @dev: Moves amount tokens from _sender to the recipient. Used by token_owner *)
(* @param recipient:  Address of the recipient whose balance is increased.      *)
(* @param amount:     Amount of tokens to be sent.                              *)
transition Send(recipient: ByStr20, amount: Uint128)
```

|        | Name     | Type      | Description                                            |
| ------ | -------- | --------- | ------------------------------------------------------ |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase. |
| @param | `amount` | `Uint128` | Amount of tokens to be sent.                           |

|           | Name          | Description                | Event Parameters                                                                                                                                            |
| --------- | ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `MoveSuccess` | Sending is successful.     | `from`: `ByStr20` which is the sender's address, `to`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount to the sent. |
| eventName | `Error`       | Sending is not successful. | - emit `CodeNotFound` if the balance is not found. <br> - emit `CodeNotAuthorized` if the balance is insufficient.                                          |

#### 2. OperatorSend

```ocaml
(* @dev: Moves amount tokens from token_owner to recipient. _sender must be an operator of token_owner. *)
(* @param from:        Address of the token_owner whose balance is decreased.                           *)
(* @param to:          Address of the recipient whose balance is increased.                             *)
(* @param amount:      Amount of tokens to be sent.                                                     *)
transition OperatorSend(from: ByStr20, to: ByStr20, amount: Uint128)
```

|        | Name     | Type      | Description                                              |
| ------ | -------- | --------- | -------------------------------------------------------- |
| @param | `from`   | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase.   |
| @param | `amount` | `Uint128` | Amount of tokens to be sent.                             |

|           | Name          | Description                | Event Parameters                                                                                                                                            |
| --------- | ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `MoveSuccess` | Sending is successful.     | `from`: `ByStr20` which is the sender's address, `to`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount to the sent. |
| eventName | `Error`       | Sending is not successful. | - emit `CodeNotFound` if the balance is not found. <br> - emit `CodeNotAuthorized` if operator is not approved **or** if the balance is insufficient.       |

#### 3. TransferFrom

```ocaml
(* @dev: Move a given amount of tokens from one address to another using the allowance mechanism. The caller must be an approved_spender. *)
(* @param from:    Address of the token_owner whose balance is decreased.                                                                 *)
(* @param to:      Address of the recipient whose balance is increased.                                                                   *)
(* @param amount:  Amount of tokens to be transferred.                                                                                    *)
transition TransferFrom(spender: ByStr20, from: ByStr20, to: ByStr20, amount: Uint128)
```

|        | Name     | Type      | Description                                              |
| ------ | -------- | --------- | -------------------------------------------------------- |
| @param | `from`   | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase.   |
| @param | `amount` | `Uint128` | Number of tokens to be transferred.                      |

|           | Name                  | Description                 | Event Parameters                                                                                                                                                    |
| --------- | --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferFromSuccess` | Approval is successful.     | `from`: `ByStr20` which is the sender's address, `to`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount to the sent.         |
| eventName | `Error`               | Approval is not successful. | - emit `CodeNotAuthorized` if the spender is not an approved_spender. <br> - emit `CodeNotAllowed` if the requested spent amount is more than authorized allowance. |

#### 4. Mint

```ocaml
(* @dev: Optional transition. Mint new tokens. Only contract_owner can mint. *)
(* @param recipient: Address of the recipient whose balance is to increase.  *)
(* @param amount:    Number of tokens to be minted.                          *)
transition Mint(recipient: ByStr20, amount: Uint128)
```

|        | Name        | Type      | Description                                            |
| ------ | ----------- | --------- | ------------------------------------------------------ |
| @param | `recipient` | `ByStr20` | Address of the recipient whose balance is to increase. |
| @param | `amount`    | `Uint128` | Number of tokens to be minted.                         |

|           | Name          | Description                | Event Parameters                                                                                                                                                                              |
| --------- | ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `MintSuccess` | Minting is successful.     | `recipient`: `ByStr20` which is the recipient's address, `minted_amount`: `Uint128` which is the amount to the minted, and `new_total_tokens`: `Uint128` which is the new total token supply. |
| eventName | `Error`       | Minting is not successful. | - emit `CodeNotAuthorized` if the transition is called by a user who is not the contract_owner.                                                                                               |

#### 5. Burn

```ocaml
(* @dev: Optional transition. Burn existing tokens. Only contract_owner can burn. *)
(* @param burn_account: Address of the token_owner whose balance is to decrease.  *)
(* @param amount:       Number of tokens to be burned.                            *)
transition Burn(burn_account: ByStr20, amount: Uint128)
```

|        | Name           | Type      | Description                                              |
| ------ | -------------- | --------- | -------------------------------------------------------- |
| @param | `burn_account` | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `amount`       | `Uint128` | Number of tokens to be burned.                           |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                    |
| --------- | ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BurnSuccess` | Burning is successful.     | `to`: `ByStr20` which is the recipient's address, `minted_amount`: `Uint128` which is the amount to the minted, and `new_total_tokens`: `Uint128` which is the new total token supply.              |
| eventName | `Error`       | Burning is not successful. | - emit `CodeNotAuthorized` if the transition is called by a use who is not the contract_owner. <br> - emit `CodeNotAllowed` if the amount to be burned is more than the balance of the token_owner. |

#### 6. AuthorizeOperator

```ocaml
(* @dev: Make an address an operator of the caller.                           *)
(* @param operator: Address to be set as operator. Cannot be calling address. *)
transition AuthorizeOperator(operator: ByStr20)
```

|        | Name       | Type      | Description                                               |
| ------ | ---------- | --------- | --------------------------------------------------------- |
| @param | `operator` | `ByStr20` | Address to be set as operator. Cannot be calling address. |

|           | Name                       | Description                    | Event Parameters                                                                        |
| --------- | -------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| eventName | `AuthorizeOperatorSuccess` | Authorizing is successful.     | `operator`: `ByStr20` which is the address to be set as an operator of the token_owner. |
| eventName | `Error`                    | Authorizing is not successful. | - emit `CodeNotAuthorized` if the user is trying to authorize himself as an operator.   |

#### 7. RevokeOperator

```ocaml
(* @dev: Revoke an address from being an operator of the caller. *)
(* @param operator: Address to be removed as operator.           *)
transition RevokeOperator(operator: ByStr20)
```

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `operator` | `ByStr20` | Address to be unset as operator. |

|           | Name                    | Description                 | Event Parameters                                                                            |
| --------- | ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| eventName | `RevokeOperatorSuccess` | Revoking is successful.     | `operator`: `ByStr20` which is the address to be removed as an operator of the token_owner. |
| eventName | `Error`                 | Revoking is not successful. | - emit `CodeNotFound` if the specified address is not an operator of the token_owner.       |

#### 8. RevokeDefaultOperator

```ocaml
(* @dev: Revoke a default operator from being an operator of the caller *)
(* @param operator:  Address of the default operator to be revoked.     *)
transition RevokeDefaultOperator(operator : ByStr20)
```

|        | Name       | Type      | Description                                    |
| ------ | ---------- | --------- | ---------------------------------------------- |
| @param | `operator` | `ByStr20` | Address of the default operator to be revoked. |

|           | Name                            | Description                 | Event Parameters                                                                                    |
| --------- | ------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| eventName | `RevokedDefaultOperatorSuccess` | Revoking is successful.     | `operator`: `ByStr20` which is the address to be removed as an default operator of the token_owner. |
| eventName | `Error`                         | Revoking is not successful. | - emit `CodeNotFound` if the specified address is not an default operator of the token_owner.       |

#### 9. ReAuthorizeDefaultOperator

```ocaml
(* @dev: Re-authorize a default operator as an operator of the caller    *)
(* @param operator: Address of the default operator to be re-authorized. *)
transition ReAuthorizeDefaultOperator(operator : ByStr20)
```

|        | Name       | Type      | Description                                    |
| ------ | ---------- | --------- | ---------------------------------------------- |
| @param | `operator` | `ByStr20` | Address of the default operator to be revoked. |

|           | Name                                 | Description                 | Event Parameters                                                                                          |
| --------- | ------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| eventName | `ReAuthorizedDefaultOperatorSuccess` | Revoking is successful.     | `operator`: `ByStr20` which is the address to be re-authorized as an default operator of the token_owner. |
| eventName | `Error`                              | Revoking is not successful. | - emit `CodeNotFound` if the specified address is not an default operator of the token_owner.             |

#### 10. IsOperatorFor

```ocaml
(* @dev: Returns true if an address is an operator or default operator of a token_owner. *)
(* @param operator:    Address of a potential operator.                                  *)
(* @param token_owner: Address of a token_owner.                                         *)
transition IsOperatorFor(token_owner: ByStr20, operator: ByStr20)
```

|        | Name          | Type      | Description                      |
| ------ | ------------- | --------- | -------------------------------- |
| @param | `operator`    | `ByStr20` | Address of a potential operator. |
| @param | `token_owner` | `ByStr20` | Address of a token_owner.        |

|           | Name                   | Description                       | Event Parameters                                                                                                                                                                  |
| --------- | ---------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `IsOperatorForSuccess` | Operator query is successful.     | `token_owner`: `ByStr20` which is the address of the token_owner, `operator`: `ByStr20` which is the queried address which is an operator or default operator of the token_owner. |
| eventName | `Error`                | Operator query is not successful. | - emit `CodeNotAuthorized` if the queried operator address is not an operator or default operator of the token_owner.                                                             |

#### 11. Approve

```ocaml
(* @dev: Sets amount as the allowance of spender over the caller’s tokens. Only token_owner allowed to invoke. *)
(* param spender:      Address to be set as an approved_spender.                                               *)
(* param amount:       Number of tokens to be set as allowance for the approved_spender.                       *)
transition Approve(spender: ByStr20, amount: Uint128)
```

|        | Name      | Type      | Description                                                       |
| ------ | --------- | --------- | ----------------------------------------------------------------- |
| @param | `spender` | `ByStr20` | Address to be set as an approved_spender.                         |
| @param | `amount`  | `Uint128` | Number of tokens to be approved as allowance for a given spender. |

|           | Name             | Description                  | Event Parameters                                                                                                                                                      |
| --------- | ---------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approving is successful.     | `spender`: `ByStr20` which is the address to be set as approved_spender, and `amount`: `Uint128` which is the amount to be set as allowance for the approved_spender. |
| eventName | `Error`          | Approving is not successful. | - emit `CodeNotAuthorized` if the approved_spender's address is the token_owner's address.                                                                            |

#### 12. Allowance

```ocaml
(* @dev: Returns the number of tokens an approved_spender is allowed to spend on behalf of the token_owner. *)
(* param token_owner:  Address of a token_owner.                                                            *)
(* param spender:      Address of the approved_spender.                                                     *)
transition Allowance(token_owner: ByStr20, spender: ByStr20)
```

|        | Name          | Type      | Description                      |
| ------ | ------------- | --------- | -------------------------------- |
| @param | `token_owner` | `ByStr20` | Address of a token_owner.        |
| @param | `spender`     | `ByStr20` | Address of the approved_spender. |

|           | Name        | Description                           | Event Parameters                                                                                                                                                                                                                     |
| --------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `Allowance` | Query of allowance is successful.     | `token_owner`: `ByStr20` which is the address of the token_owner, `spender`: `ByStr20` which is the address of the approved_spender, and `allowance`: `Uint128` which is the allowance given to approved_spender by the token_owner. |
| eventName | `Error`     | Query of allowance is not successful. | - emit `CodeNotFound` if the spender is not an approved_spender set by the token_owner.                                                                                                                                              |

#### 13. TotalSupply

```ocaml
(* @dev: Returns the total amount of tokens in existence. *)
transition TotalSupply()
```

|           | Name          | Description                                    | Event Parameters                                                                 |
| --------- | ------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| eventName | `TotalSupply` | Query of total supply of tokens is successful. | `total_supply`: `Uint128` which is the current total supply of tokens available. |

#### 14. BalanceOf

```ocaml
(* @dev: Returns the amount of tokens owned by an address. *)
transition BalanceOf(address: ByStr20)
```

|        | Name      | Type      | Description               |
| ------ | --------- | --------- | ------------------------- |
| @param | `address` | `ByStr20` | Address of a token_owner. |

|           | Name        | Description                                 | Event Parameters                                                                                                                                |
| --------- | ----------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BalanceOf` | Query of token_owner balance is successful. | `balance`: `Uint128` which is the number of tokens owned by a token_owner. If the user does not own any tokens, then the value returned is `0`. |

## V. Existing Implementation(s)

- [Fungible Token Reference contract](../reference/FungibleToken.scilla)

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
