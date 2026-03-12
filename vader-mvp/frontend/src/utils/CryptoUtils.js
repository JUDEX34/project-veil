export const CryptoUtils = {
    /** Generate a new RSA-OAEP key pair structure */
    generateKeyPair: async () => {
        return await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );
    },

    /** Export Public Key to Base64 String (for VaderPKI Smart Contract) */
    exportPublicKey: async (key) => {
        const exported = await window.crypto.subtle.exportKey("spki", key);
        const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported));
        return btoa(exportedAsString);
    },

    /** Import Public Key from Base64 String (retrieved from VaderPKI Smart Contract) */
    importPublicKey: async (pem) => {
        const binaryDerString = window.atob(pem);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }
        return await window.crypto.subtle.importKey(
            "spki",
            binaryDer.buffer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["encrypt"]
        );
    },

    /** Encrypt string message using target's Public Key */
    encryptMessage: async (pubKey, message) => {
        const encoded = new TextEncoder().encode(message);
        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            pubKey,
            encoded
        );
        const cipherArray = Array.from(new Uint8Array(ciphertext));
        return btoa(String.fromCharCode.apply(null, cipherArray));
    },

    /** Decrypt Base64 ciphertext string using our Private Key */
    decryptMessage: async (privKey, ciphertextStr) => {
        const binaryString = window.atob(ciphertextStr);
        const ciphertext = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            ciphertext[i] = binaryString.charCodeAt(i);
        }
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privKey,
            ciphertext
        );
        return new TextDecoder().decode(decrypted);
    },

    /** Hash username (bytes32 hex equivalent) for blind relay routing and dPKI key lookup */
    hashUsername: async (username) => {
        const msgBuffer = new TextEncoder().encode(username);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
};
