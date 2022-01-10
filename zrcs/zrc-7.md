| ZRC | Title             | Status |   Type   | Author                                                                                                                    | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| :-: | ----------------- | :----: | :------: | ------------------------------------------------------------------------------------------------------------------------- | :------------------: | :------------------: |
|  7  | Metadata Standard | Draft  | Standard | Neuti Yoo<br/><noel@zilliqa.com> <br/> Elliott Green<br/><elliott@zilliqa.com> <br/> Jun Hao Tan<br/><junhao@zilliqa.com> |      2021-10-11      |      2022-01-07      |

## Table of Contents

- [I. What is Metadata and Token URI?](#i-what-is-metadata)
- [II. Abstract](#ii-abstract)
- [III. Motivation](#iii-motivation)
- [IV. Specification](#iv-specification)
  - [A. Metadata Structure](#a-metadata-structure)
  - [B. Token URI Optimization](#b-token-uri-optimization)
- [V. References](#v-references)
- [VI. Copyright](#vi-copyright)

## I. What is Metadata and Token URI?

Metadata is data that provides information about other data. Metadata allows NFTs to have additional properties e.g. name, description, and resource. The example is the following:

```json
{
  "name": "Creature #101",
  "description": "10,000 unique and diverse creatures living on the blockchain.",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1"
}
```

The above is a JSON blob of data with the metadata for the NFT. It is returned by a token URI which is an HTTP or IPFS URL. The examples are the following:

- `ipfs://QmZIL4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aA/1`
- `ipfs://QmZILw65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStAE`
- `ar://ZILsR4OrYvODj7PD3czIAyNJalub0-vdV_JAg5NqA-o`
- `https://ipfs.io/ipfs/QmZIL4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aA/1`
- `https://foo.mypinata.cloud/ipfs/QmZILYgURKVnLWBm1aXH1BqKqFgmj7j1K6MWAFTkf9xm8A/1`
- `https://creatures-api.zilliqa.com/api/creature/1`

## II. Abstract

ZRC-7 standardizes the metadata structure and covers token URI optimization with base token URI.

## III. Motivation

The consistent metadata structure can help the NFT creators and builders to handle the NFT metadata more simply. Also, base token URI can be used to reduce the gas cost.

## IV. Specification

### A. Metadata Structure

The metadata must be structured as the following:

| Property            |        Type        | Description                                                                                                                                                                                                                                                                                                                                                    | Required |
| ------------------- | :----------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `name`              |      `String`      | Name of the asset.                                                                                                                                                                                                                                                                                                                                             |    ✓     |
| `description`       |      `String`      | A human readable description of the asset.                                                                                                                                                                                                                                                                                                                     |          |
| `resource`          |      `String`      | A URI that points to the asset's resource. A decentralized URI is recommended.                                                                                                                                                                                                                                                                                 |    ✓     |
| `resource_mimetype` |      `String`      | A [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#types) of the asset's resource _(discrete type only)_. The examples of MIME types are `image/png`, `audio/mpeg`, `video/mp4`, `model/3mf`, `font/otf`, and `application/pdf`.                                                                                        |          |
| `animation_url`     |      `String`      | A URL to a multi-media attachment for the asset. The examples of file extensions are GLTF, GLB, WEBM, MP4, M4V, OGV, OGG, MP3, WAV, and OGA. <br/><br/> Also, `animation_url` can be HTML pages for interactive NFTs using JavaScript canvas, WebGL, etc.                                                                                                      |          |
| `external_url`      |      `String`      | A URI that points to an external website presenting the asset.                                                                                                                                                                                                                                                                                                 |          |
| `attributes`        | `Array of Objects` | An array of attributes.<br/><br/> Each attribute has the following properties: <ul> <li>`trait_type` : `String` <br/> The name of the trait. <br/> _(optional)_</li> <li>`value` : `String` or `Number` <br/> The value of the trait. <br/> _(required)_</li> <li>`display_type` : `String` <br/> The display type of the trait. <br/> _(optional)_</li> </ul> |          |

#### Examples

**Minimal**

```json
{
  "name": "Creature #101",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1"
}
```

**Basic**

```json
{
  "name": "Creature #101",
  "description": "10,000 unique and diverse creatures living on the blockchain.",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "animation_url": "https://example.com/ipfs/QmQCJyWdRRsFNYZdpkhGLZVaMLv82GDuKG2wFeBqADksEi/?seed=eaaacee01ec4887f31da5cb500c1d7d19aed562492c93ce8c9a708f320d1a9eA",
  "external_url": "https://example.com/?token_id=1"
}
```

**Attributes**

```json
{
  "name": "Creature #101",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Black"
    },
    {
      "trait_type": "Fur",
      "value": "Teal"
    },
    {
      "trait_type": "Eyes",
      "value": "Big"
    },
    {
      "trait_type": "Mouth",
      "value": "Grin"
    },
    {
      "trait_type": "Accessories",
      "value": "None"
    },
    {
      "trait_type": "Level",
      "value": 7
    },
    {
      "display_type": "date",
      "trait_type": "birthday",
      "value": 1546360800
    }
  ]
}
```

**Other Properties**

Note that it is valid to have other properties for the several use cases.

```json
{
  "name": "Creature #101",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "id": 101
}
```

```json
{
  "name": "Creature #101",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "attributes": [
    {
      "trait_type": "Pupil Color",
      "value": "Deep Sea Green",
      "colors": [
        {
          "name": "Pupil",
          "value": "#07595c"
        }
      ]
    }
  ]
}
```

```json
{
  "name": "Creature #101",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "properties": {
    "rich_property": {
      "name": "Fur",
      "value": "teal",
      "display_value": "Teal"
    }
  }
}
```

### B. Token URI Optimization

We recommend using a token URI with the concatenation of base token URI and token ID only if it is possible. The concatenated token URI is `<base_uri><token_id>` and it can be gas-efficient.

| Base URI                                                 |
| :------------------------------------------------------- |
| `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/` |

When the base token URI is the above, the token URIs are the following:

| Token ID | Token URI                                                 |
| :------: | :-------------------------------------------------------- |
|    1     | `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/1` |
|    2     | `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/2` |
|    3     | `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/3` |

**When there is no base token URI**

Each token can have its own token URI when the base token URI does not exist. For example, there can be no base token URI for the randomized or dynamic minting with decentralized token URIs. It's because Content Identifier (CID) will change as NFTs are minted dynamically.

The token URIs can be just the following:

| Token ID | Token URI                                               |
| :------: | :------------------------------------------------------ |
|    1     | `ipfs://QmZacCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbEYpS1st` |
|    2     | `ipfs://QmZec4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB2nd` |
|    3     | `ipfs://QmZi2Jxm3aqVmByTMdud3z2pDiAYARBfLTEFg1Z7iiK3rd` |

## V. References

- [OpenSea - Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [Metaplex - Token Metadata Standard](https://docs.metaplex.com/nft-standard)
- [ARCs - Algorand Standard Asset Parameters Conventions for Fungible and Non-Fungible Tokens](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md)
- [ZRC-6 - Non-Fungible Token Standard](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-6.md)
- [ERC721 - Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC1155 - Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [IPFS - Best Practices for Storing NFT Data using IPFS](https://docs.ipfs.io/how-to/best-practices-for-nft-data/#best-practices-for-storing-nft-data-using-ipfs)
- [RFC6838 - Media Type Specifications and Registration Procedures](https://datatracker.ietf.org/doc/html/rfc6838)
- [IANA - Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml)
- [Mozilla - MIME types (IANA media types)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
