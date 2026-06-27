import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function Sidebar({ activeWorkspace, setActiveWorkspace }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const location = useLocation();

  const fetchWorkspaces = async () => {
    const res = await apiFetch('/api/workspaces');
    if (res && res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0 && !activeWorkspace) {
        setActiveWorkspace(data[0]);
        }
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await apiFetch('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: newWorkspaceName })
    });
    setNewWorkspaceName('');
    setIsCreating(false);
    fetchWorkspaces();
  };

  return (
    <div className="flex flex-col h-full w-full p-6 bg-transparent z-10">
      <div className="mb-8 space-y-1 mt-2">
        <NavLink to="/" className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all rounded-xl ${location.pathname === '/' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </NavLink>
        <NavLink to="/dashboard" className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all rounded-xl ${location.pathname === '/dashboard' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M21 8a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          Analytics & Search
        </NavLink>
        <NavLink to="/team" className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all rounded-xl ${location.pathname === '/team' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Team Directory
        </NavLink>
        <NavLink to="/settings" className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all rounded-xl ${location.pathname === '/settings' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          Settings
        </NavLink>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground m-0">
              Workspaces
            </p>
            <button onClick={() => setIsCreating(!isCreating)} className="p-1 text-muted-foreground transition-colors rounded-md hover:bg-destructive/10 hover:text-destructive">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateWorkspace} className="mb-4">
            <input 
              autoFocus
              type="text" 
              placeholder="Workspace name..." 
              className="w-full px-3 py-2 text-sm transition-all border rounded-md bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              value={newWorkspaceName} 
              onChange={(e) => setNewWorkspaceName(e.target.value)} 
            />
          </form>
        )}

        <div className="space-y-1">
            {workspaces.map(ws => (
            <button 
                key={ws._id}
                className={`flex items-center w-full gap-3 px-4 py-2 text-sm font-medium transition-colors rounded-lg text-left ${activeWorkspace?._id === ws._id ? 'bg-accent text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
                onClick={() => setActiveWorkspace(ws)}
            >
                <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-md bg-background shadow-sm text-foreground">
                    {ws.name.charAt(0).toUpperCase()}
                </span>
                {ws.name}
            </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;