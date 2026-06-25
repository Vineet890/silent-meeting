import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // NEW: Analytics State
  const [analytics, setAnalytics] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
        fetchMeetings(activeWorkspace._id);
        fetchAnalytics(activeWorkspace._id); // Fetch the KPI Data!
        clearSearch();
    }
  }, [activeWorkspace]);

  const fetchWorkspaces = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/workspaces', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    setWorkspaces(data);
    if (data.length > 0 && !activeWorkspace) setActiveWorkspace(data[0]);
  };

  const fetchMeetings = async (workspaceId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/meetings?workspaceId=${workspaceId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    setMeetings(data);
  };

  // NEW: Fetch Analytics
  const fetchAnalytics = async (workspaceId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/analytics/${workspaceId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newWorkspaceName })
    });
    if (response.ok) {
        setNewWorkspaceName('');
        setShowCreateWorkspace(false);
        fetchWorkspaces();
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('http://localhost:5000/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, agenda, workspaceId: activeWorkspace._id }),
    });
    setTitle('');
    setAgenda('');
    fetchMeetings(activeWorkspace._id);
    fetchAnalytics(activeWorkspace._id); // Refresh metrics!
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/workspaces/${activeWorkspace._id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail })
    });

    if (response.ok) {
        alert("Teammate invited successfully!");
        setInviteEmail('');
        setShowInviteModal(false);
        fetchWorkspaces();
        fetchAnalytics(activeWorkspace._id); // Refresh teammate count!
    } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to invite teammate");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/search?q=${searchQuery}&workspaceId=${activeWorkspace._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setSearchResults(data);
      setIsSearching(true);
    } catch (err) {
      console.error(err);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* LEFT SIDEBAR */}
      <div className="workspace-sidebar">
        <h2 style={{ color: '#e2e8f0', marginBottom: '2rem', fontSize: '1.2rem' }}>Async Sync</h2>
        
        <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginBottom: '1rem' }}>
                Your Workspaces
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {workspaces.map(ws => (
                    <button 
                        key={ws._id}
                        onClick={() => setActiveWorkspace(ws)}
                        className={`workspace-btn ${activeWorkspace?._id === ws._id ? 'active' : ''}`}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{ws.name.charAt(0)}</span>
                        {ws.name}
                    </button>
                ))}
            </div>
        </div>

        <button onClick={() => setShowCreateWorkspace(!showCreateWorkspace)} className="btn-secondary" style={{ width: '100%', marginBottom: '1rem' }}>
            + New Workspace
        </button>

        {showCreateWorkspace && (
            <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="text" placeholder="Workspace Name" className="glass-input" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} required />
                <button type="submit" className="btn-primary">Create</button>
            </form>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: '3rem' }}>
        
        {activeWorkspace ? (
            <div>
                {/* HEADER & SEARCH BAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ color: '#c084fc', margin: 0 }}>{activeWorkspace.name}</h1>
                        {user.id === activeWorkspace.ownerId && (
                            <button onClick={() => setShowInviteModal(true)} className="btn-secondary" style={{ color: '#10b981', borderColor: '#10b981', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                + Invite Teammate
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" placeholder="Search transcripts & titles..." className="glass-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ margin: 0, width: '300px' }} />
                        <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Search</button>
                    </form>
                </div>

                {isSearching ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ color: '#10b981' }}>Search Results for "{searchQuery}"</h2>
                            <button onClick={clearSearch} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Clear Search</button>
                        </div>
                        
                        <div className="meetings-grid">
                            {searchResults.map((meeting) => (
                                <div key={meeting._id} className="meeting-card" onClick={() => navigate(`/meeting/${meeting._id}`)}>
                                    <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>{meeting.title}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>{meeting.agenda}</p>
                                    <span className={meeting.status === 'Open' ? 'status-badge' : 'status-badge closed'}>{meeting.status}</span>
                                </div>
                            ))}
                            {searchResults.length === 0 && (
                                <div className="glass-panel" style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    No videos or meetings found matching "{searchQuery}".
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* NEW: ANALYTICS KPI DASHBOARD */}
                        {analytics && (
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
                                
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                                        <h3 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Meetings</h3>
                                        <p style={{ fontSize: '3rem', color: '#c084fc', margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>{analytics.totalMeetings}</p>
                                    </div>
                                    <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                                        <h3 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Recorded Videos</h3>
                                        <p style={{ fontSize: '3rem', color: '#10b981', margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>{analytics.totalVideos}</p>
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Workspace Productivity</h3>
                                    <div style={{ flex: 1, minHeight: '200px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Meetings', count: analytics.totalMeetings },
                                                { name: 'Videos', count: analytics.totalVideos },
                                                { name: 'Teammates', count: analytics.totalMembers }
                                            ]}>
                                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                                <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fill: '#94a3b8' }} />
                                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {user.id === activeWorkspace.ownerId && (
                            <div className="glass-panel" style={{ marginBottom: '3rem' }}>
                                <h2>Start a New Silent Meeting</h2>
                                <form onSubmit={handleCreateMeeting} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <input type="text" placeholder="Meeting Title" className="glass-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                    <input type="text" placeholder="Agenda / Topic" className="glass-input" value={agenda} onChange={(e) => setAgenda(e.target.value)} required />
                                    <button type="submit" className="btn-primary">Create Meeting</button>
                                </form>
                            </div>
                        )}

                        <h2 style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}>Active Meetings</h2>
                        <div className="meetings-grid">
                            {meetings.map((meeting) => (
                                <div key={meeting._id} className="meeting-card" onClick={() => navigate(`/meeting/${meeting._id}`)}>
                                    <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>{meeting.title}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>{meeting.agenda}</p>
                                    <span className={meeting.status === 'Open' ? 'status-badge' : 'status-badge closed'}>{meeting.status}</span>
                                </div>
                            ))}
                            {meetings.length === 0 && <p style={{ color: '#94a3b8' }}>No meetings found in this workspace.</p>}
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                <h2>Create or Select a Workspace to begin!</h2>
            </div>
        )}

      </div>

      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', position: 'relative' }}>
            <button onClick={() => setShowInviteModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            <h2 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Invite to {activeWorkspace?.name}</h2>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="email" placeholder="teammate@example.com" className="glass-input" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              <button type="submit" className="btn-primary" style={{ backgroundColor: '#10b981' }}>Send Invite</button>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default Dashboard;