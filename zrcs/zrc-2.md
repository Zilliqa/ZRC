| ZRC | Title                            | Status | Type     | Author                             | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | -------------------------------- | ------ | -------- | ---------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Fungible Tokens | Draft  | Ready | Gareth Mensah <gareth@zilliqa.com> | 2019-11-18           | 2019-11-18           |

## I. What are Fungible Tokens?

The Fungible Token is an open standard for creating currencies. Fungibility is the property of goods or commodities whose individual units are essentially interchangeable, and each of its parts is indistinguishable from another part.

## II. Abstract

ZRC-2 defines a minimum interface that a smart contract must implement to allow fungible tokens to be managed, tracked, owned, and traded.

## III. Motivation

A standard for fungible tokens can serve as an interface for developers to create currencies, utility tokens or stable coins. Generally, fungible tokens can be used to represent interchangeable, identical and divisible assets as tokens.

## IV. Specification

The fungible token contract specification describes:

1. the global error codes to be declared in the library part of the contract;
2. the names and types of the immutable and mutable variables (aka `fields`);
3. the transitions that will allow the changing of values of the mutable variables;
4. the events to be emitted by them.

### A. Roles

| Name              | Description                                                                                                                                                                                                                      |     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |--|
| `contractOwner`   | The owner of the contract initialized by the creator of the contract.                                                                                                                                                            |
| `tokenOwner`      | A user (identified by an address) that owns tokens.                                                                                                                                                                              |
| `approvedSpender` | A user (identified by an address) that can transfer tokens on behalf of the `tokenOwner`.                                                                                                                     |
| `operator`        | A user (identified by an address) that is approved to operate all and any tokens owned by another user (identified by another address). The operators can make any transfer, approve, or burn the tokens on behalf of that user. |

### B. Error Codes

The fungible token contract must define the following constants for use as error codes for the `Error` event.

| Name                  | Type    | Code | Description                                                     |
| --------------------- | ------- | ---- | --------------------------------------------------------------- |
| `CodeNotAuthorised`   | `Int32` | `-1` | Emit when the transition call is unauthorised for a given user. |
| `CodeNotFound`        | `Int32` | `-2` | Emit when a value is missing.                                   |
| `CodeTokenExists`     | `Int32` | `-3` | Emit when trying to create a token that already exists.         |
| `CodeUnexpectedError` | `Int32` | `-4` | Emit when the transition call runs into an unexpected error.    |

### C. Immutable Variables

| Name                 | Type          | Description                                                           |
| -------------------- | ------------- | --------------------------------------------------------------------- |
| `contractOwner`      | `ByStr20`     | The owner of the contract initialized by the creator of the contract. |
| `name`               | `String`      | The name of the fungible token.                                       |
| `symbol`             | `String`      | The symbol of the fungible token.                                     |
| `default_operators`  | `List ByStr20`| The adddresses set of default operators for all token holders.        |
| `decimals`           | `Uint32`      | The number of decimal places a token can be divided by.               |

### D. Mutable Fields

| Name                | Type                                                              | Description                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `total_tokens` | `Uint128 = Uint128 0` |    Total amount of tokens.       |
| `revokedDefaultOperators` | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)` |    Mapping of `default_operators` that have been revoked by token hodlers.       |
| `balancesMap`     | `Map ByStr20 Uint128 = Emp ByStr20 Uint128`                       | Mapping between token owner to number of owned tokens.                                                                                                  |
| `operatorsMap`    | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)`                       | Mapping from token owner to designated operators. Token owner can approve an address as an operator (as per the definition of operator given above).   |
| `allowancesMap` | `Map ByStr20 (Map ByStr20 Uint128) = Emp ByStr20 (Map ByStr20 Uint128)` |    Mapping from token owner to approved spender address. Token owner can give an address an allowance of tokens to transfer tokens to other addresses.       |                                                                                                           

### E. Transitions

#### 1. ReauthorizeDefaultOperator

```ocaml
(* @dev: Re-authorize a default operator               *)
(* @param operator: Amount of tokens to be sent.       *)
transition ReauthorizeDefaultOperator(operator : ByStr20)  
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `operator`  | `ByStr20` | Address of the default operator to be reauthorized.  |


|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ReAuthorizedDefaultOperatorSuccess` | Re-authorizing is successful.     | `operator`: `ByStr20`, `recipient`: `ByStr20`, and `sender` : `_sender`.                             |
| eventName | `Error`       | Re-authorizing is not successful. | - emit `CodeNotFound` if the default operator is not found. |

