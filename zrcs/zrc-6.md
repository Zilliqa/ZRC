| ZRC | Title                       | Status | Type     | Author                       | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| :-: | --------------------------- | ------ | -------- | ---------------------------- | -------------------- | -------------------- |
|  6  | Non-Fungible Token Standard | Ready  | Standard | Neuti Yoo <noel@zilliqa.com> | 2021-10-01           | 2021-10-20           |

## I. What are NFTs and NFT royalties?

An NFT or Non-Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is unique and non-interchangeable with other tokens.

NFT royalties give an NFT creator or rights holder a percentage of the sale price each time the NFT is sold or re-sold.

## II. Abstract

ZRC-6 defines a new minimum interface of an NFT smart contract while improving upon ZRC-1.

The main advantages of this standard are:

1. ZRC-6 implements standardized royalty information retrieval with a percentage-based royalty fee model. For simplicity, it mandates royalty payments to a single address and unit-less royalty payments across all NFT marketplaces. Funds will be paid for secondary sales only if a marketplace chooses to implement ZRC-6.

2. ZRC-6 implements standardized token URI with the concatenation of base token URI and token ID. A token URI is an HTTP or IPFS URL. This URL should return a JSON blob of data with the metadata for the NFT when queried.

3. ZRC-6 includes batch minting such that multiple NFTs can be minted in one transaction.

4. ZRC-6 is compatible with ZRC-X since every callback name is prefixed with `ZRC6_`.

## III. Motivation

Many of the largest NFT marketplaces have implemented incompatible royalty payment solutions. ZRC-6 provides a standardized way to retrieve royalty information for NFTs. The marketplace should transfer the actual funds.

The marketplace builders had to customize to each NFT contract since there was no standard for token URI.

In ZRC-1 minting can be very inefficient since multiple transactions are required to mint multiple NFTs.

The ZRC-1 and ZRC-2 contracts can share the same callback names. It can cause the composed contracts to throw a compiler error.

## IV. Specification

The NFT contract specification describes:

1. the error codes
2. the immutable contract parameters and mutable fields
3. the transitions
4. the messages and events

### A. Roles

| Name                | Description                                                                                                                                                                                | Required |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------: |
| `contract_owner`    | The contract owner is the creator of the NFT. The contract owner can: <ul><li>set royalty recipient</li><li>set royalty fee BPS</li><li>set base URI</li><li>add/remove a minter</li></ul> |   Yes    |
| `royalty_recipient` | The royalty recipient gets a royalty amount each time the NFT is sold or re-sold. Initially, the royalty recipient is the contract owner.                                                  |    No    |
| `token_owner`       | Each token has an token owner. A token owner can: <ul><li>transfer a token </li><li>burn a token</li><li>add/remove a spender of a token</li><li>add/remove an operator</li></ul>          |   Yes    |
| `minter`            | A minter can mint tokens. Initially, the contract owner is a minter.                                                                                                                       |   Yes    |
| `spender`           | On behalf of the token owner, a spender can transfer a token. There can only be one spender per token at any given time.                                                                   |   Yes    |
| `operator`          | On behalf of the token owner, an operator can: <ul><li>transfer a token </li><li>burn a token</li><li>add/remove a spender of a token</li></ul>                                            |   Yes    |

### B. Error Codes

The NFT contract must define the following constants for use as error codes for the `Error` event.

| Name                        | Type    |  Code | Description                                                               | Required |
| --------------------------- | ------- | ----: | ------------------------------------------------------------------------- | :------: |
| `TokenNotFoundError`        | `Int32` |  `-1` | Emit when the token is not found.                                         |   Yes    |
| `SelfError`                 | `Int32` |  `-2` | Emit when the address is self.                                            |   Yes    |
| `NotContractOwnerError`     | `Int32` |  `-3` | Emit when the address is not a contract owner.                            |   Yes    |
| `NotTokenOwnerError`        | `Int32` |  `-4` | Emit when the address is not a token owner.                               |   Yes    |
| `NotMinterError`            | `Int32` |  `-5` | Emit when the address is not a minter.                                    |   Yes    |
| `NotSpenderOrOperatorError` | `Int32` |  `-6` | Emit when the address is neither a spender nor an operator for the token. |   Yes    |
| `NotOwnerOrOperatorError`   | `Int32` |  `-7` | Emit when the address is neither a token owner nor a token operator.      |   Yes    |
| `MinterNotFoundError`       | `Int32` |  `-9` | Emit when the minter is found.                                            |   Yes    |
| `MinterFoundError`          | `Int32` |  `-8` | Emit when the minter is not found.                                        |   Yes    |
| `SpenderFoundError`         | `Int32` | `-10` | Emit when the spender is found.                                           |   Yes    |
| `SpenderNotFoundError`      | `Int32` | `-11` | Emit when the spender is not found.                                       |   Yes    |
| `OperatorFoundError`        | `Int32` | `-12` | Emit when the operator is found.                                          |   Yes    |
| `OperatorNotFoundError`     | `Int32` | `-13` | Emit when the operator is not found.                                      |   Yes    |
| `InvalidFeeBpsError`        | `Int32` | `-14` | Emit when the fee bps is out of range.                                    |    No    |

