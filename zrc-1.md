
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

## Transferring ZRC Ownership

It occasionally becomes necessary to transfer ownership of ZRCs to a new champion. In general, we'd like to retain the original author as a co-author of the transferred ZRC, but that's really up to the original author. A good reason to transfer ownership is because the original author no longer has the time or interest in updating it or following through with the ZRC process, or has fallen off the face of the 'net (i.e. is unreachable or isn't responding to email). A bad reason to transfer ownership is because you don't agree with the direction of the ZRC. We try to build consensus around a ZRC, but if that's not possible, you can always submit a competing ZRC.

If you are interested in assuming ownership of a ZRC, send a message asking to take over, addressed to both the original author and the ZRC editor. If the original author doesn't respond to email in a timely manner, the ZRC editor will make a unilateral decision (it's not like such decisions can't be reversed :)).

## ZRC Editors

The current ZRC editors are

` * Jacob Johannsen (@jjcnn)`

` * Vaivaswatha Nagaraj (@vaivaswatha)`

` * Edison Lim (@edisonljh)`

` * Han Wen Chua (@evesnow91)`

` * Anton Trunov (anton-trunov)`

` * Amrit Kumar (@AmritKumar)`


## ZRC Editor Responsibilities

For each new ZRC that comes in, an editor does the following:

- Read the ZIP to check if it is ready: sound and complete. The ideas must make technical sense, even if they don't seem likely to get to final status.
- The title should accurately describe the content.
- Check the ZRC for language (spelling, grammar, sentence structure, etc.), markup (Github flavored Markdown), code style

If the ZRC isn't ready, the editor will send it back to the author for revision, with specific instructions.

Once the ZRC is ready for the repository, the ZRC editor will:

- Assign a ZRC number (generally the PR number or, if preferred by the author, the Issue # if there was discussion in the Issues section of this repository about this ZRC)

- Merge the corresponding pull request

- Send a message back to the ZRC author with the next step.

Many ZRCs are written and maintained by developers with write access to the Zilliqa codebase. The ZRC editors monitor ZRC changes, and correct any structure, grammar, spelling, or markup mistakes we see.

The editors don't pass judgment on ZRCs. We merely do the administrative & editorial part.

## History

This document was derived heavily from [Ethereum's EIP-1](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1.md) which in turn was derived from [Bitcoin's BIP-0001](https://github.com/bitcoin/bips/blob/master/bip-0001.mediawiki) written by Amir Taaki which in turn was derived from [Python's PEP-0001]. In many places text was simply copied and modified. Although the PEP-0001 text was written by Barry Warsaw, Jeremy Hylton, and David Goodger, they are not responsible for its use in the Zilliqa Reference Contracts, and should not be bothered with technical questions specific to Zilliqa or the ZRC. Please direct all comments to the ZRC editors.


## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

