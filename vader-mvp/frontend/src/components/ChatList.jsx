import React, { useState } from 'react';

const ChatList = ({ chats, activeChat, onSelectChat, onNewChat, theme }) => {
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatId, setNewChatId] = useState("");
    const [isGroup, setIsGroup] = useState(false);

    const handleCreate = (e) => {
        e.preventDefault();
        if (newChatId.trim()) {
            onNewChat(newChatId.trim(), isGroup);
            setNewChatId("");
            setShowNewChat(false);
            setIsGroup(false);
        }
    };

    const isLight = theme === 'light';

    // Theme Variables
    const panelBg = isLight ? 'bg-gray-100' : 'bg-[#111b21]';
    const actionBarBg = isLight ? 'bg-white' : 'bg-[#202c33]';
    const inputBg = isLight ? 'bg-gray-100 text-gray-900 border border-gray-300' : 'bg-[#2a3942] text-[#d1d7db] font-normal';
    const primaryText = isLight ? 'text-gray-900' : 'text-[#e9edef]';
    const secondaryText = isLight ? 'text-gray-500' : 'text-[#8696a0]';
    const hoverBg = isLight ? 'hover:bg-gray-200' : 'hover:bg-[#202c33]';
    const activeBg = isLight ? 'bg-blue-50' : 'bg-[#2a3942]';
    const borderCol = isLight ? 'border-gray-200' : 'border-[#222d34]';
    const btnPrimary = isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#00a884] text-[#111b21] hover:bg-[#00c59b]';
    const btnSecondary = isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-[#2a3942] text-[#d1d7db] hover:bg-[#32454f]';
    const groupIcon = isLight ? 'bg-blue-100 text-blue-800' : 'bg-[#00a884] text-[#111b21]';
    const userIcon = isLight ? 'bg-gray-300 text-gray-700' : 'bg-[#6a7175] text-[#e9edef]';

    return (
        <div className={`flex-1 flex flex-col overflow-hidden ${panelBg}`}>
            {/* Action Bar */}
            <div className={`p-2 border-b ${borderCol} flex gap-2 justify-center`}>
                {!showNewChat ? (
                    <button
                        onClick={() => setShowNewChat(true)}
                        className={`w-full py-2 rounded text-sm font-medium transition ${isLight ? 'bg-white border text-blue-600 shadow-sm hover:bg-blue-50' : 'bg-[#202c33] hover:bg-[#2a3942] text-[#00a884]'}`}
                    >
                        + New Secure Connection
                    </button>
                ) : (
                    <form onSubmit={handleCreate} className={`flex flex-col gap-2 w-full p-2 rounded shadow-sm ${actionBarBg}`}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Target User ID / Hash"
                            value={newChatId}
                            onChange={(e) => setNewChatId(e.target.value)}
                            className={`p-2 rounded text-sm outline-none focus:ring-1 ${inputBg} ${isLight ? 'focus:ring-blue-500' : 'focus:ring-[#00a884]'}`}
                        />
                        <div className={`flex items-center gap-2 text-xs px-1 ${secondaryText}`}>
                            <input
                                type="checkbox"
                                checked={isGroup}
                                onChange={(e) => setIsGroup(e.target.checked)}
                                id="isGroupToggle"
                            />
                            <label htmlFor="isGroupToggle">Initialize as Group Chat</label>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <button type="submit" className={`flex-1 py-1 rounded font-bold text-sm ${btnPrimary}`}>Connect</button>
                            <button type="button" onClick={() => setShowNewChat(false)} className={`flex-1 py-1 rounded text-sm ${btnSecondary}`}>Cancel</button>
                        </div>
                    </form>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chats.length === 0 && !showNewChat && (
                    <div className={`p-8 text-center text-sm ${secondaryText}`}>
                        No active connections. Start a new secure relay.
                    </div>
                )}
                {chats.map(chat => {
                    const isActive = activeChat?.id === chat.id;
                    return (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat)}
                            className={`flex gap-3 items-center p-3 cursor-pointer transition ${isActive ? activeBg : hoverBg}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                         ${chat.isGroup ? groupIcon : userIcon}
                     `}>
                                {chat.isGroup ? 'G' : chat.id[0].toUpperCase()}
                            </div>
                            <div className={`flex-1 overflow-hidden border-b pb-3 ${borderCol}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-medium truncate ${primaryText}`}>{chat.id}</span>
                                </div>
                                <div className={`text-sm truncate ${secondaryText}`}>
                                    {chat.lastMessage || "Secure connection established."}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatList;
