import { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import GlobalHeader from './GlobalHeader';

export default function ProtectedLayout({ children, activeWorkspace, setActiveWorkspace, isDarkMode, toggleDarkMode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Hidden by default

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative selection:bg-primary/30">
      {/* Hyper-Premium Ambient Glow (Visible mostly in Dark Mode) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/15" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-600/10" />
      </div>
      <div className={`${isSidebarOpen ? 'w-64 border-r' : 'w-0 border-r-0'} transition-all duration-300 ease-in-out h-full overflow-hidden flex-shrink-0 bg-background/40 backdrop-blur-xl`}>
          <div className="w-64 h-full">
            <Sidebar activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
          </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto bg-background">
        <GlobalHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isOnline={isOnline} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />

        <div className="flex flex-col flex-1">
            {children}
        </div>
      </div>
    </div>
  );
}
