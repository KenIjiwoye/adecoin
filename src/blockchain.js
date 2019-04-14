const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction{
    constructor( fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    // Creates hash of the transaction

    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
    }

    // signs a transaction with a signingKey (private key from using Elliptic) 
    // The signature is then stored inside the transaction object and later stored on the blockchain. 

    signTransaction(signingKey){

        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('Signing transactions for different wallets are not permitted');
        }

        // Calculate the hash of this transaction, sign it with the key
        // and store it inside the transaction obect
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    // checks to see if signature is valid using the fromAddress as the publicKey

    isValid(){
        if(this.fromAddress === null) return true;

        if(!this.signature || this.signature.length === 0){
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block{
    constructor(
        timestamp,
        transactions,
        previousHash =''
    ) {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    // returns a SHA256 of this block, containing all the data stored inside this block

    calculateHash(){
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    // starts the mining process on the block
    // the nonce gets changed until the hash starts with enough zeros (difficulty)

    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined:" + this.hash );
    }

    // validates all transactions inside the block

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }

        return true;
    }
}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock(){
        return new Block(Date.parse("04/01/2019"), [], "0");
    }

    // returns the latest block when wanting to create a new Block but need the hash of the prev. Block

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    // Takes all the pending transactions, puts them in a Block and starts the
    // mining process. It also adds a transaction to send the mining reward to
    // the given address.

    minePendingTransactions(miningRewardAddress){
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Mine successful! You sir/madam deserve a beer!');
        this.chain.push(block);

        this.pendingTransactions = [];
    }


    // Add a new transaction to the list of pending transactions (to be added
    // next time the mining process starts). This verifies that the given
    // transaction is properly signed.

    addTransaction(transaction){

        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must include from and to address');
        }

        // Verifying the transaction
        if(!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);
    }

    // returns the balance of any given wallet address
    getBalanceOfAddress(address){
        let balance = 0;

        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddress === address){
                    balance -= trans.amount;
                }
                if(trans.toAddress === address){
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

     // Returns a list of all transactions that happened
     // to and from the given wallet address.
 
    getAllTransactionsForWallet(address) {
        const txs = [];

        for (const block of this.chain) {
        for (const tx of block.transactions) {
            if (tx.fromAddress === address || tx.toAddress === address) {
            txs.push(tx);
            }
        }
        }

        return txs;
    }

    // Loops over all the blocks in the chain and verify if they are properly
    // linked together and nobody has tampered with the hashes. By checking
    // the blocks it also verifies the (signed) transactions inside of them.
    
    isChainValid(){
        for( let i =1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i -1];

            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }
        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction; 