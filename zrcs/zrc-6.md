| ZRC | Title                        | Status | Type     | Author                          | Created (yyyy-mm-dd) |
| --- | ---------------------------- | ------ | -------- | ------------------------------- | -------------------- |
| 6   | Standard for Multiple Tokens | Draft  | Standard | Victor Porton <porton@narod.ru> | 2020-10-30           |

## I. What are Fungible Tokens?

This standard allows a contract to "contain" both fungible (like ZRC-2) and non-fungible (like ZRC-1) tokens. Up to 2**64 tokens per single contract are supported.

## II. Abstract

ZRC-6 defines a minimum interface that a smart contract must implement to allow (multiple) tokens to be managed, tracked, owned, and traded peer-to-peer via wallets or exchanges.

## III. Motivation

This standard serves as an interface for developers to create non-fungible tokens, currencies, utility tokens or stable coins. Allowing a single contract to create multiple tokens may sometimes much reduce gas usage when creating and/or interoperating multiple tokens.

## IV. Specification

The multiple token contract specification describes:

1. the global error codes to be declared in the library part of the contract;
2. the names and types of the immutable and mutable variables (aka `fields`);
3. the transitions that will allow the changing of values of the mutable variables;
4. the events to be emitted by them.

### A. Roles

| Name               | Description                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contract_owner`   | The owner of the contract initialized by the creator of the contract.                                                                                                                                                      |
| `token_owner`      | A user (identified by an address) that owns tokens.                                                                                                                                                                        |
| `approved_spender` | A user (identified by an address) that can transfer tokens on behalf of the token_owner.                                                                                                                                   |
| `operator`         | A user (identified by an address) that is approved to operate all tokens owned by another user (identified by another address). This role is optional. (Remark: we don't provide default operators per-token to save gas.) |
| `default_operator` | A special user (identified by an address) that is approved to operate all tokens owned by all users (identified by addresses). This role is optional.                                                                      |

### B. Error Codes

The fungible token contract must define the following constants for use as error codes for the `Error` exception.

| Name                        | Type    | Code | Description                                                                                    |
| --------------------------- | ------- | ---- | ---------------------------------------------------------------------------------------------- |
| `CodeIsSender`              | `Int32` | `-1` | Emit when an address is same as is the sender.                                                 |
| `CodeInsufficientFunds`     | `Int32` | `-2` | Emit when there is insufficient balance to authorise transaction.                              |
| `CodeInsufficientAllowance` | `Int32` | `-3` | Emit when there is insufficient allowance to authorise transaction.                            |
| `CodeNotOwner`              | `Int32` | `-4` | Emit when the sender is not a relevant owner. This error code is optional.                     |
| `CodeNotApprovedOperator`   | `Int32` | `-5` | Emit when caller is not an approved operator or default_operator. This error code is optional. |
| `CodeTokenDoesNotExist`     | `Int32` | `-6` | Emit when trying to use a non-existing token.                                                  |
| `CodeInequalLengths`        | `Int32` | `-7` | Emit when argument array lengths do not match.                                                 |

### C. Immutable Variables

| Name                | Type           | Description                                                                                                    |
| ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `contract_owner`    | `ByStr20`      | The owner of the contract initialized by the creator of the contract.                                          |
| `default_operators` | `List ByStr20` | The list of default operators initialized by the creator of the contract. This immutable variable is optional. |

### D. Mutable Fields

| Name                        | Tpe                                | Description                                                                                                                                                                                                                                            |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`                      | `Map Uint64 String`                | The name of the tokens.                                                                                                                                                                                                                                |
| `symbol`                    | `Map Uint64 String`                | The symbol of the tokens.                                                                                                                                                                                                                              |
| `decimals`                  | `Map Uint64 Uint32`                | The number of decimal places a token can be divided by.                                                                                                                                                                                                |
| `init_supply`               | `Map Uint64 Uint128`               | The initial supply of tokens when a token is created.                                                                                                                                                                                                  |
| `total_supply`              | `Map Uint64 Uint128`               | Total amount of tokens available.                                                                                                                                                                                                                      |
| `balances`                  | `Map Uint64 Uint128`               | Mapping between token owner to number of owned tokens.                                                                                                                                                                                                 |
| `allowances`                | `Map Uint64 (Map ByStr20 Uint128)` | Mapping from token owner to approved spender address. Token owner can give an address an allowance of tokens to transfer tokens to other addresses.                                                                                                    |
| `operators`                 | `Map Uint64 (Map ByStr20 Unit)`    | Mapping from token owner to designated operators. A token owner can approve an address as an operator (as per the definition of operator given above). This mapping is optional.                                                                       |
| `revoked_default_operators` | `Map Uint64 (Map ByStr20 Unit)`    | Mapping from token owner to revoked default operators. Default operators are intialised by the contract owner. A token owner can revoked a default operator (as per the definition of default operator given above) at will. This mapping is optional. |

