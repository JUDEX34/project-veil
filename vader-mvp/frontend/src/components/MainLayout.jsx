import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ActiveChat from './ActiveChat';
import SettingsPanel from './SettingsPanel';

const MainLayout = ({ username }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [chats, setChats] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const stored = localStorage.getItem("vader_recent_chats");
        if (stored) {
            try { setChats(JSON.parse(stored)); } catch (e) { console.error(e); }
        }
        const storedTheme = localStorage.getItem("vader_theme");
        if (storedTheme) setTheme(storedTheme);
    }, []);

    const saveChats = (newChats) => {
        setChats(newChats);
        localStorage.setItem("vader_recent_chats", JSON.stringify(newChats));
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem("vader_theme", newTheme);
    };

    const handleStartNewChat = (contactId, isGroup = false) => {
        if (!contactId) return;
        const existing = chats.find(c => c.id === contactId);
        if (!existing) {
            const newChat = { id: contactId, isGroup, lastMessage: "" };
            const updated = [newChat, ...chats];
            saveChats(updated);
            setActiveChat(newChat);
        } else {
            setActiveChat(existing);
        }
    };

    const updateLastMessage = (chatId, text) => {
        saveChats(chats.map(c => c.id === chatId ? { ...c, lastMessage: text } : c));
    };

    const isLight = theme === 'light';
    const sidebarBg = isLight ? 'bg-white border-gray-200' : 'bg-[#111b21] border-[#222d34]';
    const sidebarHdr = isLight ? 'bg-gray-50 text-gray-800' : 'bg-[#202c33] text-[#d1d7db]';
    const mainBg = isLight ? 'bg-[#efeae2]' : 'bg-[#0b141a]';
    const emptyBg = isLight ? 'text-gray-500' : 'text-[#8696a0]';
    const fontColor = isLight ? 'text-gray-900' : 'text-[#e9edef]';

    return (
        <div className={`h-screen w-screen flex overflow-hidden ${mainBg} ${fontColor} transition-colors duration-200`}>

            {/* ── Sidebar ─────────────────────────────────────────── */}
            {/* On mobile: show sidebar when no chat open; on desktop always show */}
            <div className={`
        flex-shrink-0 flex flex-col border-r relative transition-colors duration-200
        ${sidebarBg}
        w-full md:w-[340px]
        ${activeChat ? 'hidden md:flex' : 'flex'}
      `}>
                {showSettings && (
                    <SettingsPanel
                        username={username}
                        theme={theme}
                        onThemeChange={handleThemeChange}
                        onClose={() => setShowSettings(false)}
                    />
                )}

                {/* ── App Branding Bar ─── */}
                <div className={`flex items-center gap-3 px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-[#1a2328] bg-[#0d1418]'}`}>
                    {/* Logo placeholder — swap src with real logo when ready */}
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-800 shadow`}
                        title="VADER — replace with logo"
                    >
                        {/* Shield icon as placeholder */}
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                        </svg>
                    </div>
                    <div>
                        <p className={`text-sm font-extrabold tracking-[0.15em] uppercase ${isLight ? 'text-gray-900' : 'text-[#e9edef]'}`}>
                            VADER
                        </p>
                        <p className={`text-[9px] tracking-wider uppercase ${isLight ? 'text-gray-400' : 'text-[#4a5568]'}`}>
                            E2EE · Zero Trust
                        </p>
                    </div>
                </div>

                <div className={`px-4 py-3 flex justify-between items-center border-b ${sidebarHdr} ${isLight ? 'border-gray-200' : 'border-[#222d34]'}`}>
                    <div className="flex items-center gap-3">
                        <div
                            onClick={() => setShowSettings(true)}
                            className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center font-bold text-white shadow-md cursor-pointer hover:opacity-80 transition"
                            title="Settings"
                        >
                            {username ? username[0].toUpperCase() : 'V'}
                        </div>
                        <span className="font-semibold text-base tracking-wide">{username}</span>
                    </div>
                    <button onClick={() => setShowSettings(true)} className="hover:opacity-70 transition p-1 rounded-full">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
                        </svg>
                    </button>
                </div>

                <ChatList
                    chats={chats}
                    activeChat={activeChat}
                    onSelectChat={setActiveChat}
                    onNewChat={handleStartNewChat}
                    theme={theme}
                />
            </div>

            {/* ── Main Chat Area ──────────────────────────────────── */}
            {/* On mobile: show chat area when a chat is open; on desktop always show */}
            <div className={`
        flex-1 flex flex-col min-w-0 transition-colors duration-200
        ${mainBg}
        ${activeChat ? 'flex' : 'hidden md:flex'}
      `}>
                {activeChat ? (
                    <ActiveChat
                        myUsername={username}
                        chat={activeChat}
                        onMessageSent={(txt) => updateLastMessage(activeChat.id, txt)}
                        onBack={() => setActiveChat(null)}
                        theme={theme}
                    />
                ) : (
                    <div className={`flex-1 flex flex-col items-center justify-center ${emptyBg}`}>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isLight ? 'bg-gray-100' : 'bg-[#202c33]'}`}>
                            <svg viewBox="0 0 303 172" width="64" height="40" fill="none">
                                <path fill={isLight ? '#d1d5db' : '#3d4b54'} d="M229.565 160.229c39.625-11.077 77.567-41.209 64.92-116.89C281.838 11.688 243.915.109 207.624 0c-79.35 0-136.908 42.62-145.286 107.091-8.379 64.472 37.026 93.346 82.43 89.342 30.065-2.662 47.025-15.956 47.025-15.956 12.394 8.655 44.677 18.017 37.772-20.248z" />
                            </svg>
                        </div>
                        <h1 className={`text-2xl font-light mb-3 ${isLight ? 'text-gray-700' : 'text-[#e9edef]'}`}>Vader E2EE</h1>
                        <p className="text-sm max-w-xs text-center opacity-70 leading-relaxed">
                            Select a conversation or start a new secure relay from the sidebar.
                        </p>
                        <div className={`mt-8 flex items-center gap-2 px-4 py-2 rounded-full text-xs ${isLight ? 'bg-gray-100 text-gray-500' : 'bg-[#202c33] text-[#8696a0]'}`}>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            End-to-end encrypted
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainLayout;
