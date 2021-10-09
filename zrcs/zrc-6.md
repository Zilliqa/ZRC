| ZRC | Title                       | Status | Type     | Author                       | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | --------------------------- | ------ | -------- | ---------------------------- | -------------------- | -------------------- |
| 6   | Non-Fungible Token Standard | Ready  | Standard | Neuti Yoo <noel@zilliqa.com> | 2021-10-01           | 2021-10-08           |

## I. What are NFTs and NFT royalties?

An NFT or Non-Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is unique and non-interchangeable with other tokens.

NFT royalties give an NFT creator or rights holder a percentage of the sale price each time the NFT is sold or re-sold.

## II. Abstract

ZRC-6 defines a new minimum interface of an NFT smart contract while improving upon ZRC-1.

The main advantages of this standard are:

1. ZRC-6 implements standardized royalty information retrieval with a percentage-based royalty fee model. For simplicity, it mandates royalty payments to a single address and unit-less royalty payments across all NFT marketplaces. Funds will be paid for secondary sales only if a marketplace chooses to implement ZRC-6.

2. ZRC-6 includes batch minting such that multiple NFTs can be minted in one transaction.

3. ZRC-6 is compatible with ZRC-X since every callback name is prefixed with `ZRC6_`.

## III. Motivation

Many of the largest NFT marketplaces have implemented incompatible royalty payment solutions. ZRC-6 provides a standardized way to retrieve royalty information for NFTs. The marketplace should transfer the actual funds.

In ZRC-1 minting can be very inefficient since multiple transactions are required to mint multiple NFTs.

The ZRC-1 and ZRC-2 contracts can share the same callback names. It can cause the composed contracts to throw a compiler error.

## IV. Specification

The NFT contract specification describes:

1. the global error codes to be declared in the library part of the contract;
2. the names and types of the immutable and mutable variables (aka `fields`);
3. the transitions that will allow the changing of values of the mutable variables;
4. the events to be emitted by them.

### A. Roles

