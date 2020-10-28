/*
 * sign transaction
 * this example deploys a 3-owners requiring 2/3 signatures wallet
 */
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { toBech32Address, getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

// change the following parameters
const API = 'http://localhost:5555' // https://dev-api.zilliqa.com for zilliqa dev test
const CHAIN_ID = 1; // 333 for zilliqa dev testnet
const PRIVATE_KEY = 'd96e9eb5b782a80ea153c937fa83e5948485fbfc8b7e7c069d7b914dbc350aba'; // any of the wallet owners
const MULTISIG_CONTRACT_ADDR = toBech32Address('0xB9289D96Ee3CC4456ea8911B8a95d5aa939823c1');
const TRANSACTION_ID = '2'; // transaction to be signed

const zilliqa = new Zilliqa(API);
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
const GAS_PRICE = units.toQa('2000', units.Units.Li);

async function main() {
    try {
        zilliqa.wallet.addByPrivateKey(PRIVATE_KEY);
        const address = getAddressFromPrivateKey(PRIVATE_KEY);

        console.log("Your account address is:");
        console.log(`${address}`);
        console.log("------------------------ begin sign transaction ------------------------\n");

        const contract =  zilliqa.contracts.at(MULTISIG_CONTRACT_ADDR);
        const callTx = await contract.call(
            'SignTransaction',
            [
                {
                    vname: 'transactionId',
                    type: 'Uint32',
                    value: `${TRANSACTION_ID}`
                }
            ],
            {
                version: VERSION,
                amount: new BN(0),
                gasPrice: GAS_PRICE,
                gasLimit: Long.fromNumber(10000)
            }
        );
        console.log("transaction: %o", callTx.id);
        console.log(JSON.stringify(callTx.receipt, null, 4));
    } catch (err) {
        console.log(err);
    }
    console.log("------------------------ end sign transaction ------------------------\n");
}

main();