/*
 * get all the transactions and their signatures
 */
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { toBech32Address, getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

// change the following parameters
const API = 'http://localhost:5555' // https://dev-api.zilliqa.com for zilliqa dev test
const PRIVATE_KEY = '589417286a3213dceb37f8f89bd164c3505a4cec9200c61f7c6db13a30a71b45'; // any private key, don't have to be wallet owners
const MULTISIG_CONTRACT_ADDR = toBech32Address('0xB9289D96Ee3CC4456ea8911B8a95d5aa939823c1');

const zilliqa = new Zilliqa(API);

async function main() {
    try {
        zilliqa.wallet.addByPrivateKey(PRIVATE_KEY);
        const address = getAddressFromPrivateKey(PRIVATE_KEY);

        console.log("Your account address is:");
        console.log(`${address}`);
        console.log("------------------------ begin get transactions ------------------------\n");

        const contract =  zilliqa.contracts.at(MULTISIG_CONTRACT_ADDR);
        const state = await contract.getState();

        console.log("Transactions:");
        console.log(state.transactions);
        console.log("\n");
        console.log("Signatures:");
        console.log(state.signatures)
        
    } catch (err) {
        console.log(err);
    }
    console.log("------------------------ end get transactions ------------------------\n");
}

main();