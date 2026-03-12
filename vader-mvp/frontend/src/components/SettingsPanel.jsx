import React, { useState, useEffect } from 'react';

/* ─── small reusable row components ────────────────────────────────────────── */

const SettingRow = ({ icon, label, sublabel, children, onClick, isLight }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${onClick ? 'cursor-pointer' : ''}
      ${isLight ? 'hover:bg-gray-50' : 'hover:bg-[#1d282f]'}`}
    >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
      ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-[#2a3942] text-[#8696a0]'}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-[#e9edef]'}`}>{label}</p>
            {sublabel && <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-[#8696a0]'}`}>{sublabel}</p>}
        </div>
        {children}
    </div>
);

const Toggle = ({ value, onChange, accent }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onChange(!value); }}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
      ${value ? accent : 'bg-gray-300'}`}
    >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
      ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
);

const SectionHeader = ({ label, isLight }) => (
    <p className={`px-5 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wider
    ${isLight ? 'text-blue-600' : 'text-[#00a884]'}`}>
        {label}
    </p>
);

const Divider = ({ isLight }) => (
    <div className={`h-px mx-5 ${isLight ? 'bg-gray-100' : 'bg-[#222d34]'}`} />
);

/* ─── main component ────────────────────────────────────────────────────────── */

const SettingsPanel = ({ username, theme, onThemeChange, onClose }) => {
    const isLight = theme === 'light';
    const accent = isLight ? 'bg-blue-600' : 'bg-[#00a884]';
    const accentText = isLight ? 'text-blue-600' : 'text-[#00a884]';
    const panelBg = isLight ? 'bg-white' : 'bg-[#111b21]';
    const headerBg = isLight ? 'bg-blue-600' : 'bg-[#202c33]';
    const subText = isLight ? 'text-gray-500' : 'text-[#8696a0]';

    // ── Persisted settings ──────────────────────────────────────────
    const [soundNotifs, setSoundNotifs] = useState(() =>
        JSON.parse(localStorage.getItem('v_sound') ?? 'true'));
    const [msgPreview, setMsgPreview] = useState(() =>
        JSON.parse(localStorage.getItem('v_preview') ?? 'true'));
    const [screenshotBlock, setScreenshotBlock] = useState(() =>
        JSON.parse(localStorage.getItem('v_screenshot_block') ?? 'false'));
    const [autoLock, setAutoLock] = useState(() =>
        localStorage.getItem('v_autolock') ?? '5');
    const [msgTTL, setMsgTTL] = useState(() =>
        localStorage.getItem('v_msg_ttl') ?? '120');
    const [ghostTarget, setGhostTarget] = useState(() =>
        localStorage.getItem('v_ghost_target') ?? 'https://www.google.com/search?q=tcp+ip+networking+basics');

    // persist on change
    useEffect(() => { localStorage.setItem('v_sound', JSON.stringify(soundNotifs)); }, [soundNotifs]);
    useEffect(() => { localStorage.setItem('v_preview', JSON.stringify(msgPreview)); }, [msgPreview]);
    useEffect(() => { localStorage.setItem('v_screenshot_block', JSON.stringify(screenshotBlock)); }, [screenshotBlock]);
    useEffect(() => { localStorage.setItem('v_autolock', autoLock); }, [autoLock]);
    useEffect(() => { localStorage.setItem('v_msg_ttl', msgTTL); }, [msgTTL]);
    useEffect(() => { localStorage.setItem('v_ghost_target', ghostTarget); }, [ghostTarget]);

    const handleLogout = () => window.location.reload();

    const Select = ({ value, onChange, options }) => (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            onClick={e => e.stopPropagation()}
            className={`text-xs rounded-md px-2 py-1 border outline-none cursor-pointer
        ${isLight
                    ? 'bg-white border-gray-200 text-gray-700'
                    : 'bg-[#2a3942] border-[#3d5160] text-[#d1d7db]'}`}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );

    return (
        <div className={`absolute inset-0 ${panelBg} flex flex-col z-50 overflow-hidden`}>

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`${headerBg} pt-8 pb-5 px-5`}>
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onClose} className="text-white opacity-80 hover:opacity-100 transition">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z" />
                        </svg>
                    </button>
                    <h2 className="text-white font-semibold text-lg">Settings</h2>
                </div>

                {/* Profile card in header */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-800 border-2 border-white/30 flex items-center justify-center font-bold text-white text-2xl shadow">
                        {username ? username[0].toUpperCase() : 'V'}
                    </div>
                    <div>
                        <p className="text-white font-semibold text-base">{username}</p>
                        <p className="text-white/50 text-[11px] font-mono mt-0.5 tracking-wide">
                            {localStorage.getItem('vader_id') || 'vdr_??????'}
                        </p>
                        <p className="text-white/40 text-[9px] mt-0.5">Zero-Trust Identity</p>
                    </div>
                </div>
            </div>

            {/* ── Scrollable body ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

                {/* Appearance */}
                <SectionHeader label="Appearance" isLight={isLight} />
                <div className={`mx-4 rounded-xl overflow-hidden border ${isLight ? 'border-gray-100' : 'border-[#1d282f]'}`}>
                    <SettingRow
                        icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1 0-16z" /></svg>}
                        label="Theme"
                        sublabel={isLight ? 'Light mode active' : 'Dark mode active'}
                        isLight={isLight}
                    >
                        <div className="flex gap-2">
                            {['light', 'dark'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => onThemeChange(t)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition border
                    ${theme === t
                                            ? `${accent} text-white border-transparent`
                                            : `${isLight ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-[#3d5160] text-[#8696a0] hover:bg-[#2a3942]'}`}`}
                                >
                                    {t[0].toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                </div>

                {/* Notifications */}
                <SectionHeader label="Notifications" isLight={isLight} />
                <div className={`mx-4 rounded-xl overflow-hidden border ${isLight ? 'border-gray-100' : 'border-[#1d282f]'}`}>
                    <SettingRow
                        icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>}
                        label="Sound & Alerts"
                        sublabel={soundNotifs ? 'Enabled' : 'Silenced'}
                        isLight={isLight}
                    >
                        <Toggle value={soundNotifs} onChange={setSoundNotifs} accent={accent} />
                    </SettingRow>
                    <Divider isLight={isLight} />
                    <SettingRow
                        icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>}
                        label="Message Previews"
                        sublabel={msgPreview ? 'Shown in notifications' : 'Hidden for privacy'}
                        isLight={isLight}
                    >
                        <Toggle value={msgPreview} onChange={setMsgPreview} accent={accent} />
                    </SettingRow>
                </div>

                {/* Security */}
                <SectionHeader label="Security" isLight={isLight} />
                <div className={`mx-4 rounded-xl overflow-hidden border ${isLight ? 'border-gray-100' : 'border-[#1d282f]'}`}>
                    <SettingRow
                        icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>}
                        label="Auto-Lock Vault"
                        sublabel="Lock after inactivity"
                        isLight={isLight}
                    >
                        <Select
                            value={autoLock}
                            onChange={setAutoLock}
                            options={[
                                { value: '1', label: '1 min' },
                                { value: '5', label: '5 min' },
                                { value: '15', label: '15 min' },
                                { value: '30', label: '30 min' },
                                { value: '0', label: 'Never' },
                            ]}
                        />
                    </SettingRow>
                    <Divider isLight={isLight} />
                    <SettingRow
                        icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>}
                        label="Screenshot Shield"
                        sublabel={screenshotBlock ? 'Screen capture blocked' : 'Screen capture allowed'}
                        isLight={isLight}
                    >
                        <Toggle value={screenshotBlock} onChange={setScreenshotBlock} accent={accent} />
                    </SettingRow>
                    <Divider isLight={isLight} />
                    <SettingRow
                        icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" /></svg>}
                        label="Message Expiry"
                        sublabel="Auto-delete relay messages after"
                        isLight={isLight}
                    >
                        <Select
                            value={msgTTL}
                            onChange={setMsgTTL}
                            options={[
                                { value: '30', label: '30 sec' },
                                { value: '60', label: '1 min' },
                                { value: '120', label: '2 min' },
                                { value: '300', label: '5 min' },
                                { value: '600', label: '10 min' },
                            ]}
                        />
                    </SettingRow>
                </div>

                {/* Ghost Protocol */}
                <SectionHeader label="Ghost Protocol" isLight={isLight} />
                <div className={`mx-4 rounded-xl overflow-hidden border ${isLight ? 'border-gray-100' : 'border-[#1d282f]'}`}>
                    <div className="px-5 py-3.5">
                        <p className={`text-sm font-medium mb-1.5 ${isLight ? 'text-gray-900' : 'text-[#e9edef]'}`}>
                            Boss Key Redirect (Alt+Shift+S)
                        </p>
                        <p className={`text-xs mb-2 ${subText}`}>Where to redirect if Boss Key is triggered</p>
                        <input
                            type="url"
                            value={ghostTarget}
                            onChange={e => setGhostTarget(e.target.value)}
                            placeholder="https://..."
                            className={`w-full text-xs rounded-lg px-3 py-2 outline-none border transition
                ${isLight
                                    ? 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400'
                                    : 'bg-[#2a3942] border-[#3d5160] text-[#d1d7db] focus:border-[#00a884]'}`}
                        />
                    </div>
                </div>

                {/* Danger Zone */}
                <SectionHeader label="Account" isLight={isLight} />
                <div className={`mx-4 rounded-xl overflow-hidden border border-red-500/20`}>
                    <SettingRow
                        icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-red-500"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3H9c-1.1 0-2 .9-2 2v3h2V5h11v14H9v-3H7v3c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" /></svg>}
                        label="Log Out"
                        sublabel="Lock vault and return to login screen"
                        isLight={isLight}
                        onClick={handleLogout}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={`${isLight ? 'text-gray-300' : 'text-[#3d5160]'}`}>
                            <path d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                        </svg>
                    </SettingRow>
                </div>

                <div className="h-8" />
            </div>
        </div>
    );
};

export default SettingsPanel;