### E. Getter Transitions

#### 1. IsOperatorFor() (Optional)

```ocaml
(* @dev: Check if an address is an operator or default operator of a token_owner. Throw if not. *)
(* @param token:       Token ID.                                                                *)
(* @param operator:    Address of a potential operator.                                         *)
(* @param token_owner: Address of a token_owner.                                                *)
transition IsOperatorFor(token: Uint64, token_owner: ByStr20, operator: ByStr20)
```

**Arguments:**

|        | Name          | Type      | Description                                           |
| ------ | ------------- | --------- | ----------------------------------------------------- |
| @param | `token`       | `ByStr20` | A token ID.                                           |
| @param | `token_owner` | `ByStr20` | An address of a particular token_owner.               |
| @param | `operator`    | `ByStr20` | An address of a particular operator of a token_owner. |

**Messages sent:**

|        | Name                    | Description                                                                                                 | Callback Parameters                                                                                                                                          |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `IsOperatorForCallBack` | Provide the sender a callback if specified address is indeed an approved operator of specified token_owner. | `token` : `Uint64`, `token_owner` : `ByStr20`, `operator`: `ByStr20`, where `token_owner` is the address of the token_owner, `operator` is the address of the approved operator. |

### F. Interface Transitions

#### 1. Mint() (Optional)

```ocaml
(* @dev: Mint new tokens. Only the relevant owner can mint.                  *)
(* @param token: Token ID.                                                   *)
(* @param recipient: Address of the recipient whose balance is to increase.  *)
(* @param amount:    Number of tokens to be minted.                          *)
transition Mint(token: ByStr20, recipient: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name        | Type      | Description                                            |
| ------ | ----------- | --------- | ------------------------------------------------------ |
| @param | `token`     | `ByStr20` | A token ID.                                            |
| @param | `recipient` | `ByStr20` | Address of the recipient whose balance is to increase. |
| @param | `amount`    | `Uint128` | Number of tokens to be minted.                         |

**Messages sent:**

|        | Name                  | Description                                           | Callback Parameters                                                                                                                                                                                                |
| ------ | --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract. | `token` : `Uint64`, `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `minter` is the address of the minter, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens minted. |
| `_tag` | `MintSuccessCallBack` | Provide the sender the status of the mint.            | `token` : `Uint64`, `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `minter` is the address of the minter, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens minted. |

**Events/Errors:**

|              | Name     | Description                | Event Parameters                                                                                                                                                                                                                                                                |
| ------------ | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Minted` | Minting is successful.     | `token` : `Uint64`, `minter` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `minter` is the address of the minter, `recipient` is the address whose balance will be increased, and `amount` is the amount of fungible tokens minted.  |
| `_eventname` | `Error`  | Minting is not successful. | - emit `CodeNotOwner` if the transition is not called by the appropriate owner.                                                                                                                                                                                                 |
|              |          |                            | - emit `CodeTokenDoesNotExist` if the token ID does not exist                                                                                                                                       |

#### 2. Burn() (Optional)

```ocaml
(* @dev: Burn existing tokens. Only relevant owner can burn.                      *)
(* @param token: Token ID.                                                        *)
(* @param burn_account: Address of the token_owner whose balance is to decrease.  *)
(* @param amount:       Number of tokens to be burned.                            *)
transition Burn(token: ByStr20, burn_account: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name           | Type      | Description                                              |
| ------ | -------------- | --------- | -------------------------------------------------------- |
| @param | `token`        | `ByStr20` | A token ID.                                              |
| @param | `burn_account` | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `amount`       | `Uint128` | Number of tokens to be burned.                           |

**Messages sent:**

|        | Name                  | Description                                | Callback Parameters                                                                                                                                                                                                                     |
| ------ | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `BurnSuccessCallBack` | Provide the sender the status of the burn. | `token` : `Uint64`, `burner` : `ByStr20`, `burn_account`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `burner` is the address of the burner, `burn_account` is the address whose balance will be decreased, and `amount` is the amount of fungible tokens burned. |

**Events/Errors:**

|              | Name    | Description                | Event Parameters                                                                                                                                                                                                                                                                                                                            |
| ------------ | ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Burnt` | Burning is successful.     | `token` : `Uint64`, `burner` : `ByStr20`, `burn_account`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `burner` is the address of the burner, `burn_account` is the address whose balance will be decreased, and `amount` is the amount of fungible tokens burned.                                                        |
| `_eventname` | `Error` | Burning is not successful. | - emit `CodeNotOwner` if the transition is not called by the relevant owner. <br> - emit `CodeNoBalance` if balance of token_owner does not exists. <br> - emit `CodeInsufficientFunds` if the amount to be burned is more than the balance of token_owner. <br> -  emit `CodeTokenDoesNotExist` if the token ID does not exist. |

#### 3. AuthorizeOperator() (Optional)

