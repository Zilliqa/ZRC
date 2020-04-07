| ZRC | Title                            | Status | Type     | Author                                                                                                         | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | -------------------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Non Fungible Tokens | Ready  | Standard | Gareth Mensah <gareth@zilliqa.com> <br> Edison Lim <edison@aqilliz.com> <br> Han Wen Chua <hanwen@zilliqa.com> | 2019-09-28           | 2020-02-01           |

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

| Name               | Description                                                                                                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contract_owner`   | The owner of the contract initialized by the creator of the contract.                                                                                                                                                            |
| `token_owner`      | A user (identified by an address) that owns a token tied to a token_id.                                                                                                                                                          |
| `approved_spender` | A user (identified by an address) that can transfer a token tied to a token_id on behalf of the token_owner.                                                                                                                     |
| `minter`           | A user (identified by an address) that is approved by the contract_owner to mint NFTs.                                                                                                                                           |
| `operator`         | A user (identified by an address) that is approved to operate all and any tokens owned by another user (identified by another address). The operators can make any transfer, approve, or burn the tokens on behalf of that user. |

### B. Error Codes

The NFT contract must define the following constants for use as error codes for the `Error` event.

| Name                  | Type    | Code | Description                                                     |
| --------------------- | ------- | ---- | --------------------------------------------------------------- |
| `CodeNotAuthorised`   | `Int32` | `-1` | Emit when the transition call is unauthorised for a given user. |
| `CodeNotFound`        | `Int32` | `-2` | Emit when a value is missing.                                   |
| `CodeTokenExists`     | `Int32` | `-3` | Emit when trying to create a token that already exists.         |
| `CodeUnexpectedError` | `Int32` | `-4` | Emit when the transition call runs into an unexpected error.    |

### C. Immutable Variables

| Name             | Type      | Description                                                           |
| ---------------- | --------- | --------------------------------------------------------------------- |
| `contract_owner` | `ByStr20` | The owner of the contract initialized by the creator of the contract. |
| `name`           | `String`  | The name of the non-fungible token.                                   |
| `symbol`         | `String`  | The symbol of the non-fungible token.                                 |

### D. Mutable Fields

| Name                 | Type                             | Description                                                                                                                                     |
| -------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `minters`            | `Map ByStr20 Unit`               | Mapping containing the addresses approved to mint NFTs.                                                                                         |
| `token_owners`       | `Map Uint256 ByStr20`            | Mapping between token_id (that identifies each token) to its owner.                                                                             |
| `owned_token_count`  | `Map ByStr20 Uint256`            | Mapping from token_owner to the number of NFTs he/she owns.                                                                                     |
| `token_approvals`    | `Map Uint256 ByStr20`            | Mapping between token_id to an approved_spender address. token_owner can approve an address to transfer a particular token of a given token_id. |
| `operator_approvals` | `Map ByStr20 (Map ByStr20 Bool)` | Mapping from token_owner to approved operators authorised by the token_owner.                                                                   |
| `token_uris`         | `Map Uint256 String`             | Mapping from token_id to its token_uri                                                                                                          |
| `total_supply`       | `Uint256`                        | Current total supply of NFTs minted                                                                                                             |

### E. Getter Transitions

#### 1. balanceOf()

```ocaml
(* @dev: Get number of NFTs assigned to a token_owner *)
transition balanceOf(address: ByStr20)
```

**Arguments:**

|        | Name      | Type      | Description                                     |
| ------ | --------- | --------- | ----------------------------------------------- |
| @param | `address` | `ByStr20` | Address of the token_owner to check balance of. |

**Messages sent:**

|        | Name                | Description                                                | Callback Parameters                                                                                    |
| ------ | ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `_tag` | `balanceOfCallBack` | Provide the sender the balance of the queried token_owner. | `balance` of type `Uint256` representing the current balance of NFTs owned by the queried for token_owner. |

#### 2. totalSupply()

```ocaml
(* @dev: Get total supply of NFTs minted *)
transition totalSupply()
```

**Messages sent:**

|        | Name                  | Description                                                 | Callback Parameters                                                                    |
| ------ | --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `_tag` | `totalSupplyCallBack` | Provide the sender the current total supply of NFTs minted. | `total_supply` of type `Uint256` representing the current total supply of NFTs minted. |

#### 3. name()

```ocaml
(* @dev: Get name of the NFTs *)
transition name()
```

**Messages sent:**

|        | Name           | Description                                      | Callback Parameters                                                |
| ------ | -------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `_tag` | `nameCallBack` | Provide the sender the current name of the NFTs. | `name` of type `String` representing the current name of the NFTs. |

#### 4. symbol()

```ocaml
(* @dev: Get name of the NFTs *)
transition symbol()
```

**Messages sent:**

|        | Name             | Description                                        | Callback Parameters                                                    |
| ------ | ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `_tag` | `symbolCallBack` | Provide the sender the current symbol of the NFTs. | `symbol` of type `String` representing the current symbol of the NFTs. |

#### 5. getApproved()

```ocaml
(* @dev: Get approved_addr for token_id *)
transition getApproved(token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                    |
| ------ | ---------- | --------- | ------------------------------ |
| @param | `token_id` | `Uint256` | A token_id that to be queried. |

**Messages sent:**

|        | Name                  | Description                                                                                              | Callback Parameters                                                                                                                                                                         |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `getApprovedCallBack` | Provide the sender an address of the approved_spender address for the queried token_id and the token_id. | `approved_addr` of type `ByStr20` representing the address of the approved_spender for the token_id, and `token_id` of type `Uint256` representing the unique token_id of that queried NFT. |

#### 6. getTokenURI()

```ocaml
(* @dev: Get the token_uri of a certain token_id *)
transition getTokenURI(token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                    |
| ------ | ---------- | --------- | ------------------------------ |
| @param | `token_id` | `Uint256` | A token_id that to be queried. |

**Messages sent:**

|        | Name                  | Description                                           | Callback Parameters                                                           |
| ------ | --------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `_tag` | `getTokenURICallBack` | Provide the sender a token_uri of a queried token_id. | `token_uri` of type `String` representing the token_uri of a unique token_id. |

#### 7. isOwner()

```ocaml
(* @dev: Check if a token_id is owned by a token_owner and get a Bool *)
transition isOwner(token_id: Uint256, address: ByStr20)
```

**Arguments:**

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `token_id` | `Uint256` | A token_id that will be queried. |
| @param | `address`  | `ByStr20` | An address that will be queried. |

**Messages sent:**

|        | Name              | Description                                                                                                                        | Callback Parameters                                                                                    |
| ------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `_tag` | `isOwnerCallBack` | Provide the sender a True or False statement depending on whether the queried address is indeed the owner of the queried token_id. | `is_owner` of type `Bool` representing the status of ownership of the token_id by the queried address. |

#### 8. isApprovedForAll()

```ocaml
(* @dev: Check if address is operator for token_owner and get a Bool *)
transition isApprovedForAll(token_owner: ByStr20, operator: ByStr20)
```

**Arguments:**

|        | Name          | Type      | Description                      |
| ------ | ------------- | --------- | -------------------------------- |
| @param | `token_owner` | `ByStr20` | An address that will be queried. |
| @param | `operator`    | `ByStr20` | An address that will be queried. |

**Messages sent:**

|        | Name                       | Description                                                                                                                             | Callback Parameters                                                                                 |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `_tag` | `isApprovedForAllCallBack` | Provide the sender a True or False statement depending on whether the queried operator is indeed an approved operator of a token_owner. | `is_operator` of type `Bool` representing the status of operator's approval given by a token_owner. |

### F. Interface Transitions

#### 1. configureMinter()

```ocaml
(* @dev:    Add or remove approved minters. Only contract_owner can approve minters. *)
(* @param:  minter      - Address of the minter to be approved or removed            *)
(* Returns error event CodeNotAuthorised if _sender is not contract_owner.           *)
transition configureMinter(minter: ByStr20)
```

**Arguments:**

|        | Name     | Type      | Description                                                      |
| ------ | -------- | --------- | ---------------------------------------------------------------- |
| @param | `minter` | `ByStr20` | An address that will be approved or removed as a minter of NFTs. |

**Events:**

|              | Name                   | Description                    | Event Parameters                                                                |
| ------------ | ---------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `_eventname` | `RemovedMinterSuccess` | Removing minter is successful. | `minter`: `ByStr20`, where `minter` is the address removed as a minter of NFTs. |
| `_eventname` | `AddMinterSuccess`     | Adding minter is successful.   | `minter`: `ByStr20`, where `minter` is the address added as a minter of NFTs.   |
| `_eventname` | `Error`                | Minting is not successful.     | emit `CodeNotAuthorised` if the \_sender is not the contract_owner.             |

#### 2. mint()

```ocaml
(* @dev:    Mint new tokens. Only contract_owner can mint.         *)
(* @param:  to        - Address of the token recipient             *)
(* @param:  token_id  - ID of the new token to be minted           *)
(* @param:  token_uri -  URI of the the new token to be minted     *)
(* Returns error event CodeTokenExists if token already exists.    *)
(* Returns error event CodeNotAuthorised if _sender is not minter. *)
(* Revert transition if invalid recipient contract.                *)
```

**Arguments:**

|        | Name        | Type      | Description                                       |
| ------ | ----------- | --------- | ------------------------------------------------- |
| @param | `to`        | `ByStr20` | Address of the recipient of the NFT to be minted. |
| @param | `token_id`  | `Uint256` | Unique token_id of the NFT to be minted.          |
| @param | `token_uri` | `Uint256` | Token URI of the NFT to be minted.                |

**Messages sent:**

|        | Name                  | Description                                           | Callback Parameters                                                                                                                                                                                                                    |
| ------ | --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `recipientAcceptMint` | Dummy callback to prevent invalid recipient contract. |                                                                                                                                                                                                                                        |
| `_tag` | `mintCallBack`        | Provide the sender the status of the mint.            | `recipient`: `ByStr20`, `token_id`: `Uint256`, `token_uri`: `String`, where `to` is the address of the recipient, `token_id` is the unique token_id of the NFT to be minted, and `token_uri` is the token URI of the NFT to be minted. |

**Events:**

|              | Name          | Description                | Event Parameters                                                                                                                                                                                                                                                                                              |
| ------------ | ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `MintSuccess` | Minting is successful.     | `by`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, `token_uri`: `String`, where `by` is the address of caller,`recipient` is the `to` address the token is sent to, `token_id` is the unique token_id of the new NFT to be minted, and `token_uri` is the token URI of the new NFT to be minted. |
| `_eventname` | `Error`       | Minting is not successful. | - emit `CodeTokenExists` if the token already exists. <br> - emit `CodeNotAuthorised` if the transition is called by a \_sender who is not the contract_owner.                                                                                                                                                |

#### 3. Burn

```ocaml
(* @dev:    Burn existing tokens. Only token_owner or an approved operator can burn a NFT. *)
(* @param:  token_id - Unique ID of the NFT to be destroyed                                *)
(* Returns error event CodeNotFound if token does not exists.                              *)
(* Returns error event CodeNotAuthorised if _sender is not token_owner or operator.        *)
transition burn(tokenId: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                                         |
| ------ | ---------- | --------- | --------------------------------------------------- |
| @param | `token_id` | `Uint256` | Unique token_id of an existing NFT to be destroyed. |

**Messages sent:**

|        | Name           | Description                                | Callback Parameters                                                                                                                                                                                                                                                                  |
| ------ | -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `burnCallBack` | Provide the sender the status of the burn. | `initiator`: `ByStr20`, `burn_address`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the burner, `to` is the address of the recipient, `token_id` is the unique token_id of the NFT to be minted, and `token_uri` is the token URI of the NFT to be minted. |

**Events:**

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                                                            |
| --------- | ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BurnSuccess` | Burning is successful.     | `initiator`: `ByStr20`, `burn_address`: `ByStr20`, `token_id`: `Uint256`, where, `initiator` is the address of caller, `burn_address` is the address of the token_owner whose NFT is being burned, and `token_id` is the unique token_id of the token that has been burned. |
| eventName | `Error`       | Burning is not successful. | - emit `CodeNotFound` if the token does not exists. <br> - emit `CodeNotAuthorised` if the transition is called by a user who is neither the token_owner or approved operator.                                                                                              |

#### 3. approve()

```ocaml
(* @dev: Approves OR remove an address's ability to transfer a given token_id       *)
(* There can only be one approved_spender per token at any given time               *)
(* param: to       - Address to be approved for the given token_id                  *)
(* param: token_id - Unique ID of the NFT to be approved                            *)
(* Returns error event CodeNotFound if token does not exists.                       *)
(* Returns error event CodeNotAuthorised if _sender is not token_owner or operator. *)
transition approve(to: ByStr20, token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                                                   |
| ------ | ---------- | --------- | ------------------------------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set as an approved_spender of a given token_id. |
| @param | `token_id` | `Uint256` | Unique token_id of an existing NFT.                           |

**Messages sent:**

|        | Name                            | Description                                                            | Callback Parameters                                                                                                                                                                                                                                                           |
| ------ | ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `addApprovalSuccessCallBack`    | Provide the sender the status of the approval for an approved_spender. | `initiator`: `ByStr20`, `approved_spender`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the \_sender, `approved_spender` is address to be set as an approved_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT. |
| `_tag` | `removeApprovalSuccessCallBack` | Provide the sender the status of the approval for an approved_spender. | `initiator`: `ByStr20`, `removed_spender`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the \_sender, `removed_spender` is address to be set as an removed_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT.    |

**Events:**

|           | Name                    | Description                                 | Event Parameters                                                                                                                                                                                                                                                              |
| --------- | ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `AddApprovalSuccess`    | Adding of approved_spender is successful.   | `initiator`: `ByStr20`, `approved_spender`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the \_sender, `approved_spender` is address to be set as an approved_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT. |
| eventName | `RemoveApprovalSuccess` | Removing of approved_spender is successful. | `initiator`: `ByStr20`, `removed_spender`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the \_sender, `removed_spender` is address to removed as an approved_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT.  |
| eventName | `Error`                 | Approval is not successful.                 | - emit `CodeNotFound` if the token does not exists. <br> - emit `CodeNotAuthorised` if the transition is called by a user who is neither the token_owner or approved operator.                                                                                                |

#### 4. setApprovalForAll()

```ocaml
(* @dev: Sets or unsets the approval of a given operator for a token_owner/_sender *)
(* @param: to       - Address to be set or unset as operator                       *)
(* @param: approved - Status of approval to be set for the address                 *)
(* Returns error event CodeNotAuthorised if "to" address is the token_owner.       *)
transition setApprovalForAll(to: ByStr20, approved: Bool)
```

**Arguments:**

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set or unset as operator. |
| @param | `approved` | `Bool`    | Status of the approval to be set.       |

**Messages sent:**

|        | Name                               | Description                                                   | Callback Parameters                                                                                                                                                     |
| ------ | ---------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `setApprovalForAllSuccessCallBack` | Provide the sender the status of the approval of an operator. | `operator`: `ByStr20`, `status`: `Bool`, where `operator` is the address of the approved_spender whose status was being set, and `status` is status it is being set to. |

**Events:**

|           | Name                       | Description                                        | Event Parameters                                                                                                                                                        |
| --------- | -------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `SetApprovalForAllSuccess` | Setting of an operator's status is successful.     | `operator`: `ByStr20`, `status`: `Bool`, where `operator` is the address of the approved_spender whose status was being set, and `status` is status it is being set to. |
| eventName | `Error`                    | Setting of an operator's status is not successful. | - emit `CodeNotAuthorised` if the transition if the \_sender is attempting to approve himself/herself.                                                                  |

#### 5. transfer()

```ocaml
(* @dev: Transfer the ownership of a given token_id to another address. Only token_owner transition. *)
(* @param: to       - Recipient address for the token                                                *)
(* @param: token_id - Unique ID of the NFT to be transferred                                         *)
(* Returns error event CodeNotFound if token does not exists                                         *)
(* Returns error event CodeNotAuthorised if _sender is not token_owner.                              *)
(* Revert transition if invalid recipient contract.                                                  *)
transition transfer(to: ByStr20, token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Recipient address of the NFT.           |
| @param | `token_id` | `Uint256` | Unique ID of the NFT to be transferred. |

**Messages sent:**

|        | Name                      | Description                                                                                                                             | Callback Parameters                                                                                                                                                                                           |
| ------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `recipientAcceptTransfer` | Provide the recipient the status of the transfer of an NFT. Revert the whole transition if it is a non-NFT supporting contract address. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the \_sender address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |
| `_tag` | `transferSuccessCallBack` | Provide the sender the status of the transfer of an NFT.                                                                                | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the \_sender address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |

**Events:**

|           | Name                  | Description                    | Event Parameters                                                                                                                                                                                              |
| --------- | --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferFromSuccess` | Transfer of NFT is successful. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the \_sender address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |
| eventName | `Error`               | Transfer is not successful.    | - emit `CodeNotFound` if the token does not exists. <br> - emit `CodeNotAuthorised` if the transition is called by a user that is not the token_owner.                                                        |

#### 6. transferFrom()

```ocaml
(* @dev: Transfer the ownership of a given token_id to another address. Only approved_spender or operator transition. *)
(* @param: to       - Recipient address for the NFT                                                                   *)
(* @param: token_id - Unique ID of the NFT to be transferred                                                          *)
(* Returns error event CodeNotFound if token does not exists                                                          *)
(* Returns error event CodeNotAuthorised if _sender is not approved_spender or operator.                              *)
(* Revert transition if invalid recipient contract.                                                                   *)
transition transferFrom(to: ByStr20, token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Recipient address of the NFT.           |
| @param | `token_id` | `Uint256` | Unique ID of the NFT to be transferred. |

**Messages sent:**

|        | Name                  | Description                                                           | Callback Parameters                                                                                                                                                                                              |
| ------ | --------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `TransferFromSuccess` | Provide the subsequent contract the status of the transfer of an NFT. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the token_owner address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |

**Events:**

|           | Name                  | Description                    | Event Parameters                                                                                                                                                                                                 |
| --------- | --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferFromSuccess` | Transfer of NFT is successful. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the token_owner address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |
| eventName | `Error`               | Transfer is not successful.    | - emit `CodeNotFound` if the token does not exists. <br> - emit `CodeNotAuthorised` if the transition is called by a user that is not an approved_spender or operator.                                           |

## V. Existing Implementation(s)

- [Non-Fungible Token](../reference/nonfungible-token.scilla)

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
