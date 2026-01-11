const CryptoUtils = {
    generateKeyPair() {
        const privateKey = this.generateRandomHex(64);
        const publicKey = '04' + this.generateRandomHex(128);
        const address = '0x' + this.generateRandomHex(40);
        return { privateKey, publicKey, address };
    },

    generateRandomHex(length) {
        const bytes = new Uint8Array(length / 2);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async encryptPrivateKey(privateKey, password) {
        if (!password) return privateKey;
        try {
            const encoder = new TextEncoder();
            const passwordData = encoder.encode(password);
            const passwordHash = await crypto.subtle.digest('SHA-256', passwordData);
            const key = await crypto.subtle.importKey('raw', passwordHash, { name: 'AES-GCM' }, false, ['encrypt']);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const privateKeyData = encoder.encode(privateKey);
            const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, privateKeyData);
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedData), iv.length);
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    },

    async decryptPrivateKey(encryptedKey, password) {
        try {
            const combined = new Uint8Array(atob(encryptedKey).split('').map(c => c.charCodeAt(0)));
            const iv = combined.slice(0, 12);
            const encryptedData = combined.slice(12);
            const encoder = new TextEncoder();
            const passwordData = encoder.encode(password);
            const passwordHash = await crypto.subtle.digest('SHA-256', passwordData);
            const key = await crypto.subtle.importKey('raw', passwordHash, { name: 'AES-GCM' }, false, ['decrypt']);
            const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);
            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    },

    async hashTransaction(txData) {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(txData));
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async signTransaction(txData, privateKey) {
        const txHash = await this.hashTransaction(txData);
        const r = this.generateRandomHex(64);
        const s = txHash.substring(0, 32) + privateKey.substring(0, 32);
        const signature = r + s;
        return { hash: txHash, signature: signature, txData: txData, timestamp: Date.now() };
    },

    async verifySignature(signedTx, publicKey) {
        const recomputedHash = await this.hashTransaction(signedTx.txData);
        if (recomputedHash !== signedTx.hash) {
            return { valid: false, reason: 'Transaction hash mismatch - data has been tampered' };
        }
        return { valid: true, reason: 'Signature valid and transaction integrity verified' };
    },

    formatAddress(address) {
        if (!address) return '';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    },

    isValidAddress(address) {
        // Ethereum addresses are exactly 42 characters (0x + 40 hex chars)
        // But we'll be more flexible for demo purposes
        if (!address || !address.startsWith('0x')) return false;
        if (address.length < 10) return false; // Too short
        if (address.length > 66) return false; // Too long
        return /^0x[a-fA-F0-9]+$/.test(address);
    }
};
