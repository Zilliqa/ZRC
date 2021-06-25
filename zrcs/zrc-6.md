## ZRC-6 MultiToken Standard 

This is the proposal for the bounty on creation of an erc 1155 esque multitoken contract for scilla named ZRC-6. This contract is created by the developes @ Pastel Software Solutions.

The multitoken contract will allow the creation of multiple tokens. These tokens can then be minted either as a funngible asset, only minting once or as a non fungible asset and can be minted multiple times all identified by their __token_id__.

## Contract Functions

### get_batch_balance_of

Processes the individual element of two list __token_id__ and __address__ per their index according to the builtin __list_zip_with__ and returns a list containing the balance.

Params: balances_map: the mapping __balances__,  
        token_id: the token_id,  
        address: address of the user who's token_id balance is to be checked.  

### do_batch_mint

Processes the individual element of two list __token_id__ and __amount__ per their index according to the builtin __list_zip_with__ and returns a list containing the new balance for a user after minitng specific __amount__ for a specific __token_id__.

Params: balances_map: the mapping __balances__,  
        address: address to mint to,  
        token_id: the token_id,  
        amount: amount of the token with token_id that is to be mined.

### do_batch_burn

Processes the individual element of two list __token_id__ and __amount__ per their index according to the builtin __list_zip_with__ and returns a list containing the new balance for a user after burning specific __amount__ for a specific __token_id__.

Params: balances_map: the mapping __balances__,  
        address: address to burn from,  
        token_id: the token_id,  
        amount: amount of the token with token_id that is to be burned.

### do_batch_transfer_from

Processes the individual element of two list __token_id__ and __amount__ per their index according to the builtin __list_zip_with__ and returns a list containing the new balance for a user after transfering specific __amount__ for a specific __token_id__.

Params: balances_map: the mapping __balances__,  
        from: address to transfer from,  
        token_id: the token_id,  
        amount: amount of the token with token_id that is to be transfered.

### do_batch_transfer_to

Processes the individual element of two list __token_id__ and __amount__ per their index according to the builtin __list_zip_with__ and returns a list containing the new balance for a user after receiving specific __amount__ for a specific __token_id__.

Params: balances_map: the mapping __balances__,  
        to: address which is to receive token,  
        token_id: the token_id,  
        amount: amount of the token with token_id that is to be received.

## Contract Procedures

### EmitError

Throws an error when called upon.  

Params: err: An error data type.

### SenderIsNotOperator

Throws an error if _sender is same as operator.  

Params: operator : _sender's operator is to be assigned.

### SenderIsOperator

Throws an error if _sender not the operator of an account.  

Params: account : Address of user who's operator must be _sender.

### IsZeroAddress

Throws an error if address of an account is a zero address.  

Params: address : Address of user that is to be checked with zero address.

### IsInsufficientBalance

Throws an error if balance of an account is less than amount.

Params: balance : Balance of an account.    
        amount: Amount to be trasnferred.

### IsEqual

Throws an error if two Uint32 values are unequal.

Params: a: Uint32 value.  
        b: Uint32 value.

### UpdateBalances

Updates the balances mapping after the 4/5 function as mentioned above have been called.

Parmas: token_ids: Takes a Uint256 value.

### IsMinter

Throws an error if _sender is not a minter.

### IsContractOwner

Throws an error if _sender is not the __contract_owner__.

### IsTokenOwner

Throws an error if an address does not own a specific token with token_id.

Params: token_id: Id of a token.  
        address: Address of a user.

### IsTokenOwnerOrOperator

Throws an error if _sender is not token owner or operator.

Params: account: address to check againt _sender as owner or check is account's operator approval is _sender.

## Contract Transitions

### GetURI

Get the uri for the given token_id.

Params: token_id : Unique ID of the a token.

### CheckTokenOwner

Check if a token_id is owned by a token_owner.

Params: token_id : Unique ID of the a token.  
        address : Address of a user.

### ConfigureMinter

Add or remove approved minters. Only contract_owner can approve minters.

Params: minter : Address of the minter to be approved or removed.

### BalanceOf

Get the balance of token token_id for an address

Params: address :  Address of the user whose balance is needed.  
        token_id : Token id whose balance is required. 

### BalanceOfBatch

Get the batch balance of token token_id for an address.

