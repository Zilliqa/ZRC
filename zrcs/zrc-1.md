| ZRC | Title                            | Status | Type     | Author                                                                                                      | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | -------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Non Fungible Tokens | Ready  | Standard | Edison Lim <edison@aqilliz.com> <br> Han Wen Chua <hanwen@zilliqa.com> <br> Arnav Vohra <arnav@zilliqa.com> | 2019-09-28           | 2020-12-11           |

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

| Name                               | Type    | Code  | Description                                                                         |
| ---------------------------------- | ------- | ----- | ----------------------------------------------------------------------------------- |
| `CodeNotContractOwner`             | `Int32` | `-1`  | Emit when the sender attempts a transition call only authorised for contract owner. |
| `CodeIsSelf`                       | `Int32` | `-2`  | Emit when the sender attempts a transition call wrongly to his/her own address .    |
| `CodeTokenExists`                  | `Int32` | `-3`  | Emit when trying to create a token that already exists.                             |
| `CodeIsNotMinter`                  | `Int32` | `-4`  | Emit when the sender is not an approved token minter.                               |
| `CodeNotApproved`                  | `Int32` | `-5`  | Emit when there is no approved address for the given token id.                      |
| `CodeNotTokenOwner`                | `Int32` | `-6`  | Emit when a given address is not an owner of the token.                             |
| `CodeNotFound`                     | `Int32` | `-7`  | Emit when a value is missing.                                                       |
| `CodeNotApprovedForAll`            | `Int32` | `-8`  | Emit when the address is not an operator for the token owner.                       |
| `CodeNotOwnerOrOperator`           | `Int32` | `-9`  | Emit when the sender is neither a token owner nor a token operator.                 |
| `CodeNotApprovedSpenderOrOperator` | `Int32` | `-10` | Emit when the sender is neither an approved sender nor a token operator.            |

### C. Immutable Variables

| Name             | Type      | Description                                                           |
| ---------------- | --------- | --------------------------------------------------------------------- |
| `contract_owner` | `ByStr20` | The owner of the contract initialized by the creator of the contract. |
| `name`           | `String`  | The name of the non-fungible token.                                   |
| `symbol`         | `String`  | The symbol of the non-fungible token.                                 |

### D. Mutable Fields

| Name                 | Type                             | Description                                                                                                                  |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `minters`            | `Map ByStr20 Unit`               | Mapping containing the addresses approved to mint NFTs.                                                                      |
| `token_owners`       | `Map Uint256 ByStr20`            | Mapping between token_id (that identifies each token) to its owner.                                                          |
| `owned_token_count`  | `Map ByStr20 Uint256`            | Mapping from token_owner to the number of NFTs he/she owns.                                                                  |
| `token_approvals`    | `Map Uint256 ByStr20`            | Mapping between token_id to an approved_spender address. There can only be one approved address per token at any given time. |
| `operator_approvals` | `Map ByStr20 (Map ByStr20 Bool)` | Mapping from token_owner to approved operators authorised by the token_owner.                                                |
| `token_uris`         | `Map Uint256 String`             | Mapping from token_id to token_uri                                                                                           |
| `total_supply`       | `Uint256`                        | Current total supply of NFTs minted                                                                                          |

### E. Getter Transitions

#### 1. BalanceOf()

```ocaml
(* @dev: Get number of NFTs assigned to a token_owner *)
transition BalanceOf(address: ByStr20)
```

**Arguments:**

|        | Name      | Type      | Description                                     |
| ------ | --------- | --------- | ----------------------------------------------- |
| @param | `address` | `ByStr20` | Address of the token_owner to check balance of. |

**Messages sent:**

|        | Name                | Description                                                | Callback Parameters                                                                                        |
| ------ | ------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `_tag` | `balanceOfCallBack` | Provide the sender the balance of the queried token_owner. | `balance` of type `Uint256` representing the current balance of NFTs owned by the queried for token_owner. |

#### 2. TotalSupply()

```ocaml
(* @dev: Get total supply of NFTs minted *)
transition TotalSupply()
```

**Messages sent:**

|        | Name                  | Description                                                 | Callback Parameters                                                                    |
| ------ | --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `_tag` | `TotalSupplyCallBack` | Provide the sender the current total supply of NFTs minted. | `total_supply` of type `Uint256` representing the current total supply of NFTs minted. |