### C. Immutable Variables

| Name             | Type      | Description                                                              |
| ---------------- | --------- | ------------------------------------------------------------------------ |
| `contract_owner` | `ByStr20` | The owner of the contract is initialized by the creator of the contract. |
| `name`           | `String`  | The NFT name.                                                            |
| `symbol`         | `String`  | The NFT symbol.                                                          |

### D. Mutable Fields

| Name                | Type                             | Description                                                          | Required |
| ------------------- | -------------------------------- | -------------------------------------------------------------------- | :------: |
| `royalty_recipient` | `ByStr20`                        | Address to send royalties to.                                        |    No    |
| `royalty_fee_bps`   | `Uint256`                        | Royalty fee BPS (1/100ths of a percent, e.g. 1000 = 10%).            |    No    |
| `base_uri`          | `String`                         | Base URI. e.g. `https://creatures-api.zil.xyz/api/creature/`         |   Yes    |
| `token_owners`      | `Map Uint256 ByStr20`            | Mapping from token ID to its owner.                                  |   Yes    |
| `token_id_count`    | `Uint256`                        | The total number of tokens minted.                                   |   Yes    |
| `total_supply`      | `Uint256`                        | The total number of existing tokens.                                 |   Yes    |
| `balances`          | `Map ByStr20 Uint256`            | Mapping from token owner to the number of existing tokens.           |   Yes    |
| `minters`           | `Map ByStr20 Dummy`              | Set for minters.                                                     |   Yes    |
| `spenders`          | `Map Uint256 ByStr20`            | Mapping from token ID to a spender.                                  |   Yes    |
| `operators`         | `Map ByStr20 (Map ByStr20 Bool)` | Mapping from token owner to operators authorized by the token owner. |   Yes    |

### E. Transitions

#### 1. RoyaltyInfo() (Optional)

**Arguments:**

| Name         | Type      | Description                        |
| ------------ | --------- | ---------------------------------- |
| `token_id`   | `Uint256` | Unique ID of an existing token.    |
| `sale_price` | `Uint256` | Sale price when the token is sold. |

**Messages:**

|        | Name                       | Description                                              | Callback Parameters                                                                                                                                                            |
| ------ | -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_RoyaltyInfoCallback` | Provide the sender how much royalty is owed and to whom. | <ul><li>`royalty_amount` : `Uint256`<br/>Amount of funds to be paid to the royalty recipient</li><li>`royalty_recipient` : `ByStr20`</li>Address of the royalty recipient</ul> |

#### 2. TokenURI()

**Arguments:**

| Name       | Type      | Description           |
| ---------- | --------- | --------------------- |
| `token_id` | `Uint256` | Unique ID of a token. |

**Messages:**

|        | Name                    | Description                                            | Callback Parameters                                                                                      |
| ------ | ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_TokenURICallback` | Provide the sender with the token URI of the token ID. | `token_uri` : `String`<br/>Token URI of a token<br/> e.g. `https://creatures-api.zil.xyz/api/creature/1` |

#### 3. OwnerOf()

**Arguments:**

| Name       | Type      | Description           |
| ---------- | --------- | --------------------- |
| `token_id` | `Uint256` | Unique ID of a token. |

**Messages:**

|        | Name                   | Description                              | Callback Parameters                       |
| ------ | ---------------------- | ---------------------------------------- | ----------------------------------------- |
| `_tag` | `ZRC6_OwnerOfCallback` | Provide the sender with the token owner. | `token_owner` : `ByStr20`<br/>Token owner |

