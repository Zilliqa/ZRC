
|  ZRC | Title | Status| Type | Author | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd)
|--|--|--|--| -- | -- | -- |
| 3  | Standard for Operated Meta Transactions in Fungible Token Contracts | Draft | Standard | Cameron Sajedi <cameron@starlingfoundries.com> | 2019-10-15 | 2019-10-15 


## I. What are Meta Transactions?

Meta Transactions are an emerging standard across smart contract platforms for smoothing the experience of onboarding new users.This is done by enabling an off-chain teller node to act as an intermediary, accepting signed checks for token transfers and paying the fee to engage the transfer on the signatory's behalf. In the Ethereum community, this pattern can be seen in: ERC-865, 965, 1077, 1776 token contracts, no including the many other applications unrelated to token transfers. 

## II. Abstract 

ZRC-3 defines the minimum functionality a smart contract must implement to allow a token of any type to be transfered via delegation to a pre-arranged teller server which can pay gas fees on that user's behalf. This may be easily extended to cases where access control or authority must be represented by this off-chain server as well. 
ZRC-3 modifies ZRC-2 in several core ways:
* Teller replaced with a Teller, which cannot arbitrarily transfer funds, but must wait for the user to prompt a transfer with a signed, valid metatransaction. 
* `Allowance` and `TransferFrom` are both considered depricated and (should be) removed - a teller gets approval through the signed metatransaction and the TransferFrom logic was brought into ERC777 to maintain backwards compatibility, the function has little purpose and presents a front-running vulnerability, and DEXes on Zilliqa will likely not rely on it to engage transfers.  
* A contract-wide account nonce is added to enable multiple Tellers and normal transactions to process in contract without worrying about double spending or out of order transactions due to Teller censorship. Any transaction is only considered valid if its nonce is previous nonce+1. The default transfer does not include this nonce, as that would make supporting this contract more difficult for wallets and exchanges. Thus, if a user is interacting with a Teller they will be encouraged not to spend from that account until the check has cleared (because normal transactions take precedence over check transactions).
* The `OperatorSend` function has been replaced with `SendCheck`, which accepts a signed metatransaction payload and validates the hash and signature on-chain to prevent Teller fraud. 

## III. Motivation

Today, if a potential Zilliqa dapp user wants to participate they must figure out their wallet, keys, safety strategy, recovery seed, etc before they can even begin to participate. Beyond that, if they recieve tokens and want to send them from a wallet without gas, they must now register through an exchange, probably do KYC, and wait several weeks just to do a transfer that costs a fraction of a cent. Tokens that have enabled Meta Transactions may have a Teller that pays for this gas fee on a users behalf, extending ZRC-2. This addition will reduce adoption barries by reducing the onboarding from many days to a few minutes. There are other potential benefits, including OpenBadges standard for scarce achievement badges, UniversalLogins and more.

## IV. Specification

The reference Meta Transactions contract specification describes: 
1) the global error codes to be declared in the library part of the contract. 
2) the names and types of the immutable and mutable variables (aka `fields`). 
3) the transitions that will allow changing the values of the mutable variables. 
4) the events to be emitted by them.

### A. Roles

| Name | Description
|--|--|
| Contract Owner | The owner of the contract initialized by the creator of the contract. |
| Token Owner | A user (identified by her address) that owns a token.  |
| Teller | A signing authority identified by its `_sender` address within a contract call that can only be executed if the teller the Teller has included a valid signed metatransaction specifying that transaction parameters and the `Token Owner`'s signature. A `Token Owner` can now trust that no authority can move funds without the `Token Owner`'s expressed consent. |

### B. Error Codes

The NFT contract must define the following constants for use as error codes for the `Error` event.

| Name | Type | Code | Description
|--|--|--|--|
| `CodeNoAuthorized` | `Int32` | `-1` | Emit when the transition call is unauthorized for a given user.
| `CodeNotFound` | `Int32` | `-2` | Emit when a value is missing.
| `CodeBadRequest` | `Int32` | `-3` | Emit when the transition call is somehow incorrect.
| `CodeTokenExists`| `Int32` | `-4` | Emit when trying to create a token that already exists.
| `CodeUnexpectedError` | `Int32` | `-5` | Emit when the transition call runs into an unexpected error.

