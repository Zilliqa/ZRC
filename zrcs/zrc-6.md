| ZRC | Title                       | Status | Type     | Author                       | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| :-: | --------------------------- | ------ | -------- | ---------------------------- | -------------------- | -------------------- |
|  6  | Non-Fungible Token Standard | Ready  | Standard | Neuti Yoo <noel@zilliqa.com> | 2021-10-01           | 2021-11-02           |

## Table of Contents

- [I. What are NFTs and NFT royalties?](#i-what-are-nfts-and-nft-royalties)
- [II. Abstract](#ii-abstract)
- [III. Motivation](#iii-motivation)
- [IV. Specification](#iv-specification)
  - [A. Immutable Variables](#a-immutable-variables)
  - [B. Mutable Fields](#b-mutable-fields)
  - [C. Roles](#c-roles)
  - [D. Error Codes](#d-error-codes)
  - [E. Transitions](#e-transitions)
- [V. Testing](#v-testing)
- [VI. References](#vi-references)
- [VII. Copyright](#vii-copyright)

## I. What are NFTs and NFT royalties?

An NFT or Non-Fungible Token is an open standard to create collectible assets. Unlike fungible tokens, each token is unique and non-interchangeable with other tokens.

NFT royalties give an NFT creator or rights holder a percentage of the sale price each time the NFT is sold or re-sold.

## II. Abstract

ZRC-6 defines a new minimum interface of an NFT smart contract while improving upon ZRC-1.

The main advantages of this standard are:

1. ZRC-6 implements standardized royalty information retrieval with a percentage-based royalty fee model. For simplicity, it mandates royalty payments to a single address and unit-less royalty payments across all NFT marketplaces. Funds will be paid for secondary sales only if a marketplace chooses to implement ZRC-6.

2. ZRC-6 implements standardized token URI with the concatenation of base token URI and token ID. A token URI is an HTTP or IPFS URL. This URL should return a JSON blob of data with the metadata for the NFT when queried.

3. ZRC-6 implements standardized token transfer with a single transition which can be called by a token owner, a spender, or an operator.

4. ZRC-6 is compatible with ZRC-X since every callback name is prefixed with `ZRC6_`.

5. ZRC-6 features batch minting such that multiple NFTs can be minted in one transaction.

6. ZRC-6 features contract ownership transfer by making the contract owner mutable.

## III. Motivation

1. Many of the largest NFT marketplaces have implemented incompatible royalty payment solutions. ZRC-6 provides a standardized way to retrieve royalty information for NFTs. The marketplace should transfer the actual funds.

2. The marketplace builders had to customize to each NFT contract since there was no standard for token URI.

3. ZRC-1 includes `Transfer` and `TransferFrom` for the token transfer. The two transitions have the same type signature and the only difference is the access control. This has added unnecessary complexity.

4. The ZRC-1 and ZRC-2 contracts can share the same callback names. It can cause the composed contracts to throw a compiler error.

5. In ZRC-1 minting can be very inefficient since multiple transactions are required to mint multiple NFTs.

6. In ZRC-1 contract owner is immutable. As some contract owners want to transfer their contract ownership, developers had to implement the feature for ZRC-1.

## IV. Specification

### A. Immutable Variables

| Name                     | Type      | Description         |
| ------------------------ | --------- | ------------------- |
| `initial_contract_owner` | `ByStr20` | The contract onwer. |
| `name`                   | `String`  | The NFT name.       |
| `symbol`                 | `String`  | The NFT symbol.     |

### B. Mutable Fields

| Name                       | Type                             | Description                                                                             | Required |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- | :------: |
| `contract_owner`           | `ByStr20`                        | Address of the contract owner. Defaults to `initial_contract_owner`.                    |    ✓     |
| `contract_owner_candidate` | `ByStr20`                        | Address of the contract owner candidate. Defaults to zero address.                      |          |
| `royalty_recipient`        | `ByStr20`                        | Address to send royalties to. Defaults to `initial_contract_owner`.                     |          |
| `royalty_fee_bps`          | `Uint256`                        | Royalty fee BPS (1/100ths of a percent, e.g. 1000 = 10%). Defaults to `1000`.           |          |
| `base_uri`                 | `String`                         | Base URI. e.g. `https://creatures-api.zil.xyz/api/creature/`. Defaults to empty string. |    ✓     |
| `token_id_count`           | `Uint256`                        | The total number of tokens minted. Defaults to `0`.                                     |    ✓     |
| `total_supply`             | `Uint256`                        | The total number of existing tokens. Defaults to `0`.                                   |    ✓     |
| `token_owners`             | `Map Uint256 ByStr20`            | Mapping from token ID to its owner.                                                     |    ✓     |
| `balances`                 | `Map ByStr20 Uint256`            | Mapping from token owner to the number of existing tokens.                              |    ✓     |
| `minters`                  | `Map ByStr20 Dummy`              | Set of minters.                                                                         |    ✓     |
| `spenders`                 | `Map Uint256 ByStr20`            | Mapping from token ID to a spender.                                                     |    ✓     |
| `operators`                | `Map ByStr20 (Map ByStr20 Bool)` | Mapping from token owner to operators authorized by the token owner.                    |    ✓     |

### C. Roles

| Name                       | Description                                                                                                                                                                                                                                     | Required |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `contract_owner`           | The contract owner can: <ul><li>set contract owner candidate</li><li>set royalty recipient</li><li>set royalty fee BPS</li><li>set base URI</li><li>add/remove a minter</li></ul>                                                               |    ✓     |
| `contract_owner_candidate` | If the contract owner wants to transfer contract ownership to someone, the contract owner can set the person as the contract owner candidate. The contract owner candidate can accept the contract ownership and become the new contract owner. |          |
| `royalty_recipient`        | The royalty recipient gets a royalty amount each time the NFT is sold or re-sold. Initially, the royalty recipient is the contract owner.                                                                                                       |          |
| `minter`                   | A minter can mint tokens. Initially, the contract owner is a minter.                                                                                                                                                                            |    ✓     |
| `token_owner`              | Each token has an token owner. A token owner can: <ul><li>transfer a token </li><li>burn a token</li><li>add/remove a spender of a token</li><li>add/remove an operator</li></ul>                                                               |    ✓     |
| `spender`                  | On behalf of the token owner, a spender can transfer a token. There can only be one spender per token at any given time.                                                                                                                        |    ✓     |
| `operator`                 | On behalf of the token owner, an operator can: <ul><li>transfer a token </li><li>burn a token</li><li>add/remove a spender of a token</li></ul>                                                                                                 |    ✓     |

| Transition                  | `contract_owner` | `contract_owner_candidate` | `minter` | `token_owner` | `spender` | `operator` |
| --------------------------- | :--------------: | :------------------------: | :------: | :-----------: | :-------: | :--------: |
| `SetContractOwnerCandidate` |        ✓         |                            |          |               |           |            |
| `AcceptContractOwnership`   |                  |             ✓              |          |               |           |            |
| `SetRoyaltyRecipient`       |        ✓         |                            |          |               |           |            |
| `SetRoyaltyFeeBPS`          |        ✓         |                            |          |               |           |            |
| `SetBaseURI`                |        ✓         |                            |          |               |           |            |
| `AddMinter`                 |        ✓         |                            |          |               |           |            |
| `RemoveMinter`              |        ✓         |                            |          |               |           |            |
| `BatchMint`                 |                  |                            |    ✓     |               |           |            |
| `Mint`                      |                  |                            |    ✓     |               |           |            |
| `Burn`                      |                  |                            |          |       ✓       |           |     ✓      |
| `AddSpender`                |                  |                            |          |       ✓       |           |     ✓      |
| `RemoveSpender`             |                  |                            |          |       ✓       |           |     ✓      |
| `AddOperator`               |                  |                            |          |       ✓       |           |            |
| `RemoveOperator`            |                  |                            |          |       ✓       |           |            |
| `TransferFrom`              |                  |                            |          |       ✓       |     ✓     |     ✓      |

### D. Error Codes

The NFT contract must define the following constants for use as error codes for the `Error` event.

| Name                             | Type    |  Code | Description                                                          | Required |
| -------------------------------- | ------- | ----: | -------------------------------------------------------------------- | :------: |
| `SelfError`                      | `Int32` |  `-1` | Emit when the address is self.                                       |    ✓     |
| `NotContractOwnerError`          | `Int32` |  `-2` | Emit when the address is not a contract owner.                       |    ✓     |
| `NotContractOwnerCandidateError` | `Int32` |  `-3` | Emit when the address is not a contract owner candidate.             |          |
| `NotTokenOwnerError`             | `Int32` |  `-4` | Emit when the address is not a token owner.                          |    ✓     |
| `NotMinterError`                 | `Int32` |  `-5` | Emit when the address is not a minter.                               |    ✓     |
| `NotOwnerOrOperatorError`        | `Int32` |  `-6` | Emit when the address is neither a token owner nor a token operator. |    ✓     |
| `MinterNotFoundError`            | `Int32` |  `-7` | Emit when the minter is not found.                                   |    ✓     |
| `MinterFoundError`               | `Int32` |  `-8` | Emit when the minter is found.                                       |    ✓     |
| `SpenderNotFoundError`           | `Int32` |  `-9` | Emit when the spender is not found.                                  |    ✓     |
| `SpenderFoundError`              | `Int32` | `-10` | Emit when the spender is found.                                      |    ✓     |
| `OperatorNotFoundError`          | `Int32` | `-11` | Emit when the operator is not found.                                 |    ✓     |
| `OperatorFoundError`             | `Int32` | `-12` | Emit when the operator is found.                                     |    ✓     |
| `NotAllowedToTransferError`      | `Int32` | `-13` | Emit when `_sender` is not allowed to transfer the token.            |    ✓     |
| `TokenNotFoundError`             | `Int32` | `-14` | Emit when the token is not found.                                    |    ✓     |
| `InvalidFeeBpsError`             | `Int32` | `-15` | Emit when the fee bps is out of range. The valid range is 1 ~ 1000   |          |

### E. Transitions

#### 1. `RoyaltyInfo()` (Optional)

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`

**Arguments:**

| Name         | Type      | Description                        |
| ------------ | --------- | ---------------------------------- |
| `token_id`   | `Uint256` | Unique ID of an existing token.    |
| `sale_price` | `Uint256` | Sale price when the token is sold. |

**Messages:**

|        | Name                       | Description                                                                     | Callback Parameters                                                                                                                                                            |
| ------ | -------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_RoyaltyInfoCallback` | Provide the sender the address of the royalty recipient and the royalty amount. | <ul><li>`royalty_amount` : `Uint256`<br/>Amount of funds to be paid to the royalty recipient</li><li>`royalty_recipient` : `ByStr20`</li>Address of the royalty recipient</ul> |

#### 2. `TokenURI()`

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`

**Arguments:**

| Name       | Type      | Description           |
| ---------- | --------- | --------------------- |
| `token_id` | `Uint256` | Unique ID of a token. |

**Messages:**

|        | Name                    | Description                                            | Callback Parameters                                                                                      |
| ------ | ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_TokenURICallback` | Provide the sender with the token URI of the token ID. | `token_uri` : `String`<br/>Token URI of a token<br/> e.g. `https://creatures-api.zil.xyz/api/creature/1` |

#### 3. `OwnerOf()`

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`

**Arguments:**

| Name       | Type      | Description           |
| ---------- | --------- | --------------------- |
| `token_id` | `Uint256` | Unique ID of a token. |

**Messages:**

|        | Name                   | Description                                        | Callback Parameters                       |
| ------ | ---------------------- | -------------------------------------------------- | ----------------------------------------- |
| `_tag` | `ZRC6_OwnerOfCallback` | Provide the sender the address of the token owner. | `token_owner` : `ByStr20`<br/>Token owner |

#### 4. `Name()`

**Messages:**

|        | Name                | Description                      | Callback Parameters            |
| ------ | ------------------- | -------------------------------- | ------------------------------ |
| `_tag` | `ZRC6_NameCallback` | Provide the sender the NFT name. | `name` : `String`<br/>NFT name |

#### 5. `Symbol()`

**Messages:**

|        | Name                  | Description                        | Callback Parameters                |
| ------ | --------------------- | ---------------------------------- | ---------------------------------- |
| `_tag` | `ZRC6_SymbolCallback` | Provide the sender the NFT symbol. | `symbol` : `String`<br/>NFT symbol |

#### 6. `BalanceOf()`

**Arguments:**

| Name      | Type      | Description                                         |
| --------- | --------- | --------------------------------------------------- |
| `address` | `ByStr20` | Address of the token owner to check the balance of. |

**Messages:**

|        | Name                     | Description                                             | Callback Parameters                                                      |
| ------ | ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `_tag` | `ZRC6_BalanceOfCallback` | Provide the sender with the balance of the token owner. | `balance` : `Uint256`<br/>The balance of tokens owned by the token owner |

#### 7. `TotalSupply()`

**Messages:**

|        | Name                       | Description                                                   | Callback Parameters                                              |
| ------ | -------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `_tag` | `ZRC6_TotalSupplyCallback` | Provide the sender the current total supply of tokens minted. | `total_supply` : `Uint256`<br/>The total supply of tokens minted |

#### 8. `GetSpender()`

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`
- There should be a spender for the token. Otherwise, it should throw `SpenderNotFoundError`

**Arguments:**

| Name       | Type      | Description           |
| ---------- | --------- | --------------------- |
| `token_id` | `Uint256` | Unique ID of a token. |

**Messages:**

|        | Name                      | Description                                                     | Callback Parameters                                                                                                    |
| ------ | ------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_GetSpenderCallback` | Provide the sender the address of the spender and the token ID. | <ul><li>`spender` : `ByStr20`<br/>Address of spender</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 9. `IsOperator()`

**Arguments:**

| Name          | Type      | Description             |
| ------------- | --------- | ----------------------- |
| `token_owner` | `ByStr20` | Address of token owner. |
| `operator`    | `ByStr20` | Address of operator.    |

**Messages:**

|        | Name                      | Description                                                                             | Callback Parameters                                               |
| ------ | ------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `_tag` | `ZRC6_IsOperatorCallback` | Provide the sender a boolean for whether the address is an operator of the token owner. | `is_operator` : `Bool`<br/> `True` if operator, otherwise `False` |

#### 10. `SetContractOwnerCandidate()` (Optional)

**Requirements:**

- `_sender` should be the contract owner. Otherwise, it should throw `NotContractOwnerError`
- `_sender` should not be `to`. Otherwise, it should throw `SelfError`

**Arguments:**

| Name | Type      | Description                                        |
| ---- | --------- | -------------------------------------------------- |
| `to` | `ByStr20` | Address to be set as the contract owner candidate. |

**Messages:**

|        | Name                                     | Description                                                     | Callback Parameters                                          |
| ------ | ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| `_tag` | `ZRC6_SetContractOwnerCandidateCallback` | Provide the sender the address of the contract owner candidate. | `to` : `ByStr20`<br/>Address of the contract owner candidate |

**Events:**

|              | Name                        | Description                                    | Event Parameters                                                                                                                            |
| ------------ | --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `SetContractOwnerCandidate` | The contract owner candidate has been updated. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address of the contract owner candidate</li></ul> |

#### 11. `AcceptContractOwnership()` (Optional)

**Requirements:**

- `_sender` should be the contract owner candidate. Otherwise, it should throw `NotContractOwnerCandidateError`

**Messages:**

|        | Name                                   | Description                                                       | Callback Parameters                                                                                                                                                         |
| ------ | -------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_AcceptContractOwnershipCallback` | Provide the sender the result of the contract ownership transfer. | <ul><li>`contract_owner` : `ByStr20`<br/>Address of the contract owner</li><li>`contract_owner_candidate` : `ByStr20`<br/>Address of the contract owner candidate</li></ul> |

**Events:**

|              | Name                      | Description                              | Event Parameters                                                                                                                                                                                                                         |
| ------------ | ------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AcceptContractOwnership` | Contract ownership has been transferred. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`contract_owner` : `ByStr20`<br/>Address of the contract owner</li><li>`contract_owner_candidate` : `ByStr20`<br/>Address of the contract owner candidate</li></ul> |

#### 12. `SetRoyaltyRecipient()` (Optional)

**Requirements:**

- `_sender` should be the contract owner. Otherwise, it should throw `NotContractOwnerError`

**Arguments:**

| Name | Type      | Description                         |
| ---- | --------- | ----------------------------------- |
| `to` | `ByStr20` | Address that royalties are sent to. |

**Messages:**

|        | Name                               | Description                                          | Callback Parameters                                   |
| ------ | ---------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyRecipientCallback` | Provide the sender the address of royalty recipient. | `to` : `ByStr20`<br/>Address of the royalty recipient |

**Events:**

|              | Name                  | Description                         | Event Parameters                                                                                                                     |
| ------------ | --------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `SetRoyaltyRecipient` | Royalty recipient has been updated. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address of the royalty recipient</li></ul> |

#### 13. `SetRoyaltyFeeBPS()` (Optional)

**Requirements:**

- `_sender` should be the contract owner. Otherwise, it should throw `NotContractOwnerError`
- `fee_bps` should be in the range of 1 and 1000. Otherwise, it should throw `InvalidFeeBpsError`

**Arguments:**

| Name      | Type      | Description                                                |
| --------- | --------- | ---------------------------------------------------------- |
| `fee_bps` | `Uint256` | Royality fee BPS (1/100ths of a percent, e.g. 1000 = 10%). |

**Messages:**

|        | Name                            | Description                             | Callback Parameters                               |
| ------ | ------------------------------- | --------------------------------------- | ------------------------------------------------- |
| `_tag` | `ZRC6_SetRoyaltyFeeBPSCallback` | Provide the sender the royalty fee BPS. | `royalty_fee_bps` : `Uint256`<br/>Royalty Fee BPS |

**Events:**

|              | Name               | Description                       | Event Parameters                                                                                                                 |
| ------------ | ------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `SetRoyaltyFeeBPS` | Royalty fee BPS has been updated. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`royalty_fee_bps` : `Uint256`<br/>Royalty Fee BPS</li></ul> |

#### 14. `SetBaseURI()`

**Requirements:**

- `_sender` should be the contract owner. Otherwise, it should throw `NotContractOwnerError`

**Arguments:**

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `uri` | `String` | Base URI.   |

**Messages:**

|        | Name                      | Description                      | Callback Parameters                |
| ------ | ------------------------- | -------------------------------- | ---------------------------------- |
| `_tag` | `ZRC6_SetBaseURICallback` | Provide the sender the base URI. | `base_uri` : `String`<br/>Base URI |

**Events:**

|              | Name         | Description                | Event Parameters                                                                                                  |
| ------------ | ------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `SetBaseURI` | Base URI has been updated. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`base_uri` : `String`<br/>Base URI</li></ul> |

#### 15. `BatchMint()` (Optional)

**Requirements:**

- `_sender` should be a minter. Otherwise, it should throw `NotMinterError`

**Arguments:**

| Name      | Type           | Description                       |
| --------- | -------------- | --------------------------------- |
| `to_list` | `List ByStr20` | Addresses of the token recipient. |

**Messages:**

|        | Name                     | Description                         | Callback Parameters |
| ------ | ------------------------ | ----------------------------------- | ------------------- |
| `_tag` | `ZRC6_BatchMintCallback` | Provide the sender with the result. |                     |

#### 16. `Mint()`

**Requirements:**

- `_sender` should be a minter. Otherwise, it should throw `NotMinterError`

**Arguments:**

| Name | Type      | Description                                         |
| ---- | --------- | --------------------------------------------------- |
| `to` | `ByStr20` | Address of the recipient of the token to be minted. |

**Messages:**

|        | Name                       | Description                                                     | Callback Parameters                                                                                                   |
| ------ | -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract.           |                                                                                                                       |
| `_tag` | `ZRC6_MintCallback`        | Provide the sender the address of token recipient and token ID. | <ul><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name   | Description            | Event Parameters                                                                                                                                                                    |
| ------------ | ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Mint` | Token has been minted. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li> `to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 17. `Burn()` (Optional)

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`
- `_sender` should be a token owner or an operator. Otherwise, it should throw `NotOwnerOrOperatorError`

**Arguments:**

| Name       | Type      | Description                                     |
| ---------- | --------- | ----------------------------------------------- |
| `token_id` | `Uint256` | Unique ID of an existing token to be destroyed. |

**Messages:**

|        | Name                | Description                                       | Callback Parameters                                                                                                                                                                              |
| ------ | ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `ZRC6_BurnCallback` | Provide the sender the burn address and token ID. | <ul><li>`initiator` : `ByStr20`</br>Address of the `_sender`</li><li>`burn_address` : `ByStr20`<br/>Address of the token owner</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

**Events:**

|              | Name   | Description            | Event Parameters                                                                                                                                                                                 |
| ------------ | ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `Burn` | Token has been burned. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`burn_address` : `ByStr20`</br>Address of the token owner</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

#### 18. `AddMinter()`

**Requirements:**

- `_sender` should be the contract owner. Otherwise, it should throw `NotContractOwnerError`
- `to` should not be already a minter. Otherwise, it should throw `MinterFoundError`

**Arguments:**

| Name | Type      | Description                    |
| ---- | --------- | ------------------------------ |
| `to` | `ByStr20` | Address to be added as minter. |

**Messages:**

|        | Name                     | Description                                   | Callback Parameters                                                |
| ------ | ------------------------ | --------------------------------------------- | ------------------------------------------------------------------ |
| `_tag` | `ZRC6_AddMinterCallback` | Provide the sender the address of the minter. | <ul><li>`to` : `ByStr20`<br/>Address that has been added</li></ul> |

**Events:**

|              | Name        | Description            | Event Parameters                                                                                                                |
| ------------ | ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddMinter` | Minter has been added. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been added</li></ul> |

#### 19. `RemoveMinter()`

**Requirements:**

- `_sender` should be the contract owner. Otherwise, it should throw `NotContractOwnerError`
- `to` should be already a minter. Otherwise, it should throw `MinterNotFoundError`

**Arguments:**

| Name | Type      | Description                        |
| ---- | --------- | ---------------------------------- |
| `to` | `ByStr20` | Address to be removed from minter. |

**Messages:**

|        | Name                        | Description                                           | Callback Parameters                                                  |
| ------ | --------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `_tag` | `ZRC6_RemoveMinterCallback` | Provide the sender the address that has been removed. | <ul><li>`to` : `ByStr20`<br/>Address that has been removed</li></ul> |

**Events:**

|              | Name           | Description              | Event Parameters                                                                                                                  |
| ------------ | -------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RemoveMinter` | Minter has been removed. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been removed</li></ul> |

#### 20. `AddSpender()`

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`
- `_sender` should be a token owner or an operator. Otherwise, it should throw `NotOwnerOrOperatorError`
- `to` should not be already a spender. Otherwise, it should throw `SpenderFoundError`

**Arguments:**

| Name       | Type      | Description                                           |
| ---------- | --------- | ----------------------------------------------------- |
| `to`       | `ByStr20` | Address to be added as a spender of a given token ID. |
| `token_id` | `Uint256` | Unique ID of an existing token.                       |

**Messages:**

|        | Name                      | Description                                                 | Callback Parameters                                                                                                        |
| ------ | ------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `ZRC6_AddSpenderCallback` | Provide the sender the address of the spender and token ID. | <ul><li>`to` : `ByStr20`<br/>Address that has been added</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

**Events:**

|              | Name         | Description             | Event Parameters                                                                                                                                                                        |
| ------------ | ------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddSpender` | Spender has been added. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been added</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

#### 21. `RemoveSpender()`

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`
- `_sender` should be a token owner or an operator. Otherwise, it should throw `NotOwnerOrOperatorError`
- `to` should be already a spender. Otherwise, it should throw `SpenderNotFoundError`

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

|              | Name            | Description               | Event Parameters                                                                                                                                                                          |
| ------------ | --------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RemoveSpender` | Spender has been removed. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been removed</li><li>`token_id` : `Uint256`</br>Unique ID of a token</li></ul> |

#### 22. `AddOperator()`

**Requirements:**

- `_sender` should be the token owner. Otherwise, it should throw `NotTokenOwnerError`
- `_sender` should not be `to`. Otherwise, it should throw `SelfError`
- `to` should not be already an operator. Otherwise, it should throw `OperatorFoundError`

**Arguments:**

| Name | Type      | Description                      |
| ---- | --------- | -------------------------------- |
| `to` | `ByStr20` | Address to be added as operator. |

**Messages:**

|        | Name                       | Description                                     | Callback Parameters                              |
| ------ | -------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `_tag` | `ZRC6_AddOperatorCallback` | Provide the sender the address of the operator. | `to` : `ByStr20`<br/>Address that has been added |

**Events:**

|              | Name          | Description              | Event Parameters                                                                                                                |
| ------------ | ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AddOperator` | Operator has been added. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been added</li></ul> |

#### 23. `RemoveOperator()`

**Requirements:**

- `_sender` should be the token owner. Otherwise, it should throw `NotTokenOwnerError`
- `_sender` should not be `to`. Otherwise, it should throw `SelfError`
- `to` should be already an operator. Otherwise, it should throw `OperatorNotFoundError`

**Arguments:**

| Name | Type      | Description                          |
| ---- | --------- | ------------------------------------ |
| `to` | `ByStr20` | Address to be removed from operator. |

**Messages:**

|        | Name                          | Description                                           | Callback Parameters                                |
| ------ | ----------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `_tag` | `ZRC6_RemoveOperatorCallback` | Provide the sender the address that has been removed. | `to` : `ByStr20`<br/>Address that has been removed |

**Events:**

|              | Name             | Description                | Event Parameters                                                                                                                  |
| ------------ | ---------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RemoveOperator` | Operator has been removed. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`to` : `ByStr20`<br/>Address that has been removed</li></ul> |

#### 24. `TransferFrom()`

**Requirements:**

- `token_id` should exist. Otherwise, it should throw `TokenNotFoundError`
- `_sender` should be a token owner, spender, or operator. Otherwise, it should throw `NotAllowedToTransferError`
- `_sender` should not be `to`. Otherwise, it should throw `SelfError`

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

|              | Name           | Description                 | Event Parameters                                                                                                                                                                                                                             |
| ------------ | -------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferFrom` | Token has been transferred. | <ul><li>`initiator` : `ByStr20`<br/>Address of the `_sender`</li><li>`from` : `ByStr20`<br/>Address of the token owner</li><li>`to` : `ByStr20`<br/>Address of a recipient</li><li>`token_id` : `Uint256`<br/>Unique ID of a token</li></ul> |

## V. Testing

Prerequisites:

- [Docker](https://www.docker.com/products/container-runtime)
- [Node.js](https://nodejs.org/en/)

To test the [ZRC-6](../reference/zrc6.scilla), run:

```shell
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
