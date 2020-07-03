| ZRC | Title                        | Status   | Type     | Author                                                                                                                       | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| 5   | Convention for Deposit of ZIL | Draft | Standard | Jun Hao Tan <junhao@zilliqa.com> | 2020-06-25           | 2020-06-25           |

## I. What is ZIL?

ZIL is the native token for [Zilliqa](https://www.zilliqa.com/) blockchain. One can store ZIL inside any Zilliqa address, including smart contract address.

## II. Abstract

ZRC-5 defines a convention for an interface that a smart contract should implement should it decide to accept ZIL.

## III. Motivation

For a smart contract to accept incoming ZIL, it needs to do so explicitly using the `accept` statement. As such, any transition that does not have the `accept` statement  will not be able to accept any incoming ZIL transfer. 

However, there is currently no naming convention for transitions that can accept ZIL. As a result, cryptocurrency exchanges or cryptocurrency wallet providers do not know which `_tag` to set, should they wish to transfer ZIL to a contract address. 

By having a naming convention for transitions that can accept ZIL, one can easily transfer ZIL to a contract that follows this convention, thereby improving composability. 

## IV. Specification

The deposit of ZIL specification describes:

1. the naming convention of the transition
2. mandatory instruction in the transition

### A. Naming of transition

For a contract that wishes to conditionally or unconditionally accept ZIL, it should implement a transition named `AddFunds`.

### B. Mandatory instruction 

Within the `AddFunds` transition, there should be an `accept` instruction. 

### C. Conditional acceptance of ZIL

Smart contract developers are free to introduce any programmatic logic to conditionally accept ZIL in `AddFunds` transition. Smart contract developers can also use `accept` instruction in other transitions, however, such transitions may reduce composability of the smart contract. 

### D. Sample implementation
This is a sample implementation of `AddFunds` transition that unconditionally accepts ZIL.

```
transition AddFunds ()
  accept;
end
```

## V. Existing Implementation(s)

- [MultiSig Wallet Reference contract](../reference/multisig_wallet.scilla#L406)

To test the reference contract, simply go to the [`example/zrc4`](../example/zrc4) folder and run `node add_funds.js`.

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
