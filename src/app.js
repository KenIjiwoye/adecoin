const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Private key goes here
const myKey = ec.keyFromPrivate('2b589d7d0b30ebf9442fa0a812817df7b4e889ce834e53a3408e24dcf2e65ea4');

// From that we can calculate your public key (which doubles as your wallet address)
const myWalletAddress = myKey.getPublic('hex');

// Create new instance of Blockchain class
let adeCoin = new Blockchain();

// Create a transaction & sign it with the key
const tx1 = new Transaction(myWalletAddress, 'address2', 10);
tx1.signTransaction(myKey);
adeCoin.addTransaction(tx1);

// Mine block
console.log('\n Starting the miner');
adeCoin.minePendingTransactions(myWalletAddress);

// Create second transaction
const tx2 = new Transaction(myWalletAddress, 'address1', 50);
tx2.signTransaction(myKey);
savjeeCoin.addTransaction(tx2);


console.log();
console.log('\n Balance of Diamond is', adeCoin.getBalanceOfAddress(myWalletAddress));

// Uncomment this line if you want to test tampering with the chain
// savjeeCoin.chain[1].transactions[0].amount = 10;

// Check if the chain is valid
console.log();
console.log('Is chain valid?', adeCoin.isChainValid());
