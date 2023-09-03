# I. Token documentation

#### InitZIL()

 Transitions @dev: Initializes the contract, the contract can be initalized only once @param price: the price of 1 uint of the token, not the conceptual 1 uint 10^decimals but the literal 1 unit in terms of the connector token @param connector_balance: the initial balance of the connector that effectively sets the CW of the contract! where CW = connector_balance / ( total_supply price) transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `price` | `Uint128`          |
| @param | `connector_balance` | `Uint128`          |

#### InitZRC2()

 @dev: Initializes the contract, the contract can be initalized only once @param price: the price of 1 uint of the token, not the conceptual 1 uint 10^decimals but the literal 1 unit in terms of the connector token @param connector_balance: the initial balance of the connector that effectively sets the CW of the contract! where CW = connector_balance / ( total_supply price) @param token_address: if it is zeroByStr20 then ZIL connector token is assumed ; tokens are going to be taken using the allowance mechanism transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `price` | `Uint128`          |
| @param | `connector_balance` | `Uint128`          |
| @param | `token_address` | `ByStr20 with contract field balances : Map (ByStr20) (Uint128) end`          |

#### IncreaseAllowance()

 @dev: Increase the allowance of an approved_spender over the caller tokens. Only token_owner allowed to invoke. param spender: Address of the designated approved_spender. param amount: Number of tokens to be increased as allowance for the approved_spender. transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `spender` | `ByStr20`          |
| @param | `amount` | `Uint128`          |

#### DecreaseAllowance()

 @dev: Decrease the allowance of an approved_spender over the caller tokens. Only token_owner allowed to invoke. param spender: Address of the designated approved_spender. param amount: Number of tokens to be decreased as allowance for the approved_spender. transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `spender` | `ByStr20`          |
| @param | `amount` | `Uint128`          |

#### Transfer()

 @note: move to _this_address is now a smart token sell! @dev: Moves an amount tokens from _sender to the recipient. Used by token_owner. @dev: Balance of recipient will increase. Balance of _sender will decrease. @param to: Address of the recipient whose balance is increased. @param amount: Amount of tokens to be sent. transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `to` | `ByStr20`          |
| @param | `amount` | `Uint128`          |

#### TransferFrom()

 @dev: Move a given amount of tokens from one address to another using the allowance mechanism. The caller must be an approved_spender. @dev: Balance of recipient will increase. Balance of token_owner will decrease. @param from: Address of the token_owner whose balance is decreased. @param to: Address of the recipient whose balance is increased. @param amount: Amount of tokens to be transferred. transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `from` | `ByStr20`          |
| @param | `to` | `ByStr20`          |
| @param | `amount` | `Uint128`          |

#### AddFunds()

 The scenarios for the following are: TokenConnector: Reject All ; ZILConnector: This is a buy endpoint transition

**No Arguments**



#### CalculatePurchaseReturnCallback()

is updated when it is used anyway those callbacks are called by the bancor formula contract and set the tmp result essentially those are return values from the module that is the bancor formula transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `result` | `Uint128`          |

#### CalculateSaleReturnCallback()

transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `result` | `Uint128`          |