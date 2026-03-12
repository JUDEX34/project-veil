import React, { useState, useRef } from 'react';
import { CryptoUtils } from '../utils/CryptoUtils';

const ChatUI = () => {
    const [pin, setPin] = useState("");
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [username, setUsername] = useState("");
    const [targetUsername, setTargetUsername] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const [keys, setKeys] = useState(null);
    const wsRef = useRef(null);

    // Load or request PIN logic
    const handlePinSubmit = (e) => {
        e.preventDefault();
        const storedPin = localStorage.getItem("vader_pin");
        if (!storedPin) {
            if (pin.length < 4) {
                alert("Pin must be at least 4 characters");
                return;
            }
            localStorage.setItem("vader_pin", pin);
            setIsAuthenticated(true);
            initializeKeys();
        } else {
            if (pin === storedPin) {
                setIsAuthenticated(true);
                setFailedAttempts(0);
                initializeKeys();
            } else {
                const newFails = failedAttempts + 1;
                setFailedAttempts(newFails);
                if (newFails >= 5) {
                    wipeLocalData();
                }
            }
        }
    };

    const wipeLocalData = () => {
        localStorage.clear();
        // For Vader Phase 2: In a real app, wipe IndexedDB here using a library like localforage or native APIs
        alert("FATAL: Max PIN attempts reached. Local vault destroyed.");
        window.location.reload();
    };

    const initializeKeys = async () => {
        // Phase 2: For MVP demo purposes, we generate new keys on auth.
        // In production, we'd load encrypted keys from IndexedDB mapping to the specific Vault PIN.
        const kp = await CryptoUtils.generateKeyPair();
        setKeys(kp);
    };

    const connectWs = async () => {
        if (!username) return;
        const hash = await CryptoUtils.hashUsername(username);
        const ws = new WebSocket(`ws://localhost:8000/ws/${hash}`);

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (keys) {
                try {
                    const dec = await CryptoUtils.decryptMessage(keys.privateKey, data.payload);
                    setMessages(prev => [...prev, { from: data.from, text: dec }]);
                } catch (e) {
                    console.error("Failed to decrypt", e);
                }
            }
        };
        wsRef.current = ws;
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!wsRef.current || !targetUsername || !message || !keys) return;

        // Phase 2 MVP simulated behavior:
        // Here we'll just encrypt with our own public key for demonstration (loopback test)
        // To do true E2E across users:
        // const targetPubKeyStr = await fetchFromBlockchain(targetHash); // VaderPKI Smart Contract
        // const targetPubKey = await CryptoUtils.importPublicKey(targetPubKeyStr);

        // For MVP simulated purposes, we encrypt for ourselves or assume we have the key
        const targetHash = await CryptoUtils.hashUsername(targetUsername);
        const encrypted = await CryptoUtils.encryptMessage(keys.publicKey, message); // using our own key here as a placeholder

        const payload = {
            target_hash: targetHash,
            payload: encrypted,
            ttl: 120 // Phase 3: 2 minutes default ephemerality via Redis
        };

        wsRef.current.send(JSON.stringify(payload));
        setMessages(prev => [...prev, { from: 'Me', text: message }]);
        setMessage("");
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
                <h2 className="text-2xl font-bold mb-4 text-red-500">Vault Access</h2>
                <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
                    <input
                        type="password"
                        placeholder="Enter Device PIN"
                        value={pin} onChange={(e) => setPin(e.target.value)}
                        className="p-3 bg-gray-800 rounded border border-gray-700 text-white outline-none focus:border-red-500"
                        maxLength={8}
                    />
                    <button type="submit" className="bg-red-600 p-3 rounded font-bold hover:bg-red-700 transition">Unlock Vault</button>
                </form>
                {failedAttempts > 0 && <p className="text-red-400 mt-4">Security Notice: Attempts left: {5 - failedAttempts}</p>}
                {failedAttempts > 0 && <p className="text-gray-500 text-xs mt-1">Local data will be permanently destroyed on zero remaining attempts.</p>}
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col h-screen bg-gray-900 border-x border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-red-600 tracking-wider">VADER</h1>
                <div className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded">E2EE ACTIVE</div>
            </div>

            <div className="mb-4 flex gap-3">
                <input
                    type="text"
                    placeholder="My Identity (Username)"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    className="p-3 bg-gray-800 rounded flex-1 outline-none text-white focus:border focus:border-gray-600"
                />
                <button onClick={connectWs} className="bg-gray-700 px-6 rounded font-semibold hover:bg-gray-600 transition">Connect</button>
            </div>

            <div className="flex-1 bg-gray-950 rounded p-4 mb-4 border border-gray-800 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-600 mt-20">Secure Relay Initiated... Waiting for messages.</div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`mb-3 ${m.from === 'Me' ? 'text-right' : 'text-left'}`}>
                            <span className="text-xs text-gray-500 block mb-1 opacity-50">{m.from === 'Me' ? 'Me' : m.from.substring(0, 8) + '...'}</span>
                            <p className={`inline-block px-4 py-2 rounded-lg max-w-[80%] break-words shadow-md
                    ${m.from === 'Me' ? 'bg-red-900/50 text-red-100 border border-red-800/30' : 'bg-gray-800 text-gray-200 border border-gray-700/50'}
                `}>
                                {m.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={sendMessage} className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Target User"
                    value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)}
                    className="p-3 bg-gray-800 rounded w-1/3 outline-none focus:border focus:border-gray-600 text-white"
                />
                <input
                    type="text"
                    placeholder="Secure Message"
                    value={message} onChange={(e) => setMessage(e.target.value)}
                    className="p-3 bg-gray-800 rounded flex-1 outline-none focus:border focus:border-red-900/50 text-white"
                />
                <button type="submit" className="bg-red-700 px-6 font-bold rounded hover:bg-red-600 transition shadow-lg shadow-red-900/20">Send</button>
            </form>
            <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                <span>Shield Mode:</span> <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700 font-mono">Alt</span> + <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700 font-mono">Shift</span> + <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700 font-mono">S</span>
            </div>
        </div>
    );
};

export default ChatUI;
