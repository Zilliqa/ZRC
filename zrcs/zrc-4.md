| ZRC | Title                        | Status | Type  | Author                                                                                                                       | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| 1   | Standard for Multisig Wallet | Draft  | Standard | Yeo Te Ye <teye@zilliqa.com> | 2020-04-08           | 2020-04-09           |

## I. What is a MultiSig Wallet?

A multi-signature wallet is a cryptocurrency wallet owned by two or more owners. Whenever a transaction is created, the transaction has to be approved and signed by two or more owners before it can be executed on the blockchain. A multisig wallet can implement various combination of keys: with 2/3 being the most common where 2 signatures are minimally required out of the 3 owners.

## II. Abstract

ZRC-4 defines a minimum interface of a multisig wallet smart contract. The contract holds funds that can be paid out to arbitrary users, provided that enough people in the designated list of owners sign off on the payout.

The transaction must be added to the contract before signatures can be collected. Once sufficient signatures are collected, the recipient can request for the transaction to be executed and the money paid out.

## III. Motivation

A standard for multisig wallet can serve as an interface for developers and other companies to implement their own multisig wallets to contain their funds in a more secure fashion. The multisig wallet can be used in escrow scenarios and decision making scenarios to prevent misuse of funds.

## IV. Specification

The multisig wallet contract specification describes:

1. the global error codes to be declared in the library part of the contract;
2. the names and types of the immutable and mutable variables (aka `fields`);
3. the transitions that will allow the changing of values of the mutable variables;
4. the events to be emitted by them.

### A. Error Codes

The multisig contract define the following constants for use as error codes for the `Error` event.

| Name                      | Type    | Code  | Description    |
| ------------------------- | ------- | ----- | -------------- |
| `NonOwnerCannotSign`      | `Int32` | `-1`  | Emit when a non-owner attempts to sign a transaction.
| `UnknownTransactionId`    | `Int32` | `-2`  | Emit when a request is made for a transaction which cannot be found. |
| `InsufficientFunds`       | `Int32` | `-3`  | Emit when there is insufficient balance for token transaction. |
| `NoSignatureListFound`    | `Int32` | `-4`  | Emit when there are no signatures for a valid transaction request. |
| `AlreadySigned`           | `Int32` | `-5`  | Emit when an owner attempts to sign a transaction that has already been signed by the same owner. |
| `NotAlreadySigned`        | `Int32` | `-6`  | Emit when a request is made to revoke a signature on a exisiting transaction in which the sender has not signed. |
| `InvalidContract`         | `Int32` | `-7`  | Emit when a request is made to an invalid multisig contract. |
| `InvalidAmount`           | `Int32` | `-8`  | Emit when an owner attempts to send an empty amount to a recipient wallet. |
| `NotEnoughSignatures`     | `Int32` | `-9`  | Emit when the number of signatures counts is less than the number of signatures required to execute a transaction. |
| `SenderMayNotExecute`     | `Int32` | `-10` | Emit when a request is made to execute a transaction in which the sender is neither any of the owners nor the receipent of the transaction. |
| `NonOwnerCannotSubmit`    | `Int32` | `-11` | Emit when a non-owner attempts to create a new transaction. |
| `IncorrectSignatureCount` | `Int32` | `-12` | Emit when trying to revoke a signature of an existing transaction in which there are no signatures. |

### B. Immutable Variables

| Name                  | Type           | Description   |
| --------------------- | -------------- | ------------- |
| `owners_list`         | `List ByStr20` | The list of owners of the multisig wallet. |
| `required_signatures` | `Uint32`       | The number of signatures required to approve and execute a transaction. |

__Note__: it is a good idea to set `required_signatures` to a value strictly less than the number of owners, so that the remaining owners can retrieve the funds should some owners lose their private keys, or unable or unwilling to sign for new transactions.

### C. Mutable Fields

| Name               | Type                            | Description |
| ------------------ | ------------------------------- | ----------- |
| `owners`           | `Map ByStr20 Bool`              | Mapping of multisig wallets owners to a boolean. True indicates an owner. |
| `transactionCount` | `Uint32`                        | The number of accumulated transactions from contract initialization. |
| `signatures`       | `Map Uint32 (Map ByStr20 Bool)` | Mapping from transaction IDs to signees. |
| `signature_counts` | `Map Uint32 Uint32`             | Mapping from transaction IDs to accumulated count of signatures. |
| `transactions`     | `Map Uint32 Transaction`        | Mapping from transaction IDs to a `Transaction` object. <br/> `Transaction` object contains the `recipient`, `amount` and `tag` in the form: `Trans of ByStr20 Uint128 String`.  |