#### 2. RevokeDefaultOperator

```ocaml
(* @dev: Revoke a default operator.              *)
(* @param operator: Amount of tokens to be sent. *)
transition RevokeDefaultOperator(operator : ByStr20)
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `operator`      | `ByStr20` | Address of the default operator to be revoked.   |


|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `RevokedDefaultOperatorSuccess` | Revoking is successful.     | `operator`: `ByStr20`, `recipient`: `ByStr20`, and `sender` : `_sender`.                             |
| eventName | `Error`       | Revoking is not successful. | - emit `CodeNotFound` if the default operator is not found. |


#### 3. Send

```ocaml
(* @dev: Moves amount tokens from _sender to the recipient.                *)
(* @param recipient:  Address of the recipient whose balance is increased. *)
(* @param amount:     Amount of tokens to be sent.                         *)
transition Send(recipient: ByStr20, amount: Uint128)
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `recipient` | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`    | `Uint128` | Amount of tokens to be sent.                         |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `SendSuccess` | Sending is successful.     | `from`: `ByStr20` which should be `_sender`, `recipient`: `ByStr20`, and `amount`: `Uint128`.                             |
| eventName | `Error`       | Sending is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the token owner. |

#### 4. OperatorSend

```ocaml
(* @dev: Moves amount tokens from tokenOwner to recipient. The caller must be an operator of tokenOwner. *)
(* @param operator:   Address of an operator approved by tokenOwner.                                 *)
(* @param tokenOwner: Address of the sender whose balance is decreased.                              *)
(* @param recipient:  Address of the recipient whose balance is increased.                           *)
(* @param amount:     Amount of tokens to be sent.                                                   *)
transition OperatorSend(operator: ByStr20, tokenOwner: ByStr20, recipient: ByStr20, amount: Uint128)
```

|        | Name         | Type      | Description                                          |
| ------ | ------------ | --------- | ---------------------------------------------------- |
| @param | `operator`   | `ByStr20` | Address of an operator approved by `tokenOwner`.     |
| @param | `tokenOwner` | `ByStr20` | Address of the sender whose balance is decreased.    |
| @param | `recipient`  | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`     | `Uint128` | Amount of tokens to be sent.                         |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `OperatorSendSuccess` | Sending is successful.     | `from`: `ByStr20`, `to`: `ByStr20`, and `amount`: `Uint128`.                             |
| eventName | `Error`       | Sending is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not an approved operator. |

#### 5. Burn

```ocaml
(* @dev: Burn existing tokens. Only tokenOwner or approved operator can burn a token *)
(* @param burn_account:                     Address holding the tokens to be burned. *)
(* @param amount:                           Number of tokens to be destroyed.        *)
transition Burn(burn_account: ByStr20, amount: Uint128)
```

