| ZRC | Title                            | Status | Type     | Author                             | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | -------------------------------- | ------ | -------- | ---------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Fungible Tokens | Draft  | Ready | Gareth Mensah <gareth@zilliqa.com> | 2019-11-18           | 2019-11-18           |

## I. What are Fungible Tokens?

The Fungible Token is an open standard to create currencies, with fungibility being the property of a good or a commodity whose individual units are essentially interchangeable, and each of its parts is indistinguishable from another part.

## II. Abstract

ZRC-2 defines a minimum interface a smart contract must implement to allow fungible tokens to be managed, tracked, owned, and traded.

## III. Motivation

A standard for fungible tokens can serve as an interface for developers to create currencies, utility tokens or stable coins. Generally, fungible tokens can be used to represent interchangeable, identical and divisable assets as tokens.

## IV. Specification

The fungible token contract specification describes:

1. the global error codes to be declared in the library part of the contract;
2. the names and types of the immutable and mutable variables (aka `fields`);
3. the transitions that will allow the changing of values of the mutable variables;
4. the events to be emitted by them.

### A. Roles

| Name              | Description                                                                                                                                                                                                                      |     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `contractOwner`   | The owner of the contract initialized by the creator of the contract.                                                                                                                                                            |
| `tokenOwner`      | A user (identified by an address) that owns a token tied to a tokenId.                                                                                                                                                           |
| `approvedSpender` | A user (identified by an address) that can transfer a token tied to a tokenId on behalf of the `tokenOwner`.                                                                                                                     |
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

| Name            | Type      | Description                                                           |
| --------------- | --------- | --------------------------------------------------------------------- |
| `contractOwner` | `ByStr20` | The owner of the contract initialized by the creator of the contract. |
| `name`          | `String`  | The name of the fungible token.                                   |
| `symbol`        | `String`  | The symbol of the fungible token.                                 |
| `decimals`      | `Uint32`  | The number of decimal places a token can be divided by.           |

### D. Mutable Fields

| Name                | Type                                                              | Description                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balancesMap`     | `Map ByStr20 Uint256 = Emp ByStr20 Uint256`                       | Mapping between token owner to number of owned tokens.                                                                                                  |
| `operatorsMap`    | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)`                       | MMapping between token owner to approved address. Token owner can approve an address (as an operator) to transfer tokens to other addresses.   |
| `allowancesMap` | `Map ByStr20 (Map ByStr20 Uint256) = Emp ByStr20 (Map ByStr20 Uint256)` |    Mapping between token owner to approved address. Token owner can give an address an allowance of tokens to transfer tokens to other addresses.                                                                                                                  |

### E. Transitions

#### 1. Send

```ocaml
(* @dev:                         *)
(* @param:  address              *)
(* @param:  recipient            *)
(* @param:  amount               *)
(* Returns error message CodeTokenExists if token exists. *)
(* Revert transition if invalid recipient contract.       *)
transition Send(address: ByStr20, recipient: ByStr20, amount: Uint256)
```

|        | Name      | Type      | Description                                          |
| ------ | --------- | --------- | ---------------------------------------------------- |
| @param | `address`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `recipient`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount` | `Uint256` | Token id of the new to be minted.                    |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `SendSuccess` | Minting is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `token`: `Uint256`, where, `by` is the address of caller,`recipient` is the `to` address the token is sent, and `token` is the `tokenId` of the token minted.                             |
| eventName | `Error`       | Minting is not successful. | - emit `CodeTokenExists` if the token already exists.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not the contract owner.<br>**NOTE:** Only the `contractOwner` is allowed to call this transition. |

#### 2. OperatorSend

```ocaml
(* @dev:                     *)
(* @param:  from             *)
(* @param:  to               *)
(* @param:  amount           *)
(* Returns error message CodeTokenExists if token exists. *)
(* Revert transition if invalid recipient contract.       *)
transition OperatorSend(from: ByStr20, to: ByStr20, amount: Uint256)
```

|        | Name      | Type      | Description                                          |
| ------ | --------- | --------- | ---------------------------------------------------- |
| @param | `from`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `to`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount` | `Uint256` | Token id of the new to be minted.                    |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `OperatorSendSuccess` | Minting is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `token`: `Uint256`, where, `by` is the address of caller,`recipient` is the `to` address the token is sent, and `token` is the `tokenId` of the token minted.                             |
| eventName | `Error`       | Minting is not successful. | - emit `CodeTokenExists` if the token already exists.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not the contract owner.<br>**NOTE:** Only the `contractOwner` is allowed to call this transition. |

