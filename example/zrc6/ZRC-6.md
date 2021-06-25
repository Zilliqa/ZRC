# ZRC-6 token example

WARNING: The ZRC-6 standard is not yet finalished and even not yet
published.

The example ZRC-6 token `FungibleMultiToken` accepts deposits of any
(registered with `CreateZRC2BridgeToken` transition) ZRC-2 token and
converts it 1-1 to a ZRC-6 token. The ZRC-6 tokens are held by
`FungibleMultiToken` contract and can be withdrawn back.

This is useful for future applications when ZRC-2 will probably become
a so much outdated legacy that there will be no support for it, but we
would use ZRC-6 instead.

For example, it allows to make a new version of $XSGD that will be ZRC-6
based and easy convertible 1-1 forth and back from old ZRC-2 $XSGD.

I will probably keep working on my ZRC-6 as a response to
https://gitcoin.co/issue/Zilliqa/zilliqa-bounties/1/100023732