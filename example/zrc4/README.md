## Getting Started

The Javascript examples uses [Zilliqa-Javascript-Library](#https://github.com/Zilliqa/Zilliqa-JavaScript-Library).
<br>
Using npm <= 12.9, run `npm install`.
To execute the examples, configure the parameters in the Javascript files and run `node [file_name.js], e.g. node deploy.js`.

## Sample Workflow

An example of using this multisig wallet contract is as follows:
1. Prepare some accounts and deploy the wallet contract: `node deploy.js`
2. Add funds to the wallet: `node add_funds.js`
3. Create a transaction to transfer some funds to a recipient: `node submit_transaction.js`
4. Sign the transaction from (3): `node sign_transaction.js`; change the private key to simulate different wallet owners approving the transaction.
5. Check the transactions and signatures' statuses: `node get_transactions.js` 
6. If necessary, revoke the signature from (4): `node revoke_signature.js`
7. Execute the transaction from (4) once the number of required signatures is reached: `node execute_transaction.js`; can be wallet owners or recipient