```ocaml
(* @dev: Make an address an operator of the caller.             *)
(* @param token: Token ID.                                      *)
(* @param operator: Address to be authorize as operator or      *)
(* Re-authorize as default_operator. Cannot be calling address. *)
transition AuthorizeOperator(token: Uint64, operator: ByStr20)
```

**Arguments:**

|        | Name       | Type      | Description                                                                                         |
| ------ | ---------- | --------- | --------------------------------------------------------------------------------------------------- |
| @param | `token`    | `Uint64`  | Token ID.                                                                                           |
| @param | `operator` | `ByStr20` | Address to be authorize as operator or re-authorize as default_operator. Cannot be calling address. |

**Events/Errors:**

|              | Name                       | Description                    | Event Parameters                                                                                                                                                                                               |
| ------------ | -------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AuthorizeOperatorSuccess` | Authorizing is successful.     | `token` : `Uint64` which is the token ID, `authorizer`: `ByStr20` which is the caller's address, and `authorized_operator`: `ByStr20` which is the address to be authorized as an operator of the token_owner. |
| `_eventname` | `Error`                    | Authorizing is not successful. | - emit `CodeIsSender` if the user is trying to authorize himself as an operator. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist.                                                           |

#### 4. RevokeOperator() (Optional)

```ocaml
(* @dev: Revoke an address from being an operator or default_operator of the caller. *)
(* @param token: Token ID.                                                           *)
(* @param operator: Address to be removed as operator or default_operator.           *)
transition RevokeOperator(token: Uint64, operator: ByStr20)
```

**Arguments:**

|        | Name       | Type      | Description                      |
| ------ | ---------- | --------- | -------------------------------- |
| @param | `token`    | `Uint64`  | Token ID.                        |
| @param | `operator` | `ByStr20` | Address to be unset as operator. |

**Events/Errors:**

|              | Name                    | Description                 | Event Parameters                                                                                                                                                                                     |
| ------------ | ----------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RevokeOperatorSuccess` | Revoking is successful.     | `token`: `Uint64` which is the token ID, `revoker`: `ByStr20` which is the caller's address, and `revoked_operator`: `ByStr20` which is the address to be removed as an operator of the token_owner. |
| `_eventname` | `Error`                 | Revoking is not successful. | - emit `CodeNotApprovedOperator` if the specified address is not an existing operator or default_operator of the token_owner. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist     |

#### 5. IncreaseAllowance()

```ocaml
(* @dev: Increase the allowance of an approved_spender over the caller tokens. Only token_owner allowed to invoke.   *)
(* param token:        Token ID.                                                                                     *)
(* param spender:      Address of the designated approved_spender.                                                   *)
(* param amount:       Number of tokens to be increased as allowance for the approved_spender.                       *)
transition IncreaseAllowance(token: Uint64, spender: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name      | Type      | Description                                                                     |
| ------ | --------- | --------- | ------------------------------------------------------------------------------- |
| @param | `token`   | `Uint64`  | Token ID.                                                                       |
| @param | `spender` | `ByStr20` | Address of an approved_spender.                                                 |
| @param | `amount`  | `Uint128` | Number of tokens to be increased as spending allowance of the approved_spender. |

**Events/Errors:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                                                           |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `IncreasedAllowance` | Increasing of allowance of an approved_spender is successful. | `token`: `Uint64` which is the token ID, `token_owner`: `ByStr20` which is the address the token_owner, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowance` is the new spending allowance of the approved_spender for the token_owner. |
| `_eventname` | `Error`              | Increasing of allowance is not successful.                    | - emit `CodeIsSelf` if the user is trying to authorize himself as an approved_spender. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist                                                                                                                                  |

#### 6. DecreaseAllowance()

```ocaml
(* @dev: Decrease the allowance of an approved_spender over the caller tokens. Only the token_owner allowed to invoke. *)
(* param token:        Token ID.                                                                                          *)
(* param spender:      Address of the designated approved_spender.                                                        *)
(* param amount:       Number of tokens to be decreased as allowance for the approved_spender.                            *)
transition DecreaseAllowance(token: Uint64, spender: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name      | Type      | Description                                                                     |
| ------ | --------- | --------- | ------------------------------------------------------------------------------- |
| @param | `token`   | `Uint64`  | Token ID.                                                                       |
| @param | `spender` | `ByStr20` | Address of an approved_spender.                                                 |
| @param | `amount`  | `Uint128` | Number of tokens to be decreased as spending allowance of the approved_spender. |

**Events/Errors:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                                                           |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `DecreasedAllowance` | Decreasing of allowance of an approved_spender is successful. | `token`: `Uint64` which is the token ID, `token_owner`: `ByStr20` which is the address the token_owner, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowance` is the new spending allowance of the approved_spender for the token_owner. |
| `_eventname` | `Error`              | Decreasing of allowance is not successful.                    | - emit `CodeIsSelf` if the user is trying to authorize himself as an approved_spender.                                                                                                                                                                                                     |
|              |                      |                                                               | - emit `CodeTokenDoesNotExist` if the token ID does not exist                                                                                                                                        |