|        | Name           | Type      | Description                              |
| ------ | -------------- | --------- | ---------------------------------------- |
| @param | `burn_account` | `ByStr20` | Address holding the tokens to be burned. |
| @param | `amount`       | `Uint128` | Number of tokens to be burned.           |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                                               |
| --------- | ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BurnSuccess` | Burning is successful.     | `from`: `ByStr20`, and `amount`: `Uint128`.                                                                                                                      |
| eventName | `Error`       | Burning is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the token owner.<br>**NOTE:** Only the `tokenOwner` is allowed to call this transition. |


#### 6. OperatorBurn

```ocaml
(* @dev: Burn existing tokens. Onlya  default operator can burn a token.  *)
(* @param operator:   Address must be an operator of tokenOwner.          *)
(* @param tokenOwner: Address holding the tokens to be burned.            *)
(* @param amount:     Number of tokens to be destroyed.                   *)
transition OperatorBurn(operator: ByStr20, from: ByStr20, amount: Uint128)
```

|        | Name         | Type      | Description                                    |
| ------ | ------------ | --------- | ---------------------------------------------- |
| @param | `operator`   | `ByStr20` | Address of a default operator.                 |
| @param | `tokenOwner` | `ByStr20` | Address holding the tokens to be burned.       |
| @param | `amount`     | `Uint128` | Number of tokens to be burned.                 |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `OperatorBurnSuccess` | Burning is successful.     | `operator`: `ByStr20`, `tokenOwner`: `ByStr20`, and `amount`: `Uint128`.                                                                                               |
| eventName | `Error`          | Burning is not successful. | - emit `CodeNotAuthorised` if the transition is called by an operator who is not authorized. |


#### 7. Mint

```ocaml
(* @dev: Mint new tokens. Only contractOwner can mint.                        *)
(* @param recipient:     Address of the recipient whose balance is increased. *)
(* @param amount:        Number of tokens to be burned.                       *)
transition Mint(recipient: ByStr20, amount: Uint128)
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `recipient` | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`    | `Uint128` | Number of tokens to be minted.                       |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `MintSuccess` | Minting is successful.     | `recipient`: `ByStr20`, and `amount`: `Uint128`.                             |
| eventName | `Error`       | Minting is not successful. | - emit `CodeTokenExists` if the token already exists.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not the contract owner.<br>**NOTE:** Only the `contractOwner` is allowed to call this transition. |


#### 8. OperatorMint

```ocaml
(* @dev: Mint new tokens. Only approved operator can mint tokens.         *)
(* @param operator:   Address must be an operator of tokenOwner.          *)
(* @param recipient: Address of the recipient whose balance is increased. *)
(* @param amount:    Number of tokens to be burned.                       *)
transition OperatorMint(operator: ByStr20, recipient: ByStr20, amount: Uint128)
```

|        | Name         | Type      | Description                                         |
| ------ | ------------ | --------- | --------------------------------------------------- |
| @param | `operator`   | `ByStr20` | Address of a default operator.                      |
| @param | `recipient`  | `ByStr20` | Address of the recipient whose balance is increased.|
| @param | `amount`     | `Uint128` | Number of tokens to be minted.                      |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `OperatorMintAllSuccess` | Minting is successful.     | `recipient`: `ByStr20`, and `amount`: `Uint128`. |
| eventName | `Error`                    | Minting is not successful. | - emit `CodeNotAuthorised` if the transition is not called by an approved operator.                                                                                                      |


#### 9. AuthorizeOperator

```ocaml
(* @dev: Make an address an operator of the caller.                           *)
(* @param operator: Address to be set as operator. Cannot be calling address. *)
transition AuthorizeOperator(operator: ByStr20)
```

|        | Name       | Type      | Description                    |
| ------ | ---------- | --------- | ------------------------------ |
| @param | `operator` | `ByStr20` | Address to be set as operator. Cannot be calling address. |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `AuthorizeOperatorSuccess` | Authorizing is successful.     | `operator`: `ByStr20`. |
| eventName | `Error`                    | Authorizing is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the token holder.                                                                                                      |


#### 10. RevokeOperator

```ocaml
(* @dev: Revoke an address from being an operator of the caller. *)
(* @param operator:         Address to be unset as operator.     *)
transition RevokeOperator(operator: ByStr20)
```

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `operator` | `ByStr20` | Address to be unset as operator. |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `RevokeOperatorSuccess` | Revoking is successful.     | `operator`: `ByStr20`. |
| eventName | `Error`                    | Revoking is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the token holder.                                                                                                      |


#### 11. IsOperatorFor

```ocaml
(* @dev: Returns true if an address is an operator of tokenOwner. All addresses are their own operator. *)
(* @param operator:    Address of a potential operator.                                                 *)
(* @param tokenOwner:  Address of a token holder.                                                       *)
transition IsOperatorFor(operator: ByStr20, tokenOwner: ByStr20)
```

|        | Name          | Type      | Description                          |
| ------ | ------------- | --------- | ------------------------------------ |
| @param | `operator`    | `ByStr20` | Address of a potential operator.     |
| @param | `tokenOwner`  | `ByStr20` | Address of a token ownwer.           |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `IsOperatorForSuccess` | Checking operator is successful.     | `operator`: `ByStr20`, and `tokenOwner`: `ByStr20`. |
| eventName | `Error`                    | Checking operator is not successful. | TBA.                                                                                                      |


#### 12. DefaultOperators

```ocaml
(* @dev: Returns the list of default operators. These addresses are operators for all token holders. *)
transition DefaultOperators()
```

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `DefaultOperatorsSuccess` | Listing default operators is successful.     | `list`: `List ByStr20` |


#### 13. Transfer

```ocaml
(* @dev: Move a given amount of tokens from one address another.       *)
(* @param to:     Address of the recipient whose balance is increased. *)
(* @param amount: Number of tokens to be transferred.                  *)
transition Transfer(to: ByStr20, amount: Uint128)
```

|        | Name      | Type      | Description                        |
| ------ | --------- | --------- | ---------------------------------- |
| @param | `to`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`  | `Uint128` | Number of tokens to be transferred.                  |

