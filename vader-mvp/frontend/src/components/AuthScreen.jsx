import React, { useState, useEffect, useCallback } from 'react';

// ── Generates a short unique Vader ID like "vdr_x8k2p" ──────────────────────
const generateVaderID = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let id = 'vdr_';
    for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
};

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 3 * 60 * 60 * 1000; // 3 hours

// ── Hidden honeypot inputs ───────────────────────────────────────────────────
const HoneypotTrap = () => (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
        <input type="text" name="username" tabIndex={-1} autoComplete="username" />
        <input type="password" name="password" tabIndex={-1} autoComplete="current-password" />
    </div>
);

// ── Clean input field ────────────────────────────────────────────────────────
const Field = ({ id, label, labelColor = 'text-gray-400', hint, type = 'text',
    placeholder, value, onChange, maxLength, autoFocus, name, disabled }) => (
    <div>
        <label htmlFor={id} className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${labelColor}`}>{label}</label>
        {hint && <p className="text-[10px] text-gray-600 mb-1.5 leading-snug">{hint}</p>}
        <input
            id={id}
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            autoFocus={autoFocus}
            disabled={disabled}
            autoComplete="new-password"
            spellCheck="false"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            className={`w-full px-3 py-2.5 bg-gray-800/70 rounded-lg border border-gray-700
                       text-white placeholder-gray-600 text-sm outline-none
                       focus:border-red-500/70 focus:bg-gray-800 transition-all duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed`}
        />
    </div>
);

// ── Shared wrapper (defined outside component for stable identity) ────────────
const AuthWrapper = ({ children }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-white px-4"
        style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(180,0,0,0.08) 0%, transparent 60%)' }}>
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

// ── Format ms remaining as HH:MM:SS ─────────────────────────────────────────
const formatCountdown = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

// ── Main component ──────────────────────────────────────────────────────────
const AuthScreen = ({ onAuthSuccess }) => {
    const [screen, setScreen] = useState('loading');
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPin, setLoginPin] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null); // unix ms timestamp
    const [countdown, setCountdown] = useState('');
    const [isSecondRound, setIsSecondRound] = useState(false); // true = after first lockout expired

    const [regUsername, setRegUsername] = useState('');
    const [regPin, setRegPin] = useState('');
    const [regDuressPin, setRegDuressPin] = useState('');
    const [createdID, setCreatedID] = useState('');

    // ── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const existingPin = localStorage.getItem('vader_pin');
        const storedLockout = localStorage.getItem('vader_lockout_until');
        const storedRound = localStorage.getItem('vader_lockout_round');

        if (storedLockout) {
            const until = parseInt(storedLockout, 10);
            if (until > Date.now()) {
                setLockoutUntil(until);
                setIsSecondRound(storedRound === '2');
                setScreen('login');
                return;
            } else {
                // Lockout expired — move to second round if not already
                if (storedRound !== '2') {
                    localStorage.setItem('vader_lockout_round', '2');
                    setIsSecondRound(true);
                }
                localStorage.removeItem('vader_lockout_until');
            }
        }

        setScreen(existingPin ? 'login' : 'signup');
    }, []);

    // ── Live countdown ticker ─────────────────────────────────────────────────
    useEffect(() => {
        if (!lockoutUntil) return;
        const tick = () => {
            const remaining = lockoutUntil - Date.now();
            if (remaining <= 0) {
                setLockoutUntil(null);
                setCountdown('');
                // After first lockout ends, enter second round
                if (!isSecondRound) {
                    localStorage.setItem('vader_lockout_round', '2');
                    setIsSecondRound(true);
                }
                localStorage.removeItem('vader_lockout_until');
                setFailedAttempts(0);
            } else {
                setCountdown(formatCountdown(remaining));
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [lockoutUntil, isSecondRound]);

    // ── Trigger lockout (first round) ────────────────────────────────────────
    const triggerLockout = useCallback(async () => {
        const until = Date.now() + LOCKOUT_MS;
        localStorage.setItem('vader_lockout_until', String(until));
        localStorage.setItem('vader_lockout_round', '1');
        setLockoutUntil(until);
        setIsSecondRound(false);
        setFailedAttempts(0);

        // Notify backend (best-effort)
        const vaderID = localStorage.getItem('vader_id');
        if (vaderID) {
            try {
                await fetch(`${BACKEND}/account/lockout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vader_id: vaderID }),
                });
            } catch (_) { /* backend may not be running */ }
        }
    }, []);

    // ── Wipe everything (second round exhausted) ─────────────────────────────
    const wipeAccount = useCallback(async () => {
        const vaderID = localStorage.getItem('vader_id');
        if (vaderID) {
            try {
                await fetch(`${BACKEND}/account/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vader_id: vaderID }),
                });
            } catch (_) { /* backend may not be running */ }
        }
        localStorage.clear();
        alert('Account permanently destroyed: too many failed attempts.');
        window.location.reload();
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

    const handleEnterVault = () => {
        onAuthSuccess('AUTHENTICATED_REAL', regUsername.trim());
    };

    // ── Login ────────────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        if (lockoutUntil) return; // locked — do nothing

        const storedPin    = localStorage.getItem('vader_pin');
        const storedDuress = localStorage.getItem('vader_duress_pin');
        const storedUser   = localStorage.getItem('vader_username') || 'Anonymous';

        // Wrong username → silent fail, no attempt counting
        if (loginUsername.trim().toLowerCase() !== storedUser.toLowerCase()) {
            return;
        }

        // Correct username — check PIN
        if (loginPin === storedPin) {
            localStorage.removeItem('vader_lockout_until');
            localStorage.removeItem('vader_lockout_round');
            setFailedAttempts(0);
            onAuthSuccess('AUTHENTICATED_REAL', storedUser);
        } else if (loginPin === storedDuress) {
            localStorage.removeItem('vader_lockout_until');
            localStorage.removeItem('vader_lockout_round');
            setFailedAttempts(0);
            onAuthSuccess('AUTHENTICATED_DECOY', storedUser);
        } else {
            const newFails = failedAttempts + 1;
            setFailedAttempts(newFails);
            setLoginPin('');

            if (newFails >= MAX_ATTEMPTS) {
                if (isSecondRound) {
                    // Second round exhausted → delete account
                    await wipeAccount();
                } else {
                    // First round exhausted → 3-hour lockout
                    await triggerLockout();
                }
            }
        }
    };

    const handleGoToSignup = () => setScreen('signup');

    // ── Loading ───────────────────────────────────────────────────────────────
    if (screen === 'loading') return (
        <AuthWrapper>
            <div className="text-gray-600 text-sm">Initializing…</div>
        </AuthWrapper>
    );

    // ── Signup screen ─────────────────────────────────────────────────────────
    if (screen === 'signup') return (
        <AuthWrapper>
            <p className="text-gray-500 text-xs tracking-widest uppercase mb-6">New Identity</p>

            <form onSubmit={handleSignup} autoComplete="off"
                className="relative flex flex-col gap-5 w-full max-w-sm bg-gray-900/60 backdrop-blur p-7 rounded-2xl border border-gray-800/80 shadow-2xl">

                <HoneypotTrap />

                {/* Display Name */}
                <div>
                    <label htmlFor="su-name" className="text-[11px] font-bold uppercase tracking-wider block mb-1.5 text-gray-400">
                        Display Name
                    </label>
                    <input
                        id="su-name"
                        type="text"
                        name="vader-display-name"
                        placeholder="Your name"
                        value={regUsername}
                        onChange={e => setRegUsername(e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        className="w-full px-3 py-2.5 bg-gray-800/70 rounded-lg border border-gray-700 text-white placeholder-gray-600 text-sm outline-none focus:border-red-500/70 focus:bg-gray-800 transition-all"
                    />
                </div>

                <div className="h-px bg-gray-800" />

                {/* Primary PIN */}
                <div>
                    <label htmlFor="su-pin" className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-green-500/80">
                        Primary PIN
                    </label>
                    <p className="text-[10px] text-gray-600 mb-1.5">6–8 digits recommended. Used for normal access.</p>
                    <input
                        id="su-pin"
                        type="password"
                        name="vader-primary-pin"
                        placeholder="••••••••"
                        value={regPin}
                        onChange={e => setRegPin(e.target.value)}
                        maxLength={8}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-form-type="other"
                        className="w-full px-3 py-2.5 bg-gray-800/70 rounded-lg border border-gray-700 text-white placeholder-gray-600 text-sm outline-none focus:border-green-500/50 focus:bg-gray-800 transition-all"
                    />
                </div>

                {/* Duress PIN */}
                <div>
                    <label htmlFor="su-duress" className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-red-500/80">
                        Duress PIN
                    </label>
                    <p className="text-[10px] text-gray-600 mb-1.5">If forced to unlock, enter this to open a decoy account.</p>
                    <input
                        id="su-duress"
                        type="password"
                        name="vader-duress-pin"
                        placeholder="••••••••"
                        value={regDuressPin}
                        onChange={e => setRegDuressPin(e.target.value)}
                        maxLength={8}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-form-type="other"
                        className="w-full px-3 py-2.5 bg-gray-800/70 rounded-lg border border-gray-700 text-white placeholder-gray-600 text-sm outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all"
                    />
                </div>

                <button type="submit"
                    className="mt-1 w-full py-3 bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-red-900/30">
                    Initialize Vault
                </button>
            </form>
        </AuthWrapper>
    );

    // ── Created confirmation screen ───────────────────────────────────────────
    if (screen === 'created') return (
        <AuthWrapper>
            <div className="w-full max-w-sm bg-gray-900/60 backdrop-blur p-8 rounded-2xl border border-gray-800/80 shadow-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-green-900/40 border border-green-700/40 flex items-center justify-center mx-auto mb-5">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" className="text-green-400">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold mb-1">Vault Initialized</h3>
                <p className="text-gray-500 text-sm mb-6">Your identity is secured on this device.</p>

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
        </AuthWrapper>
    );

    // ── Login screen ──────────────────────────────────────────────────────────
    const isLocked = !!lockoutUntil;

    return (
        <AuthWrapper>
            <p className="text-gray-500 text-xs tracking-widest uppercase mb-6">Unlock Vault</p>

            <form onSubmit={handleLogin} autoComplete="off"
                className="relative flex flex-col gap-4 w-full max-w-sm bg-gray-900/60 backdrop-blur p-7 rounded-2xl border border-gray-800/80 shadow-2xl">

                <HoneypotTrap />

                {/* Lockout banner */}
                {isLocked && (
                    <div className="flex flex-col items-center gap-2 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-4 text-center">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" className="text-red-400">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                        <p className="text-red-400 text-xs font-bold uppercase tracking-wide">Vault Locked</p>
                        <p className="text-[11px] text-gray-400 leading-snug">Too many failed attempts. Try again in:</p>
                        <p className="text-2xl font-mono font-bold text-red-300 tracking-widest">{countdown}</p>
                        {isSecondRound && (
                            <p className="text-[10px] text-red-600 mt-1 leading-snug">
                                ⚠ Final warning — account will be permanently destroyed on next failure.
                            </p>
                        )}
                    </div>
                )}

                <Field id="login-username" label="Username" name="vader-login-username"
                    placeholder="Enter your display name"
                    value={loginUsername} onChange={e => setLoginUsername(e.target.value)}
                    autoFocus disabled={isLocked} />

                <Field id="login-pin" label="PIN" name="vader-login-pin" type="password"
                    placeholder="Enter passcode"
                    value={loginPin} onChange={e => setLoginPin(e.target.value)}
                    maxLength={8} disabled={isLocked} />

                <button type="submit" disabled={isLocked}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 rounded-xl font-bold text-sm tracking-wide transition mt-1 disabled:opacity-40 disabled:cursor-not-allowed">
                    Unlock
                </button>
            </form>

            {/* Failed attempt counter (only when not locked) */}
            {!isLocked && failedAttempts > 0 && (
                <div className="mt-5 text-center">
                    <p className="text-red-500 text-sm font-mono">
                        {MAX_ATTEMPTS - failedAttempts} attempt{MAX_ATTEMPTS - failedAttempts !== 1 ? 's' : ''} remaining
                    </p>
                    <p className="text-gray-700 text-[10px] mt-1 max-w-xs">
                        {isSecondRound
                            ? 'Account will be permanently destroyed on zero remaining attempts.'
                            : 'Vault will be locked for 3 hours on zero remaining attempts.'}
                    </p>
                </div>
            )}

            <button onClick={handleGoToSignup}
                className="mt-8 text-gray-700 text-xs hover:text-gray-400 transition">
                Create New Account
            </button>
        </AuthWrapper>
    );
};

export default AuthScreen;