#### 7. Transfer()

```ocaml
(* @dev: Moves an amount tokens from _sender to the recipient. Used by token_owner. *)
(* @dev: Balance of recipient will increase. Balance of _sender will decrease.      *)
(* @param token:        Token ID.                                                   *)
(* @param to:  Address of the recipient whose balance is increased.                 *)
(* @param amount:     Amount of tokens to be sent.                                  *)
transition Transfer(token: Uint64, to: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                            |
| ------ | -------- | --------- | ------------------------------------------------------ |
| @param | `token`  | `Uint64`  | Token ID.                                              |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase. |
| @param | `amount` | `Uint128` | Amount of tokens to be sent.                           |

**Messages sent:**

|        | Name                      | Description                                           | Callback Parameters                                                                                                                                                                                                           |
| ------ | ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptTransfer` | Dummy callback to prevent invalid recipient contract. | `token` : `Uint64`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `sender` is the address of the sender, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_tag` | `TransferSuccessCallBack` | Provide the sender the status of the transfer.        | `token` : `Uint64`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `sender` is the address of the sender, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events/Errors:**

|              | Name              | Description                | Event Parameters                                                                                                                                                                                                                 |
| ------------ | ----------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferSuccess` | Sending is successful.     | `token`: `Uint64` which is the token ID, `sender`: `ByStr20` which is the sender's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens transferred. |
| `_eventname` | `Error`           | Sending is not successful. | - emit `CodeInsufficientFunds` if the balance of the token_owner lesser than the specified amount that is to be transferred. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist                                  |

#### 8. TransferFrom()

```ocaml
(* @dev: Move a given amount of tokens from one address to another using the allowance mechanism. The caller must be an approved_spender. *)
(* @dev: Balance of recipient will increase. Balance of token_owner will decrease.                                                        *)
(* @param from:    Address of the token_owner whose balance is decreased.                                                                 *)
(* @param to:      Address of the recipient whose balance is increased.                                                                   *)
(* @param amount:  Amount of tokens to be transferred.                                                                                    *)
transition TransferFrom(token: Uint64, from: ByStr20, to: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                              |
| ------ | -------- | --------- | -------------------------------------------------------- |
| @param | `token`  | `Uint64`  | Token ID.                                              |
| @param | `from`   | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase.   |
| @param | `amount` | `Uint128` | Number of tokens to be transferred.                      |

**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `RecipientAcceptTransferFrom` | Dummy callback to prevent invalid recipient contract. | `token`: `Uint64`, `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is te token ID, `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_tag` | `TransferFromSuccessCallBack` | Provide the initiator the status of the transfer.     | `token`: `Uint64`, `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is te token ID, `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                                                                                                                         |
| ------------ | --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferFromSuccess` | Sending is successful.     | `token`: `Uint64`, `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `initiator` is the address of an approved_spender,`sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeInsufficientAllowance` if the allowance of approved_spender is lesser than the specified amount that is to be transferred. <br> - emit `CodeInsufficientFunds` if the balance of the token_owner lesser than the specified amount that is to be transferred. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist              |

#### 9. OperatorSend() (Optional)

```ocaml
(* @dev: Moves amount tokens from token_owner to recipient. _sender must be an operator of token_owner. *)
(* @dev: Balance of recipient will increase. Balance of token_owner will decrease.                      *)
(* @param token:       Token ID.                                                                        *)
(* @param from:        Address of the token_owner whose balance is decreased.                           *)
(* @param to:          Address of the recipient whose balance is increased.                             *)
(* @param amount:      Amount of tokens to be sent.                                                     *)
transition OperatorSend(token: Uint64, from: ByStr20, to: ByStr20, amount: Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                              |
| ------ | -------- | --------- | -------------------------------------------------------- |
| @param | `token`  | `Uint64`  | Token ID.                                                |
| @param | `from`   | `ByStr20` | Address of the token_owner whose balance is to decrease. |
| @param | `to`     | `ByStr20` | Address of the recipient whose balance is to increase.   |
| @param | `amount` | `Uint128` | Amount of tokens to be sent.                             |

**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptOperatorSend` | Dummy callback to prevent invalid recipient contract. | `token`: `Uint64`, `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `initiator` is the address of an operator, `sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |
| `_tag` | `OperatorSendSuccessCallBack` | Provide the operator the status of the transfer.      | `token`: `Uint64`, `initiator`: `ByStr20`, `sender` : `ByStr20`, `recipient`: `ByStr20`, `amount`: `Uint128`, where `token` is the token ID, `initiator` is the address of an operator, `sender` is the address of the token_owner, `recipient` is the address of the recipient, and `amount` is the amount of fungible tokens to be transferred. |