| Name                | Description                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contract_owner`    | The owner of the contract is initialized by the creator of the contract.                                                                                                                                                         |
| `royalty_recipient` | The royalty recipient gets a royalty amount each time the NFT is sold or re-sold. This is optional.                                                                                                                              |
| `token_owner`       | A user (identified by an address) that owns a token tied to a token ID.                                                                                                                                                          |
| `approved_spender`  | A user (identified by an address) that can transfer a token tied to a token ID on behalf of the token owner.                                                                                                                     |
| `minter`            | A user (identified by an address) that is approved by the contract owner to mint NFTs.                                                                                                                                           |
| `operator`          | A user (identified by an address) that is approved to operate all and any tokens owned by another user (identified by another address). The operators can make any transfer, approve, or burn the tokens on behalf of that user. |

### B. Error Codes

The NFT contract must define the following constants for use as error codes for the `Error` event.

| Name                                | Type    | Code  | Description                                                                         |
| ----------------------------------- | ------- | ----- | ----------------------------------------------------------------------------------- |
| `NotFoundError`                     | `Int32` | `-1`  | Emit when a value is not found.                                                     |
| `ConflictError`                     | `Int32` | `-2`  | Emit when a value already exists.                                                   |
| `SelfError`                         | `Int32` | `-3`  | Emit when the sender attempts a transition call wrongly to his/her own address .    |
| `NotContractOwnerError`             | `Int32` | `-4`  | Emit when the sender attempts a transition call only authorised for contract owner. |
| `NotTokenOwnerError`                | `Int32` | `-5`  | Emit when a given address is not an owner of the token.                             |
| `NotMinterError`                    | `Int32` | `-6`  | Emit when the sender is not an approved token minter.                               |
| `NotApprovedError`                  | `Int32` | `-7`  | Emit when there is no approved address for the given token ID.                      |
| `NotApprovedForAllError`            | `Int32` | `-8`  | Emit when the address is not an operator for the token owner.                       |
| `NotOwnerOrOperatorError`           | `Int32` | `-9`  | Emit when the sender is neither a token owner nor a token operator.                 |
| `NotApprovedSpenderOrOperatorError` | `Int32` | `-10` | Emit when the sender is neither an approved sender nor a token operator.            |
| `InvalidFeeBpsError`                | `Int32` | `-11` | Emit when the fee bps is out of range. This is optional.                            |

### C. Immutable Variables

| Name             | Type      | Description                                                              |
| ---------------- | --------- | ------------------------------------------------------------------------ |
| `contract_owner` | `ByStr20` | The owner of the contract is initialized by the creator of the contract. |
| `name`           | `String`  | The name of the NFTs.                                                    |
| `symbol`         | `String`  | The symbol of the NFTs.                                                  |

### D. Mutable Fields

| Name                 | Type                             | Description                                                                                                                  |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `minters`            | `Map ByStr20 Unit`               | Mapping containing the addresses approved to mint NFTs.                                                                      |
| `royalty_recipient`  | `ByStr20`                        | Address to send royalties to. This is optional.                                                                              |
| `royalty_fee_bps`    | `Uint256`                        | Royality fee BPS (1/100ths of a percent, e.g. 1000 = 10%). This is optional.                                                 |
| `token_owners`       | `Map Uint256 ByStr20`            | Mapping between token ID (that identifies each token) to its owner.                                                          |
| `owned_token_count`  | `Map ByStr20 Uint256`            | Mapping from token owner to the number of NFTs he/she owns.                                                                  |
| `token_approvals`    | `Map Uint256 ByStr20`            | Mapping between token ID to an approved spender address. There can only be one approved address per token at any given time. |
| `operator_approvals` | `Map ByStr20 (Map ByStr20 Bool)` | Mapping from token owner to approved operators authorised by the token owner.                                                |
| `token_uris`         | `Map Uint256 String`             | Mapping from token ID to token URI.                                                                                          |
| `total_supply`       | `Uint256`                        | Current total supply of NFTs minted.                                                                                         |

### E. Getter Transitions

#### 1. RoyaltyInfo() (Optional)

**Arguments:**

| Name         | Type      | Description                      |
| ------------ | --------- | -------------------------------- |
| `token_id`   | `Uint256` | Unique ID of an existing NFT.    |
| `sale_price` | `Uint256` | Sale price when the NFT is sold. |

**Messages sent:**

|        | Name                       | Description                                              | Callback Parameters                                                                                                                                                            |
| ------ | -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_RoyaltyInfoCallback` | Provide the sender how much royalty is owed and to whom. | <ul><li>`royalty_amount` : `Uint256`<br/>Amount of funds to be paid to the royalty recipient</li><li>`royalty_recipient` : `ByStr20`</li>Address of the royalty recipient</ul> |

#### 2. BalanceOf()

**Arguments:**

| Name      | Type      | Description                                     |
| --------- | --------- | ----------------------------------------------- |
| `address` | `ByStr20` | Address of the token owner to check balance of. |

**Messages sent:**

|        | Name                     | Description                                                | Callback Parameters                                                                |
| ------ | ------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_BalanceOfCallback` | Provide the sender the balance of the queried token owner. | `balance` : `Uint256`<br/>The balance of NFTs owned by the queried for token owner |

#### 3. TotalSupply()

**Messages sent:**

|        | Name                       | Description                                                 | Callback Parameters                                            |
| ------ | -------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| `_tag` | `ZRC6_TotalSupplyCallback` | Provide the sender the current total supply of NFTs minted. | `total_supply` : `Uint256`<br/>The total supply of NFTs minted |

#### 4. Name()

**Messages sent:**

|        | Name                | Description                                      | Callback Parameters                        |
| ------ | ------------------- | ------------------------------------------------ | ------------------------------------------ |
| `_tag` | `ZRC6_NameCallback` | Provide the sender the current name of the NFTs. | `name` : `String`<br/>The name of the NFTs |

#### 5. Symbol()

**Messages sent:**

|        | Name                  | Description                                        | Callback Parameters                            |
| ------ | --------------------- | -------------------------------------------------- | ---------------------------------------------- |
| `_tag` | `ZRC6_SymbolCallback` | Provide the sender the current symbol of the NFTs. | `symbol` : `String`<br/>The symbol of the NFTs |

#### 6. GetApproved()

**Arguments:**

| Name       | Type      | Description                    |
| ---------- | --------- | ------------------------------ |
| `token_id` | `Uint256` | A token ID that to be queried. |

**Messages sent:**

|        | Name                       | Description                                                                                              | Callback Parameters                                                                                                                      |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_GetApprovedCallback` | Provide the sender an address of the approved spender address for the queried token ID and the token ID. | <ul><li>`approved_address` : `ByStr20`<br/>Address of approved spender</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 7. TokenURI()

