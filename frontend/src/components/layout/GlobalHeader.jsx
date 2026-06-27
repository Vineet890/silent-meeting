import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SunIcon, MoonIcon } from '../ui/Icons';
import NotificationBell from '../ui/NotificationBell';

export default function GlobalHeader({ isDarkMode, toggleDarkMode, isOnline, toggleSidebar, isSidebarOpen, leftSlot }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
                {toggleSidebar && (
                    <button 
                        onClick={toggleSidebar} 
                        className="p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground active:scale-95"
                        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="12" x2="20" y2="12"></line>
                            <line x1="4" y1="6" x2="20" y2="6"></line>
                            <line x1="4" y1="18" x2="20" y2="18"></line>
                        </svg>
                    </button>
                )}
                {leftSlot}
                <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary drop-shadow-md" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
                    </svg>
                    <span className="font-bold tracking-tight">SyncLoop</span>
                </Link>
            </div>

            <div className="flex flex-1 justify-center hidden md:flex">
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-default transition-colors ${
                    isOnline 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                  }`}
                  title={isOnline ? "All systems operational and synced" : "You are currently offline. Changes will sync when reconnected."}
                >
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></div>
                    <span className="text-[11px] font-bold uppercase tracking-widest">{isOnline ? 'Sync Active' : 'Offline'}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <NotificationBell />
                <button 
                    onClick={toggleDarkMode} 
                    className="relative flex items-center justify-center w-10 h-10 transition-all rounded-full bg-white/50 border border-black/5 hover:bg-white dark:bg-black/50 dark:border-white/10 dark:hover:bg-black/80 shadow-sm hover:shadow hover:scale-105 active:scale-95" 
                    title="Toggle Dark Mode" 
                >
                    {isDarkMode ? (
                        <SunIcon className="text-yellow-400 drop-shadow-sm" />
                    ) : (
                        <MoonIcon className="text-slate-600 drop-shadow-sm" />
                    )}
                </button>
                <div className="relative">
                    <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-primary-foreground rounded-full cursor-pointer bg-primary" onClick={() => setDropdownOpen(!dropdownOpen)}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'V'}
                    </div>
                    {dropdownOpen && (
                        <div className="absolute right-0 z-50 p-2 mt-2 border shadow-lg rounded-xl w-48 bg-popover text-popover-foreground animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 mb-2 border-b">
                                <p className="text-sm font-bold">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <button className="w-full px-4 py-2 text-left text-sm transition-colors rounded-md hover:bg-accent" onClick={() => { setDropdownOpen(false); window.location.href='/settings'; }}>Account Settings</button>
                            <button className="w-full px-4 py-2 text-left text-sm transition-colors rounded-md hover:bg-accent" onClick={() => { setDropdownOpen(false); window.location.href='/settings'; }}>Workspace Preferences</button>
                            <div className="my-1 border-t"></div>
                            <button className="w-full px-4 py-2 text-left text-sm text-destructive transition-colors rounded-md hover:bg-destructive/10" onClick={handleLogout}>Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