### C. Immutable Variables

| Name                 | Type          | Description                                                           |
| -------------------- | ------------- | --------------------------------------------------------------------- |
| `contractOwner`      | `ByStr20`     | The owner of the contract initialized by the creator of the contract. |
| `name`               | `String`      | The name of the fungible token.                                       |
| `symbol`             | `String`      | The symbol of the fungible token.                                     |
| `default_tellers`  | `List ByStr20`| The adddresses set as default for tellers all token holders.        |
| `decimals`           | `Uint32`      | The number of decimal places a token can be divided by.               |

### D. Mutable Fields

| Name                | Type                                                              | Description                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `total_tokens` | `Uint128 = Uint128 0` |    Total amount of tokens.       |
| `revokedDefaultTeller` | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)` |    Mapping of `default_tellers` that have been revoked by token hodlers.       |
| `balancesMap`     | `Map ByStr20 Uint128 = Emp ByStr20 Uint128`                       | Mapping between token owner to number of owned tokens.                                                                                                  |
| `tellersMap`    | `Map ByStr20 (Map ByStr20 Bool) = Emp ByStr20 (Map ByStr20 Bool)`                       | Mapping between token owner to approved address. Token owner can approve an address (as an teller) to transfer tokens to other addresses.   |
| `allowancesMap` | `Map ByStr20 (Map ByStr20 Uint128) = Emp ByStr20 (Map ByStr20 Uint128)` |    Mapping between token owner to approved address. Token owner can give an address an allowance of tokens to transfer tokens to other addresses.       |            
| `accountNonce` | `Map ByStr20 Uint128 = Emp ByStr20 Uint128` |    Mapping between token owner to their present nonce. |

### E. Transitions

#### 1. ReauthorizeDefaultTeller

```ocaml
(* @dev: Re-authorize a default teller*)
(* @param teller: Amount of tokens to be sent.       *)
transition ReauthorizeDefaultTeller(teller: ByStr20)  
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `teller`  | `ByStr20` | Address of the default teller to be reauthorized.  |


|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ReAuthorizedDefaultTeller` | Re-authorizing is successful.     | `teller`: `ByStr20`, `recipient`: `ByStr20`, and `sender` : `_sender`.                             |
| eventName | `Error`       | Re-authorizing is successful. | - emit `CodeNotFound` if the default teller is not found. |

#### 2. RevokeDefaultTeller

```ocaml
(* @dev: Revoke a default teller.              *)
(* @param teller: Amount of tokens to be sent. *)
transition RevokeDefaultTeller(teller : ByStr20)
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `teller`      | `ByStr20` | Address of the default teller to be revoked.   |


|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `RevokedDefaultTellerSuccess` | Revoking is successful.     | `teller`: `ByStr20`, `recipient`: `ByStr20`, and `sender` : `_sender`.                             |
| eventName | `Error`       | Revoking is not successful. | - emit `CodeNotFound` if the default teller is not found. |


#### 3. Send

```ocaml
(* @dev: Moves amount tokens from the caller’s address to the recipient.   *)
(* @param from:       Address of the sender whose balance is decreased.    *)
(* @param recipient:  Address of the recipient whose balance is increased. *)
(* @param amount:     Amount of tokens to be sent.                         *)
transition Send(from: ByStr20, recipient: ByStr20, amount: Uint128)
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `from`      | `ByStr20` | Address of the sender whose balance is decreased.    |
| @param | `recipient` | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`    | `Uint128` | Amount of tokens to be sent.                         |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `SendSuccess` | Sending is successful.     | `from`: `ByStr20`, `recipient`: `ByStr20`, and `amount`: `Uint128`.                             |
| eventName | `Error`       | Sending is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the contract owner. |

#### 4. SendCheck

```ocaml
(* @dev: Moves amount tokens from sender to recipient. The caller must be an teller for the tokenOwner. *)
(* @param tokenOwner: Address of the sender whose balance is decreased.                              *)
(* @param recipient:  Address of the recipient whose balance is increased.                           *)
(* @param amount:     Amount of tokens to be sent.                                                   *)
transition TellerSend(tokenOwner: ByStr20, recipient: ByStr20, amount: Uint128, checkHash: ByStrX, checkSig: ByStr33, tip: Uint128)
```

