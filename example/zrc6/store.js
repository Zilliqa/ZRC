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
    const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions


    const ftAddrHuman = "509ae6e5d91cee3c6571dcd04aa08288a29d563a";
    const mtAddrHuman = "e3aa085f045abb2102520b3678d54dd551a04b08";
    const ftAddr = toBech32Address(ftAddrHuman);
    const mtAddr = toBech32Address(mtAddrHuman);
    const receiptAddrHuman = "BFe2445408C51CD8Ee6727541195b02c891109ee";

    try {
        const ftContract = zilliqa.contracts.at(ftAddr);
        const mtContract = zilliqa.contracts.at(mtAddr);

        const createTokenCallTx = await mtContract.call(
            'CreateZRC2BridgeToken',
            [
                {
                    vname: 'zrc2_contract',
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
        console.log(JSON.stringify(createTokenCallTx.receipt, null, 4));
        const tokenId = createTokenCallTx.receipt.event_logs.filter(e => e._eventname === "CreatedToken")[0]
            .params.filter(p => p.vname === "token")[0].value;
        console.log(`Created token #${tokenId}.`);

        const depositCallTx = await ftContract.call(
            'Transfer',
            [
                {
                    vname: 'to',
                    type: 'ByStr20',
                    value: "0x"+mtAddrHuman,
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
                    value: tokenId,
                },
                {
                    vname: 'to',
                    type: 'ByStr20',
                    value: "0x"+receiptAddrHuman,
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
                    value: tokenId,
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
