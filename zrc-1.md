
|  ZRC | Title | Status| Type | Author | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd)
|--|--|--|--| -- | -- | -- |
| 1  | Standard for Non Fungible Tokens | Draft | Meta  | Gareth Mensah <gareth@zilliqa.com> | 2019-09-20 | 2019-09-20 

## What are Non Fungible Tokens (NFT)?

A NFT, or Non Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is completely unique and non-interchangeable with other tokens.

## Abstract 

ZRC-1 defines a minimum interface a smart contract must implement to allow unique tokens to be managed, owned, and traded.


## Motivation

A standard for NFT can be serve as an interface for game creators to create kitties, cards or weapons; by institutions to create certifications, diplomas and identifications. Generally, NFTs can be used to represent unique and rare assets as a tokens.


### Specification

## Errror Codes
```
let code_success = Uint32 0
let code_failure = Uint32 1
let code_not_authorized = Uint32 2
let code_not_found = Uint32 4
let code_bad_request = Uint32 5
let code_token_exists = Uint32 6
let code_unexpected_error = Uint32 9
let code_owner_not_right = Uint32 10
```

## Approve()
```
(* Approves an address to transfer the given token ID                   *)
(* @event emit _eventname "Approve" if successful                       *)
(* @param to: ByStr20 to be approved for the given token id             *)
(* @param tokenId: uint256 id of the token to be apporved               *)
transition approve(to: ByStr20, tokenId: Uint256)
```

## SetApprovalForAll()
```
(* Sets or unsets the approval of a given operator                      *)
(* @event emit _eventname "SetApprovalForAll" if successful             *)
(* @param address: to be set or unset as operator                       *)
(* @param approved: status of the approval to be set                    *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

## TransferFrom()
```
(* Transfer the ownership of a given token ID to another address      *)
(* @event emit _eventname "Transfer" if successful                    *)
(* @param from:     Current owner of the token                        *)
(* @param to:       Recipient address of the token                    *)
(* @param tokenI:d   uint256 id of the token to be transferred        *)
transition transferFrom(from: ByStr20, to: ByStr20, tokenId: Uint256)
```

## OwnerOf()
```
(* Get the owner of a particular tokenId                         *)
(* @event emit _eventname "OwnerOf" if successful                *)
transition ownerOf(tokenId: Uint256)
```

## BalanceOf()
```
(* Count all NFTs assigned to an owner                           *)
(* @event emit _eventname "BalanceOf" if successful              *)
transition balanceOf(address: ByStr20)
```

## Mint()
```
(* Mint new tokens.                                              *)
(* @event emit _eventname "Birth" if successful                  *)
(* @param to: address of the token recipient                     *)
(* @param key: token key of the new token                        *)
transition mint(to: ByStr20, key: String)
```

## Existing Implementations

ZRCs should be written in [markdown](https://en.wikipedia.org/wiki/Markdown) format.
Image files should be included in a subdirectory of the `assets` folder for that ZRC as follows: `assets/zrc-N` (where **N** is to be replaced with the ZRC number). When linking to an image in the ZRC, use relative links such as `../assets/zrc-1/image.png`.

## ZRC Header Preamble

Each ZRC must begin with an [RFC 822](https://www.ietf.org/rfc/rfc822.txt) style header preamble, preceded and followed by three hyphens (`---`). This header is also termed ["front matter" by Jekyll](https://jekyllrb.com/docs/front-matter/). The headers must appear in the following order. Headers marked with "*" are optional and are described below. All other headers are required.

` zrc:` *ZRC number* (this is determined by the ZRC editor)

` title:` *ZRC title*

` author:` *a list of the author's or authors' name(s) and/or username(s), or name(s) and email(s). *

` * discussions-to:` *a url pointing to the official discussion thread*

` status:` *Draft | Ready | Approved| Implemented*

`* review-period-end:` *date review period ends*

` type:` *Standards Track | Meta*

` created:` *date created on*

` * updated:` *comma separated list of dates*

` * requires:` *ZRC number(s)*

` * replaces:` *ZRC number(s)*

` * superseded-by:` *ZRC number(s)*

` * resolution:` *a url pointing to the resolution of this ZRC*

Headers that permit lists must separate elements with commas.

Headers requiring dates will always do so in the format of ISO 8601 (yyyy-mm-dd).

#### `author` header

The `author` header optionally lists the names, email addresses or usernames of the authors/owners of the ZRC. Those who prefer anonymity may use a username only, or a first name and a username. The format of the author header value must be:

> Random J. User &lt;address@dom.ain&gt;

or

> Random J. User (@username)

if the email address or GitHub username is included, and

> Random J. User

if the email address is not given.

#### `resolution` header

The `resolution` header can be used to point to a URL where the pronouncement about the ZRC is made.

#### `discussions-to` header

While a ZRC is a draft, a `discussions-to` header will indicate the mailing list or URL where the ZRC is being discussed. As mentioned above, examples for places to discuss your ZRC include [Zilliqa Discord Channel](https://discord.gg/8tpGXrB), an issue in this repo or in a fork of this repo.

No `discussions-to` header is necessary if the ZRC is being discussed privately with the author.

As a single exception, `discussions-to` cannot point to GitHub pull requests.

#### `type` header

The `type` header specifies the type of ZRC: Standards Track or Meta. 

#### `created` header

The `created` header records the date that the ZRC was assigned a number. Both headers should be in yyyy-mm-dd format, e.g. 2001-08-14.

#### `updated` header

The `updated` header records the date(s) when the ZIP was updated with "substantial" changes. 

#### `requires` header

ZRCs may have a `requires` header, indicating the ZRC numbers that this ZRC depends on.

#### `superseded-by` and `replaces` headers

ZRCs may also have a `superseded-by` header indicating that a ZRC has been rendered obsolete by a later document; the value is the number of the ZRC that replaces the current document. The newer ZRC must have a `replaces` header containing the number of the ZRC that it rendered obsolete.

## Auxiliary Files

ZRCs may include auxiliary files such as diagrams. Such files must be named ZRC-XXXX-Y.ext, where “XXXX” is the ZRC number, “Y” is a serial number (starting at 1), and “ext” is replaced by the actual file extension (e.g. “png”).

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