|        | Name         | Type      | Description                                          |
| ------ | ------------ | --------- | ---------------------------------------------------- |
| @param | `tokenOwner` | `ByStr20` | Address of the sender whose balance is decreased.    |
| @param | `recipient`  | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`     | `Uint128` | Amount of tokens to be sent.                         |
| @param | `checkHash` | `ByStrX` | The concatenated hashes of the metacheck fields to validate|
| @param | `checkSig` | `ByStr33` | The tokenOwner's signature of checkhash to validate the check | 
| @param | `tip`     | `Uint128` | Amount of tokens to transfer from sender to teller for service.|



|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TellerSendSuccess` | Sending is successful.     | `from`: `ByStr20`, `to`: `ByStr20`, and `amount`: `Uint128`.                             |
| eventName | `Error`       | Sending is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not an approved teller. |

#### 5. Burn

```ocaml
(* @dev: Burn existing tokens. Only tokenOwner or approved teller can burn a token *)
(* @param burn_account:                     Address holding the tokens to be burned. *)
(* @param amount:                           Number of tokens to be destroyed.        *)
transition Burn(burn_account: ByStr20, amount: Uint128)
```

|        | Name           | Type      | Description                              |
| ------ | -------------- | --------- | ---------------------------------------- |
| @param | `burn_account` | `ByStr20` | Address holding the tokens to be burned. |
| @param | `amount`       | `Uint128` | Number of tokens to be burned.           |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                                               |
| --------- | ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BurnSuccess` | Burning is successful.     | `from`: `ByStr20`, and `amount`: `Uint128`.                                                                                                                      |
| eventName | `Error`       | Burning is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the token owner.<br>**NOTE:** Only the `tokenOwner` is allowed to call this transition. |


#### 6. TellerBurn

```ocaml
(* @dev: Burn existing tokens. Onlya  default teller can burn a token.  *)
(* @param teller:   Address must be an teller of tokenOwner.          *)
(* @param tokenOwner: Address holding the tokens to be burned.            *)
(* @param amount:     Number of tokens to be destroyed.                   *)
transition TellerBurn(teller: ByStr20, from: ByStr20, amount: Uint128)
```

|        | Name         | Type      | Description                                    |
| ------ | ------------ | --------- | ---------------------------------------------- |
| @param | `teller`   | `ByStr20` | Address of a default teller.                 |
| @param | `tokenOwner` | `ByStr20` | Address holding the tokens to be burned.       |
| @param | `amount`     | `Uint128` | Number of tokens to be burned.                 |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TellerBurnSuccess` | Burning is successful.     | `teller`: `ByStr20`, `tokenOwner`: `ByStr20`, and `amount`: `Uint128`.                                                                                               |
| eventName | `Error`          | Burning is not successful. | - emit `CodeNotAuthorised` if the transition is called by an teller who is not authorized. |


#### 7. Mint

```ocaml
(* @dev: Mint new tokens. Only contractOwner can mint.                        *)
(* @param recipient:     Address of the recipient whose balance is increased. *)
(* @param amount:        Number of tokens to be burned.                       *)
transition Mint(recipient: ByStr20, amount: Uint128)
```