#### 4. Name()

**Messages:**

|        | Name                | Description                      | Callback Parameters            |
| ------ | ------------------- | -------------------------------- | ------------------------------ |
| `_tag` | `ZRC6_NameCallback` | Provide the sender the NFT name. | `name` : `String`<br/>NFT name |

#### 5. Symbol()

**Messages:**

|        | Name                  | Description                        | Callback Parameters                |
| ------ | --------------------- | ---------------------------------- | ---------------------------------- |
| `_tag` | `ZRC6_SymbolCallback` | Provide the sender the NFT symbol. | `symbol` : `String`<br/>NFT symbol |

#### 6. BalanceOf()

**Arguments:**

| Name      | Type      | Description                                         |
| --------- | --------- | --------------------------------------------------- |
| `address` | `ByStr20` | Address of the token owner to check the balance of. |

**Messages:**

|        | Name                     | Description                                             | Callback Parameters                                                      |
| ------ | ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `_tag` | `ZRC6_BalanceOfCallback` | Provide the sender with the balance of the token owner. | `balance` : `Uint256`<br/>The balance of tokens owned by the token owner |

#### 7. TotalSupply()

**Messages:**

|        | Name                       | Description                                                   | Callback Parameters                                              |
| ------ | -------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `_tag` | `ZRC6_TotalSupplyCallback` | Provide the sender the current total supply of tokens minted. | `total_supply` : `Uint256`<br/>The total supply of tokens minted |

#### 8. GetSpender()

**Arguments:**

| Name       | Type      | Description           |
| ---------- | --------- | --------------------- |
| `token_id` | `Uint256` | Unique ID of a token. |

**Messages:**

|        | Name                      | Description                                                            | Callback Parameters                                                                                                    |
| ------ | ------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_GetSpenderCallback` | Provide the sender an address of the spender address and the token ID. | <ul><li>`spender` : `ByStr20`<br/>Address of spender</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 9. IsOperator()

**Arguments:**

| Name          | Type      | Description             |
| ------------- | --------- | ----------------------- |
| `token_owner` | `ByStr20` | Address of token owner. |
| `operator`    | `ByStr20` | Address of operator.    |

**Messages:**

|        | Name                      | Description                                            | Callback Parameters                                               |
| ------ | ------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| `_tag` | `ZRC6_IsOperatorCallback` | Check if the address is an operator of the token owner | `is_operator` : `Bool`<br/> `True` if operator, otherwise `False` |

#### 10. SetRoyaltyRecipient() (Optional)

**Arguments:**

| Name | Type      | Description                         |
| ---- | --------- | ----------------------------------- |
| `to` | `ByStr20` | Address that royalties are sent to. |

**Messages:**

|        | Name                               | Description                               | Callback Parameters                                   |
| ------ | ---------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyRecipientCallback` | Provide the sender the royalty recipient. | `to` : `ByStr20`<br/>Address of the royalty recipient |

**Events:**

|              | Name                         | Description                         | Event Parameters                                                                                                                     |
| ------------ | ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `SetRoyaltyRecipientSuccess` | Royalty recipient has been updated. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address of the royalty recipient</li></ul> |

#### 11. SetRoyaltyFeeBPS() (Optional)

**Arguments:**

| Name      | Type      | Description                                                |
| --------- | --------- | ---------------------------------------------------------- |
| `fee_bps` | `Uint256` | Royality fee BPS (1/100ths of a percent, e.g. 1000 = 10%). |

**Messages:**

