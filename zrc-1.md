
|  ZRC | Title | Status| Type | Author | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd)
|--|--|--|--| -- | -- | -- |
| 1  | Standard for Non Fungible Tokens | Draft | Meta  | Gareth Mensah <gareth@zilliqa.com> | 2019-09-20 | 2019-09-20 

<br/><br/>  
## What are Non Fungible Tokens (NFT)?

A NFT, or Non Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is completely unique and non-interchangeable with other tokens.

<br/><br/> 
## Abstract 

ZRC-1 defines a minimum interface a smart contract must implement to allow unique tokens to be managed, owned, and traded.

<br/><br/> 
## Motivation

A standard for NFT can be serve as an interface for game creators to create kitties, cards or weapons; by institutions to create certifications, diplomas and identifications. Generally, NFTs can be used to represent unique and rare assets as a tokens.

<br/><br/> 
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

<br/><br/> 
**Approve()**

```ocaml
(* Approves an address to transfer the given token ID *)
transition approve(to: ByStr20, tokenId: Uint256)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | to | ByStr20 | Address to be approved for the given token id. |
| @param | tokenId | Uint256 | Id of the token to be approved. |

|  | Name | Description
|--|--|--|
| eventName | "Approve" | emit event if the call is successful. |
  
<br/><br/> 
**SetApprovalForAll()**

```ocaml
(* Sets or unsets the approval of a given operator *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | to | ByStr20 | Address to be set or unset as operator. |
| @param | approved | Bool | Status of the approval to be set. |

|  | Name | Description
|--|--|--|
| eventName | "SetApprovalForAll" | emit event if the call is successful. |

<br/><br/> 
**TransferFrom()**

```ocaml
(* Transfer the ownership of a given token ID to another address *)
transition transferFrom(from: ByStr20, to: ByStr20, tokenId: Uint256)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | from | ByStr20 | Current owner of the token. |
| @param | to | ByStr20 | Recipient address of the token. |
| @param | tokenId | Uint256 | Id of the token to be transferred. |

|  | Name | Description
|--|--|--|
| eventName | "Transfer" | emit event if the call is successful. |

<br/><br/> 
**OwnerOf()**

```ocaml
(* Get the owner of a particular tokenId *)
transition ownerOf(tokenId: Uint256)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | tokenId | Uint256 | Id of a given token. |

|  | Name | Description
|--|--|--|
| eventName | "OwnerOf" | emit event if the call is successful. |

<br/><br/> 
**BalanceOf()**

```ocaml
(* Count the number of NFTs assigned to an owner *)
transition balanceOf(address: ByStr20)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | address | ByStr20 | Address of an owner. |

|  | Name | Description
|--|--|--|
| eventName | "BalanceOf" | emit event if the call is successful. |

<br/><br/> 
**Mint()**

```ocaml
(* Mint new tokens *)
transition mint(to: ByStr20, key: String)
```

|  | Name | Type| Description
|--|--|--|--|
| @param | to | ByStr20 | Address of the token recipient. |
| @param | key | String | Token key of the new token. |

|  | Name | Description
|--|--|--|
| eventName | "Birth" | emit event if the call is successful. |

<br/><br/> 
## Existing Implementations

ZRCs should be written in [markdown](https://en.wikipedia.org/wiki/Markdown) format.
Image files should be included in a subdirectory of the `assets` folder for that ZRC as follows: `assets/zrc-N` (where **N** is to be replaced with the ZRC number). When linking to an image in the ZRC, use relative links such as `../assets/zrc-1/image.png`.

<br/><br/> 
## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
