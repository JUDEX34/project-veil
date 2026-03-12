import React, { useState, useEffect } from 'react';
import SettingsPanel from './SettingsPanel';

const FAKE_CHATS = [
    { id: '1', name: 'Mom', lastMsg: "Don't forget to pick up the milk!", avatar: 'bg-pink-500', time: '10:15 AM' },
    { id: '2', name: 'Weather Alerts', lastMsg: 'Rain expected tomorrow at 3 PM.', avatar: 'bg-blue-500', time: '8:00 AM' },
    { id: '3', name: 'Landlord', lastMsg: 'Rent is due on the 1st.', avatar: 'bg-gray-500', time: 'Tuesday' },
    { id: '4', name: "Doctor's Office", lastMsg: 'Your appointment is confirmed.', avatar: 'bg-green-500', time: 'Monday' },
    { id: '5', name: 'Work Group', lastMsg: 'Meeting at 2 PM, please join on time.', avatar: 'bg-yellow-600', time: 'Yesterday' },
];

const FAKE_MESSAGES = {
    '1': [
        { text: 'Hi hun, how are you?', fromMe: false, time: '10:00 AM' },
        { text: 'Doing well! Working right now.', fromMe: true, time: '10:05 AM' },
        { text: "Don't forget to pick up the milk!", fromMe: false, time: '10:15 AM' },
    ],
    '2': [
        { text: 'Severe Thunderstorm Warning: Seek shelter immediately.', fromMe: false, time: 'Yesterday' },
        { text: 'Rain expected tomorrow at 3 PM.', fromMe: false, time: '8:00 AM' },
    ],
    '3': [
        { text: 'Hello, please confirm you are renewing the lease.', fromMe: false, time: 'Monday' },
        { text: 'Yes, I dropped off the check yesterday.', fromMe: true, time: 'Monday' },
        { text: 'Rent is due on the 1st.', fromMe: false, time: 'Tuesday' },
    ],
    '4': [
        { text: 'Your appointment is confirmed for Friday at 9 AM.', fromMe: false, time: 'Monday' },
        { text: 'Great, thank you!', fromMe: true, time: 'Monday' },
    ],
    '5': [
        { text: 'Team, please submit your reports by EOD.', fromMe: false, time: 'Yesterday' },
        { text: 'Will do!', fromMe: true, time: 'Yesterday' },
        { text: 'Meeting at 2 PM, please join on time.', fromMe: false, time: '9:00 AM' },
    ],
};