**Arguments:**

| Name       | Type      | Description                    |
| ---------- | --------- | ------------------------------ |
| `token_id` | `Uint256` | A token ID that to be queried. |

**Messages sent:**

|        | Name                    | Description                                           | Callback Parameters                             |
| ------ | ----------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `_tag` | `ZRC6_TokenURICallback` | Provide the sender a token URI of a queried token ID. | `token_uri` : `String`<br/>Token URI of a token |

#### 8. CheckTokenOwner()

**Arguments:**

| Name       | Type      | Description                      |
| ---------- | --------- | -------------------------------- |
| `token_id` | `Uint256` | A token ID that will be queried. |
| `address`  | `ByStr20` | An address that will be queried. |

**Messages sent:**

|        | Name                        | Description                                                                                                           | Callback Parameters |
| ------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `_tag` | `ZRC6_IsTokenOwnerCallback` | Check if the queried address is the owner of the queried token ID, throw `NotTokenOwnerError` if that's not the case. |                     |

#### 9. CheckApprovedForAll()

**Arguments:**

| Name          | Type      | Description                      |
| ------------- | --------- | -------------------------------- |
| `token_owner` | `ByStr20` | An address that will be queried. |
| `operator`    | `ByStr20` | An address that will be queried. |

**Messages sent:**

|        | Name                            | Description                                                                                                                    | Callback Parameters                                                                                                                |     |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --- |
| `_tag` | `ZRC6_IsApprovedForAllCallback` | Check if the queried operator is an approved operator of a token owner, throw `NotApprovedForAllError` if that's not the case. | <ul><li>`token_owner` : `ByStr20`</li><br/>Address of a token owner<li>`operator` : `ByStr20`<br/>Address of an operator</li></ul> |

### F. Interface Transitions

#### 1. SetMinter()

**Arguments:**

| Name     | Type      | Description                           |
| -------- | --------- | ------------------------------------- |
| `minter` | `ByStr20` | Address to be set or unset as minter. |

**Messages sent:**

|        | Name                     | Description                    | Callback Parameters                                                                                                                                      |
| ------ | ------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_SetMinterCallback` | Provide the sender the result. | <ul><li>`minter` : `ByStr20`<br/>Address of the `minter` whose status was being set</li><li>`is_minter` : `Bool`<br/>Status it is being set to</li></ul> |

**Events:**

|              | Name                  | Description                    | Event Parameters                             |
| ------------ | --------------------- | ------------------------------ | -------------------------------------------- |
| `_eventname` | `AddMinterSuccess`    | Adding minter is successful.   | `minter` : `ByStr20`<br/>Address of a minter |
| `_eventname` | `RemoveMinterSuccess` | Removing minter is successful. | `minter` : `ByStr20`<br/>Address of a minter |

#### 2. BatchMint() (Optional)

**Arguments:**

| Name             | Type           | Description                         |
| ---------------- | -------------- | ----------------------------------- |
| `to_list`        | `List ByStr20` | Addresses of the token recipient.   |
| `token_uri_list` | `List String`  | URIs of the new token to be minted. |

**Messages sent:**

|        | Name                     | Description                                | Callback Parameters |
| ------ | ------------------------ | ------------------------------------------ | ------------------- |
| `_tag` | `ZRC6_BatchMintCallback` | Provide the sender the status of the mint. |                     |

#### 3. Mint()

**Arguments:**

| Name        | Type      | Description                                       |
| ----------- | --------- | ------------------------------------------------- |
| `to`        | `ByStr20` | Address of the recipient of the NFT to be minted. |
| `token_uri` | `String`  | Token URI of the NFT to be minted.                |

**Messages sent:**

|        | Name                       | Description                                           | Callback Parameters                                                                                                                                                                  |
| ------ | -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract. |                                                                                                                                                                                      |
| `_tag` | `ZRC6_MintCallback`        | Provide the sender the status of the mint.            | <ul><li>`recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li><li>`token_uri` : `String`<br/>Token URI of a token</li></ul> |

