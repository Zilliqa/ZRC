/*
 * deploy multisig wallet contract
 * this example deploys a 3-owners requiring 2/3 signatures wallet
 */
const fs = require('fs');
const path = require('path');
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { toBech32Address, getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

// change the following parameters
const API = 'http://localhost:5555' // https://dev-api.zilliqa.com for zilliqa dev test
const CHAIN_ID = 1; // 333 for zilliqa dev testnet
const PRIVATE_KEY = 'e53d1c3edaffc7a7bab5418eb836cf75819a82872b4a1a0f1c7fcf5c3e020b89';

const OWNER_ADDR1 = '0xd90f2e538ce0df89c8273cad3b63ec44a3c4ed82';
const OWNER_ADDR2 = '0x381f4008505e940ad7681ec3468a719060caf796';
const OWNER_ADDR3 = '0xb028055ea3bc78d759d10663da40d171dec992aa';
const REQUIRED_SIGNATURES = 2;

const zilliqa = new Zilliqa(API);
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
const GAS_PRICE = units.toQa('1000', units.Units.Li);

const MULTISIG_CONTRACT_PATH = "../../reference/multisig_wallet.scilla";

async function main() {
    try {
        // use any one of the owners to deploy
        zilliqa.wallet.addByPrivateKey(PRIVATE_KEY);
        const address = getAddressFromPrivateKey(PRIVATE_KEY);

        console.log("Your account address is:");
        console.log(`${address}`);
        console.log("------------------------ begin deploy multisig wallet ------------------------\n");
        console.log(`Deploying proxy contract: ` + MULTISIG_CONTRACT_PATH);
        const code = fs.readFileSync(path.join(__dirname, MULTISIG_CONTRACT_PATH), 'ascii');

        const init = [
            {
                vname: "_scilla_version",
                type: "Uint32",
                value: "0",
            },
            {
                vname: "owners_list",
                type: "List ByStr20",
                value: [OWNER_ADDR1, OWNER_ADDR2, OWNER_ADDR3]
            },
            {
                vname: "required_signatures",
                type: "Uint32",
                value: `${REQUIRED_SIGNATURES}`
            }
        ];
        
        const contract = zilliqa.contracts.new(code, init);
        const [deployTx, multiSigWallet] = await contract.deploy(
            {
                version: VERSION,
                amount: new BN(0),
                gasPrice: GAS_PRICE,
                gasLimit: Long.fromNumber(25000)
            },
            33,
            1000,
            true
        );

        console.log(`Deployment Transaction ID: ${deployTx.id}`);
        console.log(`Deployment Transaction Receipt`);
        console.log(deployTx.txParams.receipt);
        console.log('multisig wallet address: %o', multiSigWallet.address);

        console.log("------------------------ end deploy multisig wallet ------------------------\n");
    } catch (err) {
        console.log(err);
    }
}

main();