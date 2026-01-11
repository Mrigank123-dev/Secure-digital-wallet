document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.disabled) return;
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            document.getElementById(targetId).classList.add('active');
        });
    });

    const generateForm = document.getElementById('generate-form');
    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            const wallet = await walletManager.createWallet(password);
            displayWallet(wallet);
            document.getElementById('wallet-tab').disabled = false;
            document.getElementById('transaction-tab').disabled = false;
            document.querySelector('[data-tab="wallet"]').click();
        } catch (error) {
            alert('Failed to create wallet: ' + error.message);
        }
    });

    const transactionForm = document.getElementById('transaction-form');
    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const to = document.getElementById('tx-to').value;
        const amount = document.getElementById('tx-amount').value;
        const memo = document.getElementById('tx-memo').value;

        try {
            const signedTx = await walletManager.createTransaction(to, amount, memo);
            displaySignedTransaction(signedTx);
            document.getElementById('verify-tab').disabled = false;
            document.querySelector('[data-tab="verify"]').click();
        } catch (error) {
            alert('Failed to create transaction: ' + error.message);
        }
    });

    function displayWallet(wallet) {
        const walletInfo = document.getElementById('wallet-info');
        walletInfo.innerHTML = `
            <div class="wallet-field">
                <label>Wallet Address (Public)</label>
                <div class="wallet-field-content">
                    <input type="text" value="${wallet.address}" readonly>
                    <button class="copy-btn" onclick="copyToClipboard('${wallet.address}')">Copy</button>
                </div>
            </div>
            
            <div class="wallet-field">
                <label>Public Key (Derived from Private Key)</label>
                <div class="wallet-field-content">
                    <input type="text" value="${wallet.publicKey.substring(0, 40)}..." readonly>
                    <button class="copy-btn" onclick="copyToClipboard('${wallet.publicKey}')">Copy</button>
                </div>
            </div>
            
            <div class="wallet-field danger">
                <label>⚠️ Private Key (Never Share!)</label>
                <div class="wallet-field-content">
                    <input type="password" value="${wallet.privateKey}" readonly id="private-key-input">
                    <button class="btn-secondary" onclick="togglePrivateKey()">Show</button>
                </div>
            </div>
            
            <div class="wallet-field success">
                <label>🔒 Encrypted Private Key (AES-256)</label>
                <div class="wallet-field-content">
                    <input type="text" value="${wallet.encryptedPrivateKey.substring(0, 50)}..." readonly>
                    <button class="copy-btn" onclick="copyToClipboard('${wallet.encryptedPrivateKey}')">Copy</button>
                </div>
                <p class="hint">This is how your private key is stored securely</p>
            </div>
            
            <div class="info-box mt-4">
                <h3>Wallet Information</h3>
                <ul>
                    <li><strong>Created:</strong> ${new Date(wallet.createdAt).toLocaleString()}</li>
                    <li><strong>Balance:</strong> ${wallet.balance}</li>
                    <li><strong>Encryption:</strong> AES-256-GCM</li>
                    <li><strong>Curve:</strong> secp256k1</li>
                </ul>
            </div>
        `;

        document.getElementById('tx-from').value = wallet.address;
    }

    function displaySignedTransaction(signedTx) {
        const signedTxDiv = document.getElementById('signed-transaction');
        signedTxDiv.innerHTML = `
            <div class="wallet-field">
                <label>Transaction Hash (SHA-256)</label>
                <div class="wallet-field-content">
                    <input type="text" value="${signedTx.hash}" readonly>
                    <button class="copy-btn" onclick="copyToClipboard('${signedTx.hash}')">Copy</button>
                </div>
            </div>
            
            <div class="wallet-field">
                <label>Digital Signature (ECDSA)</label>
                <div class="wallet-field-content">
                    <input type="text" value="${signedTx.signature.substring(0, 50)}..." readonly>
                    <button class="copy-btn" onclick="copyToClipboard('${signedTx.signature}')">Copy</button>
                </div>
            </div>
            
            <div class="wallet-field">
                <label>Transaction Data</label>
                <div class="transaction-data">
                    <pre>${JSON.stringify(signedTx.txData, null, 2)}</pre>
                </div>
            </div>
            
            <div class="success-message">
                <h3>✓ Transaction Signed Successfully</h3>
                <p>This transaction is now cryptographically secure and ready to broadcast</p>
            </div>
            
            <div class="info-box">
                <h3>Security Properties:</h3>
                <ul>
                    <li>✓ <strong>Authenticity:</strong> Signature proves sender identity</li>
                    <li>✓ <strong>Integrity:</strong> Any data modification invalidates signature</li>
                    <li>✓ <strong>Non-repudiation:</strong> Sender cannot deny transaction</li>
                    <li>✓ <strong>Confidentiality:</strong> Private key never exposed</li>
                </ul>
            </div>
        `;
    }

    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    };

    window.togglePrivateKey = () => {
        const input = document.getElementById('private-key-input');
        input.type = input.type === 'password' ? 'text' : 'password';
    };
});