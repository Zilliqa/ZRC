| ZRC | Title                            | Status | Type     | Author                             | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | -------------------------------- | ------ | -------- | ---------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Non Fungible Tokens | Draft  | Standard | Gareth Mensah <gareth@zilliqa.com> | 2019-09-28           | 2019-10-09           |

## I. What are Non Fungible Tokens?

An NFT, or Non Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is completely unique and non-interchangeable with other tokens.

## II. Abstract

ZRC-1 defines a minimum interface a smart contract must implement to allow unique tokens to be managed, tracked, owned, and traded.

## III. Motivation

A standard for NFT can serve as an interface for game creators to create kitties, cards or weapons; by institutions to create certifications, diplomas and identifications. Generally, NFTs can be used to represent unique and rare assets as tokens.

## IV. Specification

The NFT contract specification describes:

1. the global error codes to be declared in the library part of the contract;
2. the names and types of the immutable and mutable variables (aka `fields`);
3. the transitions that will allow the changing of values of the mutable variables;
4. the events to be emitted by them.

### A. Roles

| Name            | Description                                                                                                                                                                                                                      |     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `contractOwner` | The owner of the contract initialized by the creator of the contract.                                                                                                                                                            |
| `tokenOwner`    | A user (identified by an address) that owns a token tied to a tokenId.                                                                                                                                                           |
| `tokenApproval` | A user (identified by an address) that can transfer a token tied to a tokenId on behalf of the `tokenOwner`.                                                                                                                     |
| `operator`      | A user (identified by an address) that is approved to operate all and any tokens owned by another user (identified by another address). The operators can make any transfer, approve, or burn the tokens on behalf of that user. |

### B. Error Codes

The NFT contract must define the following constants for use as error codes for the `Error` event.

| Name                  | Type    | Code | Description                                                     |
| --------------------- | ------- | ---- | --------------------------------------------------------------- |
| `CodeNoAuthorized`    | `Int32` | `-1` | Emit when the transition call is unauthorized for a given user. |
| `CodeNotFound`        | `Int32` | `-2` | Emit when a value is missing.                                   |
| `CodeTokenExists`     | `Int32` | `-3` | Emit when trying to create a token that already exists.         |
| `CodeUnexpectedError` | `Int32` | `-4` | Emit when the transition call runs into an unexpected error.    |
| `CodeNotValid`        | `Int32` | `-5` | Emit when the transition call is invalid.                       |

### C. Immutable Variables

| Name            | Type      | Description                                                           |
| --------------- | --------- | --------------------------------------------------------------------- |
| `contractOwner` | `ByStr20` | The owner of the contract initialized by the creator of the contract. |
| `name`          | `String`  | The name of the non-fungible token.                                   |
| `symbol`        | `String`  | The symbol of the non-fungible token.                                 |

### D. Mutable Fields

| Name                | Type                                                              | Description                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenOwnerMap`     | `Map Uint256 ByStr20 = Emp Uint256 ByStr20`                       | Mapping between `tokenId` (that identifies each token) to its owner.                                                                                                  |
| `ownedTokenCount`   | `Map ByStr20 Uint256 = Emp ByStr20 Uint256`                       | Mapping from token owner to number of owned tokens.                                                                                                                   |
| `tokenApprovals`    | `Map Uint256 ByStr20 = Emp Uint256 ByStr20`                       | Mapping between tokenId to approved address. Token owner can approve an address (as an operator) to transfer a particular token (given a tokenId) to other addresses. |
| `operatorApprovals` | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)` | Mapping from token owner to operator approvals.                                                                                                                       |

### E. Transitions

#### 1. Mint