**Events:**

|              | Name          | Description            | Event Parameters                                                                                                                                                                                                                            |
| ------------ | ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `MintSuccess` | Minting is successful. | <ul><li>`by` : `ByStr20`<br/>Address of the `_sender`</li><li> `recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li><li>`token_uri` : `String`<br/>Token URI of a token</li></ul> |

#### 4. Burn() (Optional)

**Arguments:**

| Name       | Type      | Description                                   |
| ---------- | --------- | --------------------------------------------- |
| `token_id` | `Uint256` | Unique ID of an existing NFT to be destroyed. |

**Messages sent:**

|        | Name                | Description                                | Callback Parameters                                                                                                                                                                                                        |
| ------ | ------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_BurnCallback` | Provide the sender the status of the burn. | <ul><li>`initiator` : `ByStr20`</br>Address of the `_sender`</li><li>`burn_address` : `ByStr20`<br/>Address of the token owner whose NFT is being burned</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name          | Description            | Event Parameters                                                                                                                                                                                                           |
| ------------ | ------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `BurnSuccess` | Burning is successful. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`burn_address` : `ByStr20`</br>Address of the token owner whose NFT is being burned</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 5. SetRoyaltyRecipient() (Optional)

**Arguments:**

| Name | Type      | Description                         |
| ---- | --------- | ----------------------------------- |
| `to` | `ByStr20` | Address that royalties are sent to. |

**Messages sent:**

|        | Name                               | Description                         | Callback Parameters                                                  |
| ------ | ---------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyRecipientCallback` | Royalty recipient has been updated. | `royalty_recipient` : `ByStr20`<br/>Address of the royalty recipient |

**Events:**

|              | Name                         | Description                         | Event Parameters                                                     |
| ------------ | ---------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `_eventname` | `SetRoyaltyRecipientSuccess` | Royalty recipient has been updated. | `royalty_recipient` : `ByStr20`<br/>Address of the royalty recipient |

#### 6. SetRoyaltyFeeBPS() (Optional)

**Arguments:**

| Name      | Type      | Description                                                |
| --------- | --------- | ---------------------------------------------------------- |
| `fee_bps` | `Uint256` | Royality fee BPS (1/100ths of a percent, e.g. 1000 = 10%). |

**Messages sent:**

|        | Name                            | Description                       | Callback Parameters                               |
| ------ | ------------------------------- | --------------------------------- | ------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyFeeBPSCallback` | Royalty fee BPS has been updated. | `royalty_fee_bps` : `Uint256`<br/>Royalty Fee BPS |

**Events:**

|              | Name                      | Description                       | Event Parameters                                  |
| ------------ | ------------------------- | --------------------------------- | ------------------------------------------------- |
| `_eventname` | `SetRoyaltyFeeBPSSuccess` | Royalty fee BPS has been updated. | `royalty_fee_bps` : `Uint256`<br/>Royalty Fee BPS |

#### 7. SetApproval()

**Arguments:**

| Name       | Type      | Description                                                            |
| ---------- | --------- | ---------------------------------------------------------------------- |
| `to`       | `ByStr20` | Address to be set or unset as an approved spender of a given token ID. |
| `token_id` | `Uint256` | Unique token ID of an existing NFT.                                    |