#### 3. Burn

```ocaml
(* @dev:    Burn existing tokens. Only tokenOwner or approved operator can burn a token *)
(* @param:  amount - number of tokens to be destroyed                                   *)
(* Returns error message CodeNotFound if token does not exists                          *)
transition Burn(amount: Uint256)
```

|        | Name      | Type      | Description                         |
| ------ | --------- | --------- | ----------------------------------- |
| @param | `amount` | `Uint256` | Number of tokens to be burned. |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                                               |
| --------- | ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BurnSuccess` | Burning is successful.     | `by`: `ByStr20`, `token`: `Uint256`, where, `by` is the address of caller and `token` is the `tokenID` of the token that has been burned.                                                                                                                      |
| eventName | `Error`       | Burning is not successful. | - emit `CodeNotFound` if the token does not exists.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not the contract owner.<br>**NOTE:** Only either the `tokenOwner` or approved `operator`(s) is allowed to call this transition. |


#### 4. OperatorBurn

```ocaml
(* @dev: Approves another address the ability to transfer the given tokenId *)
(* There can only be one approvedSpender per token at a given time          *)
(* Absence of entry in tokenApproval indicates there is no approved address *)
(* param: to      - Address to be approved for the given tokenId            *)
(* param: tokenId - ID of the token to be approved                          *)
transition OperatorBurn(from: ByStr20, amount: Uint256)
```

|        | Name      | Type      | Description                                    |
| ------ | --------- | --------- | ---------------------------------------------- |
| @param | `to`      | `ByStr20` | Address to be approved for the given token id. |
| @param | `tokenId` | `Uint256` | ID of the token to be approved.                |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approval is successful.     | `from`: `ByStr20`, `approvedTo`: `ByStr20`, `token`: `Uint256`, where `from` is the address of the caller, and `approvedTo` is argument `to` to the transition.                                                                                               |
| eventName | `Error`          | Approval is not successful. | - emit `CodeNotFound` if token doesn't exist.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only either the `tokenOwner` or approved `operator`(s) are allowed to call this transition. |


#### 5. Mint

```ocaml
(* @dev:    Mint new tokens. Only contractOwner can mint. *)
(* @param:  to      - Address of the token recipient      *)
(* @param:  tokenId - ID of the new token minted          *)
(* Returns error message CodeTokenExists if token exists. *)
(* Revert transition if invalid recipient contract.       *)
transition mint(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                                          |
| ------ | --------- | --------- | ---------------------------------------------------- |
| @param | `to`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `tokenId` | `Uint256` | Token id of the new to be minted.                    |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `MintSuccess` | Minting is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `token`: `Uint256`, where, `by` is the address of caller,`recipient` is the `to` address the token is sent, and `token` is the `tokenId` of the token minted.                             |
| eventName | `Error`       | Minting is not successful. | - emit `CodeTokenExists` if the token already exists.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not the contract owner.<br>**NOTE:** Only the `contractOwner` is allowed to call this transition. |


#### 6. OperatorMint

```ocaml
(* @dev: Sets or unsets the approval of a given operator           *)
(* @param: to       - Address to be set or unset as operator       *)
(* @param: approved - Status of approval to be set for the address *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set or unset as operator. |
| @param | `approved` | `Bool`    | Status of the approval to be set.       |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `SetApprovalForAllSuccess` | Set approval for all is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `status`: `Bool`, where, `by` is the caller, `recipient` is the `to` address to be set approval status for, and `status` is the `approved` status after execution of this transition. |
| eventName | `Error`                    | Set approval for all is not successful. | - emit `CodeNotAuthorised` if the transition is called by the wrong user, i.e., the caller attempting to approve herself.                                                                                                      |


#### 7. AuthorizeOperator

```ocaml
(* @dev: Sets or unsets the approval of a given operator           *)
(* @param: to       - Address to be set or unset as operator       *)
(* @param: approved - Status of approval to be set for the address *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set or unset as operator. |
| @param | `approved` | `Bool`    | Status of the approval to be set.       |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `SetApprovalForAllSuccess` | Set approval for all is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `status`: `Bool`, where, `by` is the caller, `recipient` is the `to` address to be set approval status for, and `status` is the `approved` status after execution of this transition. |
| eventName | `Error`                    | Set approval for all is not successful. | - emit `CodeNotAuthorised` if the transition is called by the wrong user, i.e., the caller attempting to approve herself.                                                                                                      |


#### 8. RevokeOperator

```ocaml
(* @dev: Sets or unsets the approval of a given operator           *)
(* @param: to       - Address to be set or unset as operator       *)
(* @param: approved - Status of approval to be set for the address *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set or unset as operator. |
| @param | `approved` | `Bool`    | Status of the approval to be set.       |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `SetApprovalForAllSuccess` | Set approval for all is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `status`: `Bool`, where, `by` is the caller, `recipient` is the `to` address to be set approval status for, and `status` is the `approved` status after execution of this transition. |
| eventName | `Error`                    | Set approval for all is not successful. | - emit `CodeNotAuthorised` if the transition is called by the wrong user, i.e., the caller attempting to approve herself.                                                                                                      |


#### 9. IsOperatorFor

```ocaml
(* @dev: Sets or unsets the approval of a given operator           *)
(* @param: to       - Address to be set or unset as operator       *)
(* @param: approved - Status of approval to be set for the address *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set or unset as operator. |
| @param | `approved` | `Bool`    | Status of the approval to be set.       |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `SetApprovalForAllSuccess` | Set approval for all is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `status`: `Bool`, where, `by` is the caller, `recipient` is the `to` address to be set approval status for, and `status` is the `approved` status after execution of this transition. |
| eventName | `Error`                    | Set approval for all is not successful. | - emit `CodeNotAuthorised` if the transition is called by the wrong user, i.e., the caller attempting to approve herself.                                                                                                      |


#### 10. DefaultOperators

```ocaml
(* @dev: Sets or unsets the approval of a given operator           *)
(* @param: to       - Address to be set or unset as operator       *)
(* @param: approved - Status of approval to be set for the address *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set or unset as operator. |
| @param | `approved` | `Bool`    | Status of the approval to be set.       |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `SetApprovalForAllSuccess` | Set approval for all is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `status`: `Bool`, where, `by` is the caller, `recipient` is the `to` address to be set approval status for, and `status` is the `approved` status after execution of this transition. |
| eventName | `Error`                    | Set approval for all is not successful. | - emit `CodeNotAuthorised` if the transition is called by the wrong user, i.e., the caller attempting to approve herself.                                                                                                      |


#### 11. Transfer

```ocaml
(* @dev: Transfer the ownership of a given tokenId to another address *)
(* @param: to      - Recipient address for the token                  *)
(* @param: tokenId - ID of the token to be transferred                *)
(* Returns error message CodeNotFound if token does not exists        *)
(* Revert transition if invalid recipient contract.                   *)
transition transfer(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                        |
| ------ | --------- | --------- | ---------------------------------- |
| @param | `to`      | `ByStr20` | Recipient address of the token.    |
| @param | `tokenId` | `Uint256` | Id of the token to be transferred. |

|           | Name                  | Description                 | Event Parameters                                                                                                                                                                                                                                                                        |
| --------- | --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferFromSuccess` | Transfer is successful.     | `from`: `ByStr20`, `recipient`: `ByStr20`, `token`: `Uint256`, where, `from` is the caller of the transition, `recipient` is the `to` address and `token` is the `tokenID` of the token that is transferred.                                                                            |
| eventName | `Error`               | Transfer is not successful. | - emit `CodeNotFound` if the token does not exists.<br>- emit `CodeNotAuthorised` if the transition is called by a user that is not authorised.<br>**NOTE:** Only either `tokenOwner`, `approvedSpender` or an `operator` tied to that `tokenOwner` address can invoke this transition. |

#### 12. TansferFrom

```ocaml
(* @dev: Approves another address the ability to transfer the given tokenId *)
(* There can only be one approvedSpender per token at a given time          *)
(* Absence of entry in tokenApproval indicates there is no approved address *)
(* param: to      - Address to be approved for the given tokenId            *)
(* param: tokenId - ID of the token to be approved                          *)
transition approve(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                                    |
| ------ | --------- | --------- | ---------------------------------------------- |
| @param | `to`      | `ByStr20` | Address to be approved for the given token id. |
| @param | `tokenId` | `Uint256` | ID of the token to be approved.                |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approval is successful.     | `from`: `ByStr20`, `approvedTo`: `ByStr20`, `token`: `Uint256`, where `from` is the address of the caller, and `approvedTo` is argument `to` to the transition.                                                                                               |
| eventName | `Error`          | Approval is not successful. | - emit `CodeNotFound` if token doesn't exist.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only either the `tokenOwner` or approved `operator`(s) are allowed to call this transition. |

#### 13. Allowance

```ocaml
(* @dev: Approves another address the ability to transfer the given tokenId *)
(* There can only be one approvedSpender per token at a given time          *)
(* Absence of entry in tokenApproval indicates there is no approved address *)
(* param: to      - Address to be approved for the given tokenId            *)
(* param: tokenId - ID of the token to be approved                          *)
transition approve(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                                    |
| ------ | --------- | --------- | ---------------------------------------------- |
| @param | `to`      | `ByStr20` | Address to be approved for the given token id. |
| @param | `tokenId` | `Uint256` | ID of the token to be approved.                |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approval is successful.     | `from`: `ByStr20`, `approvedTo`: `ByStr20`, `token`: `Uint256`, where `from` is the address of the caller, and `approvedTo` is argument `to` to the transition.                                                                                               |
| eventName | `Error`          | Approval is not successful. | - emit `CodeNotFound` if token doesn't exist.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only either the `tokenOwner` or approved `operator`(s) are allowed to call this transition. |


#### 14. Approve

```ocaml
(* @dev: Approves another address the ability to transfer the given tokenId *)
(* There can only be one approvedSpender per token at a given time          *)
(* Absence of entry in tokenApproval indicates there is no approved address *)
(* param: to      - Address to be approved for the given tokenId            *)
(* param: tokenId - ID of the token to be approved                          *)
transition approve(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                                    |
| ------ | --------- | --------- | ---------------------------------------------- |
| @param | `to`      | `ByStr20` | Address to be approved for the given token id. |
| @param | `tokenId` | `Uint256` | ID of the token to be approved.                |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approval is successful.     | `from`: `ByStr20`, `approvedTo`: `ByStr20`, `token`: `Uint256`, where `from` is the address of the caller, and `approvedTo` is argument `to` to the transition.                                                                                               |
| eventName | `Error`          | Approval is not successful. | - emit `CodeNotFound` if token doesn't exist.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only either the `tokenOwner` or approved `operator`(s) are allowed to call this transition. |


#### 15. TotalSupply

```ocaml
(* @notice: Count all NFTs assigned to a tokenOwner *)
transition balanceOf(address: ByStr20)
```

|        | Name      | Type      | Description               |
| ------ | --------- | --------- | ------------------------- |
| @param | `address` | `ByStr20` | Address of a token owner. |

|           | Name               | Description                        | Event Parameters                                                                                                                                    |
| --------- | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BalanceOfSuccess` | Counting of balance is successful. | `bal`: `Uint128`, which returns the number of tokens owned by a given address. If the user does not own any tokens, then the value returned is `0`. |

#### 16. BalanceOf

```ocaml
(* @notice: Count all NFTs assigned to a tokenOwner *)
transition balanceOf(address: ByStr20)
```

|        | Name      | Type      | Description               |
| ------ | --------- | --------- | ------------------------- |
| @param | `address` | `ByStr20` | Address of a token owner. |

|           | Name               | Description                        | Event Parameters                                                                                                                                    |
| --------- | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BalanceOfSuccess` | Counting of balance is successful. | `bal`: `Uint128`, which returns the number of tokens owned by a given address. If the user does not own any tokens, then the value returned is `0`. |

## V. Existing Implementation(s)

- [Non-Fungible Token](https://github.com/Zilliqa/ZRC/blob/master/reference/nonfungible-token.scilla)

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
