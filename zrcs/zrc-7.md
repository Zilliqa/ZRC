| ZRC | Title                                    | Status | Type     | Author                              | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------------------- | ------ | -------- | ----------------------------------- | -------------------- | -------------------- |
| 7   | Standardisation of non-fungible metadata | Draft  | Standard | Elliott Green <elliott@zilliqa.com> | 2021-10-11           | 2021-11-26           |

## I. What is Metadata?

Metadata is data that includes infomation about other data, it's widely used to present richer infomation to the end user. Non-fungible tokens can take advantage of a standardised way to present metadata for block explorers, wallets, marketplaces, ecosystem partners and clients to consume.

## II. Abstract

ZRC-7 defines an optional standard for non-fungible tokens to present their associated metadata.

## III. Motivation

This specification builds from the using the existing metadata JSON Schema from [ERC721 - Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) and utilises the localization JSON schema from [ERC1155 - Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155). Several blockchains and ecosystems have defined a richer standard that previously build on ERC721 that provide a better user experience. This specification also takes inspiration from [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards) to define how non-fungible attributes should be presented and [Algorands Standard Asset Parameters Conventions for Fungible and Non-Fungible Tokens](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md) to define how ecosystem partners should consume the NFT resources by presenting a related mime type. By standardising the base JSON to ERC-1155's metadata format, it should ensure that bridging of these assets to Zilliqa causes the least friction for existing marketplaces.

## IV. Specification

The metadata specification describes:

1. the metadata interface that is returned by an API for developers to implement and ecosystems to consume
2. the localization interface for developers to implement and ecosystems to consume
3. the dynamic interpolation that may be present in the URL string, such as {id} and {locale}

### A. Rationale

Compared to ERC-1155, the JSON Metadata schema allows to indicate the MIME type of the files pointed by any URI field. This is to allow clients to display appropriately the resource without having to first query it to find out the MIME type.

Metadata localization should be standardized to increase presentation uniformity across all languages. As such, a simple overlay method is proposed to enable localization.

NFT's are broken into two parts. The first is the blockchain smart contract, which contains the association between users and a token. Each token when examained points off-chain to an external resource which contains the metadata for that particular token. This could be on the surface web or using a decentralised storage solution such as IPFS or Arweave.

ZRC-6 gives the developer the ability to set an ```base_uri``` which exposes a field for the developer to insert a URI they control. When navigating to ```base_uri/{id}``` for a given ```token_id```, the response returned should be a standardised JSON structure for it to be considered ZRC-7 compliant.

The main advantages of keeping metadata offchain are as follows.

* Mutability
  * Owner can update the metadata at anytime without a chain call (changing hashes of IPFS and Arweave resources)
* Storage
  * Owner can store more data offchain than onchain and for a cheaper cost to maintain and amend.

The main disadvantages of keeping metadata offchain are as follows.

* Mutability 
  * Owner can maliciously update the metadata at anytime without a chain call.

### B. Metadata JSON Schema

```js
{
    "name": "Cloud Quackers",
    "description": "Non-Fungible Ducks",
    "resource": "ipfs://QmTwmV66VMgq5YzEUZj48oqvznkiUGVMCT4UnWRjr1L9gU",
    "resource_mimetype": "image/png",
    "external_url": "https://duck.community",
    "external_description": "Non-Fungible Ducks are the first randomised, hard-cap project on the Zilliqa blockchain.",
    "attributes": 
    [ 
          {
            "display_type" : "string",
            "trait_type": "Base name", 
            "value": "Mandarin Shiny"
          }, 
          {
            "display_type" : "string",
            "trait_type": "Base rarity percent", 
            "value": "10%"
          }, 
          {
            "display_type" : "string",
            "trait_type": "Base occurance chance", 
            "value": "0.91%"
          }
    ],
    "localization": {
        "type": "object",
        "properties": {
            "uri": "",
            "default": "",
            "locales": ""
        }
    }
}

```

### JSON Object

The data required in the JSON object is predefined, this should not be changed. This is a required field.

| Name         | Type             | Description                                                           | Required |
|--------------| ---------------- | --------------------------------------------------------------------- | -------- |
| `title`      | `string`         | The title of the metadata. Expected to be presented as "ZRC_7".       | true     |
| `value`      | `string`         | A JSON object representing the metadata for the token.                | true     |

### Name

The name of the asset. This is a required field.

| Name          | Type             | Description                                                           | Required |
|---------------| ---------------- | --------------------------------------------------------------------- | -------- |
| `name`        | `object`         | A JSON object representing the name of the token.                     | true     |
| `value`      | `string`          | The name of the asset to which this token represents.                 | true     |

### Description

A textual description of the asset. This is a optional field.

| Name          | Type             | Description                                                           | Required  |
|---------------| ---------------- | --------------------------------------------------------------------- | --------- |
| `description` | `object`         | A JSON object representing the description of the token.              | false     |
| `value`      | `string`          | The description of the asset to which this token represents.          | false     |

### Resource

A URI which points to the asset resource. This is a required field.
The resource URI must follow RFC-3986 and must not contain any whitespace character.
The resource URI may include the string {id} which should be substituted for the token_id by ecosystem partners.
The resource URI should persist publically forever.
The resource URI should use one of the following URI schemes defined in this document section URI Schema.

| Name         | Type             | Description                                                                 | Required |
|--------------| ---------------- | --------------------------------------------------------------------------- | -------- |
| `resource`   | `object`         | A JSON object representing the resource of the token.                       | true     |
| `value`      | `string`         | The URI of the asset to which this token represents.                        | true     |

