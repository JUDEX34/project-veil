import React, { useState, useEffect, useRef } from 'react';
import { CryptoUtils } from '../utils/CryptoUtils';

const ActiveChat = ({ myUsername, chat, onMessageSent, onBack, theme }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [keys, setKeys] = useState(null);

    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle crypto init and websocket connection dynamically per chat
    useEffect(() => {
        let ws;
        const initializeChat = async () => {
            // Clear old messages when switching chats
            // In reality, load from local storage/IndexedDB here
            setMessages([]);

            const kp = await CryptoUtils.generateKeyPair();
            setKeys(kp);

            const hash = await CryptoUtils.hashUsername(myUsername);
            ws = new WebSocket(`ws://localhost:8000/ws/${hash}`);

            ws.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                try {
                    const dec = await CryptoUtils.decryptMessage(kp.privateKey, data.payload);
                    setMessages(prev => [...prev, { from: data.from, text: dec, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                } catch (e) {
                    console.error("Failed to decrypt incoming", e);
                }
            };
            wsRef.current = ws;
        };

        initializeChat();

        return () => {
            if (ws) ws.close();
        };
    }, [chat.id, myUsername]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!wsRef.current || !inputText.trim() || !keys) return;

        const message = inputText.trim();
        // Simulate encryption for loopback
        const targetHash = await CryptoUtils.hashUsername(chat.id);
        const encrypted = await CryptoUtils.encryptMessage(keys.publicKey, message);

        const payload = {
            target_hash: targetHash,
            payload: encrypted,
            ttl: 120
        };

        wsRef.current.send(JSON.stringify(payload));

        setMessages(prev => [...prev, {
            from: 'Me',
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        onMessageSent(message);
        setInputText("");
    };

    const handleCreateSubchat = () => {
        const subchatId = `sub_${chat.id}_${Math.floor(Math.random() * 1000)}`;
        alert(`Subchat functionality: Send symmetric key request to specific peers in this group to initialize ${subchatId}`);
    };

    const isLight = theme === 'light';

    // Theme Variables
    const bgImageOverlay = isLight ? 'rgba(239, 234, 226, 0.95)' : 'rgba(11, 20, 26, 0.9)';
    const headerBg = isLight ? 'bg-gray-100 border-gray-300' : 'bg-[#202c33] border-[#222d34]';
    const headerText = isLight ? 'text-gray-900' : 'text-[#e9edef]';
    const headerSubText = isLight ? 'text-gray-500' : 'text-[#8696a0]';
    const groupIcon = isLight ? 'bg-blue-100 text-blue-800' : 'bg-[#00a884] text-[#111b21]';
    const userIcon = isLight ? 'bg-gray-300 text-gray-700' : 'bg-[#6a7175] text-[#e9edef]';
    const inputBarBg = isLight ? 'bg-gray-100' : 'bg-[#202c33]';
    const inputBg = isLight ? 'bg-white text-gray-900 shadow-sm' : 'bg-[#2a3942] text-[#e9edef]';
    const systemMsgBg = isLight ? 'bg-yellow-50 text-yellow-800 border-yellow-200 shadow-sm' : 'bg-[#182229] border-[#222d34] text-[#8696a0] shadow-sm';
    const myMsgBg = isLight ? 'bg-blue-100 text-blue-900' : 'bg-[#005c4b] text-[#e9edef]';
    const otherMsgBg = isLight ? 'bg-white text-gray-800 border border-gray-100 shadow-sm' : 'bg-[#202c33] text-[#e9edef]';
    const timeText = isLight ? 'text-gray-500' : 'text-[#8696a0]';
    const senderColor = isLight ? 'text-blue-600' : 'text-[#00a884]';
    const sendIconColor = isLight ? 'text-blue-500 hover:text-blue-700' : 'text-[#8696a0] hover:text-[#00a884]';

    return (
        <div className="flex-1 flex flex-col w-full h-full relative" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: bgImageOverlay }}>

            {/* Header */}
            <div className={`h-[60px] ${headerBg} flex items-center justify-between px-4 border-l shadow-sm z-10 transition-colors`}>
                <div className="flex items-center gap-3">
                    {/* Back button — mobile only */}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className={`md:hidden p-1 rounded-full transition ${isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-[#2a3942] text-[#8696a0]'}`}
                            aria-label="Back to chats"
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z" /></svg>
                        </button>
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${chat.isGroup ? groupIcon : userIcon}`}>
                        {chat.isGroup ? 'G' : chat.id[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className={`font-medium text-base ${headerText}`}>{chat.id}</h2>
                        <p className={`text-xs ${headerSubText}`}>{chat.isGroup ? 'E2EE Group Relay' : 'E2EE Direct Relay'}</p>
                    </div>
                </div>


                <div className="flex items-center gap-4">
                    {chat.isGroup && (
                        <button
                            onClick={handleCreateSubchat}
                            className={`text-xs font-bold border px-3 py-1.5 rounded transition ${isLight ? 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50' : 'bg-[#111b21] border-[#00a884] text-[#00a884] hover:bg-[#00a884] hover:text-[#111b21]'}`}
                        >
                            + Subchat
                        </button>
                    )}
                    <div className={headerSubText}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-2 custom-scrollbar">
                <div className={`${systemMsgBg} border text-xs self-center px-4 py-1.5 rounded-lg mb-4 text-center max-w-md transition-colors`}>
                    🔒 Messages and subchats are end-to-end encrypted. No third party, including Vader relays, can read them. They expire in 2 minutes.
                </div>

                {messages.map((m, i) => {
                    const isMe = m.from === 'Me';
                    return (
                        <div key={i} className={`flex flex-col max-w-[65%] ${isMe ? 'self-end' : 'self-start'}`}>
                            {!isMe && chat.isGroup && (
                                <span className={`text-[10px] ${senderColor} font-medium mb-0.5 ml-1`}>{m.from.substring(0, 8)}...</span>
                            )}
                            <div className={`px-2.5 py-1.5 shadow-sm relative text-[15px]
                 ${isMe ? `${myMsgBg} rounded-lg rounded-tr-none` : `${otherMsgBg} rounded-lg rounded-tl-none`}
              `}>
                                <span className="break-words">{m.text}</span>
                                <div className="float-right mt-1 ml-3 flex items-center opacity-70">
                                    <span className={`text-[10px] whitespace-nowrap pt-1 ${timeText}`}>{m.time}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`${inputBarBg} p-3 flex items-center gap-3 transition-colors`}>
                <form onSubmit={handleSendMessage} className={`flex-1 flex items-center ${inputBg} rounded-lg px-4 py-2 transition-colors`}>
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-[15px]"
                    />
                    <button type="submit" className={`${sendIconColor} ml-2 transition-colors`}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ActiveChat;
