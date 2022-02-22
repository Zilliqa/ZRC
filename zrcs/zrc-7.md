| ZRC | Title                 |  Status  |   Type   | Author                                                                                                                    | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| :-: | --------------------- | :------: | :------: | ------------------------------------------------------------------------------------------------------------------------- | :------------------: | :------------------: |
|  7  | NFT Metadata Standard | Approved | Standard | Neuti Yoo<br/><noel@zilliqa.com> <br/> Elliott Green<br/><elliott@zilliqa.com> <br/> Jun Hao Tan<br/><junhao@zilliqa.com> |      2021-10-11      |      2022-02-22      |

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
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ],
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
    }
  ]
}
```

The above is a JSON blob of data with the metadata for the NFT. It is returned by a token URI which is an IPFS, HTTP, or [data URL](https://datatracker.ietf.org/doc/html/rfc2397). The examples are the following:

- `ipfs://QmZIL4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aA/1`
- `ipfs://QmZILw65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStAE`
- `ar://ZILsR4OrYvODj7PD3czIAyNJalub0-vdV_JAg5NqA-o`
- `https://ipfs.io/ipfs/QmZIL4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aA/1`
- `https://foo.mypinata.cloud/ipfs/QmZILYgURKVnLWBm1aXH1BqKqFgmj7j1K6MWAFTkf9xm8A/1`
- `https://creatures-api.zilliqa.com/api/creature/1`
- `data:application/json;base64,ewogICJuYW1lIjogIkNyZWF0dXJlICMxMDEiLAogICJyZXNvdXJjZXMiOiBbCiAgICB7ICJ1cmkiOiAiaXBmczovL1FtWklMR2E3elhVYml4dllKcGdrUmthU0NZRUJ0U3dnVnRmemtvRDNZa05zRTEiIH0KICBdCn0=`
- `data:application/json,%7B%22name%22%3A%22Creature%20%23101%22%2C%22resources%22%3A%5B%7B%22uri%22%3A%22ipfs%3A%2F%2FQmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1%22%7D%5D%7D`

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

|        Type         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required |
| :-----------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| Collection Metadata | Contract-level metadata for the NFT collection. It is returned by a URI of this format: `<base_uri>metadata.json`. For example, if `ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1/` is the [ZRC-6](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-6.md) compliant `base_uri`, then collection metadata JSON file is returned by `ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1/metadata.json`. <br/><br/> It can be space-efficient to use collection metadata. It's because the redundant data in the token metadata can be stored in the collection metadata instead. <br/><br/>This is optional. If there is no `base_uri`, the collection metadata cannot be accessed. |
|   Token Metadata    | Token-level metadata for a specific NFT. It is returned by a token URI e.g., `ipfs://QmZILCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbS0M3UrI/1`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |    ✓     |

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