**Events/Errors:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                                                                    |
| ------------ | --------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `OperatorSendSuccess` | Sending is successful.     | `token`: `Uint64` which is the token ID, `initiator`: `ByStr20` which is the operator's address, `sender`: `ByStr20` which is the token_owner's address, `recipient`: `ByStr20` which is the recipient's address, and `amount`: `Uint128` which is the amount of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeNotApprovedOperator` if sender is not an approved operator for the token_owner <br> - emit `CodeInsufficientFunds` if the balance of the token_owner is lesser than the specified amount that is to be transferred. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist  |

#### 1. MintMultiple() (Optional)

```ocaml
(* @dev: Mint new tokens. Only the relevant owner can mint.                     *)
(* @param tokens: Token IDs.                                                    *)
(* @param recipients: Addresses of the recipients whose balance is to increase. *)
(* @param amounts:    Numbers of tokens to be minted.                           *)
transition MintMultiple(tokens: List ByStr20, recipients: List ByStr20, amounts: List Uint128)
```

**Arguments:**

|        | Name         | Type      | Description                                                    |
| ------ | ------------ | --------- | -------------------------------------------------------------- |
| @param | `tokens`     | `List ByStr20` | Token IDs.                                                |
| @param | `recipients` | `List ByStr20` | Addresses of the recipients whose balance is to increase. |
| @param | `amounts`    | `List Uint128` | Numbers of tokens to be minted.                           |

**Messages sent:**

|        | Name                  | Description                                           | Callback Parameters                                                                                                                                                                                                |
| ------ | --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `RecipientAcceptMint` | Dummy callback to prevent invalid recipient contract. | `tokens` : `List Uint64`, `minter` : `ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `minter` is the address of the minter, `recipients` are the addresses of the recipients, and `amounts` are the amounts of fungible tokens minted. |
| `_tag` | `MintSuccessCallBack` | Provide the sender the status of the mint.            | `tokens` : `List Uint64`, `minter` : `ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `minter` is the address of the minter, `recipients` are the addresses of the recipients, and `amounts` are the amounts of fungible tokens minted. |

**Events/Errors:**