### Resource Mimetype

A mimetype which represents the resource URI conforming to RFC 2045. This is a required field.

| Name                  | Type             | Description                                                           | Required |
|-----------------------| ---------------- | ----------------------------------------------------------------------| -------- |
| `resource_mimetype`   | `object`         | A JSON object representing the tokens resource mime type.             | true     |
| `value`               | `string`         | A RFC 2045 compliant mime type of the asset resource.                 | true     |

### External URL

A URI which points to an external resource for presenting the token. This is an optional field.
The external URI must follow RFC-3986 and must not contain any whitespace character.
The external URI should use one of the following URI schemes defined in this document section URI Schema.

| Name              | Type             | Description                                                           | Required |
|-------------------| ---------------- | --------------------------------------------------------------------- | -------- |
| `external_url`    | `object`         | A JSON object representing the external URL of the token.             | false    |
| `value`           | `string`         | The URI pointing to an external website presenting the asset.         | false    |

### External Description

A textual description of the external resource for presenting the token. This is an optional field.

| Name                     | Type             | Description                                                                   | Required |
|--------------------------| ---------------- | ----------------------------------------------------------------------------- | -------- |
| `external_description`   | `object`         | A JSON object representing the description of the external URL.               | false    |
| `value`                  | `string`         | The description of the external url.                                          | false    |

### Attributes

An array of attributes with predefined types. Attributes can have the type of string, integer, decimal or date.

| Name                     | Type             | Description                                                                   | Required |
|--------------------------| ---------------- | ----------------------------------------------------------------------------- | -------- |
| `attributes`             | `array`          | A JSON array of attributes with customised types of key value pairs.                                        | false    |

| Name                     | Type             | Description                                                                   | Required |
|--------------------------| ---------------- | ----------------------------------------------------------------------------- | -------- |
| `type`                   | `*`              | The customised type of the attribute. Can be string, integer, decimal or date.           | false    |
| `value`                  | `*`              | The value of the attribute.                                                   | false    |

### Localization

The data required for the sub-object is predefined, this should not be changed. This is a optional field.
If the metadata contains a ```localization``` attribute, its content may be used to provide localized values for fields that need it.
The localization attribute should be a sub-object with three attributes: uri, default and locales

| Name            | Type             | Description                                                                    | Required |
|-----------------| ---------------- | ------------------------------------------------------------------------------ | -------- |
| `localization`  | `object`         | A JSON object representing the localization metadata.                          | false    |  |
| `value`         | `string`         | A JSON object representing the localization properties.                        | false    |

### Localization URI

A URI which points to an external resource for presenting the token. This is an optional field.
Ecosystem partners may consume the localization URI pattern with the permitted string substitutions to
The localization resource URI may include the string {id} which should be substituted for the token_id by ecosystem partners.
The localization resource URI may include the string {locale} which may be substituted for the current locale by ecosystem partners.
The localization URI should persist publically forever.
The localization URI must follow RFC-3986 and must not contain any whitespace character
The localization URI should use one of the following URI schemes defined in this document section URI Schema

| Name          | Type             | Description                                                                       | Required  |
|---------------| ---------------- | --------------------------------------------------------------------------------- | --------- |
| `uri`         | `object`         |  A JSON object representing the localization URI pattern.                         | false     |
| `value`      | `string`         | The URI pattern to fetch localized data from. This URI should contain the substring `{locale}` which will be replaced with the appropriate locale value before sending the request. | false     |

### Default Localization

The language of the default metadata defined in the parent object. This is an optional field. This locale should conform to those defined in the Unicode Common Locale Data Repository.

| Name          | Type             | Description                                                                                 | Required  |
|---------------| ---------------- | ------------------------------------------------------------------------------------------- | --------- |
| `default`     | `object`         | A JSON object representing the locale of the default metadata within the parent JSON.       | false     |
| `value`       | `string`         |The value of the default localization metadata within the parent JSON. This locale should conform to those defined in the Unicode Common Locale Data Repository (<http://cldr.unicode.org/>)        | false     |

### Locale

An array of supported languages. This is an optional field. This locale should conform to those defined in the Unicode Common Locale Data Repository.

| Name          | Type             | Description                                                                            | Required  |
|---------------| ---------------- | -------------------------------------------------------------------------------------- | --------- |
| `locale`      | `object`         | A JSON object representing the locale of the default metadata within the parent JSON.  | false     |
| `value`       | `string`         | The array values of locales for which data is available. These locales should conform to those defined in the Unicode Common Locale Data Repository (<http://cldr.unicode.org/>) | false     |

### B. URI Schema Examples

Developers should use one of the following URI schemes.

When the resource is stored on the web, https should be used.
```https://example.com/mypict```

When the resource is stored on IPFS, the ```ipfs://``` URI should be used. The IPFS Gateway URI (such as ```https://ipfs.io/ipfs/...```) should not be used.
```ipfs://QmWS1VAdMD353A6SDk9wNyvkT14kyCiZrNDYAad4w1tKqT```

When the resource is stored on Arweave, https should be used.
```https://arweave.net/MAVgEMO3qlqe-qHNVs00qgwwbCb6FY2k15vJP3gBLW4```

When the resource contains the string ```{id}``` this should be substituted for the token_id by ecosystem partners.
```https://s3.amazonaws.com/your-bucket/images/{id}.json```

When the localization URI contains the string ```{locale}``` this should be substituted for the current locale by ecosystem partners.
```https://example.com/mypict/{locale}.json```

## V. Existing Implementation(s)

JSON examples of ZRC7.

## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
