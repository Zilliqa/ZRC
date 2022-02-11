| ZRC | Title                 | Status |   Type   | Author                                                                                                                    | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| :-: | --------------------- | :----: | :------: | ------------------------------------------------------------------------------------------------------------------------- | :------------------: | :------------------: |
|  7  | NFT Metadata Standard | Ready  | Standard | Neuti Yoo<br/><noel@zilliqa.com> <br/> Elliott Green<br/><elliott@zilliqa.com> <br/> Jun Hao Tan<br/><junhao@zilliqa.com> |      2021-10-11      |      2022-01-20      |

## Table of Contents

- [I. What is Metadata and Token URI?](#i-what-is-metadata-and-token-uri)
- [II. Abstract](#ii-abstract)
- [III. Motivation](#iii-motivation)
- [IV. Specification](#iv-specification)
  - [A. Metadata Structure](#a-metadata-structure)
    - [1. Collection Metadata Structure](#1-collection-metadata-structure-optional)
    - [2. Token Metadata Structure](#2-token-metadata-structure)
- [V. References](#v-references)
- [VI. Copyright](#vi-copyright)

## I. What is Metadata and Token URI?

Metadata is data that provides information about other data. Metadata allows NFTs to have additional properties e.g. name, resource, and attributes. The example is the following:

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
      "trait_type": "Eyes",
      "value": "Big"
    },
    {
      "trait_type": "Mouth",
      "value": "Grin"
    },
    {
      "display_type": "timestamp",
      "trait_type": "Birthday",
      "value": 1546360800
    }
  ]
}
```

The above is a JSON blob of data with the metadata for the NFT. It is returned by a token URI which is an HTTP or IPFS URL. The examples are the following:

- `ipfs://QmZIL4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aA/1`
- `ipfs://QmZILw65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStAE`
- `ar://ZILsR4OrYvODj7PD3czIAyNJalub0-vdV_JAg5NqA-o`
- `https://ipfs.io/ipfs/QmZIL4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aA/1`
- `https://foo.mypinata.cloud/ipfs/QmZILYgURKVnLWBm1aXH1BqKqFgmj7j1K6MWAFTkf9xm8A/1`
- `https://creatures-api.zilliqa.com/api/creature/1`

Token URIs can be gas-efficient with the concatenation of [ZRC-6](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-6.md) compliant base URI and token ID. The concatenated token URI is `<base_uri><token_id>`.

| Base URI                                                 |
| :------------------------------------------------------- |
| `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/` |

When the base URI is the above, the token URIs are the following:

| Token ID | Token URI                                                 |
| :------: | :-------------------------------------------------------- |
|    1     | `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/1` |
|    2     | `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/2` |
|    3     | `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/3` |

Note that each token can have its own token URI when the base URI does not exist.

## II. Abstract

ZRC-7 standardizes the NFT metadata structure.

## III. Motivation

The consistent metadata structure can help the NFT creators and builders to handle the NFT metadata more simply.

## IV. Specification

### A. Metadata Structure

There are two types of metadata structure to be described: collection metadata, token metadata

|        Type         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Required |
| :-----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| Collection Metadata | Contract-level metadata for the NFT collection. It is returned by the URI of this format: `<base_uri>metadata.json`. For example, if `ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1/` is the [ZRC-6](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-6.md) compliant `base_uri`, then collection metadata JSON file is returned by `ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1/metadata.json`. <br/><br/> It can be space-efficient to use collection metadata. It's because the redundant data in the token metadata can be stored in the collection metadata instead. <br/><br/>This is optional. If there is no `base_uri`, the collection metadata cannot be accessed. |
|   Token Metadata    | Token-level metadata for a specific NFT. It is returned by the token URI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |    ✓     |

#### 1. Collection Metadata Structure (Optional)

Collection metadata must be structured as the following:

| Property        |   Type   | Description                                                                                                                                                                                                                                                    | Required |
| --------------- | :------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `name`          | `String` | Name of the collection.                                                                                                                                                                                                                                        |    ✓     |
| `description`   | `String` | A human readable description of the collection.                                                                                                                                                                                                                |          |
| `external_url`  | `String` | A URL that points to an external website presenting the collection.                                                                                                                                                                                            |          |
| `animation_url` | `String` | A URL to a multi-media attachment for the collection. The examples of file extensions are GLTF, GLB, WEBM, MP4, M4V, OGV, OGG, MP3, WAV, and OGA. <br/><br/> Also, `animation_url` can be HTML pages for interactive NFTs using JavaScript canvas, WebGL, etc. |          |

##### Examples

**Minimal**

```json
{
  "name": "Unique and Diverse Creatures"
}
```

**Basic**

```json
{
  "name": "Unique and Diverse Creatures",
  "description": "10,000 unique and diverse creatures living on the blockchain.",
  "external_url": "https://example.com/creature",
  "animation_url": "https://animation.example.com/creature"
}
```

**Other Properties**

Note that it is valid to have other properties for several use cases.

```json
{
  "name": "Unique and Diverse Creatures",
  "image_url": "https://storage.googleapis.com/creature-prod.appspot.com/unique-and-diverse-creatures.png"
}
```

#### 2. Token Metadata Structure

Token metadata must be structured as the following:

| Property             |        Type        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Required |
| -------------------- | :----------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `name`               |      `String`      | Name of the asset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |    ✓     |
| `resource`           |      `String`      | A URI that points to the asset's resource. This can be either point to centralized storage e.g. S3 or decentralized file storage e.g. IPFS, Arweave.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |    ✓     |
| `resource_mimetype`  |      `String`      | A [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#types) of the asset's resource _(discrete type only)_. The examples of MIME types are `image/png`, `audio/mpeg`, `video/mp4`, `model/3mf`, `font/otf`, and `application/pdf`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |          |
| `resource_integrity` |      `String`      | A Base64 encoded SHA digest of the file pointed by the `resource`. This is an [integrity metadata](https://w3c.github.io/webappsec-subresource-integrity/#integrity-metadata-description). For example, if the SHA-256 is the hash function and `8z5D++W8NDHzFm5rY4/JxkXlIlU2cSQ65XjighJVk9U=` is the Base64 encoded SHA digest of the resource file, then the `resource_integrity` is `sha256-8z5D++W8NDHzFm5rY4/JxkXlIlU2cSQ65XjighJVk9U=`. <br/><br/> If `resource` points to centralized storage, then this property can be used to ensure the integrity of the resource. Otherwise, this property is unnecessary.                                                                                                                                                                                                                 |          |
| `attributes`         | `Array of Objects` | An array of attributes.<br/><br/> Each attribute has the following properties: <ul> <li>`trait_type` : `String` <br/> The name of the trait. <br/> _(optional)_</li> <li>`value` : `String`, `Number`, or `Boolean` <br/> The value of the trait. When the value is `Number`, it should be integer or float. <br/> _(required)_</li> <li>`mime_type` : `String` <br/> A [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#types) of the `value` _(discrete type only)_. <br/> _(optional)_</li> <li>`integrity` : `String` <br/> A Base64 encoded SHA digest of the file pointed by the `value`. <br/> _(optional)_</li> <li>`display_type` : `String` <br/> The display type of the trait. If the display type is `timestamp`, we recommend using unix timestamp. <br/> _(optional)_</li> </ul> |          |
| `description`        |      `String`      | A human readable description of the asset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |          |
| `external_url`       |      `String`      | A URL that points to an external website presenting the asset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |          |
| `animation_url`      |      `String`      | A URL to a multi-media attachment for the asset. The examples of file extensions are GLTF, GLB, WEBM, MP4, M4V, OGV, OGG, MP3, WAV, and OGA. <br/><br/> Also, `animation_url` can be HTML pages for interactive NFTs using JavaScript canvas, WebGL, etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |          |

##### Examples

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
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "resource_mimetype": "image/png",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Black"
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
      "display_type": "timestamp",
      "trait_type": "Birthday",
      "value": 1546360800
    }
  ]
}
```

```json
{
  "name": "Sound #101",
  "resource": "ipfs://QmZILEr2zXUbixvYJpgkRkaSCYEBtSwgVtrskoE9NnTsZ3",
  "resource_mimetype": "audio/mpeg",
  "attributes": [
    {
      "trait_type": "Cover",
      "value": "https://storage.googleapis.com/sound-prod.appspot.com/sound/101/cover.png",
      "mime_type": "image/png",
      "integrity": "sha256-8z5D++W8NDHzFm5rY4/JxkXlIlU2cSQ65XjighJVk9U="
    }
  ]
}
```

**Resource Integrity**

Note that resource is stored on centralized storage.

```json
{
  "name": "Creature #101",
  "resource": "https://storage.googleapis.com/creature-prod.appspot.com/creature/101.png",
  "resource_integrity": "sha256-8z5D++W8NDHzFm5rY4/JxkXlIlU2cSQ65XjighJVk9U="
}
```

**Description**

```json
{
  "name": "Creature #101",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "description": "10,000 unique and diverse creatures living on the blockchain."
}
```

**External & Animation URL**

```json
{
  "name": "Creature #101",
  "resource": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
  "external_url": "https://example.com/creature/101",
  "animation_url": "https://animation.example.com/creature/101"
}
```

**Other Properties**

Note that it is valid to have other properties for several use cases.

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
  "properties": {
    "base": "cat",
    "rich_property": {
      "name": "eyes",
      "value": "big",
      "display_value": "Big"
    }
  }
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

## V. References

- [OpenSea - Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [Metaplex - Token Metadata Standard](https://docs.metaplex.com/token-metadata/v1.1.0/specification)
- [ARCs - Algorand Standard Asset Parameters Conventions for Fungible and Non-Fungible Tokens](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md)
- [ZRC-6 - Non-Fungible Token Standard](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-6.md)
- [ERC721 - Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC1155 - Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [IPFS - Best Practices for Storing NFT Data using IPFS](https://docs.ipfs.io/how-to/best-practices-for-nft-data/#best-practices-for-storing-nft-data-using-ipfs)
- [RFC6838 - Media Type Specifications and Registration Procedures](https://datatracker.ietf.org/doc/html/rfc6838)
- [IANA - Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml)
- [Mozilla - MIME types (IANA media types)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [W3C - Subresource Integrity](https://w3c.github.io/webappsec-subresource-integrity)

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