#### 3. Name()

```ocaml
(* @dev: Get name of the NFTs *)
transition Name()
```

**Messages sent:**

|        | Name           | Description                                      | Callback Parameters                                                |
| ------ | -------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `_tag` | `NameCallBack` | Provide the sender the current name of the NFTs. | `name` of type `String` representing the current name of the NFTs. |

#### 4. Symbol()

```ocaml
(* @dev: Get name of the NFTs *)
transition Symbol()
```

**Messages sent:**

|        | Name             | Description                                        | Callback Parameters                                                    |
| ------ | ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `_tag` | `SymbolCallBack` | Provide the sender the current symbol of the NFTs. | `symbol` of type `String` representing the current symbol of the NFTs. |

#### 5. GetApproved()

```ocaml
(* @dev: Get approved_addr for token_id *)
transition GetApproved(token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                    |
| ------ | ---------- | --------- | ------------------------------ |
| @param | `token_id` | `Uint256` | A token_id that to be queried. |

**Messages sent:**

|        | Name                  | Description                                                                                              | Callback Parameters                                                                                                                                                                         |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `GetApprovedCallBack` | Provide the sender an address of the approved_spender address for the queried token_id and the token_id. | `approved_addr` of type `ByStr20` representing the address of the approved_spender for the token_id, and `token_id` of type `Uint256` representing the unique token_id of that queried NFT. |

#### 6. GetTokenURI()

```ocaml
(* @dev: Get the token_uri of a certain token_id *)
transition getTokenURI(token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                    |
| ------ | ---------- | --------- | ------------------------------ |
| @param | `token_id` | `Uint256` | A token_id that to be queried. |

**Messages sent:**

|        | Name                 | Description                                           | Callback Parameters                                                           |
| ------ | -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `_tag` | GetTokenURICallBack` | Provide the sender a token_uri of a queried token_id. | `token_uri` of type `String` representing the token_uri of a unique token_id. |

#### 7. CheckTokenOwner()

```ocaml
(* @dev: Check if a token_id is owned by a token_owner *)
transition CheckTokenOwner(token_id: Uint256, address: ByStr20)
```

**Arguments:**

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `token_id` | `Uint256` | A token_id that will be queried. |
| @param | `address`  | `ByStr20` | An address that will be queried. |

**Messages sent:**

|        | Name              | Description                                                                                                              | Callback Parameters |
| ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| `_tag` | `IsOwnerCallBack` | Check if the queried address is the owner of the queried token_id, throw CodeNotTokenOwner error if that's not the case. | -                   |

#### 8. CheckApprovedForAll()

```ocaml
(* @dev: Check if address is operator for token_owner *)
transition CheckApprovedForAll(token_owner: ByStr20, operator: ByStr20)
```

**Arguments:**

|        | Name          | Type      | Description                      |
| ------ | ------------- | --------- | -------------------------------- |
| @param | `token_owner` | `ByStr20` | An address that will be queried. |
| @param | `operator`    | `ByStr20` | An address that will be queried. |

**Messages sent:**

|        | Name                       | Description                                                                                                                       | Callback Parameters                                                                                                                                                                             |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `IsApprovedForAllCallBack` | Check if the queried operator is an approved operator of a token_owner, throw CodeNotApprovedForAll error if that's not the case. | `token_owner` of type `ByStr20` representing the address of the token owner of the NFTs, and `operator` of type `ByStr20` representing the address of the approved operator of the token owner. |

### F. Interface Transitions

#### 1. ConfigureMinter()

```ocaml
(* @dev:    Add or remove approved minters. Only contract_owner can approve minters. *)
(* @param:  minter      - Address of the minter to be approved or removed            *)
transition ConfigureMinter(minter: ByStr20)
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

#### 2. Mint()

```ocaml
(* @dev:    Mint new tokens. Only minters can mint.           *)
(* @param:  to        - Address of the token recipient        *)
(* @param:  token_uri - URI of the the new token to be minted *)
transition Mint(to: ByStr20, token_uri: String)
```

**Arguments:**

|        | Name        | Type      | Description                                       |
| ------ | ----------- | --------- | ------------------------------------------------- |
| @param | `to`        | `ByStr20` | Address of the recipient of the NFT to be minted. |
| @param | `token_uri` | `Uint256` | Token URI of the NFT to be minted.                |

**Messages sent:**

|        | Name                  | Description                                           | Callback Parameters                                                                                                                                                                                                                    |
| ------ | --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract. |                                                                                                                                                                                                                                        |
| `_tag` | `MintCallBack`        | Provide the sender the status of the mint.            | `recipient`: `ByStr20`, `token_id`: `Uint256`, `token_uri`: `String`, where `to` is the address of the recipient, `token_id` is the unique token_id of the NFT to be minted, and `token_uri` is the token URI of the NFT to be minted. |

**Events:**

|              | Name          | Description            | Event Parameters                                                                                                                                                                                                                                                                                              |
| ------------ | ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `MintSuccess` | Minting is successful. | `by`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, `token_uri`: `String`, where `by` is the address of caller,`recipient` is the `to` address the token is sent to, `token_id` is the unique token_id of the new NFT to be minted, and `token_uri` is the token URI of the new NFT to be minted. |

#### 3. Burn()

```ocaml
(* @dev:    Burn existing tokens. Only token_owner or an approved operator can burn a NFT. *)
(* @param:  token_id - Unique ID of the NFT to be destroyed                                *)
(* Returns error event CodeNotFound if token does not exists.                              *)
(* Returns error event CodeNotAuthorised if _sender is not token_owner or operator.        *)
transition Burn(tokenId: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                                         |
| ------ | ---------- | --------- | --------------------------------------------------- |
| @param | `token_id` | `Uint256` | Unique token_id of an existing NFT to be destroyed. |

**Messages sent:**

|        | Name           | Description                                | Callback Parameters                                                                                                                                                                                                                                                                  |
| ------ | -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `BurnCallBack` | Provide the sender the status of the burn. | `initiator`: `ByStr20`, `burn_address`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the burner, `to` is the address of the recipient, `token_id` is the unique token_id of the NFT to be minted, and `token_uri` is the token URI of the NFT to be minted. |

**Events:**

|           | Name          | Description            | Event Parameters                                                                                                                                                                                                                                                            |
| --------- | ------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BurnSuccess` | Burning is successful. | `initiator`: `ByStr20`, `burn_address`: `ByStr20`, `token_id`: `Uint256`, where, `initiator` is the address of caller, `burn_address` is the address of the token_owner whose NFT is being burned, and `token_id` is the unique token_id of the token that has been burned. |

#### 4. SetApprove()

```ocaml
(* @dev: Approves OR remove an address ability to transfer a given token_id *)
(* There can only be one approved_spender per token at any given time       *)
(* param: to       - Address to be approved for the given token_id          *)
(* param: token_id - Unique ID of the NFT to be approved                    *)
transition SetApprove(to: ByStr20, token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                                                   |
| ------ | ---------- | --------- | ------------------------------------------------------------- |
| @param | `to`       | `ByStr20` | Address to be set as an approved_spender of a given token_id. |
| @param | `token_id` | `Uint256` | Unique token_id of an existing NFT.                           |

**Messages sent:**

|        | Name                            | Description                                                            | Callback Parameters                                                                                                                                                                                       |
| ------ | ------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `AddApprovalSuccessCallBack`    | Provide the sender the status of the approval for an approved_spender. | `approved_spender`: `ByStr20`, `token_id`: `Uint256`, where `approved_spender` is address to be set as an approved_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT. |
| `_tag` | `RemoveApprovalSuccessCallBack` | Provide the sender the status of the approval for an approved_spender. | `removed_spender`: `ByStr20`, `token_id`: `Uint256`, where `removed_spender` is address to be set as an removed_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT.    |

**Events:**

|           | Name                    | Description                                 | Event Parameters                                                                                                                                                                                                                                                              |
| --------- | ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `AddApprovalSuccess`    | Adding of approved_spender is successful.   | `initiator`: `ByStr20`, `approved_spender`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the \_sender, `approved_spender` is address to be set as an approved_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT. |
| eventName | `RemoveApprovalSuccess` | Removing of approved_spender is successful. | `initiator`: `ByStr20`, `removed_spender`: `ByStr20`, `token_id`: `Uint256`, where `initiator` is the address of the \_sender, `removed_spender` is address to removed as an approved_spender of a given token_id, and `token_id` is the unique token_id of an existing NFT.  |

#### 5. SetApprovalForAll()

```ocaml
(* @dev: Sets or unsets an operator for the _sender       *)
(* @param: to - Address to be set or unset as an operator *)
transition SetApprovalForAll(to: ByStr20)
```

**Arguments:**

|        | Name | Type      | Description                             |
| ------ | ---- | --------- | --------------------------------------- |
| @param | `to` | `ByStr20` | Address to be set or unset as operator. |

**Messages sent:**

|        | Name                               | Description                                                   | Callback Parameters                                                                                                                                                     |
| ------ | ---------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `SetApprovalForAllSuccessCallBack` | Provide the sender the status of the approval of an operator. | `operator`: `ByStr20`, `status`: `Bool`, where `operator` is the address of the approved_spender whose status was being set, and `status` is status it is being set to. |

**Events:**

|           | Name                          | Description                                     | Event Parameters                                                                                                                                                          |
| --------- | ----------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `AddApprovalForAllSuccess`    | Addition of an operator's status is successful. | `initiator`: `ByStr20`, `operator`: `ByStr20`, where `initiator` is the address of the \_sender, and `operator` is the address of the approved_spender which was added.   |
| eventName | `RemoveApprovalForAllSuccess` | Removal of an operator's status is successful.  | `initiator`: `ByStr20`, `operator`: `ByStr20`, where `initiator` is the address of the \_sender, and `operator` is the address of the approved_spender which was removed. |

#### 6. Transfer()

```ocaml
(* @dev: Transfer the ownership of a given token_id to another address. token_owner only transition. *)
(* @param: to       - Recipient address for the token                                                *)
(* @param: token_id - Unique ID of the NFT to be transferred                                         *)
transition Transfer(to: ByStr20, token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Recipient address of the NFT.           |
| @param | `token_id` | `Uint256` | Unique ID of the NFT to be transferred. |

**Messages sent:**

|        | Name                      | Description                                                                                                                             | Callback Parameters                                                                                                                                                                                           |
| ------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptTransfer` | Provide the recipient the status of the transfer of an NFT. Revert the whole transition if it is a non-NFT supporting contract address. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the \_sender address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |
| `_tag` | `TransferSuccessCallBack` | Provide the sender the status of the transfer of an NFT.                                                                                | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the \_sender address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |

**Events:**

|           | Name              | Description                    | Event Parameters                                                                                                                                                                                              |
| --------- | ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferSuccess` | Transfer of NFT is successful. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the \_sender address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |

#### 7. TransferFrom()

```ocaml
(* @dev: Transfer the ownership of a given token_id to another address. approved_spender or operator only transition. *)
(* @param: to       - Recipient address for the NFT                                                                   *)
(* @param: token_id - Unique ID of the NFT to be transferred                                                          *)
transition TransferFrom(to: ByStr20, token_id: Uint256)
```

**Arguments:**

|        | Name       | Type      | Description                             |
| ------ | ---------- | --------- | --------------------------------------- |
| @param | `to`       | `ByStr20` | Recipient address of the NFT.           |
| @param | `token_id` | `Uint256` | Unique ID of the NFT to be transferred. |

**Messages sent:**

|        | Name                          | Description                                                 | Callback Parameters                                                                                                                                                                                              |
| ------ | ----------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptTransferFrom` | Provide the recipient the status of the transfer of an NFT. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the token_owner address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |
| `_tag` | `TransferFromSuccessCallBack` | Provide the sender the status of the transfer of an NFT.    | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the token_owner address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |

**Events:**

|           | Name                  | Description                    | Event Parameters                                                                                                                                                                                                 |
| --------- | --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| eventName | `TransferFromSuccess` | Transfer of NFT is successful. | `from`: `ByStr20`, `recipient`: `ByStr20`, `token_id`: `Uint256`, where, `from` is the token_owner address, `recipient` is the recipient address and `token_id` is the unique ID of the NFT that is transferred. |     |

## V. Existing Implementation(s)

- [Non-Fungible Token](../reference/nonfungible-token.scilla)

To test the reference contract, simply go to the [`example/zrc1`](../example/zrc1) folder and run one of the JS scripts. For example, to deploy the contract, run:

```shell
yarn deploy.js
```

> **NOTE:** Please change the `privkey` in the script to your own private key. You can generate a testnet wallet and request for testnet \$ZIL at the [Nucleus Faucet](https://dev-wallet.zilliqa.com/home).

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
