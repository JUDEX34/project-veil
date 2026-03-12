import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import MainLayout from './components/MainLayout';
import DecoyLayout from './components/DecoyLayout';

const App = () => {
    const [authState, setAuthState] = useState("UNAUTHENTICATED");
    const [username, setUsername] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ghost Protocol (Boss Key): Alt + Shift + S
            if (e.altKey && e.shiftKey && e.key.toLowerCase() === 's') {
                const ghostTarget = localStorage.getItem('v_ghost_target')
                    || 'https://www.google.com/search?q=tcp+ip+networking+basics';
                // Physical coercion override: replace history so back button fails
                window.location.replace(ghostTarget);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleAuthSuccess = (mode, user) => {
        setAuthState(mode);
        setUsername(user);
    };

    return (
        <div className="font-sans">
            {authState === "UNAUTHENTICATED" && (
                <AuthScreen onAuthSuccess={handleAuthSuccess} />
            )}

            {authState === "AUTHENTICATED_REAL" && (
                <MainLayout username={username} />
            )}

            {authState === "AUTHENTICATED_DECOY" && (
                <DecoyLayout username={username} />
            )}
        </div>
    );
};

export default App;
