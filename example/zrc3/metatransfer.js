const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
    getAddressFromPrivateKey,
    getPubKeyFromPrivateKey,
    sign,
    toBech32Address,
    fromBech32Address,
} = require('@zilliqa-js/crypto');

var hash = require('hash.js')

async function metatransfer() {
    const zilliqa = new Zilliqa('https://api.zilliqa.com');
    const sender_zilliqa = new Zilliqa('https://api.zilliqa.com');
    const CHAIN_ID = 1;
    const MSG_VERSION = 1;
    const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
    privkey = '3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8';
    zilliqa.wallet.addByPrivateKey(
        privkey
    );
    const alice = getAddressFromPrivateKey(privkey); //alice is the sender
    const bob = "114f77519e8a463d25fc1a399870ed0dcb275ce3"  //bob recieves the metatransaction
    sender_zilliqa.wallet.addByPrivateKey("07e0b1d1870a0ba1b60311323cb9c198d6f6193b2219381c189afab3f5ac41a9");
    console.log("bob: ")
    console.log(`${bob}`);

    const pubkey = getPubKeyFromPrivateKey(privkey);
    const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions

    //Signature Parameters calculation
    const amount = 2;
    const nonce = 13;
    const fee = 2;
    const contractAddr = "5ff3cae12c97850f8ca3db2d921ead12690e38c3";

    const amount_bn = new BN(amount)
    const nonce_bn = new BN(nonce)
    const fee_bn = new BN(fee)
    const uint_amt = Uint8Array.from(amount_bn.toArrayLike(Buffer, undefined, 16))
    const uint_nonce = Uint8Array.from(nonce_bn.toArrayLike(Buffer, undefined, 16))
    const uint_fee = Uint8Array.from(fee_bn.toArrayLike(Buffer, undefined, 16))

    const to_hash = hash.sha256().update(bytes.hexToByteArray(bob)).digest('hex')
    console.log("to_hash: ")
    console.log(`${to_hash}`);

    const amount_hash = hash.sha256().update(uint_amt).digest('hex')
    console.log("amount_hash: ")
    console.log(`${amount_hash}`);

    const contract_hash = hash.sha256().update(bytes.hexToByteArray(contractAddr)).digest('hex')
    console.log("contract_hash: ")
    console.log(`${contract_hash}`);

    const fee_hash = hash.sha256().update(uint_fee).digest('hex')
    console.log("fee_hash: ")
    console.log(`${fee_hash}`);

    const nonce_hash = hash.sha256().update(uint_nonce).digest('hex')
    console.log("nonce_hash: ")
    console.log(`${nonce_hash}`);

    const msg_buf = Buffer.from(to_hash + amount_hash + contract_hash + fee_hash + nonce_hash, 'hex')
    const sig = sign(msg_buf, privkey, pubkey)
    console.log("pubkey: ")
    console.log(`0x` + `${pubkey}`);
    console.log("privkey: ")
    console.log(`0x` + `${privkey}`);
    console.log("buf_message: ")
    console.log(`${msg_buf}`);
    console.log("sig: ")
    console.log(`0x` + `${sig}`);

    try {
        const contract = sender_zilliqa.contracts.at(contractAddr);
        const callTx = await contract.call(
            'ChequeSend',
            [
                {
                    vname: 'pubkey',
                    type: 'ByStr33',
                    value: `0x` + `${pubkey}`,
                },
                {
                    vname: 'to',
                    type: 'ByStr20',
                    value: `0x` + `${bob}`,
                },
                {
                    vname: 'amount',
                    type: 'Uint128',
                    value: `${amount}`,
                },
                {
                    vname: 'fee',
                    type: 'Uint128',
                    value: `${fee}`,
                },
                {
                    vname: 'nonce',
                    type: 'Uint128',
                    value: `${nonce}`,
                },
                {
                    vname: 'signature',
                    type: 'ByStr64',
                    value: `0x` + `${sig}`,
                },
            ],
            {
                // amount, gasPrice and gasLimit must be explicitly provided
                version: VERSION,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(10000),
            }
        );
        console.log(JSON.stringify(callTx.receipt, null, 4));

    } catch (err) {
        console.log(err);
    }
}

metatransfer();
