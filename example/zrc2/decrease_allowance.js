const {BN, Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const {
    toBech32Address,
    getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');


async function main() {
    const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
    const CHAIN_ID = 333;
    const MSG_VERSION = 1;
    const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
    privkey = '534b41b12c3c14e282279da256d85a9ce456e1d8cea4e2ef5c49c71e321b3eac';
    zilliqa.wallet.addByPrivateKey(
        privkey
    );
    const address = getAddressFromPrivateKey(privkey);
    console.log("Your account address is:");
    console.log(`${address}`);
    const myGasPrice = units.toQa('1000', units.Units.Li); // Gas Price that will be used by all transactions


    const ftAddr = toBech32Address("509ae6e5d91cee3c6571dcd04aa08288a29d563a");
    try {
        const contract = zilliqa.contracts.at(ftAddr);
        const callTx = await contract.call(
            'DecreaseAllowance',
            [
                {
                    vname: 'spender',
                    type: 'ByStr20',
                    value: "0xF9814DFAF5b817b6Ccd2993d94348cC77b354575",
                },
                {
                    vname: 'amount',
                    type: 'Uint128',
                    value: "10",
                }
            ],
            {
                // amount, gasPrice and gasLimit must be explicitly provided
                version: VERSION,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(10000),
            },
            33,
            100,
            false,
        );
        console.log(JSON.stringify(callTx.receipt, null, 4));

    } catch (err) {
        console.log(err);
    }
}

main();
