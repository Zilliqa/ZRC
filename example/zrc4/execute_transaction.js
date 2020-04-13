/*
 * execute transaction
 * this example deploys a 3-owners requiring 2/3 signatures wallet
 */
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { toBech32Address, getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

// change the following parameters
const API = 'http://localhost:5555' // https://dev-api.zilliqa.com for zilliqa dev test
const CHAIN_ID = 1; // 333 for zilliqa dev testnet
const PRIVATE_KEY = '589417286a3213dceb37f8f89bd164c3505a4cec9200c61f7c6db13a30a71b45'; // any of the wallet owners, or the recipient's private key
const MULTISIG_CONTRACT_ADDR = toBech32Address('0xB9289D96Ee3CC4456ea8911B8a95d5aa939823c1');
const TRANSACTION_ID = '0'; // transaction to be executed

const zilliqa = new Zilliqa(API);
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
const GAS_PRICE = units.toQa('1000', units.Units.Li);

async function main() {
    try {
        zilliqa.wallet.addByPrivateKey(PRIVATE_KEY);
        const address = getAddressFromPrivateKey(PRIVATE_KEY);

        console.log("Your account address is:");
        console.log(`${address}`);
        console.log("------------------------ begin execute transaction ------------------------\n");

        // transaction must first be signed according to the minimal number of requried signatures
        // when initialising the contract
        const contract =  zilliqa.contracts.at(MULTISIG_CONTRACT_ADDR);
        const callTx = await contract.call(
            'ExecuteTransaction',
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
    console.log("------------------------ end execute transaction ------------------------\n");
}

main();