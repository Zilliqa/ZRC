# I. BancorFormula documentation

#### CalculatePurchaseReturn()

 @dev given a token supply, connector balance, weight and a deposit amount ( in the connector token), calculates the return for a given conversion ( in the main token) Formula: Return = in_supply ( ( 1 + in_deposit_amount / in_connector_balance) ^ ( in_connector_weight / 1000000) - 1) @param in_supply token total supply @param in_connector_balance total connector balance @param in_connector_weight connector weight, represented in ppm, 1-1000000 @param in_deposit_amount deposit amount, in connector token @send purchase return amount in form: { _tag: "CalculatePurchaseReturnCallback" ; _recipient: _sender ; _amount: zero_uint128 ; result: result } transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `in_supply` | `Uint128`          |
| @param | `in_connector_balance` | `Uint128`          |
| @param | `in_connector_weight` | `Uint128`          |
| @param | `in_deposit_amount` | `Uint128`          |

#### CalculateSaleReturn()

 @dev given a token supply, connector balance, weight and a sell amount ( in the main token), calculates the return for a given conversion ( in the connector token) Formula: Return = in_connectorBalance ( 1 - ( 1 - in_sellAmount / in_supply) ^ ( 1 / ( in_connectorWeight / 1000000))) @param in_supply token total supply @param in_connectorBalance total connector @param in_connectorWeight constant connector Weight, represented in ppm, 1-1000000 @param in_sellAmount sell amount, in the token itself @return sale return amount transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `in_supply` | `Uint128`          |
| @param | `in_connector_balance` | `Uint128`          |
| @param | `in_connector_weight` | `Uint128`          |
| @param | `in_sell_amount` | `Uint128`          |

#### CalculateCrossConnectorReturn()

 @dev given two connector balances/weights and a sell amount ( in the first connector token), calculates the return for a conversion from the first connector token to the second connector token ( in the second connector token) Formula: Return = in_to_connector_balance ( 1 - ( in_from_connector_balance / ( in_from_connector_balance + in_amount)) ^ ( in_from_connector_weight / in_to_connector_weight)) @param in_from_connector_balance input connector balance @param in_from_connector_weight input connector weight, represented in ppm, 1-1000000 @param in_to_connector_balance output connector balance @param in_to_connector_weight output connector weight, represented in ppm, 1-1000000 @param in_amount input connector amount @return second connector amount transition

  **Arguments:**

|        | Name      | Type               |
| ------ | --------- | ------------------ |
| @param | `in_from_connector_balance` | `Uint128`          |
| @param | `in_from_connector_weight` | `Uint128`          |
| @param | `in_to_connector_balance` | `Uint128`          |
| @param | `in_to_connector_weight` | `Uint128`          |
| @param | `in_amount` | `Uint128`          |