|        | Name                            | Description                             | Callback Parameters                               |
| ------ | ------------------------------- | --------------------------------------- | ------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyFeeBPSCallback` | Provide the sender the royalty fee BPS. | `royalty_fee_bps` : `Uint256`<br/>Royalty Fee BPS |

**Events:**

|              | Name                      | Description                       | Event Parameters                                                                                                                 |
| ------------ | ------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `SetRoyaltyFeeBPSSuccess` | Royalty fee BPS has been updated. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`royalty_fee_bps` : `Uint256`<br/>Royalty Fee BPS</li></ul> |

#### 12. SetBaseURI()

**Arguments:**

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `uri` | `String` | Base URI.   |

**Messages:**

|        | Name                      | Description                      | Callback Parameters                |
| ------ | ------------------------- | -------------------------------- | ---------------------------------- |
| `_tag` | `ZRC6_SetBaseURICallback` | Provide the sender the base URI. | `base_uri` : `String`<br/>Base URI |

**Events:**

|              | Name                | Description                | Event Parameters                                                                                                  |
| ------------ | ------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `SetBaseURISuccess` | Base URI has been updated. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`base_uri` : `String`<br/>Base URI</li></ul> |

#### 13. BatchMint() (Optional)

**Arguments:**

| Name      | Type           | Description                       |
| --------- | -------------- | --------------------------------- |
| `to_list` | `List ByStr20` | Addresses of the token recipient. |

**Messages:**

|        | Name                     | Description                         | Callback Parameters |
| ------ | ------------------------ | ----------------------------------- | ------------------- |
| `_tag` | `ZRC6_BatchMintCallback` | Provide the sender with the result. |                     |

#### 14. Mint()

**Arguments:**

| Name | Type      | Description                                         |
| ---- | --------- | --------------------------------------------------- |
| `to` | `ByStr20` | Address of the recipient of the token to be minted. |

**Messages:**

|        | Name                       | Description                                                  | Callback Parameters                                                                                                   |
| ------ | -------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract.        |                                                                                                                       |
| `_tag` | `ZRC6_MintCallback`        | Provide the sender the token recipient address and token ID. | <ul><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name          | Description            | Event Parameters                                                                                                                                                                    |
| ------------ | ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `MintSuccess` | Token has been minted. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li> `to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 15. Burn() (Optional)

**Arguments:**

| Name       | Type      | Description                                     |
| ---------- | --------- | ----------------------------------------------- |
| `token_id` | `Uint256` | Unique ID of an existing token to be destroyed. |

**Messages:**

|        | Name                | Description                                       | Callback Parameters                                                                                                                                                                              |
| ------ | ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_BurnCallback` | Provide the sender the burn address and token ID. | <ul><li>`initiator` : `ByStr20`</br>Address of the `_sender`</li><li>`burn_address` : `ByStr20`<br/>Address of the token owner</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name          | Description            | Event Parameters                                                                                                                                                                                 |
| ------------ | ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `BurnSuccess` | Token has been burned. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`burn_address` : `ByStr20`</br>Address of the token owner</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 16. AddMinter()

**Arguments:**

| Name | Type      | Description                    |
| ---- | --------- | ------------------------------ |
| `to` | `ByStr20` | Address to be added as minter. |

**Messages:**

|        | Name                     | Description                            | Callback Parameters                                                |
| ------ | ------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `_tag` | `ZRC6_AddMinterCallback` | Provide the sender the minter address. | <ul><li>`to` : `ByStr20`<br/>Address that has been added</li></ul> |

**Events:**

|              | Name               | Description            | Event Parameters                                                                                                                |
| ------------ | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddMinterSuccess` | Minter has been added. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been added</li></ul> |

#### 17. RemoveMinter()

**Arguments:**

| Name | Type      | Description                        |
| ---- | --------- | ---------------------------------- |
| `to` | `ByStr20` | Address to be removed from minter. |

**Messages:**

|        | Name                        | Description                                           | Callback Parameters                                                  |
| ------ | --------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `_tag` | `ZRC6_RemoveMinterCallback` | Provide the sender the address that has been removed. | <ul><li>`to` : `ByStr20`<br/>Address that has been removed</li></ul> |

**Events:**

|              | Name                  | Description              | Event Parameters                                                                                                                  |
| ------------ | --------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RemoveMinterSuccess` | Minter has been removed. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been removed</li></ul> |

#### 18. AddSpender()

**Arguments:**

| Name       | Type      | Description                                           |
| ---------- | --------- | ----------------------------------------------------- |
| `to`       | `ByStr20` | Address to be added as a spender of a given token ID. |
| `token_id` | `Uint256` | Unique ID of an existing token.                       |

**Messages:**

|        | Name                      | Description                                          | Callback Parameters                                                                                                        |
| ------ | ------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_AddSpenderCallback` | Provide the sender the spender address and token ID. | <ul><li>`to` : `ByStr20`<br/>Address that has been added</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

**Events:**

