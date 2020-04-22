/*
 * submit transaction
 * this example deploys a 3-owners requiring 2/3 signatures wallet
 */
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { toBech32Address, getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

// change the following parameters
const API = 'http://localhost:5555' // https://dev-api.zilliqa.com for zilliqa dev test
const CHAIN_ID = 1; // 333 for zilliqa dev testnet
const PRIVATE_KEY = 'e53d1c3edaffc7a7bab5418eb836cf75819a82872b4a1a0f1c7fcf5c3e020b89'; // any of the wallet owners
const MULTISIG_CONTRACT_ADDR = toBech32Address('0xB9289D96Ee3CC4456ea8911B8a95d5aa939823c1');
const RECIPIENT = '0xB9289D96Ee3CC4456ea8911B8a95d5aa939823c1'; // can be wallet address
const TRANSFER_AMOUNT = '1000';

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
        console.log("------------------------ begin submit transaction ------------------------\n");

        const contract =  zilliqa.contracts.at(MULTISIG_CONTRACT_ADDR);
        const callTx = await contract.call(
            'SubmitTransaction',
            [
                {
                    vname: 'recipient',
                    type: 'ByStr20',
                    value: `${RECIPIENT}`
                },
                {
                    vname: 'amount',
                    type: 'Uint128',
                    value: `${TRANSFER_AMOUNT}`
                },
                {
                    vname: 'tag',
                    type: 'String',
                    value: 'AddFunds'
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
    console.log("------------------------ end submit transaction ------------------------\n");
}

main();