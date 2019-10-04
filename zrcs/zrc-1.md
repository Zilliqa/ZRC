
|  ZRC | Title | Status| Type | Author | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd)
|--|--|--|--| -- | -- | -- |
| 1  | Standard for Non Fungible Tokens | Draft | Standard | Gareth Mensah <gareth@zilliqa.com> | 2019-09-28 | 2019-09-28 


## I. What are Non Fungible Tokens?

An NFT, or Non Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is completely unique and non-interchangeable with other tokens.

## II. Abstract 

ZRC-1 defines a minimum interface a smart contract must implement to allow unique tokens to be managed, tracked, owned, and traded. 


## III. Motivation

A standard for NFT can serve as an interface for game creators to create kitties, cards or weapons; by institutions to create certifications, diplomas and identifications. Generally, NFTs can be used to represent unique and rare assets as tokens.

## IV. Specification

The NFT contract specification describes: 
1) the global error codes to be declared in the library part of the contract. 
2) the names and types of the immutable and mutable variables (aka `fields`). 
3) the transitions that will allow changing the values of the mutable variables. 
4) the events to be emitted by them.

### A. Roles

| Name | Description
|--|--|
| Contract Owner | The owner of the contract initialized by the creator of the contract. |
| Token Owner | A user (identified by her address) that owns a token.  |
| Operator | A user (identified) by an address that is approved to make transfers on behalf of a token owner. A token owner can assign other people to be an operator of their tokens. Once assigned, the operators can make any transfer for the token owner on her behalf. |

### B. Error Codes

The NFT contract must define the following global constants in the library part of the contract code. These constants will be used as error codes in events.

| Name | Type | Code | Description
|--|--|--|--|
| `code_success` | `Int32` | `-1` | Emit when the transition call is successful. 
| `code_failure` | `Int32` | `-2` | Emit when the transition call is unsuccessful. 
| `code_not_authorized` | `Int32` | `-3` | Emit when the transition call is unauthorized for a given user. 
| `code_not_found` | `Int32` | `-4` | Emit when a value is missing.
| `code_bad_request` | `Int32` | `-5` | Emit when the transition call is somehow incorrect.
| `code_token_exists`| `Int32` | `-6` | Emit when trying to create a token that already exists.
| `code_unexpected_error` | `Int32` | `-7` | Emit when the transition call runs into an unexpected error. 

### C. Immutable Variables

| Name |  Type |Description
|--|--|--|
| `contractOwner` | `ByStr20` | The owner of the contract initialized by the creator of the contract. |
| `name` | `String` | The name of the non-fungible token. |
| `symbol` | `String` | The symbol of the non-fungible token. |

### D. Mutable Fields

| Name | Type | Description
|--|--|--|
| `tokenOwnerMap` | `Map Uint256 ByStr20 = Emp Uint256 ByStr20` | Mapping between `tokenId` (that identifies each token) to its owner. |
| `ownedTokenCount` | `Map ByStr20 Uint256 = Emp ByStr20 Uint256` | Mapping from token owner to number of owned tokens. |
| `tokenApprovals` | `Map Uint256 ByStr20 = Emp Uint256 ByStr20` | Mapping between tokenId to approved address. Token owner can approve an address (as an operator) to transfer a particular token (given a tokenId) to other addresses. |
| `operatorApprovals` | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)` | Mapping from token owner to operator approvals. |

### E. Transitions

**1. Approve**

```ocaml
(* Approves an address to transfer the given token ID *)
transition approve(to: ByStr20, tokenId: Uint256)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | `to` | `ByStr20` | Address to be approved for the given token id. |
| @param | `tokenId` | `Uint256` | Id of the token to be approved. |

|  | Name | Description | Event Parameters
|--|--|--|--|
| eventName | `ApproveSuccess` | event is successful. | `from`: `ByStr20`, `approvedTo`: `ByStr20`, `token`: `Uint256` |
| eventName | `Error` | event is not successful. | emit `code_not_found` if token is not found.<br/>emit `code_not_authorized` if the transition is called by the wrong user. |

<br/>

**2. ApprovalForAll**

```ocaml
(* Sets or unsets the approval of a given operator *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | `to` | `ByStr20` | Address to be set or unset as operator. |
| @param | `approved` | `Bool` | Status of the approval to be set. |

|  | Name | Description | Event Parameters
|--|--|--|--|
| eventName | `SetApprovalForAllSuccess` | event is successful. | `from`: `ByStr20`, `recipient`: `ByStr20`, `status`: `Bool` |
| eventName | `Error` | event is not successful. | emit `code_not_authorized` if the transition is called by the wrong user. |

<br/>

**3. TransferFrom**

```ocaml
(* Transfer the ownership of a given token ID to another address *)
transition transferFrom(from: ByStr20, to: ByStr20, tokenId: Uint256)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | `from` | `ByStr20` | Current holder of the token. |
| @param | `to` | `ByStr20` | Recipient address of the token. |
| @param | `tokenId` | `Uint256` | Id of the token to be transferred. |

|  | Name | Description | Event Parameters
|--|--|--|--|
| eventName | `TransferFromSuccess` | event is successful. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token`:  `Uint256` |
| eventName | `Error` | event is not successful. | emit `code_bad_request` if `from` address is not the same as the token holder.<br/>emit `code_unexpected_error` if there's an issue withe token holder's balance.<br/>emit `code_not_authorized` if the transition is called by the wrong user. |

<br/>

**4. TransferSingle**

```ocaml
(* Mint or Burn tokens *)
transition transferSingle(operator: ByStr20, from: ByStr20, to: ByStr20, tokenId: String, value: Uint128)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | `operator` | `ByStr20` | Address of an account that is approved to make the transfer. Token owners can assign other people to be an operator of their token. Once assigned, the operators can make any transfer for the token owner on his behalf. `operatorApprovals` store the mapping between the owner to the operators that he/she has approved. |
| @param | `from` | `ByStr20` | Address of the holder whose balance is decreased. |
| @param | `to` | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `tokenId` | `Uint256` | Token id of the new token. |
| @param | `value` | `Uint128` | Number of tokens the holder balance is decreased by and match what the recipient balance is increased by. |

|  | Name | Description | Event Parameters
|--|--|--|--|
| eventName | `TransferSingleSuccess` | event is successful. | `by`: `ByStr20`, `recipient`: `ByStr20`, `token`: `Uint256` |
| eventName | `Error` | event is not successful. | emit `code_token_exists` if the token already exists.<br/>emit `code_not_authorized` if the transition is called by the wrong user. |

<br/>

**5. BalanceOf**

```ocaml
(* Count the number of NFTs assigned to a token owner *)
transition balanceOf(address: ByStr20)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | `address` | `ByStr20` | Address of a token owner. |

|  | Name | Description | Event Parameters
|--|--|--|--|
| eventName | `BalanceOfSuccess` | event is successful. | `bal`: `Uint128` |
| eventName | `Error` | event is not successful. | emit `code_unexpected_error` if there's an issue with the token owner's balance. |

<br/>

## V. Existing Implementation(s)


* [NonfungibleToken](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-1.md)


<br/>

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

