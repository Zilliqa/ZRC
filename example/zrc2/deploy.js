const fs = require('fs');
const {Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const {getAddressFromPrivateKey} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');


async function main() {
    const CHAIN_ID = 333;
    const MSG_VERSION = 1;
    const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
    privkey = 'e19d05c5452598e24caad4a0d85a49146f7be089515c905ae6a19e8a578a6930';
    zilliqa.wallet.addByPrivateKey(
        privkey
    );
    const address = getAddressFromPrivateKey(privkey);
    console.log("Your account address is:");
    console.log(`${address}`);
    const myGasPrice = units.toQa('1000', units.Units.Li); // Gas Price that will be used by all transactions

    console.log("start to deploy zrc2: ");
    const code = fs.readFileSync("./FungibleToken.scilla").toString();
    console.log("contract code is: ");
    console.log(code);
    const init = [
        // this parameter is mandatory for all init arrays
        {
            vname: "_scilla_version",
            type: "Uint32",
            value: "0"
        },
        {
            vname: "contract_owner",
            type: "ByStr20",
            value: `${address}`
        },
        {
            vname: "name",
            type: "String",
            value: `USDT`
        },
        {
            vname: "symbol",
            type: "String",
            value: `USDT`
        },
        {
            vname: "decimals",
            type: "Uint32",
            value: `2`
        },
        {
            vname: "default_operators",
            type: "List ByStr20",
            value: ["0xcd44d83d5217a191eed05cf4ee3dd5d9a93961a1", "0xcd44d83d5217a191eed05cf4ee3dd5d9a93961a2", "0xcd44d83d5217a191eed05cf4ee3dd5d9a93961a3"]
        },
        {
            vname: "init_supply",
            type: "Uint128",
            value: `100000000`
        }
    ];
    console.log("init json is: ");
    console.log(JSON.stringify(init));
    const contract = zilliqa.contracts.new(code, init);
    try {
        const [deployTx, ftoken] = await contract.deployWithoutConfirm({
            version: VERSION,
            gasPrice: myGasPrice,
            gasLimit: Long.fromNumber(40000)
        }, false);

        if (ftoken.error) {
            console.error(ftoken.error);
            return;
        }
        // check the pending status
        const pendingStatus = await zilliqa.blockchain.getPendingTxn(deployTx.id);
        console.log(`Pending status is: `);
        console.log(pendingStatus.result);

        // process confirm
        console.log(`The transaction id is:`, deployTx.id);
        console.log(`Waiting transaction be confirmed`);
        const confirmedTxn = await deployTx.confirm(deployTx.id);

        // Introspect the state of the underlying transaction
        console.log(`Deployment Transaction ID: ${deployTx.id}`);

        // Get the deployed contract address
        console.log("The contract address is:");
        console.log(ftoken.address);

        //Get the contract state
        const state = await ftoken.getState();
        console.log("The state of the contract is:");
        console.log(state);
    } catch (e) {
        console.error(e);
    }

}

main();