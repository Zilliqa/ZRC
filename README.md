<div align="center">
  <h1>
  ZRC (Zilliqa Reference Contracts)
  </h1>
  <strong>
  Contract standards for the Zilliqa platform
  </strong>
</div>
<hr/>

[![Build Status](https://app.travis-ci.com/Zilliqa/ZRC.svg?branch=master)](https://app.travis-ci.com/Zilliqa/ZRC) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

The Zilliqa Reference Contracts (ZRCs) are the contract standards for the Zilliqa platform.

|           ZRC           | Title                                           |
| :---------------------: | ----------------------------------------------- |
| [ZRC-7](/zrcs/zrc-7.md) | NFT Metadata Standard                           |
| [ZRC-6](/zrcs/zrc-6.md) | Non-Fungible Token Standard                     |
| [ZRC-5](/zrcs/zrc-5.md) | Convention for Deposit of ZIL                   |
| [ZRC-4](/zrcs/zrc-4.md) | Standard for Multisig Wallet                    |
| [ZRC-3](/zrcs/zrc-3.md) | Standard for Metatransactions                   |
| [ZRC-2](/zrcs/zrc-2.md) | Standard for Fungible Tokens                    |
| [ZRC-1](/zrcs/zrc-1.md) | Standard for Non Fungible Tokens _(deprecated)_ |

## Contributing

1. Review [ZRC-0](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-0.md).
2. Fork the repository by clicking "Fork" in the top right.
3. Add your ZRC to your fork of the repository. There is a template ZRC [here](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-1.md).
4. Submit a Pull Request to [Zilliqa's ZRC repository](https://github.com/Zilliqa/ZRC).

Your first PR should be a first draft of the final ZRC. An editor will manually review the first PR for a new ZRC and assign it a number before merging it. Make sure you include a `discussions-to header` with the URL to a discussion forum or open GitHub issue where people can discuss the ZRC as a whole.

If your ZRC requires images, the image files should be included in a subdirectory of the assets folder for that ZRC as follow: `assets/zrc-X` (for zrc X). When linking to an image in the ZRC, use relative links such as `../assets/zrc-X/image.png`.

When you believe your ZRC is ready to progress past the 'Draft' phase, you should go to our [Zilliqa Official Discord](https://discord.gg/XMRE9tt) server and ask to have your issue added to the next community dev call where it can be discussed for inclusion in a future platform upgrade. If the community agrees to include it, the ZRC editors will update the state of your ZRC to 'Approved'.

## ZRC Status

1. **Draft** - a preliminary version of the ZRC that is not yet ready for submission.
2. **Ready** - a preliminary version of the ZRC that is ready for review by a wide audience.
3. **Approved** - a finalized version of the ZRC that has been in the 'Ready' state for at least 2 weeks and any technical changes that were requested have been addressed by the author.
4. **Implemented** - a finalized version of the ZRC that the Core Devs have decided to implement and release.

## License

This project is open source software licensed as [MIT](https://github.com/zilliqa/zrc/blob/master/LICENSE).