|              | Name     | Description                | Event Parameters                                                                                                                                                                                                                                                                |
| ------------ | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Minted` | Minting is successful.     | `tokens` : `Uint64`, `minter` : `ByStr20`, `recipients`: `ByStr20`, `amounts`: `Uint128`, where `tokens` are the tokens IDs, `minter` is the address of the minter, `recipients` are the addresses whose balances will be increased, and `amounts` are the amounts of fungible tokens minted.  |
| `_eventname` | `Error`  | Minting is not successful. | - emit `CodeNotOwner` if the transition is not called by the appropriate owner.                                                                                                                                                                                                 |
|              |          |                            | - emit `CodeTokenDoesNotExist` if the token ID does not exist                                                                                                                                       |

#### 2. BurnMultiple() (Optional)

```ocaml
(* @dev: Burn existing tokens. Only relevant owner can burn.                        *)
(* @param tokens: Tokens IDs.                                                       *)
(* @param burn_accounts: Addresses of the token_owner whose balance is to decrease. *)
(* @param amounts:       Numbers of tokens to be burned.                            *)
transition BurnMultiple(tokens: List ByStr20, burn_accounts: List ByStr20, amounts: List Uint128)
```

**Arguments:**

|        | Name            | Type           | Description                                                 |
| ------ | --------------- | -------------- | ----------------------------------------------------------- |
| @param | `tokens`        | `List ByStr20` | Tokens IDs.                                                 |
| @param | `burn_accounts` | `List ByStr20` | Addresses of the token_owner whose balances is to decrease. |
| @param | `amounts`       | `List Uint128` | Numbers of tokens to be burned.                             |

**Messages sent:**

|        | Name                  | Description                                | Callback Parameters                                                                                                                                                                                                                     |
| ------ | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `BurnSuccessCallBack` | Provide the sender the status of the burn. | `tokens` : `List Uint64`, `burner` : `ByStr20`, `burn_accounts`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the token IDs, `burner` is the address of the burner, `burn_accounts` are the addresses whose balance will be decreased, and `amounts` are the amounts of fungible tokens burned. |

**Events/Errors:**

|              | Name    | Description                | Event Parameters                                                                                                                                                                                                                                                                                                                            |
| ------------ | ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `Burnt` | Burning is successful.     | `tokens` : `List Uint64`, `burner` : `ByStr20`, `burn_accounts`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `burner` is the address of the burner, `burn_accounts` are the addresses whose balances will be decreased, and `amounts` are the amounts of fungible tokens burned.                                                        |
| `_eventname` | `Error` | Burning is not successful. | - emit `CodeNotOwner` if the transition is not called by the relevant owner. <br> - emit `CodeNoBalance` if balance of token_owner does not exists. <br> - emit `CodeInsufficientFunds` if the amount to be burned is more than the balance of token_owner. <br> -  emit `CodeTokenDoesNotExist` if the token ID does not exist. |

#### 3. AuthorizeOperatorMultiple() (Optional)

```ocaml
(* @dev: Make an address an operator of the caller.             *)
(* @param tokens: Tokens IDs.                                   *)
(* @param operator: Address to be authorized as operator or   *)
(* Re-authorize as default_operator. Cannot be calling address. *)
transition AuthorizeOperator(tokens: List Uint64, operator: ByStr20)
```

**Arguments:**

|        | Name       | Type          | Description                                                                                         |
| ------ | ---------- | ------------- | --------------------------------------------------------------------------------------------------- |
| @param | `token`    | `List Uint64` | Tokens IDs.                                                                                         |
| @param | `operator` | `ByStr20`     | Address to be authorize as operator or re-authorize as default_operator. Cannot be calling address. |

**Events/Errors:**

|              | Name                       | Description                    | Event Parameters                                                                                                                                                                                               |
| ------------ | -------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `AuthorizeOperatorSuccess` | Authorizing is successful.     | `tokens` : `List Uint64` which are the tokens IDs, `authorizer`: `ByStr20` which is the caller's address, and `authorized_operator`: `ByStr20` which is the address to be authorized as an operator of the token_owner. |
| `_eventname` | `Error`                    | Authorizing is not successful. | - emit `CodeIsSender` if the user is trying to authorize himself as an operator. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist.                                                           |

#### 4. RevokeOperatorMultiple() (Optional)

```ocaml
(* @dev: Revoke an address from being an operator or default_operator of the caller. *)
(* @param tokens: Tokens IDs.                                                        *)
(* @param operator: Address to be removed as operator or default_operator.           *)
transition RevokeOperatorMultiple(tokens: List Uint64, operator: ByStr20)
```

**Arguments:**

|        | Name       | Type          | Description                      |
| ------ | ---------- | ------------- | -------------------------------- |
| @param | `tokens`   | `List Uint64` | Tokens IDs.                      |
| @param | `operator` | `ByStr20`     | Address to be unset as operator. |

**Events/Errors:**

|              | Name                    | Description                 | Event Parameters                                                                                                                                                                                     |
| ------------ | ----------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `RevokeOperatorSuccess` | Revoking is successful.     | `tokens`: `List Uint64` which are the tokens IDs, `revoker`: `ByStr20` which is the caller's address, and `revoked_operator`: `ByStr20` which is the address to be removed as an operator of the token_owner. |
| `_eventname` | `Error`                 | Revoking is not successful. | - emit `CodeNotApprovedOperator` if the specified address is not an existing operator or default_operator of the token_owner. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist     |

#### 5. IncreaseAllowanceMultiple()

```ocaml
(* @dev: Increase the allowance of an approved_spender over the caller tokens. Only token_owner allowed to invoke. *)
(* param tokens:        Tokens IDs.                                                                                *)
(* param spender:      Address of the designated approved_spender.                                                 *)
(* param amounts:       Number of tokens to be increased as allowance for the approved_spender.                    *)
transition IncreaseAllowance(tokens: List Uint64, spender: ByStr20, amounts: List Uint128)
```

**Arguments:**

|        | Name      | Type           | Description                                                                      |
| ------ | --------- | -------------- | -------------------------------------------------------------------------------- |
| @param | `tokens`  | `List Uint64`  | Tokens IDs.                                                                      |
| @param | `spender` | `ByStr20`      | Address of an approved_spender.                                                  |
| @param | `amounts` | `List Uint128` | Numbers of tokens to be increased as spending allowance of the approved_spender. |

**Events/Errors:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                                                           |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `IncreasedAllowance` | Increasing of allowance of an approved_spender is successful. | `tokens`: `List Uint64` which are the tokens IDs, `token_owners`: `List ByStr20` which are the addressese the token_owner's, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowance` is the new spending allowances of the approved_spender for the token_owner's. |
| `_eventname` | `Error`              | Increasing of allowance is not successful.                    | - emit `CodeIsSelf` if the user is trying to authorize himself as an approved_spender. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist                                                                                                                                  |

#### 6. DecreaseAllowance()

```ocaml
(* @dev: Decrease the allowance of an approved_spender over the caller tokens. Only the token_owner allowed to invoke. *)
(* param tokens:        Tokens                                                                                         *)
(* param spender:       Address of the designated approved_spender.                                                    *)
(* param amounts:       Numbers of tokens to be decreased as allowance for the approved_spender.                       *)
transition DecreaseAllowance(tokens: List Uint64, spender: ByStr20, amounts: List Uint128)
```

**Arguments:**

