import React, { useState, useEffect } from 'react';

// ── Generates a short unique Vader ID like "vdr_x8k2p" ──────────────────────
const generateVaderID = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // removed lookalikes
    let id = 'vdr_';
    for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
};

// ── Hidden honeypot inputs: absorb browser autofill away from real fields ───
const HoneypotTrap = () => (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
        <input type="text" name="username" tabIndex={-1} autoComplete="username" />
        <input type="password" name="password" tabIndex={-1} autoComplete="current-password" />
    </div>
);

// ── Clean input field ───────────────────────────────────────────────────────
const Field = ({ label, labelColor = 'text-gray-400', hint, type = 'text',
    placeholder, value, onChange, maxLength, autoFocus, name }) => (
    <div>
        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${labelColor}`}>{label}</label>
        {hint && <p className="text-[10px] text-gray-600 mb-1.5 leading-snug">{hint}</p>}
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            autoFocus={autoFocus}
            autoComplete="new-password"
            spellCheck="false"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            className="w-full px-3 py-2.5 bg-gray-800/70 rounded-lg border border-gray-700
                       text-white placeholder-gray-600 text-sm outline-none
                       focus:border-red-500/70 focus:bg-gray-800 transition-all duration-150"
        />
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const AuthScreen = ({ onAuthSuccess }) => {
    const [screen, setScreen] = useState('loading'); // 'loading' | 'login' | 'signup' | 'created'
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPin, setLoginPin] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);

    const [regUsername, setRegUsername] = useState('');
    const [regPin, setRegPin] = useState('');
    const [regDuressPin, setRegDuressPin] = useState('');
    const [createdID, setCreatedID] = useState('');

    // Determine initial screen
    useEffect(() => {
        const existingPin = localStorage.getItem('vader_pin');
        setScreen(existingPin ? 'login' : 'signup');
    }, []);

    // ── Signup ───────────────────────────────────────────────────────────────
    const handleSignup = (e) => {
        e.preventDefault();
        if (!regUsername.trim()) { alert('Display name is required.'); return; }
        if (regPin.length < 4) { alert('Primary PIN must be at least 4 digits.'); return; }
        if (regDuressPin.length < 4) { alert('Duress PIN must be at least 4 digits.'); return; }
        if (regPin === regDuressPin) { alert('Main PIN and Duress PIN cannot be the same.'); return; }

        const vaderID = generateVaderID();

        localStorage.setItem('vader_username', regUsername.trim());
        localStorage.setItem('vader_id', vaderID);
        localStorage.setItem('vader_pin', regPin);
        localStorage.setItem('vader_duress_pin', regDuressPin);

        setCreatedID(vaderID);
        setScreen('created');
    };

    // ── Post-signup confirmation ─────────────────────────────────────────────
    const handleEnterVault = () => {
        onAuthSuccess('AUTHENTICATED_REAL', regUsername.trim());
    };

    // ── Login ────────────────────────────────────────────────────────────────
    const handleLogin = (e) => {
        e.preventDefault();
        const storedPin = localStorage.getItem('vader_pin');
        const storedDuress = localStorage.getItem('vader_duress_pin');
        const storedUser = localStorage.getItem('vader_username') || 'Anonymous';
        const storedID = localStorage.getItem('vader_id') || '';

        // Must match stored username (case-insensitive) AND PIN
        if (loginUsername.trim().toLowerCase() !== storedUser.toLowerCase()) {
            const newFails = failedAttempts + 1;
            setFailedAttempts(newFails);
            if (newFails >= 5) wipeLocalData();
            return;
        }

        if (loginPin === storedPin) {
            setFailedAttempts(0);
            onAuthSuccess('AUTHENTICATED_REAL', storedUser);
        } else if (loginPin === storedDuress) {
            setFailedAttempts(0);
            onAuthSuccess('AUTHENTICATED_DECOY', storedUser);
        } else {
            const newFails = failedAttempts + 1;
            setFailedAttempts(newFails);
            if (newFails >= 5) wipeLocalData();
        }
    };

    const wipeLocalData = () => {
        localStorage.clear();
        alert('FATAL: Max attempts reached. Local vault destroyed.');
        window.location.reload();
    };

    const handleCreateNewAccount = () => {
        if (window.confirm('Warning: This will permanently destroy the current vault on this device. Proceed?')) {
            localStorage.clear();
            setRegUsername(''); setRegPin(''); setRegDuressPin('');
            setLoginUsername(''); setLoginPin('');
            setFailedAttempts(0);
            setScreen('signup');
        }
    };

    // ── Shared wrapper ────────────────────────────────────────────────────────
    const Wrapper = ({ children }) => (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-white px-4"
            style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(180,0,0,0.08) 0%, transparent 60%)' }}>
            {/* Logo + name */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                </div>
                <span className="text-2xl font-extrabold tracking-[0.2em] text-white">VADER</span>
            </div>
            {children}
        </div>
    );

    // ── Loading ───────────────────────────────────────────────────────────────
    if (screen === 'loading') return <Wrapper><div className="text-gray-600 text-sm">Initializing…</div></Wrapper>;

    // ── Signup screen ─────────────────────────────────────────────────────────
    if (screen === 'signup') return (
        <Wrapper>
            <p className="text-gray-500 text-xs tracking-widest uppercase mb-6">New Identity</p>

            <form onSubmit={handleSignup} autoComplete="off"
                className="flex flex-col gap-4 w-full max-w-sm bg-gray-900/60 backdrop-blur p-7 rounded-2xl border border-gray-800/80 shadow-2xl">

                <Field label="Display Name" placeholder="Your name" value={regUsername}
                    onChange={e => setRegUsername(e.target.value)} autoFocus />

                <div className="h-px bg-gray-800" />

                <Field label="Primary PIN" labelColor="text-green-500/80"
                    hint="6–8 digits recommended. Used for normal access."
                    type="password" placeholder="••••••••"
                    value={regPin} onChange={e => setRegPin(e.target.value)} maxLength={8} />

                <Field label="Duress PIN" labelColor="text-red-500/80"
                    hint="If forced to unlock, enter this to open a decoy account."
                    type="password" placeholder="••••••••"
                    value={regDuressPin} onChange={e => setRegDuressPin(e.target.value)} maxLength={8} />

                <button type="submit"
                    className="mt-2 w-full py-3 bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-red-900/30">
                    Initialize Vault
                </button>
            </form>
        </Wrapper>
    );

    // ── Created confirmation screen ───────────────────────────────────────────
    if (screen === 'created') return (
        <Wrapper>
            <div className="w-full max-w-sm bg-gray-900/60 backdrop-blur p-8 rounded-2xl border border-gray-800/80 shadow-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-green-900/40 border border-green-700/40 flex items-center justify-center mx-auto mb-5">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" className="text-green-400">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold mb-1">Vault Initialized</h3>
                <p className="text-gray-500 text-sm mb-6">Your identity is secured on this device.</p>

                {/* Generated ID badge */}
                <div className="bg-gray-800/70 rounded-xl px-5 py-4 mb-6 border border-gray-700/60">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Your Vader ID</p>
                    <p className="text-xl font-mono font-bold text-red-400 tracking-wider">{createdID}</p>
                    <p className="text-[10px] text-gray-600 mt-2 leading-snug">
                        Share this ID with others so they can reach you. It never changes.
                    </p>
                </div>

                <div className="bg-gray-800/40 rounded-xl px-4 py-3 mb-6 text-left border border-gray-800/60">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Display Name</p>
                    <p className="text-sm font-medium">{regUsername}</p>
                </div>

                <button onClick={handleEnterVault}
                    className="w-full py-3 bg-red-700 hover:bg-red-600 rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-red-900/30">
                    Enter Vault →
                </button>
            </div>
        </Wrapper>
    );

    // ── Login screen ──────────────────────────────────────────────────────────
    const storedUser = localStorage.getItem('vader_username') || '';
    const storedID = localStorage.getItem('vader_id') || '';

    return (
        <Wrapper>
            <p className="text-gray-500 text-xs tracking-widest uppercase mb-6">Unlock Vault</p>

            <form onSubmit={handleLogin} autoComplete="off"
                className="flex flex-col gap-4 w-full max-w-sm bg-gray-900/60 backdrop-blur p-7 rounded-2xl border border-gray-800/80 shadow-2xl">

                {/* Vault owner hint */}
                {storedID && (
                    <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700/50">
                        <div className="w-9 h-9 rounded-full bg-red-900 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                            {storedUser[0]?.toUpperCase() || 'V'}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{storedUser}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{storedID}</p>
                        </div>
                    </div>
                )}

                <Field label="Username" placeholder="Enter your display name"
                    value={loginUsername} onChange={e => setLoginUsername(e.target.value)} autoFocus />

                <Field label="PIN" type="password" placeholder="Enter passcode"
                    value={loginPin} onChange={e => setLoginPin(e.target.value)} maxLength={8} />

                <button type="submit"
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 rounded-xl font-bold text-sm tracking-wide transition mt-1">
                    Unlock
                </button>
            </form>

            {/* Attempt counter */}
            {failedAttempts > 0 && (
                <div className="mt-5 text-center">
                    <p className="text-red-500 text-sm font-mono">
                        {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? 's' : ''} remaining
                    </p>
                    <p className="text-gray-700 text-[10px] mt-1 max-w-xs">
                        Vault will be permanently destroyed on zero attempts.
                    </p>
                </div>
            )}

            <button onClick={handleCreateNewAccount}
                className="mt-8 text-gray-700 text-xs hover:text-red-500 transition">
                Wipe Vault &amp; Create New Identity
            </button>
        </Wrapper>
    );
};

export default AuthScreen;