Params: address : List of address of the user whose balance is needed.  
        token_id : List of token id whose balance is required. 

### SetApprovalForAll

Sets or unsets an operator for the _sender.

Params: to : Address to be set or unset as an operator.  
        approved : Approval status to be given 1 for set and 0 for not removing.

### IsApprovedForAll

Checks if the operator address is operator for token_owner address.

Params: operator : Address to be check as an operator.  
        token_owner : Address of the token_owner.

### SafeTransferFrom

Transfer the ownership of a given token_id of amount to address. 
Owner or operator can only call the transition.

Params: to : Address to recieve the token.  
        from : Address to send the token.   
        token_id : Token id to be transferred.  
        amount : Amount of token to be transferred.  
        data : Data to display on BeforeBatchTokenTransfer.  

### SafeBatchTransferFrom

Transfer the ownership of a given token_id of amount to address. Owner or operator can only call the transition. 

Params: to : Address to recieve the token.  
        from : Address to send the token.  
        token_id : List of token id to be transferred.   
        amount : List of amount of token to be transferred.   
        data : Data to display on BeforeBatchTokenTransfer. 

### Mint

This transition mints the token to to address, only minters can call the transition

Params: to : Address to recieve the token.  
        token_id : Token id to be minted.  
        amount : Amount of token to be minted.  
        token_uri : Token Uri to be set for the token.

### MintBatch

This transition mints the list of tokens to to address, only minters can call the transition.

Params: to : Address to recieve the token.  
        token_id : List of token id to be minted.  
        amount : List of amount of token to be minted.  
        token_uri : List of token uri to be set for the token.

### Burn

This transition burns the tokens, only operators can call the transition.

Params: from : Address of the user whose token is to be burnt.  
        token_id : Token id to be burnt.  
        amount : Amount of token to be burnt.

### BurnBatch

This transition burns the list of tokens, only operators can call the transition.

Params: from : Address of the user whose token is to be burnt.  
        token_id : List of token id to be burnt.  
        amount : List of amount of token to be burnt.

## Contract Error Codes

| Name                        | Type    | Code | Description                                                                                    |
| --------------------------- | ------- | ---- | ---------------------------------------------------------------------------------------------- |
| `CodeSenderIsOperator`              | `Int32` | `-1` | Emit when _sender is the operator param sent.                                                 |
| `CodeIsZeroAddress`              | `Int32` | `-2` | Emit when address sent is zero address.                                                 |
| `CodeInsufficientAmount`     | `Int32` | `-3` | Emit when balance is less than amount to be sent.                              |
| `CodeListLengthNoMatch             `              | `Int32` | `-4` | Emit when unequal length are passed in transiton.                                                 |
| `CodeUpdateBalanceFailed`              | `Int32` | `-5` | Emit from UpdateBalances.                                                 |
| `CodeSenderIsNotOperator`     | `Int32` | `-6` | Emit when _sender is not the operator of the address.                              |
| `CodeIsNotMinter`              | `Int32` | `-7` | Emit when _sender is not the miner.                                                 |
| `CodeNotContractOwner`     | `Int32` | `-8` | Emit when _sender is not the contract owner.                              |
| `CodeTokenNotFound`     | `Int32` | `-9` | Emit when a particular token with a token_id is not found.                             |
| `CodeSenderIsNotOperatorOrOwner`     | `Int32` | `-10` | Emit when a _sender is not token owner or operator of account.                             |

## Contract Flow

The contract transitions have been defined per the flow of the contract after deploying.

1. ConfigureMinter:  

        Accepts an address to assign role as minter or remove as minter of role already granted.

2. SetApprovalForAll:  

        Sets an address 'to' as the operator of the _sender. 

3. Mint / Mint Batch:  

        Allows minter to mint token(s) to a user 'to'.

4. Burn / Burn Batch:  

        Allows the operator of a particular address to burn token(s).

5. SafeTransferFrom / SafeBatchTransferFrom:  

        Allows the token owner or the operator of a particular address to transfer token(s) from the address to another.

6. BalanceOfBatch / BalanceOfBatch:  

        Allows any user to check the balance of token(s) with a partiular token_id of any user.

7. IsApprovedForAll:  

        Allows any user to check the if an address is the operator of an owner address.