|           | Name                  | Description                 | Event Parameters                                                                                                                                                                                                                                                                        |
| --------- | --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferSuccess` | Transfering is successful.     | `to`: `ByStr20`, and `amount`: `Uint128`.                                                                            |
| eventName | `Error`               | Transfering is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user that is not authorised.<br>**NOTE:** Only `tokenOwner` address can invoke this transition. |

#### 14. TansferFrom

```ocaml
(* @dev: Move a given amount of tokens from one address to another using the allowance mechanism. The caller must be an `approvedSpender`. *)
(* param from:    Address of the sender whose balance is deccreased.                           *)
(* param to:      Address of the recipient whose balance is increased.                         *)
(* param amount:  Number of tokens to be transferred.                                          *)
transition TansferFrom(from: ByStr20, to: ByStr20, amount: Uint128)
```

|        | Name      | Type      | Description                                          |
| ------ | --------- | --------- | ---------------------------------------------------- |
| @param | `from`    | `ByStr20` | Address of the sender whose balance is decreased.   |
| @param | `to`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`  | `Uint128` | Number of tokens to be transferred.                  |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TansferFromSuccess` | Approval is successful.     | `from`: `ByStr20`, `to`: `ByStr20`, and `amount`: `Uint128`.                                                                                               |
| eventName | `Error`          | Approval is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only either the `tokenOwner`, `approvedSpender` or authorized `operator`s are allowed to call this transition. |

#### 15. Allowance

```ocaml
(* @dev: Returns the number of tokens spender is allowed to spend on behalf of owner. *)
(* param tokenOwner:   Address of a token holder.                                     *)
(* param spender:      Address to be set as a spender.                                *)
transition Allowance(tokenOwner: ByStr20, spender: ByStr20)
```

|        | Name      | Type      | Description                                    |
| ------ | --------- | --------- | ---------------------------------------------- |
| @param | `tokenOwner` | `ByStr20` | Address of a token owner.                               |
| @param | `spender`    | `ByStr20` | Address to be set as a spender for a given token owner. |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `AllowanceSuccess` | Allowing is successful.     | `tokenOwner`: `ByStr20`, and `spender`: `ByStr20`.                                                                                               |
| eventName | `Error`          | Allowing is not successful. | TBA. |


#### 16. Approve

```ocaml
(* @dev: Sets amount as the allowance of spender over the caller’s tokens.  *)
(* There can only be one approved spender per token at a given time         *)
(* param spender: Address to be set as a spender.                           *)
(* param amount:  Number of tokens to be approved for a given spender.      *)
transition Approve(spender: ByStr20, amount: Uint128)
```

|        | Name         | Type      | Description                                          |
| ------ | ------------ | --------- | ---------------------------------------------------- | 
| @param | `spender`    | `ByStr20` | Address to be approved for the given token id.       |
| @param | `amount`     | `Uint128` | Number of tokens to be approved for a given spender. |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approving is successful.     | `spender`: `ByStr20`, and `amount`: `Uint128`.                                                                                               |
| eventName | `Error`          | Approving is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only the `tokenOwner`  is allowed to call this transition. |


#### 17. TotalSupply

```ocaml
(* @dev: Returns the amount of tokens in existence. *)
transition TotalSupply()
```

|           | Name               | Description                        | Event Parameters                                                                                                                                    |
| --------- | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TotalSupplySuccess` | Counting of supply is successful. | `bal`: `Uint128`, which returns the number of tokens owned by a given address. If the user does not own any tokens, then the value returned is `0`. |

#### 18. BalanceOf

```ocaml
(* @dev: Returns the amount of tokens owned by address. *)
transition BalanceOf(address: ByStr20)
```

|        | Name      | Type      | Description               |
| ------ | --------- | --------- | ------------------------- |
| @param | `address` | `ByStr20` | Address of a token owner. |

|           | Name               | Description                        | Event Parameters                                                                                                                                    |
| --------- | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BalanceOfSuccess` | Counting of balance is successful. | `bal`: `Uint128`, which returns the number of tokens owned by a given address. If the user does not own any tokens, then the value returned is `0`. |

## V. Existing Implementation(s)

- TBA

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