|        | Name        | Type      | Description                                          |
| ------ | ----------- | --------- | ---------------------------------------------------- |
| @param | `recipient` | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`    | `Uint128` | Number of tokens to be minted.                       |

|           | Name          | Description                | Event Parameters                                                                                                                                                                                                                   |
| --------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `MintSuccess` | Minting is successful.     | `recipient`: `ByStr20`, and `amount`: `Uint128`.                             |
| eventName | `Error`       | Minting is not successful. | - emit `CodeTokenExists` if the token already exists.<br>- emit `CodeNotAuthorised` if the transition is called by a user who is not the contract owner.<br>**NOTE:** Only the `contractOwner` is allowed to call this transition. |


#### 8. TellerMint

```ocaml
(* @dev: Mint new tokens. Only approved teller can mint tokens.         *)
(* @param teller:   Address must be an teller of tokenOwner.          *)
(* @param recipient: Address of the recipient whose balance is increased. *)
(* @param amount:    Number of tokens to be burned.                       *)
transition TellerMint(teller: ByStr20, recipient: ByStr20, amount: Uint128)
```

|        | Name         | Type      | Description                                         |
| ------ | ------------ | --------- | --------------------------------------------------- |
| @param | `teller`   | `ByStr20` | Address of a default teller.                      |
| @param | `recipient`  | `ByStr20` | Address of the recipient whose balance is increased.|
| @param | `amount`     | `Uint128` | Number of tokens to be minted.                      |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `TellerMintAllSuccess` | Minting is successful.     | `recipient`: `ByStr20`, and `amount`: `Uint128`. |
| eventName | `Error`                    | Minting is not successful. | - emit `CodeNotAuthorised` if the transition is not called by an approved teller.                                                                                                      |


#### 9. AuthorizeTeller

```ocaml
(* @dev: Make an address an teller of the caller.                           *)
(* @param teller: Address to be set as teller. Cannot be calling address. *)
transition AuthorizeTeller(teller: ByStr20)
```

|        | Name       | Type      | Description                    |
| ------ | ---------- | --------- | ------------------------------ |
| @param | `teller` | `ByStr20` | Address to be set as teller. Cannot be calling address. |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `AuthorizeTellerSuccess` | Authorizing is successful.     | `teller`: `ByStr20`. |
| eventName | `Error`                    | Authorizing is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the token holder.                                                                                                      |


#### 10. RevokeTeller

```ocaml
(* @dev: Revoke an address from being an teller of the caller. *)
(* @param teller:         Address to be unset as teller.     *)
transition RevokeTeller(teller: ByStr20)
```

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `teller` | `ByStr20` | Address to be unset as teller. |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `RevokeTellerSuccess` | Revoking is successful.     | `teller`: `ByStr20`. |
| eventName | `Error`                    | Revoking is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not the token holder.                                                                                                      |


#### 11. IsTellerFor

```ocaml
(* @dev: Returns true if an address is an teller of tokenOwner. All addresses are their own teller. *)
(* @param teller:    Address of a potential teller.                                                 *)
(* @param tokenOwner:  Address of a token holder.                                                       *)
transition IsTellerFor(teller: ByStr20, tokenOwner: ByStr20)
```

|        | Name          | Type      | Description                          |
| ------ | ------------- | --------- | ------------------------------------ |
| @param | `teller`    | `ByStr20` | Address of a potential teller.     |
| @param | `tokenOwner`  | `ByStr20` | Address of a token ownwer.           |

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `IsTellerForSuccess` | Checking teller is successful.     | `teller`: `ByStr20`, and `tokenOwner`: `ByStr20`. |
| eventName | `Error`                    | Checking teller is not successful. | TBA.                                                                                                      |


#### 12. DefaultTellers

```ocaml
(* @dev: Returns the list of default tellers. These addresses are tellers for all token holders. *)
transition DefaultTellers()
```

|           | Name                       | Description                             | Event Parameters                                                                                                                                                                                                               |
| --------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eventName | `DefaultTellersSuccess` | Listing default tellers is successful.     | `list`: `List ByStr20` |


#### 13. Transfer

```ocaml
(* @dev: Move a given amount of tokens from one address another.       *)
(* @param to:     Address of the recipient whose balance is increased. *)
(* @param amount: Number of tokens to be transferred.                  *)
transition Transfer(to: ByStr20, amount: Uint128)
```

|        | Name      | Type      | Description                        |
| ------ | --------- | --------- | ---------------------------------- |
| @param | `to`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`  | `Uint128` | Number of tokens to be transferred.                  |