// ─── Main DecoyLayout ────────────────────────────────────────────────────────
const DecoyLayout = ({ username }) => {
    const [activeId, setActiveId] = useState(null);
    const [inputText, setInputText] = useState('');
    const [localMessages, setLocalMessages] = useState(FAKE_MESSAGES);
    const [showSettings, setShowSettings] = useState(false);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const storedTheme = localStorage.getItem('vader_theme');
        if (storedTheme) setTheme(storedTheme);
    }, []);

    const handleThemeChange = (t) => {
        setTheme(t);
        localStorage.setItem('vader_theme', t);
    };

    const handleLogout = () => window.location.reload();

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeId) return;
        const newMsg = { text: inputText.trim(), fromMe: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setLocalMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), newMsg] }));
        setInputText('');
    };

    const activeChat = FAKE_CHATS.find(c => c.id === activeId);
    const currentMessages = localMessages[activeId] || [];

    const isLight = theme === 'light';

    // ── Theme tokens ──
    const appBg = isLight ? 'bg-[#f0f2f5]' : 'bg-[#0b141a]';
    const sidebarBg = isLight ? 'bg-white border-[#d1d7db]' : 'bg-[#111b21] border-[#222d34]';
    const sidebarHeader = isLight ? 'bg-[#f0f2f5] text-[#54656f] border-[#d1d7db]' : 'bg-[#202c33] text-[#8696a0] border-[#222d34]';
    const searchBg = isLight ? 'bg-[#f0f2f5]' : 'bg-[#202c33]';
    const searchInput = isLight ? 'text-[#111b21]' : 'text-[#d1d7db]';
    const chatHover = isLight ? 'hover:bg-[#f5f6f6]' : 'hover:bg-[#202c33]';
    const chatActive = isLight ? 'bg-[#f0f2f5]' : 'bg-[#2a3942]';
    const chatBorder = isLight ? 'border-[#e9edef]' : 'border-[#222d34]';
    const primaryText = isLight ? 'text-[#111b21]' : 'text-[#e9edef]';
    const subText = isLight ? 'text-[#667781]' : 'text-[#8696a0]';
    const chatAreaBg = isLight ? 'bg-[#efeae2]' : 'bg-[#0b141a]';
    const chatHeader = isLight ? 'bg-[#f0f2f5] border-[#d1d7db] text-[#111b21]' : 'bg-[#202c33] border-[#222d34] text-[#e9edef]';
    const inputBarBg = isLight ? 'bg-[#f0f2f5]' : 'bg-[#202c33]';
    const inputFieldBg = isLight ? 'bg-white text-[#111b21]' : 'bg-[#2a3942] text-[#e9edef]';
    const myBubble = isLight ? 'bg-[#d9fdd3] text-[#111b21]' : 'bg-[#005c4b] text-[#e9edef]';
    const theirBubble = isLight ? 'bg-white text-[#111b21] shadow-sm' : 'bg-[#202c33] text-[#e9edef]';
    const profileBg = isLight ? 'bg-blue-600' : 'bg-blue-700';

    // Whether sidebar or chat is visible on "mobile" (narrow) view
    const showSidebar = activeId === null;

    return (
        <div className={`flex h-screen ${appBg} overflow-hidden transition-colors duration-200`}>

            {/* ── Left Sidebar ─────────────────────────────────────── */}
            <div className={`
                flex flex-col border-r relative transition-colors duration-200
                ${sidebarBg}
                /* Mobile: full screen when no chat selected, hidden otherwise */
                ${showSidebar ? 'flex w-full md:w-[30%] md:min-w-[320px]' : 'hidden md:flex md:w-[30%] md:min-w-[320px]'}
            `}>
                {/* Settings overlay */}
                {showSettings && (
                    <SettingsPanel
                        username={username}
                        theme={theme}
                        onThemeChange={handleThemeChange}
                        onClose={() => setShowSettings(false)}
                    />
                )}

                {/* ── App Branding Bar (Decoy shows neutral name) ─── */}
                <div className={`flex items-center gap-3 px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-[#1a2328] bg-[#0d1418]'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-blue-600' : 'bg-blue-700'} shadow`}>
                        {/* Decoy: generic bubble icon */}
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <p className={`text-sm font-extrabold tracking-[0.12em] uppercase ${isLight ? 'text-gray-900' : 'text-[#e9edef]'}`}>
                            Chat
                        </p>
                        <p className={`text-[9px] tracking-wider uppercase ${isLight ? 'text-gray-400' : 'text-[#4a5568]'}`}>
                            Messages
                        </p>
                    </div>
                </div>

                {/* Sidebar Header */}
                <div className={`h-[60px] px-4 flex justify-between items-center border-b ${sidebarHeader}`}>
                    <div
                        onClick={() => setShowSettings(true)}
                        className={`w-10 h-10 rounded-full ${profileBg} flex items-center justify-center font-bold text-white shadow cursor-pointer hover:opacity-80 transition`}
                        title="Settings"
                    >
                        {username ? username[0].toUpperCase() : 'J'}
                    </div>
                    <div className="flex gap-4">
                        <div className="cursor-pointer hover:opacity-70" onClick={() => setShowSettings(true)}>
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className={`p-2 border-b ${chatBorder}`}>
                    <div className={`${searchBg} rounded-lg px-4 py-1.5 text-sm flex items-center gap-3`}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill={isLight ? '#54656f' : '#8696a0'}><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.6-1.6A3.608 3.608 0 1 1 14.017 8.6 3.604 3.604 0 0 1 10.41 12.205z" /></svg>
                        <input type="text" placeholder="Search or start new chat" className={`bg-transparent outline-none w-full ${searchInput}`} />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {FAKE_CHATS.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveId(chat.id)}
                            className={`flex gap-3 items-center p-3 cursor-pointer transition ${activeId === chat.id ? chatActive : chatHover}`}
                        >
                            <div className={`w-12 h-12 rounded-full ${chat.avatar} flex-shrink-0 flex items-center justify-center font-bold text-lg text-white`}>
                                {chat.name[0]}
                            </div>
                            <div className={`flex-1 min-w-0 border-b ${chatBorder} pb-3`}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={`font-normal text-[17px] truncate ${primaryText}`}>{chat.name}</span>
                                    <span className={`text-xs flex-shrink-0 ml-2 ${subText}`}>{chat.time}</span>
                                </div>
                                <div className={`text-sm ${subText} truncate`}>{chat.lastMsg}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right Chat Area ───────────────────────────────────── */}
            <div className={`
                flex-1 flex flex-col relative
                ${chatAreaBg}
                ${!showSidebar ? 'flex w-full' : 'hidden md:flex'}
                transition-colors duration-200
            `}
                style={{
                    backgroundImage: isLight
                        ? "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png')"
                        : 'none',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'repeat',
                }}
            >
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className={`h-[60px] ${chatHeader} flex items-center justify-between px-4 border-l border-b shadow-sm z-10 transition-colors`}>
                            <div className="flex items-center gap-3">
                                {/* Back button - navigates back to list on mobile */}
                                <button
                                    onClick={() => setActiveId(null)}
                                    className={`md:hidden p-1 rounded-full ${isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-[#2a3942] text-[#8696a0]'} transition`}
                                    aria-label="Back"
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z" /></svg>
                                </button>
                                <div className={`w-10 h-10 rounded-full ${activeChat.avatar} flex-shrink-0 flex items-center justify-center font-bold text-white`}>
                                    {activeChat.name[0]}
                                </div>
                                <div>
                                    <h2 className={`font-normal text-base ${isLight ? 'text-[#111b21]' : 'text-[#e9edef]'}`}>{activeChat.name}</h2>
                                    <p className={`text-xs ${subText}`}>online</p>
                                </div>
                            </div>
                            <div className={`${subText} cursor-pointer hover:opacity-70`}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" /></svg>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-2">
                            {currentMessages.map((m, i) => (
                                <div key={i} className={`flex flex-col max-w-[75%] md:max-w-[65%] ${m.fromMe ? 'self-end' : 'self-start'}`}>
                                    <div className={`px-3 py-1.5 rounded-lg shadow-sm relative text-[15px] ${m.fromMe ? `${myBubble} rounded-tr-none` : `${theirBubble} rounded-tl-none`}`}>
                                        <span className="break-words mr-10">{m.text}</span>
                                        <div className="absolute right-2 bottom-1 flex items-center opacity-70">
                                            <span className={`text-[10px] whitespace-nowrap ${subText}`}>{m.time}</span>
                                            {m.fromMe && (
                                                <svg viewBox="0 0 18 18" width="14" height="14" fill={isLight ? '#53bdeb' : '#53bdeb'} className="ml-0.5"><path d="M17.394 5.035l-.57-.444a.434.434 0 0 0-.609.076L8.394 14.8l-4.069-3.278a.434.434 0 0 0-.609.076l-.445.57a.434.434 0 0 0 .076.609l4.329 3.499c.204.165.509.165.714.001l.285-.228.096.272c-.076.076.228.228.457.228l8.61-11.083a.434.434 0 0 0-.075-.61" /></svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Bar */}
                        <div className={`${inputBarBg} p-3 flex items-center gap-3 transition-colors`}>
                            <form onSubmit={handleSend} className={`flex-1 flex items-center ${inputFieldBg} rounded-lg px-4 py-2 shadow-sm`}>
                                <input
                                    type="text"
                                    placeholder="Type a message"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-[15px]"
                                />
                                <button type="submit" className={`${isLight ? 'text-[#54656f] hover:text-blue-600' : 'text-[#8696a0] hover:text-[#00a884]'} ml-2 transition-colors`}>
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" /></svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    /* Empty state on desktop when no chat selected */
                    <div className={`flex-1 hidden md:flex flex-col items-center justify-center ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>
                        <svg viewBox="0 0 303 172" width="200" height="114" fill="none" className="mb-6 opacity-30">
                            <path fill={isLight ? '#cbcbd4' : '#3d4b54'} d="M229.565 160.229c39.625-11.077 77.567-41.209 64.92-116.89C281.838 11.688 243.915.109 207.624 0c-79.35 0-136.908 42.62-145.286 107.091-8.379 64.472 37.026 93.346 82.43 89.342 30.065-2.662 47.025-15.956 47.025-15.956 12.394 8.655 44.677 18.017 37.772-20.248z" />
                        </svg>
                        <h2 className={`text-2xl font-light mb-2 ${isLight ? 'text-[#41525d]' : 'text-[#e9edef]'}`}>Select a chat</h2>
                        <p className="text-sm">Click a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DecoyLayout;
