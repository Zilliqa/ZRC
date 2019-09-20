
|  ZRC | Title | Status| Type | Author | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd)
|--|--|--|--| -- | -- | -- |
| 1  | Standard for Non Fungible Tokens | Draft | Meta  | Gareth Mensah <gareth@zilliqa.com> | 2019-09-20 | 2019-09-20 


## What are Non Fungible Tokens (NFT)?

A NFT, or Non Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is completely unique and non-interchangeable with other tokens.

## Abstract 

ZRC-1 defines a minimum interface a smart contract must implement to allow unique tokens to be managed, owned, and traded.


## Motivation

A standard for NFT can be serve as an interface for game creators to create kitties, cards or weapons; by institutions to create certifications, diplomas and identifications. Generally, NFTs can be used to represent unique and rare assets as a tokens.


## Specification

**Errror Codes**
```ocaml
let code_success = Uint32 0
let code_failure = Uint32 1
let code_not_authorized = Uint32 2
let code_not_found = Uint32 4
let code_bad_request = Uint32 5
let code_token_exists = Uint32 6
let code_unexpected_error = Uint32 9
let code_owner_not_right = Uint32 10
```

**Approve()**
```ocaml
(* Approves an address to transfer the given token ID                   *)
(* @event emit _eventname "Approve" if successful                       *)
(* @param to: ByStr20 to be approved for the given token id             *)
(* @param tokenId: uint256 id of the token to be apporved               *)
transition approve(to: ByStr20, tokenId: Uint256)
```

**SetApprovalForAll()**
```ocaml
(* Sets or unsets the approval of a given operator                      *)
(* @event emit _eventname "SetApprovalForAll" if successful             *)
(* @param address: to be set or unset as operator                       *)
(* @param approved: status of the approval to be set                    *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

**TransferFrom()**
```ocaml
(* Transfer the ownership of a given token ID to another address      *)
(* @event emit _eventname "Transfer" if successful                    *)
(* @param from:     Current owner of the token                        *)
(* @param to:       Recipient address of the token                    *)
(* @param tokenI:d   uint256 id of the token to be transferred        *)
transition transferFrom(from: ByStr20, to: ByStr20, tokenId: Uint256)
```

**OwnerOf()**
```ocaml
(* Get the owner of a particular tokenId                         *)
(* @event emit _eventname "OwnerOf" if successful                *)
transition ownerOf(tokenId: Uint256)
```

**BalanceOf()**
```ocaml
(* Count all NFTs assigned to an owner                           *)
(* @event emit _eventname "BalanceOf" if successful              *)
transition balanceOf(address: ByStr20)
```

**Mint()**
```ocaml
(* Mint new tokens.                                              *)
(* @event emit _eventname "Birth" if successful                  *)
(* @param to: address of the token recipient                     *)
(* @param key: token key of the new token                        *)
transition mint(to: ByStr20, key: String)
```

## Existing Implementations

ZRCs should be written in [markdown](https://en.wikipedia.org/wiki/Markdown) format.
Image files should be included in a subdirectory of the `assets` folder for that ZRC as follows: `assets/zrc-N` (where **N** is to be replaced with the ZRC number). When linking to an image in the ZRC, use relative links such as `../assets/zrc-1/image.png`.


## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