**Messages sent:**

|        | Name                       | Description                                                            | Callback Parameters                                                                                                                                                                                                                                                   |
| ------ | -------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_SetApprovalCallback` | Provide the sender the status of the approval for an approved spender. | <ul><li>`approved_spender` : `ByStr20`<br/>Address of the approved spender of a given token ID whose status was being set</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li><li>`is_approved_spender` : `Bool`<br/>Status it is being set to</li></ul></ul> |

**Events:**

|              | Name                    | Description                        | Event Parameters                                                                                                                                                                                                                        |
| ------------ | ----------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddApprovalSuccess`    | Approved spender has been added.   | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`approved_spender` : `ByStr20`<br/>Address to removed as an approved spender of a given token ID</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |
| `_eventname` | `RemoveApprovalSuccess` | Approved spender has been removed. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`approved_spender` : `ByStr20`<br/>Address to removed as an removed spender of a given token ID</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul>  |

#### 8. SetApprovalForAll()

**Arguments:**

| Name | Type      | Description                             |
| ---- | --------- | --------------------------------------- |
| `to` | `ByStr20` | Address to be set or unset as operator. |

**Messages sent:**

|        | Name                             | Description                                                   | Callback Parameters                                                                                                                                            |
| ------ | -------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_SetApprovalForAllCallback` | Provide the sender the status of the approval of an operator. | <ul><li>`operator` : `ByStr20`<br/>Address of the `operator` whose status was being set</li><li>`is_operator` : `Bool`<br/>Status it is being set to</li></ul> |

**Events:**

|              | Name                          | Description                                     | Event Parameters                                                                                                                                            |
| ------------ | ----------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddApprovalForAllSuccess`    | Addition of an operator's status is successful. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`operator` : `ByStr20`<br/>Address of the approved spender which was added</li></ul>   |
| `_eventname` | `RemoveApprovalForAllSuccess` | Removal of an operator's status is successful.  | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`operator` : `ByStr20`<br/>Address of the approved spender which was removed</li></ul> |

#### 9. Transfer()

**Arguments:**

| Name       | Type      | Description                             |
| ---------- | --------- | --------------------------------------- |
| `to`       | `ByStr20` | Recipient address of the NFT.           |
| `token_id` | `Uint256` | Unique ID of the NFT to be transferred. |

**Messages sent:**

|        | Name                           | Description                                                                                                                             | Callback Parameters                                                                                                                                                                  |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_RecipientAcceptTransfer` | Provide the recipient the status of the transfer of an NFT. Revert the whole transition if it is a non-NFT supporting contract address. | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |
| `_tag` | `ZRC6_TransferCallback`        | Provide the sender the status of the transfer of an NFT.                                                                                | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name              | Description                    | Event Parameters                                                                                                                                                                     |
| ------------ | ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `TransferSuccess` | Transfer of NFT is successful. | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 10. TransferFrom()

**Arguments:**

| Name       | Type      | Description                             |
| ---------- | --------- | --------------------------------------- |
| `to`       | `ByStr20` | Recipient address of the NFT.           |
| `token_id` | `Uint256` | Unique ID of the NFT to be transferred. |

**Messages sent:**

|        | Name                               | Description                                                 | Callback Parameters                                                                                                                                                                  |
| ------ | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_RecipientAcceptTransferFrom` | Provide the recipient the status of the transfer of an NFT. | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |
| `_tag` | `ZRC6_TransferFromCallback`        | Provide the sender the status of the transfer of an NFT.    | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name                  | Description                    | Event Parameters                                                                                                                                                                     |
| ------------ | --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `TransferFromSuccess` | Transfer of NFT is successful. | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`recipient` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

## V. Existing Implementation(s)

Prerequisites:

- [Docker](https://www.docker.com/products/container-runtime)
- [Node.js](https://nodejs.org/en/)

To test the [ZRC-6](../reference/zrc6.scilla), run:

```shell
cd example/zrc6
npm i
npm test
```

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