|        | Name      | Type           | Description                                                                      |
| ------ | --------- | -------------- | -------------------------------------------------------------------------------- |
| @param | `tokens`  | `List Uint64`  | Tokens IDs.                                                                      |
| @param | `spender` | `ByStr20`      | Address of an approved_spender.                                                  |
| @param | `amounts` | `List Uint128` | Numbers of tokens to be decreased as spending allowance of the approved_spender. |

**Events/Errors:**

|              | Name                 | Description                                                   | Event Parameters                                                                                                                                                                                                                                                                           |
| ------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_eventname` | `DecreasedAllowance` | Decreasing of allowance of an approved_spender is successful. | `tokens`: `List Uint64` which are the tokens IDs, `token_owners`: `List ByStr20` which are the addresses the token_owner's, `spender`: `ByStr20` which is the address of a approved_spender of the token_owner, and `new_allowances` are the new spending allowances of the approved_spender for the token_owner's. |
| `_eventname` | `Error`              | Decreasing of allowance is not successful.                    | - emit `CodeIsSelf` if the user is trying to authorize himself as an approved_spender.                                                                                                                                                                                                     |
|              |                      |                                                               | - emit `CodeTokenDoesNotExist` if the token ID does not exist                                                                                                                                        |

#### 7. Transfer()

```ocaml
(* @dev: Moves an amount tokens from _sender to the recipient. Used by token_owner. *)
(* @dev: Balance of recipient will increase. Balance of _sender will decrease.      *)
(* @param tokens:        Tokens IDs.                                                *)
(* @param tos:  Addresses of the recipients whose balance is increased.             *)
(* @param amounts:     Amounts of tokens to be sent.                                *)
transition Transfer(token: List Uint64, to: List ByStr20, amount: List Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                                    |
| ------ | -------- | --------- | -------------------------------------------------------------- |
| @param | `token`  | `List Uint64`  | Tokens IDs.                                               |
| @param | `to`     | `List ByStr20` | Addresses of the recipients whose balance is to increase. |
| @param | `amount` | `List Uint128` | Amounts of tokens to be sent.                             |

**Messages sent:**

|        | Name                      | Description                                           | Callback Parameters                                                                                                                                                                                                           |
| ------ | ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptTransfer` | Dummy callback to prevent invalid recipient contract. | `tokens` : `List Uint64`, `sender` : `ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `sender` is the address of the sender, `recipients` are the addresses of the recipients, and `amounts` are the amounts of fungible tokens to be transferred. |
| `_tag` | `TransferSuccessCallBack` | Provide the sender the status of the transfer.        | `tokens` : `List Uint64`, `sender` : `ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `sender` is the address of the sender, `recipients` are the addresses of the recipients, and `amounts` are the amounts of fungible tokens to be transferred. |

**Events/Errors:**

|              | Name              | Description                | Event Parameters                                                                                                                                                                                                                                   |
| ------------ | ----------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferSuccess` | Sending is successful.     | `tokens`: `List Uint64` which is the token ID, `sender`: `ByStr20` which is the sender's address, `recipients`: `List ByStr20` which is the recipient's address, and `amounts`: `List Uint128` which is the amount of fungible tokens transferred. |
| `_eventname` | `Error`           | Sending is not successful. | - emit `CodeInsufficientFunds` if the balance of the token_owner lesser than the specified amount that is to be transferred. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist                                                    |

#### 8. TransferFromMultiple()

```ocaml
(* @dev: Move a given amount of tokens from one address to another using the allowance mechanism. The caller must be an approved_spender. *)
(* @dev: Balance of recipient will increase. Balance of token_owner will decrease.                                                        *)
(* @param tokens:   Token IDs.                                                                                                            *)
(* @param froms:    Addresses of the token_owner's whose balance is decreased.                                                            *)
(* @param tos:      Addresses of the recipients whose balance is increased.                                                               *)
(* @param amounts:  Amounts of tokens to be transferred.                                                                                   *)
transition TransferFromMultiple(tokens: List Uint64, froms: List ByStr20, tos: List ByStr20, amounts: List Uint128)
```

**Arguments:**

|        | Name      | Type      | Description                                                       |
| ------ | --------- | --------- | ----------------------------------------------------------------- |
| @param | `tokens`  | `List Uint64`  | Tokens IDs.                                                  |
| @param | `froms`   | `List ByStr20` | Addresses of the token_owner's whose balance is to decrease. |
| @param | `tos`     | `List ByStr20` | Addresses of the recipients whose balance is to increase.    |
| @param | `amounts` | `List Uint128` | Numbers of tokens to be transferred.                         |

**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_tag` | `RecipientAcceptTransferFrom` | Dummy callback to prevent invalid recipient contract. | `tokens`: `List Uint64`, `initiator`: `ByStr20`, `senders` : `List ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are te tokens ID,s `initiator` is the address of an approved_spender, `senders` are the addresses of the token_owner's, `recipients` are the addresses of the recipients, and `amounts` are the amounts of fungible tokens to be transferred. |
| `_tag` | `TransferFromSuccessCallBack` | Provide the initiator the status of the transfer.     | `tokens`: `List Uint64`, `initiator`: `ByStr20`, `senders` : `List ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are te tokens ID,s `initiator` is the address of an approved_spender, `senders` are the addresses of the token_owner's, `recipients` are the addresses of the recipients, and `amounts` are the amounts of fungible tokens to be transferred. |

**Events:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                                                                                                                         |
| ------------ | --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `TransferFromSuccess` | Sending is successful.     | `tokens`: `List Uint64`, `initiator`: `ByStr20`, `senders` : `List ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `initiator` is the address of an approved_spender, `senders` are the addresses of the token_owner's, `recipients` are the addresses of the recipients, and `amounts` are the amounts of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeInsufficientAllowance` if the allowance of approved_spender is lesser than the specified amount that is to be transferred. <br> - emit `CodeInsufficientFunds` if the balance of the token_owner lesser than the specified amount that is to be transferred. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist              |

#### 9. OperatorSendMultple() (Optional)

```ocaml
(* @dev: Moves amount tokens from token_owner to recipient. _sender must be an operator of token_owner. *)
(* @dev: Balance of recipient will increase. Balance of token_owner will decrease.                      *)
(* @param tokens:       Tokens IDs.                                                                     *)
(* @param froms:        Addresses of the token_owner's whose balance is decreased.                      *)
(* @param tos:          Addresses of the recipients whose balance is increased.                         *)
(* @param amounts:      Amounts of tokens to be sent.                                                   *)
transition OperatorSend(tokens: List Uint64, from: List ByStr20, to: List ByStr20, amount: List Uint128)
```

**Arguments:**

|        | Name     | Type      | Description                                                        |
| ------ | -------- | --------- | ------------------------------------------------------------------ |
| @param | `tokens`  | `List Uint64`  | Tokens IDs.                                                  |
| @param | `froms`   | `List ByStr20` | Addresses of the token_owner\s whose balance is to decrease. |
| @param | `tos`     | `List ByStr20` | Addresses of the recipients whose balance is to increase.    |
| @param | `amousnt` | `List Uint128` | Amounts of tokens to be sent.                                |

**Messages sent:**

|        | Name                          | Description                                           | Callback Parameters                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_tag` | `RecipientAcceptOperatorSend` | Dummy callback to prevent invalid recipient contract. | `tokens`: `List Uint64`, `initiator`: `ByStr20`, `senders` : `List ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `initiator` is the address of an operator, `senders` are the addresses of the token_owner's, `recipients` are the address of the recipients, and `amounts` are the amounts of fungible tokens to be transferred. |
| `_tag` | `OperatorSendSuccessCallBack` | Provide the operator the status of the transfer.      | `tokens`: `List Uint64`, `initiator`: `ByStr20`, `senders` : `List ByStr20`, `recipients`: `List ByStr20`, `amounts`: `List Uint128`, where `tokens` are the tokens IDs, `initiator` is the address of an operator, `senders` are the addresses of the token_owner's, `recipients` are the address of the recipients, and `amounts` are the amounts of fungible tokens to be transferred.  |

**Events/Errors:**

|              | Name                  | Description                | Event Parameters                                                                                                                                                                                                                                                                                    |
| ------------ | --------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_eventname` | `OperatorSendSuccess` | Sending is successful.     | `tokens`: `List Uint64` which are the tokens ID, `initiator`: `ByStr20` which is the operator's address, `senders`: `List ByStr20` which are the token_owner's addresses, `recipients`: `List ByStr20` which are the recipient's addresses, and `amounts`: `List Uint128` which are the amounts of fungible tokens to be transferred. |
| `_eventname` | `Error`               | Sending is not successful. | - emit `CodeNotApprovedOperator` if sender is not an approved operator for the token_owner's <br> - emit `CodeInsufficientFunds` if the balance of the token_owner's is lesser than the specified amount that is to be transferred. <br> - emit `CodeTokenDoesNotExist` if the token ID does not exist  |

## V. More events

|              | Name           | Description          | Event Parameters                                                                          |
| ------------ | -------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `_eventname` | `CreatedToken` | A token was created. | `token_owner` : `ByStr20` who created the token, `token`: `Uint64` which is the token ID. |

## VI. Existing Implementation(s)

- [ZRC2 to ZRC6 wrapper contract](../reference/FungibleMultoToken.scilla)

To test the reference contract, simply go to the [`example`](../example) folder and run one of the JS scripts. For example, to deploy the contract, run:

```shell
yarn deploy.js
```

> **NOTE:** Please change the `privkey` in the script to your own private key. You can generate a testnet wallet and request for testnet \$ZIL at the [Nucleus Faucet](https://dev-wallet.zilliqa.com/home).

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
