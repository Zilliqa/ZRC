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
    privkey = '07e0b1d1870a0ba1b60311323cb9c198d6f6193b2219381c189afab3f5ac41a9';
    zilliqa.wallet.addByPrivateKey(
        privkey
    );
    const address = getAddressFromPrivateKey(privkey);
    console.log("Your account address is:");
    console.log(`${address}`);
    const myGasPrice = units.toQa('1000', units.Units.Li); // Gas Price that will be used by all transactions


    const ftAddrHuman = "509ae6e5d91cee3c6571dcd04aa08288a29d563a";
    const mtAddrHuman = "9b80a12a68989575b7fd4b82a6dabee468ab9d92";
    const ftAddr = toBech32Address('0x'+ftAddrHuman);
    const mtAddr = toBech32Address('0x'+mtAddrHuman);
    const receiptAddrHuman = "BFe2445408C51CD8Ee6727541195b02c891109ee";

    try {
        const ftContract = zilliqa.contracts.at(ftAddr);
        const mtContract = zilliqa.contracts.at(mtAddr);

        const createTokenCallTx = await mtContract.call(
            'Transfer',
            [
                {
                    vname: 'CreateZRC2BridgeToken',
                    type: 'ByStr20',
                    value: '0x'+ftAddrHuman,
                }
            ],
            {
                // amount, gasPrice and gasLimit must be explicitly provided
                version: VERSION,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(10000),
            }
        );
        console.log(JSON.stringify(createTokenCallTx/*.receipt*/, null, 4));
        return;

        const confirmedCreateTokenCallTx = await createTokenCallTx.confirm(createTokenCallTx.id);
        console.log(JSON.stringify(confirmedCreateTokenCallTx.receipt, null, 4));

        const depositCallTx = await ftContract.call(
            'Transfer',
            [
                {
                    vname: 'to',
                    type: 'ByStr20',
                    value: mtAddr,
                },
                {
                    vname: 'amount',
                    type: 'Uint128',
                    value: "100",
                }
            ],
            {
                // amount, gasPrice and gasLimit must be explicitly provided
                version: VERSION,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(10000),
            }
        );
        console.log(JSON.stringify(depositCallTx.receipt, null, 4));

        const transferCallTx = await mtContract.call(
            'Transfer',
            [
                {
                    vname: 'token',
                    type: 'Uint64',
                    value: ??,
                },
                {
                    vname: 'to',
                    type: 'ByStr20',
                    value: receiptAddrHuman,
                },
                {
                    vname: 'amount',
                    type: 'Uint128',
                    value: "100",
                }
            ],
            {
                // amount, gasPrice and gasLimit must be explicitly provided
                version: VERSION,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(10000),
            }
        );
        console.log(JSON.stringify(transferCallTx.receipt, null, 4));

        const withdrawCallTx = await mtContract.call(
            'Withdraw',
            [
                {
                    vname: 'token',
                    type: 'Uint64',
                    value: ??,
                },
                {
                    vname: 'to',
                    type: 'ByStr20',
                    value: receiptAddrHuman,
                },
                {
                    vname: 'amount',
                    type: 'Uint128',
                    value: "100",
                }
            ],
            {
                // amount, gasPrice and gasLimit must be explicitly provided
                version: VERSION,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(10000),
            }
        );
        console.log(JSON.stringify(transferCallTx.receipt, null, 4));

    } catch (err) {
        console.log(err);
    }
}

main();