| Property        |        Type        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Required |
| --------------- | :----------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `name`          |      `String`      | Name of the asset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |    ✓     |
| `resources`     | `Array of Objects` | An array of resources. Each resource has the following properties: <br/><br/><ul> <li>`uri` : `String` _(required)_<br/> An IPFS, HTTP, or [data URL](https://datatracker.ietf.org/doc/html/rfc2397) which returns the asset's resource. The examples of URIs are the following:<ul><li>`ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1`</li><li>`https://example.com/creature/101.png`</li><li>`data:image/png;base64,iVBORw0KGgo...`</li></ul><br/></li> <li>`mime_type` : `String` _(optional)_ <br/> A [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#types) of the asset's resource _(discrete type only)_. The examples of MIME types are the following: <ul><li>`image/png`</li><li>`audio/mpeg`</li><li>`video/mp4`</li><li>`model/3mf`</li><li>`font/otf`</li><li>`application/pdf`</li></ul><br/></li> <li>`integrity` : `String` _(optional)_ <br/> A Base64 encoded SHA digest of the file pointed by the `uri`. This is an [integrity metadata](https://w3c.github.io/webappsec-subresource-integrity/#integrity-metadata-description). For example, if the SHA-256 is the hash function and `8z5D++W8NDHzFm5rY4/JxkXlIlU2cSQ65XjighJVk9U=` is the Base64 encoded SHA digest of the resource file, then the `integrity` is `sha256-8z5D++W8NDHzFm5rY4/JxkXlIlU2cSQ65XjighJVk9U=`. If `uri` is a centralized URI, then consider using this property to ensure the integrity of the resource. </li> </ul> |    ✓     |
| `attributes`    | `Array of Objects` | An array of attributes. Each attribute has the following properties: <br/><br/><ul> <li>`trait_type` : `String` _(optional)_ <br/> The name of the trait. <br/><br/></li> <li>`value` : `String`, `Number`, or `Boolean` _(required)_ <br/> The value of the trait. When the value is `Number`, it should be integer or float.<br/><br/></li> <li>`mime_type` : `String` _(optional)_ <br/> A [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#types) of the `value` _(discrete type only)_. If the `value` is a URI, then consider using this field. <br/><br/></li> <li>`integrity` : `String` _(optional)_ <br/> A Base64 encoded SHA digest of the file pointed by the `value`. If the `value` is a centralized URI, then consider using this field. <br/><br/></li> <li>`display_type` : `String` _(optional)_<br/> The display type of the trait. If the display type is `timestamp`, then consider using unix timestamp.</li> </ul>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |          |
| `description`   |      `String`      | A human readable description of the asset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |          |
| `external_url`  |      `String`      | A URL that points to an external website presenting the asset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |          |
| `animation_url` |      `String`      | A URL to a multi-media attachment for the asset. The examples of file extensions are GLTF, GLB, WEBM, MP4, M4V, OGV, OGG, MP3, WAV, and OGA. <br/><br/> Also, `animation_url` can be HTML pages for interactive NFTs using JavaScript canvas, WebGL, etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |          |
| `transitions`   | `Array of Objects` | An array of transitions that can be executed by the token owner. Each transition has the following properties:<br/><br/><ul> <li>`vname` : `String` _(required)_<br/> The name of the transition.<br/><br/></li><li>`params` : `Array of Objects` _(required)_<br/> An array of parameters. Each parameter has the following properties:<br/><ul> <li>`type` : `String` _(required)_<br/> The type of the parameter.</li><li>`vname` : `String` _(required)_<br/> The name of the parameter.</li><li>`default_value` : `String`, `Object`, `Array of Strings`, or `Array of Objects` _(optional)_<br/> The default value of the parameter.</li></ul> </li></ul>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |          |

##### Examples

**Minimal**

```json
{
  "name": "Creature #101",
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ]
}
```

**Basic**

```json
{
  "name": "Creature #101",
  "resources": [
    {
      "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
      "mime_type": "image/png"
    }
  ],
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
  "resources": [
    {
      "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1",
      "mime_type": "audio/mpeg"
    }
  ],
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
  "resources": [
    {
      "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1"
      "mime_type": "image/png",
    },
    {
      "uri": "https://storage.googleapis.com/creature-prod.appspot.com/creature/101.png"
      "mime_type": "image/png",
      "integrity": "sha256-8z5D++W8NDHzFm5rY4/JxkXlIlU2cSQ65XjighJVk9U="
    }
  ],
}
```

**Description**

```json
{
  "name": "Creature #101",
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ],
  "description": "10,000 unique and diverse creatures living on the blockchain."
}
```

**External & Animation URL**

```json
{
  "name": "Creature #101",
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ],
  "external_url": "https://example.com/creature/101",
  "animation_url": "https://animation.example.com/creature/101"
}
```

**Transitions**

```json
{
  "name": "Creature #101",
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ],
  "transitions": [
    {
      "vname": "Foo",
      "params": [
        {
          "vname": "x",
          "type": "Uint256",
          "default_value": "1"
        }
      ]
    }
  ]
}
```

**Other Properties**

Note that it is valid to have other properties for several use cases.

```json
{
  "name": "Creature #101",
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ],
  "id": 101
}
```

```json
{
  "name": "Creature #101",
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ],
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
  "resources": [
    { "uri": "ipfs://QmZILGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3YkNsE1" }
  ],
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
- [Metaplex - Token Metadata Standard](https://docs.metaplex.com/token-metadata/specification#token-standards)
- [ARCs - Algorand Standard Asset Parameters Conventions for Fungible and Non-Fungible Tokens](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md)
- [ZRC-6 - Non-Fungible Token Standard](https://github.com/Zilliqa/ZRC/blob/master/zrcs/zrc-6.md)
- [ERC721 - Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC1155 - Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [RFC 1738 - Uniform Resource Locators (URL)](https://datatracker.ietf.org/doc/html/rfc1738)
- [RFC 2397 - The "data" URL scheme](https://datatracker.ietf.org/doc/html/rfc2397)
- [RFC 6838 - Media Type Specifications and Registration Procedures](https://datatracker.ietf.org/doc/html/rfc6838)
- [IANA - Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml)
- [Mozilla - MIME types (IANA media types)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [W3C - Subresource Integrity](https://w3c.github.io/webappsec-subresource-integrity)
- [IPFS - Best Practices for Storing NFT Data using IPFS](https://docs.ipfs.io/how-to/best-practices-for-nft-data/#best-practices-for-storing-nft-data-using-ipfs)

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
