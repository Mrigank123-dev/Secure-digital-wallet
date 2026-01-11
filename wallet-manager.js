class WalletManager {
    constructor() {
        this.currentWallet = null;
        this.transactions = [];
        this.currentSignedTx = null;
    }

    async createWallet(password) {
        try {
            const keyPair = CryptoUtils.generateKeyPair();
            const encryptedPrivateKey = await CryptoUtils.encryptPrivateKey(keyPair.privateKey, password);
            if (!encryptedPrivateKey) throw new Error('Failed to encrypt private key');
            
            this.currentWallet = {
                address: keyPair.address,
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                encryptedPrivateKey: encryptedPrivateKey,
                balance: '0.00 ETH',
                createdAt: new Date().toISOString(),
                password: password
            };
            return this.currentWallet;
        } catch (error) {
            console.error('Wallet creation error:', error);
            throw error;
        }
    }

    getWallet() {
        return this.currentWallet;
    }

    async createTransaction(to, amount, memo = '') {
        if (!this.currentWallet) throw new Error('No wallet available');
        if (!CryptoUtils.isValidAddress(to)) throw new Error('Invalid recipient address');
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid amount');

        const txData = {
            from: this.currentWallet.address,
            to: to,
            amount: amount,
            memo: memo,
            timestamp: Date.now(),
            nonce: Math.floor(Math.random() * 1000000)
        };

        const signedTx = await CryptoUtils.signTransaction(txData, this.currentWallet.privateKey);
        this.currentSignedTx = signedTx;
        this.transactions.push(signedTx);
        return signedTx;
    }

    getCurrentSignedTx() {
        return this.currentSignedTx;
    }

    async verifyCurrentTransaction() {
        if (!this.currentSignedTx) throw new Error('No transaction to verify');
        return await CryptoUtils.verifySignature(this.currentSignedTx, this.currentWallet.publicKey);
    }

    getTransactions() {
        return this.transactions;
    }

    exportWallet() {
        if (!this.currentWallet) return null;
        return {
            address: this.currentWallet.address,
            publicKey: this.currentWallet.publicKey,
            encryptedPrivateKey: this.currentWallet.encryptedPrivateKey,
            createdAt: this.currentWallet.createdAt
        };
    }

    clearWallet() {
        this.currentWallet = null;
        this.currentSignedTx = null;
    }
}

const walletManager = new WalletManager();