```ocaml
(* @dev:    Mint new tokens. Only contractOwner can mint. *)
(* @param:  to      - Address of the token recipient      *)
(* @param:  tokenId - ID of the new token minted          *)
(* Returns error message CodeTokenExists if token exists  *)
transition mint(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                                          |
| ------ | --------- | --------- | ---------------------------------------------------- |
| @param | `to`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `tokenId` | `Uint256` | Token id of the new to be minted.                    |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                                                                                                 |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `MintSuccess` | Minting is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `token`: `Uint256`, where, `by` is the address of caller,`recipient` is the `to` address the token is sent, and `token` is the `tokenId` of the token minted.                                                                                                           |
| eventName | `Error`       | Minting is not successful. | - emit `CodeTokenExists` if the token already exists.<br>- emit `CodeNotAuthorized` if the transition is called by a user who is not the contract owner.<br>- emit `CodeNotValid` if `to` address is same as this contract's address.<br> **NOTE:** Only the `contractOwner` is allowed to call this transition. |

#### 2. Burn

```ocaml
(* @dev:    Burn existing tokens. Only tokenOwner or approved Operator can burn a token *)
(* @param:  tokenId - ID of the new token destroyed                                     *)
(* Returns error message CodeNotFound if token does not exists                          *)
transition burn(tokenId: Uint256)
```

|        | Name      | Type      | Description                         |
| ------ | --------- | --------- | ----------------------------------- |
| @param | `tokenId` | `Uint256` | Token id of the token to be burned. |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                                         |
| --------- | ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BurnSuccess` | Burning is successful.     | `by`: `ByStr20`, `token`: `Uint256`, where, `by` is the address of caller and `token` is the `tokenID` of the token that has been burned.                                                                                                                |
| eventName | `Error`       | Burning is not successful. | - emit `CodeNotFound` if the token does not exists.<br>- emit `CodeNotAuthorized` if the transition is called by a user who is not the contract owner.<br>**NOTE:** Only the `tokenOwner` or an approved `operator`s is allowed to call this transition. |

#### 3. Approve

```ocaml
(* @dev: Approves another address the ability to transfer the given tokenId *)
(* There can only be one approved address per token at a given time         *)
(* Absence of entry in tokenApproval indicates there is no approved address *)
(* param: to      - Address to be approved for the given tokenId            *)
(* param: tokenId - ID of the token to be approved                          *)
transition approve(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                                    |
| ------ | --------- | --------- | ---------------------------------------------- |
| @param | `to`      | `ByStr20` | Address to be approved for the given token id. |
| @param | `tokenId` | `Uint256` | ID of the token to be approved.                |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                        |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approval is successful.     | `from`: `ByStr20`, `approvedTo`: `ByStr20`, `token`: `Uint256`, where `from` is the address of the caller, and `approvedTo` is argument `to` to the transition.                                                                                         |
| eventName | `Error`          | Approval is not successful. | - emit `CodeNotFound` if token doesn't exist.<br>- emit `CodeNotAuthorized` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only the `tokenOwner` or an approved `operator`s are allowed to call this transition. |

#### 4. SetApprovalForAll

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
| eventName | `Error`                    | Set approval for all is not successful. | - emit `CodeNotAuthorized` if the transition is called by the wrong user, i.e., the caller attempting to approve herself.                                                                                                      |

#### 5. Transfer

```ocaml
(* @dev: Transfer the ownership of a given tokenId to another address *)
(* @param: to      - Recipient address for the token                  *)
(* @param: tokenId - ID of the token to be transferred                *)
transition transfer(to: ByStr20, tokenId: Uint256)
```

|        | Name      | Type      | Description                        |
| ------ | --------- | --------- | ---------------------------------- |
| @param | `to`      | `ByStr20` | Recipient address of the token.    |
| @param | `tokenId` | `Uint256` | Id of the token to be transferred. |

|           | Name                  | Description                 | Event Parameters                                                                                                                                                                                                                                                                                                                                        |
| --------- | --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferFromSuccess` | Transfer is successful.     | `from`: `ByStr20`, `recipient`: `ByStr20`, `token`: `Uint256`, where, `from` is the caller of the transition, `recipient` is the `to` address and `token` is the `tokenID` of the token that is transferred.                                                                                                                                            |
| eventName | `Error`               | Transfer is not successful. | - emit `CodeNotValid` if `to` address is this contract's address.<br>- emit `CodeNotFound` if the token does not exists.<br>- emit `CodeNotAuthorized` if the transition is called by a user that is not authorised.<br>**NOTE:** Only either `tokenOwner`, `tokenApproval` or `operator` tied to that `tokenOwner` address can invoke this transition. |

#### 6. BalanceOf

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
