| ZRC | Title                                    | Status | Type     | Author                              | Created (yyyy-mm-dd) | Updated (yyyy-mm-dd) |
| --- | ---------------------------------------- | ------ | -------- | ----------------------------------- | -------------------- | -------------------- |
| 7   | Standardisation of non-fungible metadata | Draft  | Standard | Elliott Green <elliott@zilliqa.com> | 2021-10-11           | 2021-12-04           |

## I. What is Metadata?

Metadata is data that includes infomation about other data, it's widely used to present richer infomation to the end user. Non-fungible tokens can take advantage of a standardised way to present metadata for block explorers, wallets, marketplaces, ecosystem partners and clients to consume.

## II. Abstract

ZRC-7 defines an optional standard for non-fungible tokens to present their associated metadata.

## III. Motivation

This specification defines how non-fungible tokens data should be presented from a particular token_uri. By standardising the metadata format that tokens in the ecosystem share, it should reduce friction and complexity to individual projects which want to present and consume data from non fungible tokens.

## IV. Specification

The metadata specification describes:

1. The metadata standard that should be found when navigating to a particular non fungible token's token_uri.
2. The localization interface for developers to implement and ecosystems to consume.
3. The dynamic string literals that may be present in the URL string, such as {id} and {locale}

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

### B. Metadata Structure Example

ZRC-6 has a field whereby developers can store a resource where all of the base metadata can be found. This can either be an API or direct storage. The ```token_uri``` returned from the contract for a particular ```token_id``` is ```base_uri/token_id``` appended together. 

If ```base_uri``` is https://creatures-api.zilliqa.com/api/creature/ and ```token_id``` is 1, then `token_uri` for token id 1 becomes ```https://creatures-api.zilliqa.com/api/creature/1```.

```json
{
    "name": "Advertising Space",
    "description": "Each token represents a unique advertising space in the city.",
    "resource": "ipfs://QmSjJGa7zXUbixvYJpgkRkaSCYEBtSwgVtfzkoD3QkSsty",
    "resource_mimetype": "image/png",
    "external_url": "https://example.com",
    "external_description": "A generic headline from the project shared between all tokens.",
    "attributes": 
    [ 
      {
        "trait_type": "City", 
        "value": "London"
      }, 
      {
        "trait_type": "Population", 
        "trait_value": "8961989"
      }, 
    ],
    "localization": {
      "localization_uri": "ipfs://QmebDaB3PMQv816WVsKt7JhCM3aBjtNA1hc1d7fvGhGfG2/{id}-{locale}.json",
      "default": "en",
      "locales": ["en", "es", "fr"]
    }
}
```

### C. Localization Structure Example

Given a localization URI is present ```ipfs://QmebDaB3PMQv816WVsKt7JhCM3aBjtNA1hc1d7fvGhGfG2/{id}-{locale}.json``` this should resolve for a particular ```token_id``` and ```locale```.

If ```token_id``` is 1 and the locale chosen was ```fr``` then the localization data can be resolved at ```https://ipfs.io/ipfs/QmebDaB3PMQv816WVsKt7JhCM3aBjtNA1hc1d7fvGhGfG2/1-fr.json```

```json
{
  "name": "Espace Publicitaire",
  "description": "Chaque jeton représente un espace publicitaire unique dans la ville.",
  "external_description": "Un titre générique du projet partagé entre tous les jetons.",
   "attributes": 
    [ 
      {
        "trait_type": "Ville", 
        "value": "Londres"
      }, 
      {
        "trait_type": "Population", 
        "trait_value": "8961989"
      }
    ]
}
```

If ```token_id``` is 1 and the locale chosen was ```es``` then the localization data can be resolved at ```https://ipfs.io/ipfs/QmebDaB3PMQv816WVsKt7JhCM3aBjtNA1hc1d7fvGhGfG2/1-es.json```

```json
{
  "name": "Espacio Publicitario",
  "description": "Cada token representa un espacio publicitario único en la ciudad.",
  "external_description": "Un título genérico del proyecto compartido entre todos los tokens.",
   "attributes": 
    [ 
      {
        "trait_type": "Ciudad", 
        "value": "Londres"
      }, 
      {
        "trait_type": "Población", 
        "trait_value": "8961989"
      }
    ]
}
```

### B. URI Schema Examples

Developers should use one of the following URI schemes.

#### Web Servers

When the resource is stored on a web server. ```http``` or ```https```  may be used to reference a resource.

```https://example.com/mypict```

#### IPFS

IPFS allows NFTs to represent data of any format in a secure, verifiable, and distributed way.

IFPS resources using ```http``` or ```https``` with a gateway specified are considered valid. However a direct gateway link may error in the case where the gateway operator goes offline.

```https://dweb.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi```

IPFS resources using the static string ```ipfs://``` are considered valid. This is the recommended pattern than storing a direct gateway since it's not tied to a specific provider and any node will be able to respond with the requested content.

You can verify your CID can be reached on multiple gateways through browsing the [Public IPFS gateways](https://ipfs.github.io/public-gateway-checker/).

```ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi```

You may also include filenames inside the path component of an IPFS URI. For example, if you've stored your token's metadata on IPFS in a directory, your URI for the files in the directory will appear as the example.

```ipfs://bafybeibnsoufr2renqzsh347nrx54wcubt5lgkeivez63xvivplfwhtpym/metadata.json```


#### Template Literals

The URI value allows for substitution by clients.

The resource URI may contains the string ```{id}``` this must be substituted for the requested ZRC-6 ```token_id``` by ecosystem partners.

```https://s3.amazonaws.com/your-bucket/images/{id}.json```

The localization URI may contain the string ```{locale}``` this must be substituted for the requested locale by ecosystem partners.

```https://example.com/json/{locale}.json```

# References

## Standards

* [ERC721 - Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
* [ERC1155 - Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
* [Algorands Standard Asset Parameters Conventions for Fungible and Non-Fungible Tokens](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md)
* [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

## Articles

* [Best Practices for Storing NFT Data using IPFS](https://docs.ipfs.io/how-to/best-practices-for-nft-data/#types-of-ipfs-links-and-when-to-use-them)


## VI. Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
