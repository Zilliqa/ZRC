| ZRC | Title                       |  Status  |   Type   | Author                                                                      | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| :-: | :-------------------------- | :------: | :------: | :-------------------------------------------------------------------------- | :------------------: | :------------------: |
|  6  | Non-Fungible Token Standard | Approved | Standard | Neuti Yoo<br/><noel@zilliqa.com> <br/> Jun Hao Tan<br/><junhao@zilliqa.com> |      2021-10-01      |      2022-01-05      |

## Table of Contents

- [I. What are NFTs and NFT royalties?](#i-what-are-nfts-and-nft-royalties)
- [II. Abstract](#ii-abstract)
- [III. Motivation](#iii-motivation)
- [IV. Specification](#iv-specification)
  - [A. Immutable Parameters](#a-immutable-parameters)
  - [B. Mutable Fields](#b-mutable-fields)
  - [C. Roles](#c-roles)
  - [D. Error Codes](#d-error-codes)
  - [E. Transitions](#e-transitions)
- [V. Implementations](#v-implementations)
- [VI. References](#vi-references)
- [VII. Copyright](#vii-copyright)

## I. What are NFTs and NFT royalties?

An NFT, or Non-Fungible Token is a digital asset. Unlike fungible tokens, each token is unique and non-interchangeable.

NFT royalties give an NFT creator or rights holder a percentage of the sale price each time the NFT is sold or re-sold.

## II. Abstract

ZRC-6 defines a new minimum interface of an NFT smart contract while improving upon ZRC-1.

The main advantages of this standard are:

1. ZRC-6 standardizes royalty information retrieval with a percentage-based royalty fee model and unit-less royalty payments to a single address. Funds will be paid for secondary sales only if a marketplace chooses to implement royalty payments. Marketplace contracts should transfer the actual funds.

2. ZRC-6 includes base token URI to support token URI with the concatenation of base token URI and token ID. A token URI is an HTTP or IPFS URL. This URL must return a JSON blob of data with the metadata for the NFT when queried.

3. ZRC-6 is designed for remote state read ([`x <- & c.f`](https://scilla.readthedocs.io/en/latest/scilla-in-depth.html?#remote-fetches)) such that logic to get data from a ZRC-6 contract is straightforward. ZRC-6 exposes immutable parameters via mutable fields and includes only transitions that mutate the state of the contract.

4. ZRC-6 is designed for failure. Therefore minting, burning, and token transfers are pausable.

5. ZRC-6 features batch operations for minting, burning and token transfers such that only a single transaction is required.

6. ZRC-6 features a single transition for token transfer with destination validation. The transition can be called by a token owner, a spender, or an operator. ZRC-6 prevents transferring tokens to the zero address or the address of a ZRC-6 contract.

7. ZRC-6 is compatible with ZRC-X since every callback name is prefixed with `ZRC6_`.

## III. Motivation

1. Many of the largest NFT marketplaces have implemented incompatible royalty payment solutions.

2. The concatenated token URI can reduce gas cost and is more optimal for contract state.

3. Using callbacks to get data can complicate the logic easily. Unlike immutable parameters, mutable fields are available for remote state read.

4. Without an emergency stop mechanism, it's hard to respond to bugs and vulnerabilities gracefully.

5. Without batch operations, it can be very inefficient to transfer or mint multiple tokens with multiple transactions.

6. ZRC-1 includes `Transfer` and `TransferFrom` for the token transfer. The two transitions have the same type signature and the only difference is the access control. This has added unnecessary complexity. ZRC-1 does not validate the destination for token transfer and it is not safe.

7. The ZRC-1 and ZRC-2 contracts can share the same callback names. Contracts must have unique names for callback transitions.

## IV. Specification

### A. Immutable Parameters

| Name                     | Type      | Description                                                                                                     |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------------------------- |
| `initial_contract_owner` | `ByStr20` | Address of contract owner. It must not be the zero address. i.e., `0x0000000000000000000000000000000000000000`. |
| `initial_base_uri`       | `String`  | Base token URI. e.g. `https://creatures-api.zilliqa.com/api/creature/`.                                         |
| `name`                   | `String`  | NFT name. It must not be an empty string.                                                                       |
| `symbol`                 | `String`  | NFT symbol. It must not be an empty string.                                                                     |

### B. Mutable Fields

| Name                           | Type                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Required |
| ------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `is_paused`                    | `Bool`                           | `True` if the contract is paused. Otherwise, `False`. `is_paused` defaults to `False`.                                                                                                                                                                                                                                                                                                                                                                                                                           |          |
| `contract_owner`               | `ByStr20`                        | Address of the contract owner. `contract_owner` defaults to `initial_contract_owner`.                                                                                                                                                                                                                                                                                                                                                                                                                            |    ✓     |
| `royalty_recipient`            | `ByStr20`                        | Address to send royalties to. `royalty_recipient` defaults to `initial_contract_owner`.                                                                                                                                                                                                                                                                                                                                                                                                                          |          |
| `royalty_fee_bps`              | `Uint128`                        | Royalty fee BPS. e.g. `1` = 0.01%, `10000` = 100%. `royalty_fee_bps` ranges from `1` to `10000` and defaults to `1000`. <br/><br/> When calculating the royalty amount, you must only use division to avoid integer overflow. <br/><br/> <b>`royalty amount = sale price ÷ ( 10000 ÷ royalty fee bps )`</b> <br/><br/> e.g. if `royalty_fee_bps` is `1000` (10%) and sale price is `999`, royalty amount is `99`.                                                                                                |          |
| `base_uri`                     | `String`                         | Base token URI. e.g. if `base_uri` is `https://creatures-api.zilliqa.com/api/creature/` and `token_id` is `1`, token URI is `https://creatures-api.zilliqa.com/api/creature/1`. <br/><br/> If there is no specific token URI for a token in `token_uris`, the concatenated token URI is the token URI. <br/><br/> If every token has its own token URI, `base_uri` can be an empty string. <br/><br/> `base_uri` defaults to `initial_base_uri`. This field must not be mutated unless there is a strong reason. |    ✓     |
| `token_uris`                   | `Map Uint256 String`             | Mapping from token ID to its specific token URI. When it is required to set a specific token URI per token, use this field. <br/><br/> If there is a specific token URI for a token in `token_uris`, the URI is the token URI. <br/><br/> If every token does not have its own token URI, `token_uris` can be an empty map.                                                                                                                                                                                      |    ✓     |
| `minters`                      | `Map ByStr20 Bool`               | Set of minters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |    ✓     |
| `token_owners`                 | `Map Uint256 ByStr20`            | Mapping from token ID to its owner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |    ✓     |
| `spenders`                     | `Map Uint256 ByStr20`            | Mapping from token ID to a spender.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |    ✓     |
| `operators`                    | `Map ByStr20 (Map ByStr20 Bool)` | Mapping from token owner to set of operators.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |    ✓     |
| `token_id_count`               | `Uint256`                        | The total number of tokens minted. Defaults to `0`.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |    ✓     |
| `balances`                     | `Map ByStr20 Uint256`            | Mapping from token owner to the number of existing tokens.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |    ✓     |
| `total_supply`                 | `Uint256`                        | The total number of existing tokens. Defaults to `0`.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |    ✓     |
| `token_name`                   | `String`                         | Token name. Defaults to `name`. This field is for remote state read. This field must not be mutated.                                                                                                                                                                                                                                                                                                                                                                                                             |    ✓     |
| `token_symbol`                 | `String`                         | Token symbol. Defaults to `symbol`. This field is for remote state read. This field must not be mutated.                                                                                                                                                                                                                                                                                                                                                                                                         |    ✓     |
| `contract_ownership_recipient` | `ByStr20`                        | Address of the contract ownership recipient. Defaults to zero address.                                                                                                                                                                                                                                                                                                                                                                                                                                           |          |

### C. Roles

| Name                           | Description                                                                                                                                                                                                                                             | Required |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `contract_owner`               | The contract owner can: <ul><li>pause/unpause the contract</li><li>set contract ownership recipient</li><li>set royalty recipient</li><li>set royalty fee BPS</li><li>set base URI</li><li>add/remove a minter</li></ul>                                |    ✓     |
| `royalty_recipient`            | The royalty recipient gets a royalty amount each time the NFT is sold or re-sold. Initially, the royalty recipient is the contract owner.                                                                                                               |          |
| `minter`                       | A minter can mint tokens. Initially, the contract owner is a minter.                                                                                                                                                                                    |    ✓     |
| `token_owner`                  | Each token has an token owner. A token owner can: <ul><li>transfer a token </li><li>burn a token</li><li>add/remove a spender of a token</li><li>add/remove an operator</li></ul>                                                                       |    ✓     |
| `spender`                      | On behalf of the token owner, a spender can transfer a token. There can only be one spender per token at any given time.                                                                                                                                |    ✓     |
| `operator`                     | On behalf of the token owner, an operator can: <ul><li>transfer a token </li><li>burn a token <i>(optional)</i></li><li>add/remove a spender of a token <i>(optional)</i></li></ul> An operator is not bound to a single token, unlike a spender.       |    ✓     |
| `contract_ownership_recipient` | If the contract owner wants to transfer contract ownership to someone, the contract owner can set the person as the contract ownership recipient. The contract ownership recipient can accept the contract ownership and become the new contract owner. |          |

| Transition                                                                    | `contract_owner` | `minter` | `token_owner` | `spender` | `operator` | `contract_ownership_recipient` |
| ----------------------------------------------------------------------------- | :--------------: | :------: | :-----------: | :-------: | :--------: | :----------------------------: |
| [`Pause`](#1-pause-optional)                                                  |        ✓         |          |               |           |            |                                |
| [`Unpause`](#2-unpause-optional)                                              |        ✓         |          |               |           |            |                                |
| [`SetRoyaltyRecipient`](#3-setroyaltyrecipient-optional)                      |        ✓         |          |               |           |            |                                |
| [`SetRoyaltyFeeBPS`](#4-setroyaltyfeebps-optional)                            |        ✓         |          |               |           |            |                                |
| [`SetBaseURI`](#5-setbaseuri-optional)                                        |        ✓         |          |               |           |            |                                |
| [`Mint`](#6-mint)                                                             |                  |    ✓     |               |           |            |                                |
| [`BatchMint`](#7-batchmint-optional)                                          |                  |    ✓     |               |           |            |                                |
| [`Burn`](#8-burn-optional)                                                    |                  |          |       ✓       |           |     ✓      |                                |
| [`BatchBurn`](#9-batchburn-optional)                                          |                  |          |       ✓       |           |     ✓      |                                |
| [`AddMinter`](#10-addminter)                                                  |        ✓         |          |               |           |            |                                |
| [`RemoveMinter`](#11-removeminter)                                            |        ✓         |          |               |           |            |                                |
| [`SetSpender`](#12-setspender)                                                |                  |          |       ✓       |           |     ✓      |                                |
| [`AddOperator`](#13-addoperator)                                              |                  |          |       ✓       |           |            |                                |
| [`RemoveOperator`](#14-removeoperator)                                        |                  |          |       ✓       |           |            |                                |
| [`TransferFrom`](#15-transferfrom)                                            |                  |          |       ✓       |     ✓     |     ✓      |                                |
| [`BatchTransferFrom`](#16-batchtransferfrom-optional)                         |                  |          |       ✓       |     ✓     |     ✓      |                                |
| [`SetContractOwnershipRecipient`](#17-setcontractownershiprecipient-optional) |        ✓         |          |               |           |            |                                |
| [`AcceptContractOwnership`](#18-acceptcontractownership-optional)             |                  |          |               |           |            |               ✓                |

### D. Error Codes

The NFT contract must define the following constants for use as error codes for the `Error` event.

| Name                                 | Type    |  Code | Description                                                          | Required |
| ------------------------------------ | ------- | ----: | -------------------------------------------------------------------- | :------: |
| `NotPausedError`                     | `Int32` |  `-1` | Emit when the contract is not paused.                                |          |
| `PausedError`                        | `Int32` |  `-2` | Emit when the contract is paused.                                    |          |
| `SelfError`                          | `Int32` |  `-3` | Emit when the address is self.                                       |    ✓     |
| `NotContractOwnerError`              | `Int32` |  `-4` | Emit when the address is not a contract owner.                       |    ✓     |
| `NotTokenOwnerError`                 | `Int32` |  `-5` | Emit when the address is not a token owner.                          |    ✓     |
| `NotMinterError`                     | `Int32` |  `-6` | Emit when the address is not a minter.                               |    ✓     |
| `NotOwnerOrOperatorError`            | `Int32` |  `-7` | Emit when the address is neither a token owner nor a token operator. |    ✓     |
| `MinterNotFoundError`                | `Int32` |  `-8` | Emit when the minter is not found.                                   |    ✓     |
| `MinterFoundError`                   | `Int32` |  `-9` | Emit when the minter is found.                                       |    ✓     |
| `SpenderFoundError`                  | `Int32` | `-10` | Emit when the spender is found.                                      |    ✓     |
| `OperatorNotFoundError`              | `Int32` | `-11` | Emit when the operator is not found.                                 |    ✓     |
| `OperatorFoundError`                 | `Int32` | `-12` | Emit when the operator is found.                                     |    ✓     |
| `NotAllowedToTransferError`          | `Int32` | `-13` | Emit when `_sender` is not allowed to transfer the token.            |    ✓     |
| `TokenNotFoundError`                 | `Int32` | `-14` | Emit when the token is not found.                                    |    ✓     |
| `InvalidFeeBPSError`                 | `Int32` | `-15` | Emit when the fee bps does not range from `1` to `10000`.            |          |
| `ZeroAddressDestinationError`        | `Int32` | `-16` | Emit when the destination is the zero address.                       |    ✓     |
| `ThisAddressDestinationError`        | `Int32` | `-17` | Emit when the destination is `_this_address`.                        |    ✓     |
| `NotContractOwnershipRecipientError` | `Int32` | `-18` | Emit when the address is not a contract ownership recipient.         |          |

### E. Transitions

|     | Transition                                                                                               | Required |
| :-: | -------------------------------------------------------------------------------------------------------- | :------: |
|  1  | [`Pause()`](#1-pause-optional)                                                                           |          |
|  2  | [`Unpause()`](#2-unpause-optional)                                                                       |          |
|  3  | [`SetRoyaltyRecipient(to: ByStr20)`](#3-setroyaltyrecipient-optional)                                    |          |
|  4  | [`SetRoyaltyFeeBPS(fee_bps: Uint128)`](#4-setroyaltyfeebps-optional)                                     |          |
|  5  | [`SetBaseURI(uri: String)`](#5-setbaseuri-optional)                                                      |          |
|  6  | [`Mint(to: ByStr20, token_uri: String)`](#6-mint)                                                        |    ✓     |
|  7  | [`BatchMint(to_token_uri_pair_list: List (Pair ByStr20 String)`](#7-batchmint-optional)                  |          |
|  8  | [`Burn(token_id: Uint256)`](#8-burn-optional)                                                            |          |
|  9  | [`BatchBurn(token_id_list: List Uint256)`](#9-batchburn-optional)                                        |          |
| 10  | [`AddMinter(to: ByStr20)`](#10-addminter)                                                                |    ✓     |
| 11  | [`RemoveMinter(to: ByStr20)`](#11-removeminter)                                                          |    ✓     |
| 12  | [`SetSpender(to: ByStr20, token_id: Uint256)`](#12-setspender)                                           |    ✓     |
| 13  | [`AddOperator(to: ByStr20)`](#13-addoperator)                                                            |    ✓     |
| 14  | [`RemoveOperator(to: ByStr20)`](#14-removeoperator)                                                      |    ✓     |
| 15  | [`TransferFrom(to: ByStr20, token_id: Uint256)`](#15-transferfrom)                                       |    ✓     |
| 16  | [`BatchTransferFrom(to_token_id_pair_list: List (Pair ByStr20 Uint256)`](#16-batchtransferfrom-optional) |          |
| 17  | [`SetContractOwnershipRecipient(to: ByStr20)`](#17-setcontractownershiprecipient-optional)               |          |
| 18  | [`AcceptContractOwnership()`](#18-acceptcontractownership-optional)                                      |          |

#### 1. `Pause` (Optional)

Pauses the contract. Use this only if things are going wrong ('circuit breaker').

**Requirements:**

- The contract must not be paused. Otherwise, it must throw `PausedError`.
- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.

**Messages:**

|        | Name                 | Description                                                             | Callback Parameters                                           |
| ------ | -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `_tag` | `ZRC6_PauseCallback` | Provide the sender a boolean for whether the contract is paused or not. | `is_paused` : `Bool`<br/> `True` if paused, otherwise `False` |

**Events:**

|              | Name    | Description                   | Event Parameters                                                               |
| ------------ | ------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `_eventname` | `Pause` | The contract has been paused. | <ul><li>`is_paused` : `Bool`<br/>`True` if paused, otherwise `False`</li></ul> |

#### 2. `Unpause` (Optional)

Unpauses the contract.

**Requirements:**

- The contract must be paused. Otherwise, it must throw `NotPausedError`.
- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.

**Messages:**

|        | Name                   | Description                                                             | Callback Parameters                                           |
| ------ | ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `_tag` | `ZRC6_UnpauseCallback` | Provide the sender a boolean for whether the contract is paused or not. | `is_paused` : `Bool`<br/> `True` if paused, otherwise `False` |

**Events:**

|              | Name      | Description                     | Event Parameters                                                               |
| ------------ | --------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `_eventname` | `Unpause` | The contract has been unpaused. | <ul><li>`is_paused` : `Bool`<br/>`True` if paused, otherwise `False`</li></ul> |

#### 3. `SetRoyaltyRecipient` (Optional)

Sets `to` as the royalty recipient.

**Arguments:**

| Name | Type      | Description                         |
| ---- | --------- | ----------------------------------- |
| `to` | `ByStr20` | Address that royalties are sent to. |

**Requirements:**

- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.
- `to` must not be the zero address. Otherwise, it must throw `ZeroAddressDestinationError`.
- `to` must not be `_this_address`. Otherwise, it must throw `ThisAddressDestinationError`.

**Messages:**

|        | Name                               | Description                                          | Callback Parameters                                   |
| ------ | ---------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyRecipientCallback` | Provide the sender the address of royalty recipient. | `to` : `ByStr20`<br/>Address of the royalty recipient |

**Events:**

|              | Name                  | Description                         | Event Parameters                                                        |
| ------------ | --------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `_eventname` | `SetRoyaltyRecipient` | Royalty recipient has been updated. | <ul><li>`to` : `ByStr20`<br/>Address of the royalty recipient</li></ul> |

#### 4. `SetRoyaltyFeeBPS` (Optional)

Sets `fee_bps` as royalty fee bps.

**Arguments:**

| Name      | Type      | Description                                         |
| --------- | --------- | --------------------------------------------------- |
| `fee_bps` | `Uint128` | Royality fee BPS. e.g. `1` = 0.01%, `10000` = 100%. |

**Requirements:**

- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.
- `fee_bps` must range from `1` to `10000`. Otherwise, it must throw `InvalidFeeBPSError`.

**Messages:**

|        | Name                            | Description                             | Callback Parameters                               |
| ------ | ------------------------------- | --------------------------------------- | ------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyFeeBPSCallback` | Provide the sender the royalty fee BPS. | `royalty_fee_bps` : `Uint128`<br/>Royalty Fee BPS |

**Events:**

|              | Name               | Description                       | Event Parameters                                                    |
| ------------ | ------------------ | --------------------------------- | ------------------------------------------------------------------- |
| `_eventname` | `SetRoyaltyFeeBPS` | Royalty fee BPS has been updated. | <ul><li>`royalty_fee_bps` : `Uint128`<br/>Royalty Fee BPS</li></ul> |

#### 5. `SetBaseURI` (Optional)

Sets `uri` as the base URI. Use this only if there is a strong reason to change the `base_uri`.

**Arguments:**

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `uri` | `String` | Base URI.   |

**Requirements:**

- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.

**Messages:**

|        | Name                      | Description                      | Callback Parameters                |
| ------ | ------------------------- | -------------------------------- | ---------------------------------- |
| `_tag` | `ZRC6_SetBaseURICallback` | Provide the sender the base URI. | `base_uri` : `String`<br/>Base URI |

**Events:**

|              | Name         | Description                | Event Parameters                                     |
| ------------ | ------------ | -------------------------- | ---------------------------------------------------- |
| `_eventname` | `SetBaseURI` | Base URI has been updated. | <ul><li>`base_uri` : `String`<br/>Base URI</li></ul> |

#### 6. `Mint`

Mints a token with a specific `token_uri` and transfers it to `to`.
Pass empty string to `token_uri` to use the concatenated token URI. i.e. `<base_uri><token_id>`.

**Arguments:**

| Name        | Type      | Description                                         |
| ----------- | --------- | --------------------------------------------------- |
| `to`        | `ByStr20` | Address of the recipient of the token to be minted. |
| `token_uri` | `String`  | URI of a token.                                     |

**Requirements:**

- The contract must not be paused. Otherwise, it must throw `PausedError`.
- `to` must not be the zero address. Otherwise, it must throw `ZeroAddressDestinationError`
- `to` must not be `_this_address`. Otherwise, it must throw `ThisAddressDestinationError`
- `_sender` must be a minter. Otherwise, it must throw `NotMinterError`.

**Messages:**

|        | Name                       | Description                                                     | Callback Parameters                                                                                                                                                     |
| ------ | -------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract.           |                                                                                                                                                                         |
| `_tag` | `ZRC6_MintCallback`        | Provide the sender the address of token recipient and token ID. | <ul><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li><li>`token_uri` : `String`<br/>URI of a token</li></ul> |

**Events:**

|              | Name   | Description                                | Event Parameters                                                                                                                                                         |
| ------------ | ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `Mint` | Token has been minted with a specific URI. | <ul><li> `to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li><li>`token_uri` : `String`<br/>URI of a token</li></ul> |

#### 7. `BatchMint` (Optional)

Mints multiple tokens with `token_uri`s and transfers them to multiple `to`s.
Pass empty string to `token_uri` to use the concatenated token URI. i.e. `<base_uri><token_id>`.

**Arguments:**

| Name                     | Type                         | Description                                                                                                                                               |
| ------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to_token_uri_pair_list` | `List (Pair ByStr20 String)` | List of Pair (`to`, `token_uri`)<br/><br/><ul><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_uri` : `String`<br/>URI of a token</li></ul> |

**Requirements:**

- The contract must not be paused. Otherwise, it must throw `PausedError`.
- `to_list` must not include the zero address. Otherwise, it must throw `ZeroAddressDestinationError`
- `to_list` must not include `_this_address`. Otherwise, it must throw `ThisAddressDestinationError`
- `_sender` must be a minter. Otherwise, it must throw `NotMinterError`.

**Messages:**

|        | Name                     | Description        | Callback Parameters |
| ------ | ------------------------ | ------------------ | ------------------- |
| `_tag` | `ZRC6_BatchMintCallback` | An empty callback. |                     |

**Events:**

|              | Name        | Description                                       | Event Parameters                                                                                                                                                                                                             |
| ------------ | ----------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `BatchMint` | Multiple tokens have been minted with token URIs. | `to_token_uri_pair_list` : `List (Pair ByStr20 String)` <br/><br/> List of Pair (`to`, `token_uri`)<br/><br/><ul><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_uri` : `String`<br/>URI of a token</li></ul> |

#### 8. `Burn` (Optional)

Destroys `token_id`.

**Arguments:**

| Name       | Type      | Description                                     |
| ---------- | --------- | ----------------------------------------------- |
| `token_id` | `Uint256` | Unique ID of an existing token to be destroyed. |

**Requirements:**

- The contract must not be paused. Otherwise, it must throw `PausedError`.
- `token_id` must exist. Otherwise, it must throw `TokenNotFoundError`.
- `_sender` must be a token owner or an operator. Otherwise, it must throw `NotOwnerOrOperatorError`.

**Messages:**

|        | Name                | Description                                       | Callback Parameters                                                                                                                |
| ------ | ------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_BurnCallback` | Provide the sender the burn address and token ID. | <ul><li>`token_owner` : `ByStr20`<br/>Address of the token owner</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name   | Description            | Event Parameters                                                                                                                   |
| ------------ | ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Burn` | Token has been burned. | <ul><li>`token_owner` : `ByStr20`</br>Address of the token owner</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 9. `BatchBurn` (Optional)

Destroys `token_id_list`.

**Arguments:**

| Name            | Type           | Description                                    |
| --------------- | -------------- | ---------------------------------------------- |
| `token_id_list` | `List Uint256` | List of unique IDs of the NFT to be destroyed. |

**Requirements:**

- The contract must not be paused. Otherwise, it must throw `PausedError`.
- `token_id` must exist. Otherwise, it must throw `TokenNotFoundError`.
- `_sender` must be a token owner or an operator. Otherwise, it must throw `NotOwnerOrOperatorError`.

**Messages:**

|        | Name                     | Description        | Callback Parameters |
| ------ | ------------------------ | ------------------ | ------------------- |
| `_tag` | `ZRC6_BatchBurnCallback` | An empty callback. |                     |

**Events:**

Equivalent to multiple [`Burn`](#8-burn-optional) events.

#### 10. `AddMinter`

Adds `minter`.

**Arguments:**

| Name     | Type      | Description                    |
| -------- | --------- | ------------------------------ |
| `minter` | `ByStr20` | Address to be added as minter. |

**Requirements:**

- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.
- `minter` must not be already a minter. Otherwise, it must throw `MinterFoundError`.

**Messages:**

|        | Name                     | Description                                   | Callback Parameters                                                    |
| ------ | ------------------------ | --------------------------------------------- | ---------------------------------------------------------------------- |
| `_tag` | `ZRC6_AddMinterCallback` | Provide the sender the address of the minter. | <ul><li>`minter` : `ByStr20`<br/>Address that has been added</li></ul> |

**Events:**

|              | Name        | Description            | Event Parameters                                                       |
| ------------ | ----------- | ---------------------- | ---------------------------------------------------------------------- |
| `_eventname` | `AddMinter` | Minter has been added. | <ul><li>`minter` : `ByStr20`<br/>Address that has been added</li></ul> |

#### 11. `RemoveMinter`

Removes `minter`.

**Arguments:**

| Name     | Type      | Description                        |
| -------- | --------- | ---------------------------------- |
| `minter` | `ByStr20` | Address to be removed from minter. |

**Requirements:**

- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.
- `minter` must be already a minter. Otherwise, it must throw `MinterNotFoundError`.

**Messages:**

|        | Name                        | Description                                           | Callback Parameters                                                      |
| ------ | --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `_tag` | `ZRC6_RemoveMinterCallback` | Provide the sender the address that has been removed. | <ul><li>`minter` : `ByStr20`<br/>Address that has been removed</li></ul> |

**Events:**

|              | Name           | Description              | Event Parameters                                                         |
| ------------ | -------------- | ------------------------ | ------------------------------------------------------------------------ |
| `_eventname` | `RemoveMinter` | Minter has been removed. | <ul><li>`minter` : `ByStr20`<br/>Address that has been removed</li></ul> |

#### 12. `SetSpender`

Sets `spender` for `token_id`. To remove `spender` for a token, use `zero_address`. i.e., `0x0000000000000000000000000000000000000000`

**Arguments:**

| Name       | Type      | Description                                       |
| ---------- | --------- | ------------------------------------------------- |
| `spender`  | `ByStr20` | Address to be set as a spender for a given token. |
| `token_id` | `Uint256` | Unique ID of an existing token.                   |

**Requirements:**

- `token_id` must exist. Otherwise, it must throw `TokenNotFoundError`.
- `_sender` must be a token owner or an operator. Otherwise, it must throw `NotOwnerOrOperatorError`.
- `_sender` must not be `spender`. Otherwise, it must throw `SelfError`.
- `spender` must not be already a spender. Otherwise, it must throw `SpenderFoundError`.

**Messages:**

|        | Name                      | Description                                                 | Callback Parameters                                                                                                               |
| ------ | ------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_AddSpenderCallback` | Provide the sender the address of the spender and token ID. | <ul><li>`spender` : `ByStr20`<br/>Address that has been updated</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

**Events:**

|              | Name         | Description               | Event Parameters                                                                                                                  |
| ------------ | ------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `SetSpender` | Spender has been updated. | <ul><li>`spender` : `ByStr20`<br/>Address that has been updated</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

#### 13. `AddOperator`

Adds `operator` for `_sender`.

**Arguments:**

| Name       | Type      | Description                      |
| ---------- | --------- | -------------------------------- |
| `operator` | `ByStr20` | Address to be added as operator. |

**Requirements:**

- `_sender` must be the token owner. Otherwise, it must throw `NotTokenOwnerError`.
- `_sender` must not be `operator`. Otherwise, it must throw `SelfError`.
- `operator` must not be already an operator. Otherwise, it must throw `OperatorFoundError`.

**Messages:**

|        | Name                       | Description                                     | Callback Parameters                                    |
| ------ | -------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `_tag` | `ZRC6_AddOperatorCallback` | Provide the sender the address of the operator. | `operator` : `ByStr20`<br/>Address that has been added |

**Events:**

|              | Name          | Description              | Event Parameters                                                         |
| ------------ | ------------- | ------------------------ | ------------------------------------------------------------------------ |
| `_eventname` | `AddOperator` | Operator has been added. | <ul><li>`operator` : `ByStr20`<br/>Address that has been added</li></ul> |

#### 14. `RemoveOperator`

Removes `operator` for `_sender`.

**Arguments:**

| Name       | Type      | Description                          |
| ---------- | --------- | ------------------------------------ |
| `operator` | `ByStr20` | Address to be removed from operator. |

**Requirements:**

- `operator` must be already an operator. Otherwise, it must throw `OperatorNotFoundError`.

**Messages:**

|        | Name                          | Description                                           | Callback Parameters                                      |
| ------ | ----------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| `_tag` | `ZRC6_RemoveOperatorCallback` | Provide the sender the address that has been removed. | `operator` : `ByStr20`<br/>Address that has been removed |

**Events:**

|              | Name             | Description                | Event Parameters                                                           |
| ------------ | ---------------- | -------------------------- | -------------------------------------------------------------------------- |
| `_eventname` | `RemoveOperator` | Operator has been removed. | <ul><li>`operator` : `ByStr20`<br/>Address that has been removed</li></ul> |

#### 15. `TransferFrom`

Transfers `token_id` from the token owner to `to`.

**Arguments:**

| Name       | Type      | Description                               |
| ---------- | --------- | ----------------------------------------- |
| `to`       | `ByStr20` | Recipient address of the token.           |
| `token_id` | `Uint256` | Unique ID of the token to be transferred. |

**Requirements:**

- The contract must not be paused. Otherwise, it must throw `PausedError`.
- `to` must not be the zero address. Otherwise, it must throw `ZeroAddressDestinationError`.
- `to` must not be `_this_address`. Otherwise, it must throw `ThisAddressDestinationError`.
- `token_id` must exist. Otherwise, it must throw `TokenNotFoundError`.
- `_sender` must be a token owner, spender, or operator. Otherwise, it must throw `NotAllowedToTransferError`.
- `_sender` must not be `to`. Otherwise, it must throw `SelfError`.

**Messages:**

|        | Name                               | Description                                           | Callback Parameters                                                                                                                                                             |
| ------ | ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_RecipientAcceptTransferFrom` | Dummy callback to prevent invalid recipient contract. | <ul><li>`from` : `ByStr20`<br/>Address of the token owner</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |
| `_tag` | `ZRC6_TransferFromCallback`        | Provide the sender the result of the token transfer.  | <ul><li>`from` : `ByStr20`<br/>Address of the token owner</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name           | Description                 | Event Parameters                                                                                                                                                                |
| ------------ | -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferFrom` | Token has been transferred. | <ul><li>`from` : `ByStr20`<br/>Address of the token owner</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 16. `BatchTransferFrom` (Optional)

Transfers multiple `token_id` to multiple `to`.

**Arguments:**

| Name                    | Type                          | Description                                                                                                                                                    |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to_token_id_pair_list` | `List (Pair ByStr20 Uint256)` | List of Pair (`to`, `token_id`)<br/><br/><ul><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Requirements:**

- The contract must not be paused. Otherwise, it must throw `PausedError`.
- `to` must not be the zero address. Otherwise, it must throw `ZeroAddressDestinationError`.
- `to` must not be `_this_address`. Otherwise, it must throw `ThisAddressDestinationError`.
- `token_id` must exist. Otherwise, it must throw `TokenNotFoundError`.
- `_sender` must be a token owner, spender, or operator. Otherwise, it must throw `NotAllowedToTransferError`.
- `_sender` must not be `to`. Otherwise, it must throw `SelfError`.

**Messages:**

|        | Name                             | Description        | Callback Parameters |
| ------ | -------------------------------- | ------------------ | ------------------- |
| `_tag` | `ZRC6_BatchTransferFromCallback` | An empty callback. |                     |

**Events:**

Equivalent to multiple [`TransferFrom`](#15-transferfrom) events.

#### 17. `SetContractOwnershipRecipient` (Optional)

Sets `to` as the contract ownership recipient. To reset `contract_ownership_recipient`, use `zero_address`. i.e., `0x0000000000000000000000000000000000000000`.

**Arguments:**

| Name | Type      | Description                                            |
| ---- | --------- | ------------------------------------------------------ |
| `to` | `ByStr20` | Address to be set as the contract ownership recipient. |

**Requirements:**

- `_sender` must be the contract owner. Otherwise, it must throw `NotContractOwnerError`.
- `_sender` must not be `to`. Otherwise, it must throw `SelfError`.

**Messages:**

|        | Name                                         | Description                                                         | Callback Parameters                                              |
| ------ | -------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `_tag` | `ZRC6_SetContractOwnershipRecipientCallback` | Provide the sender the address of the contract ownership recipient. | `to` : `ByStr20`<br/>Address of the contract ownership recipient |

**Events:**

|              | Name                            | Description                                        | Event Parameters                                                                   |
| ------------ | ------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `_eventname` | `SetContractOwnershipRecipient` | The contract ownership recipient has been updated. | <ul><li>`to` : `ByStr20`<br/>Address of the contract ownership recipient</li></ul> |

#### 18. `AcceptContractOwnership` (Optional)

Sets `contract_ownership_recipient` as the contract owner.

**Requirements:**

- `_sender` must be the contract ownership recipient. Otherwise, it must throw `NotContractOwnershipRecipientError`.

**Messages:**

|        | Name                                   | Description                                                       | Callback Parameters                                                              |
| ------ | -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_AcceptContractOwnershipCallback` | Provide the sender the result of the contract ownership transfer. | <ul><li>`contract_owner` : `ByStr20`<br/>Address of the contract owner</li></ul> |

**Events:**

|              | Name                      | Description                              | Event Parameters                                                                 |
| ------------ | ------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `_eventname` | `AcceptContractOwnership` | Contract ownership has been transferred. | <ul><li>`contract_owner` : `ByStr20`<br/>Address of the contract owner</li></ul> |

## V. Implementations

[zrc6.scilla](../reference/zrc6.scilla) - a reference implementation

- includes [test cases](../tests/zrc6) written using [Zilliqa Isolated Server](https://hub.docker.com/r/zilliqa/zilliqa-isolated-server) and [Jest](https://jestjs.io/)
- MIT licensed

## VI. References

- [Ethereum Smart Contract Best Practices - General Philosophy](https://github.com/ConsenSys/smart-contract-best-practices/blob/master/docs/general_philosophy.md)
- [Ethereum Smart Contract Best Practices - Software Engineering Techniques](https://github.com/ConsenSys/smart-contract-best-practices/blob/master/docs/software_engineering.md)
- [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
- [EIP-1155: Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [OpenZeppelin ERC721.sol Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol)
- [OpenZeppelin IERC2981.sol Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/interfaces/IERC2981.sol)
- [OpenZeppelin ERC1155.sol Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol)
- [OpenZeppelin Pausable.sol Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/Pausable.sol)
- [OpenSea - Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [Ethereum Smart Contract Best Practices - Token Implementation Best Practice](https://github.com/ConsenSys/smart-contract-best-practices/blob/master/docs/tokens.md)
- [ZRC-1: Standard for Non Fungible Tokens](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-1.md)
- [ZRC issue #88 - ZRC contracts must have unique names for callback transitions](https://github.com/Zilliqa/ZRC/issues/88)
- [SWC Registry - Smart Contract Weakness Classification and Test Cases](https://swcregistry.io)

## VII. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