|           | Name                  | Description                 | Event Parameters                                                                                                                                                                                                                                                                        |
| --------- | --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TransferSuccess` | Transfering is successful.     | `to`: `ByStr20`, and `amount`: `Uint128`.                                                                            |
| eventName | `Error`               | Transfering is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user that is not authorised.<br>**NOTE:** Only `tokenOwner` address can invoke this transition. |

#### 14. TransferFrom

```ocaml
(* @dev: Move a given amount of tokens from one address another using the allowance mechanism. *)
(* param from:    Address of the sender whose balance is deccreased.                           *)
(* param to:      Address of the recipient whose balance is increased.                         *)
(* param amount:  Number of tokens to be transferred.                                          *)
transition TansferFrom(from: ByStr20, to: ByStr20, amount: Uint128)
```

|        | Name      | Type      | Description                                          |
| ------ | --------- | --------- | ---------------------------------------------------- |
| @param | `from`    | `ByStr20` | Address of the sender whose balance is deccreased.   |
| @param | `to`      | `ByStr20` | Address of the recipient whose balance is increased. |
| @param | `amount`  | `Uint128` | Number of tokens to be transferred.                  |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TansferFromSuccess` | Approval is successful.     | `from`: `ByStr20`, `to`: `ByStr20`, and `amount`: `Uint128`.                                                                                               |
| eventName | `Error`          | Approval is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only either the `tokenOwner` or approved `teller`(s) are allowed to call this transition. |

#### 15. Allowance

```ocaml
(* @dev: Returns the number of tokens spender is allowed to spend on behalf of owner. *)
(* param tokenOwner:   Address of a token holder.                                     *)
(* param spender:      Address to be set as a spender.                                *)
transition Allowance(tokenOwner: ByStr20, spender: ByStr20)
```

|        | Name      | Type      | Description                                    |
| ------ | --------- | --------- | ---------------------------------------------- |
| @param | `tokenOwner` | `ByStr20` | Address of a token owner.                               |
| @param | `spender`    | `ByStr20` | Address to be set as a spender for a given token owner. |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `AllowanceSuccess` | Allowing is successful.     | `tokenOwner`: `ByStr20`, and `spender`: `ByStr20`.                                                                                               |
| eventName | `Error`          | Allowing is not successful. | TBA. |


#### 16. Approve

```ocaml
(* @dev: Sets amount as the allowance of spender over the caller’s tokens.  *)
(* There can only be one approved spender per token at a given time         *)
(* param spender: Address to be set as a spender.                           *)
(* param amount:  Number of tokens to be approved for a given spender.      *)
transition Approve(spender: ByStr20, amount: Uint128)
```

|        | Name         | Type      | Description                                          |
| ------ | ------------ | --------- | ---------------------------------------------------- | 
| @param | `spender`    | `ByStr20` | Address to be approved for the given token id.       |
| @param | `amount`     | `Uint128` | Number of tokens to be approved for a given spender. |

|           | Name             | Description                 | Event Parameters                                                                                                                                                                                                                                              |
| --------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `ApproveSuccess` | Approving is successful.     | `spender`: `ByStr20`, and `amount`: `Uint128`.                                                                                               |
| eventName | `Error`          | Approving is not successful. | - emit `CodeNotAuthorised` if the transition is called by a user who is not authorized to approve. <br>**NOTE:** Only the `tokenOwner` or approved is allowed to call this transition. |


#### 17. TotalSupply

```ocaml
(* @dev: Returns the amount of tokens in existence. *)
transition TotalSupply()
```

|           | Name               | Description                        | Event Parameters                                                                                                                                    |
| --------- | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `TotalSupplySuccess` | Counting of supply is successful. | `bal`: `Uint128`, which returns the number of tokens owned by a given address. If the user does not own any tokens, then the value returned is `0`. |

#### 18. BalanceOf

```ocaml
(* @dev: Returns the amount of tokens owned by address. *)
transition BalanceOf(address: ByStr20)
```

|        | Name      | Type      | Description               |
| ------ | --------- | --------- | ------------------------- |
| @param | `address` | `ByStr20` | Address of a token owner. |

|           | Name               | Description                        | Event Parameters                                                                                                                                    |
| --------- | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventName | `BalanceOfSuccess` | Counting of balance is successful. | `bal`: `Uint128`, which returns the number of tokens owned by a given address. If the user does not own any tokens, then the value returned is `0`. |

## V. Existing Implementation(s)

-[starling-foundries](https://github.com/starling-foundries/ZRC-3)

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