__Note__: Although `owners` is listed as a mutable fields, this multisig wallet contract specification is designed to prevent adding or removing owners. Refer to the section [V. Update Owners or Change Number of Required Signatures](#v.-update-owners-or-change-number-of-required-signatures) for more information.

### D. Interface Transitions

#### 1. SubmitTransaction()
```
(* Creates a transaction request for future signoff *)
transition SubmitTransaction (recipient : ByStr20, amount : Uint128, tag : String)
```

**Arguments:**
| Name        | Type      | Description |
| ----------- | --------- | ----------- |
| `recipient` | `ByStr20` | Address of the recipient to transfer amount to. |
| `amount`    | `Uint128` | Amount of funds to be transferred.              |
| `tag`       | `String`  | Transition name to be invoked. Designed in the scenario of invoking a transition of another contract. Otherwise, the `tag` should be set to `AddFunds`. |

**Events:**
|              | Name                  | Description                            | Event Parameters |
| ------------ | --------------------- | -------------------------------------- | ---------------- |
| `_eventname` | `Transaction created` | Transaction is submitted successfully. | <ul><li>`transactionId` : `Uint32`<br/>Identifier for submitted transaction</li><li>`recipient` : `ByStr20`<br/>Address of recipient</li><li>`amount` : `Uint128`<br/>Amount of funds to be transferred</li><li>`tag` : `String`<br/>Transition name to be invoked</li></ul> |
| `_eventname` | `Error`               | Transaction is not submitted.          | <ul><li>emit `NonOwnerCannotSubmit` if the transition is not called by the wallet owners</li><li>emit `InvalidAmount` if the transition is called with empty `amount`</li></ul> |

#### 2. SignTransaction()
```
(* Sign off on an existing transaction *)
transition SignTransaction (transactionId : Uint32)
```

**Arguments:**
| Name            | Type     | Description                                          |
| --------------- | -------  | ---------------------------------------------------- |
| `transactionId` | `Uint32` | Identifier for the transaction request to be signed. |

**Events:**
|               | Name                 | Description                         | Event Parameters |
| ------------- | -------------------- | ----------------------------------- | ---------------- |
| `_eventname`  | `Transaction signed` | Transaction is signed successfully. | <ul><li>`transactionId` : `Uint32`<br/>Identifier for transaction request</li></ul> |
| `_eventname`  | `Error`              | Transaction is not signed.          | <ul><li>emit `NonOwnerCannotSign` if the transition is not called by the wallet owners</li><li>emit `UnknownTransactionId` if there are no transaction records for the specified `transitionId`</li><li>emit `AlreadySigned` if the transaction already has an existing signature of the signee</li></ul> |

#### 3. ExecuteTransaction()
```
(* Execute signed-off transaction *)
transition ExecuteTransaction (transactionId : Uint32)
```

**Arguments:**
| Name            | Type     | Description                                            |
| --------------- | -------  | ------------------------------------------------------ |
| `transactionId` | `Uint32` | Identifier for the transaction request to be executed. |

**Messages sent:**
|        | Name                 | Description                                     | Callback Parameters |
| ------ | -------------------- | ----------------------------------------------- | ------------------- |
| `_tag` | `ExecuteTransaction` | Provide the sender the status of the execution. | <ul><li>`recipient` : `ByStr20`<br/>Address of recipient</li><li>`amount` : `Uint128`<br/>Amount of funds to be transferred</li></ul> |

**Events:**
|               | Name                   | Description                           | Event Parameters |
| ------------- | ---------------------- | ------------------------------------- | ---------------- |
| `_eventname`  | `Transaction executed` | Transaction is executed successfully. | <ul><li>`transactionId` : `Uint32`<br/>Identifier for transaction request</li><li>`recipient` : `ByStr20`<br/>Address of recipient</li><li>`amount` : `Uint128`<br/>Amount of funds to be transferred</li><li>`tag` : `String`<br/>Transition name to be invoked</li></ul> |
| `_eventname`  | `Error`                | Transaction is not executed.          | <ul><li>emit `UnknownTransactionId` if there are no transaction records for the specified `transitionId`</li><li>emit `SenderMayNotExecute` if the transition is neither called by the wallet owners nor recipient</li><li>emit `InsufficientFunds` if the wallet does not have sufficient funds to transfer over to the recipient</li><li>emit `NoSignatureListFound` if no signature records exist for the stated transaction record</li><li>emit `NotEnoughSignatures` if the transaction is executed without fulfilling the minimum number of required signatures</li></ul> |

#### 4. RevokeSignature()
```
(* Revoke signature of existing transaction, if it has not yet been executed. *)
transition RevokeSignature (transactionId : Uint32)
```

**Arguments:**
| Name            | Type     | Description                                                          |
| --------------- | -------  | -------------------------------------------------------------------- |
| `transactionId` | `Uint32` | Transaction identifier in which the signature is to be removed from. |

**Events:**
|               | Name                | Description                                             | Event Parameters |
| ------------- | ------------------- | ------------------------------------------------------- | ---------------- |
| `_eventname`  | `Signature revoked` | Signature is revoked from the transaction successfully. | <ul><li>`transactionId` : `Uint32`<br/>Identifier for transaction request to revoke the signature from</li></ul> |
| `_eventname`  | `Error`             | Signature is not revoked.                               | <ul><li>emit `NotAlreadySigned` if sender's signature is not found in the signature records for the specific `transactionId`</li><li>emit `IncorrectSignatureCount` if there do not exist any signatures for the existing transaction record</li></ul>

#### 5. AddFunds()
```
(* Add funds to wallet *)
transition AddFunds ()
```

## V. Update Owners or Change Number of Required Signatures

This multisig wallet contract is designed to prevent adding or removing owners, or changing the number of required signatures. 

The proposed design for performing the aforementioned changes is:

1. Deploy a new wallet with the owners and number of required signatures adjusted.
2. On the __old wallet__, invoke `SubmitTransaction` transition with the following parameters:
    - `recipient` : Address of new wallet
    - `amount` : _balance of old wallet
    - `tag` : `AddFunds`
3. Next, on the __old wallet__, have the various owners invoke `SignTransaction` transition with the following parameters until the minimal required signature is reached:
    - `transactionId` : <transactionId from (2)>
4. Lastly, on the __old wallet__, have one of the owners invoke `ExecuteTransaction` transition. All the existing balance of the __old wallet__ would be transferred to the new wallet from (1).

## VI. Existing Implementation(s)

_TBD_

## VII. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).