|              | Name                | Description             | Event Parameters                                                                                                                                                                        |
| ------------ | ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddSpenderSuccess` | Spender has been added. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been added</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

#### 19. RemoveSpender()

**Arguments:**

| Name       | Type      | Description                                             |
| ---------- | --------- | ------------------------------------------------------- |
| `to`       | `ByStr20` | Address to be removed from spender of a given token ID. |
| `token_id` | `Uint256` | Unique ID of an existing token.                         |

**Messages:**

|        | Name                         | Description                                           | Callback Parameters                                                                                                          |
| ------ | ---------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_RemoveSpenderCallback` | Provide the sender the address that has been removed. | <ul><li>`to` : `ByStr20`<br/>Address that has been removed</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

**Events:**

|              | Name                   | Description               | Event Parameters                                                                                                                                                                          |
| ------------ | ---------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RemoveSpenderSuccess` | Spender has been removed. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been removed</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

#### 20. AddOperator()

**Arguments:**

| Name | Type      | Description                      |
| ---- | --------- | -------------------------------- |
| `to` | `ByStr20` | Address to be added as operator. |

**Messages:**

|        | Name                       | Description                              | Callback Parameters                              |
| ------ | -------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `_tag` | `ZRC6_AddOperatorCallback` | Provide the sender the operator address. | `to` : `ByStr20`<br/>Address that has been added |

**Events:**

|              | Name                 | Description              | Event Parameters                                                                                                                |
| ------------ | -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddOperatorSuccess` | Operator has been added. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been added</li></ul> |

#### 21. RemoveOperator()

**Arguments:**

| Name | Type      | Description                          |
| ---- | --------- | ------------------------------------ |
| `to` | `ByStr20` | Address to be removed from operator. |

**Messages:**

|        | Name                          | Description                                           | Callback Parameters                                |
| ------ | ----------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `_tag` | `ZRC6_RemoveOperatorCallback` | Provide the sender the address that has been removed. | `to` : `ByStr20`<br/>Address that has been removed |

**Events:**

|              | Name                    | Description                | Event Parameters                                                                                                                  |
| ------------ | ----------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RemoveOperatorSuccess` | Operator has been removed. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been removed</li></ul> |

#### 22. Transfer()

**Arguments:**

| Name       | Type      | Description                     |
| ---------- | --------- | ------------------------------- |
| `to`       | `ByStr20` | Recipient address of the token. |
| `token_id` | `Uint256` | Unique ID of the token.         |

**Messages:**

|        | Name                           | Description                                             | Callback Parameters                                                                                                                                                           |
| ------ | ------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_RecipientAcceptTransfer` | Provide the recipient the result of the token transfer. | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |
| `_tag` | `ZRC6_TransferCallback`        | Provide the sender the result of the token transfer.    | <ul><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name              | Description                 | Event Parameters                                                                                                                                                                                                                           |
| ------------ | ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `TransferSuccess` | Token has been transferred. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`from` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 23. TransferFrom()

**Arguments:**

| Name       | Type      | Description                               |
| ---------- | --------- | ----------------------------------------- |
| `to`       | `ByStr20` | Recipient address of the token.           |
| `token_id` | `Uint256` | Unique ID of the token to be transferred. |

**Messages:**

|        | Name                               | Description                                             | Callback Parameters                                                                                                                                                             |
| ------ | ---------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_RecipientAcceptTransferFrom` | Provide the recipient the result of the token transfer. | <ul><li>`from` : `ByStr20`<br/>Address of the token owner</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |
| `_tag` | `ZRC6_TransferFromCallback`        | Provide the sender the result of the token transfer.    | <ul><li>`from` : `ByStr20`<br/>Address of the token owner</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name                  | Description                 | Event Parameters                                                                                                                                                                                                                             |
| ------------ | --------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferFromSuccess` | Token has been transferred. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`from` : `ByStr20`<br/>Address of the token owner</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

## V. Testing

Prerequisites:

- [Docker](https://www.docker.com/products/container-runtime)
- [Node.js](https://nodejs.org/en/)

To test the [ZRC-6](../reference/zrc6.scilla), run:

```shell
cd tests/zrc6
npm i
npm test
```

## VI. References

- [ZRC-1: Standard for Non Fungible Tokens](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-1.md)
- [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
- [OpenZeppelin ERC721.sol Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol)
- [OpenZeppelin IERC2981.sol Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/interfaces/IERC2981.sol)
- [OpenSea - Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [ZRC issue #88 - ZRC contracts must have unique names for callback transitions](https://github.com/Zilliqa/ZRC/issues/88)

## VII. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
