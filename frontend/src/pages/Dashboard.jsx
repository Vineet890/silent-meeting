import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { apiFetch } from '../utils/api';
import GlobalFooter from '../components/layout/GlobalFooter';

function Dashboard({ activeWorkspace }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingAgenda, setNewMeetingAgenda] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeThreads, setActiveThreads] = useState(0);
  const [resolvedDiscussions, setResolvedDiscussions] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [analyticsData, setAnalyticsData] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (activeWorkspace) {
      fetchMeetings(activeWorkspace._id);
      fetchAnalytics(activeWorkspace._id);
    }
  }, [activeWorkspace]);

  const fetchMeetings = async (workspaceId) => {
    const res = await apiFetch(`/api/meetings?workspaceId=${workspaceId}`);
    if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMeetings(data);
    }
  };

  const fetchAnalytics = async (workspaceId) => {
    try {
        const res = await apiFetch(`/api/analytics/${workspaceId}`);
        if (res && res.ok) {
            const data = await res.json();
            setActiveThreads(data.activeThreads || 0);
            setResolvedDiscussions(data.resolvedDiscussions || 0);
            setTotalVideos(data.totalVideos || 0);
            setAnalyticsData(data.chartData || []);
        }
    } catch (e) { console.error(e); }
  };

  const handleSearch = async (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (!searchQuery.trim()) {
          setIsSearching(false);
          setSearchResults([]);
          return;
      }
      setIsSearching(true);
      try {
          const res = await apiFetch(`/api/search?workspaceId=${activeWorkspace._id}&q=${encodeURIComponent(searchQuery)}`);
          if (res && res.ok) {
              const data = await res.json();
              setSearchResults(data);
          }
      } catch (err) { console.error("Search failed", err); }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    const response = await apiFetch('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({ title: newMeetingTitle, agenda: newMeetingAgenda, workspaceId: activeWorkspace._id })
    });
    if (response && response.ok) {
        const newMeeting = await response.json();
        setNewMeetingTitle('');
        navigate(`/meetings/${newMeeting._id}`);
    }
  };

  // Removed hardcoded analyticsData since it's now dynamically set via state

  return (
    <div className="flex flex-col flex-1 min-h-full bg-transparent overflow-x-hidden">
      
      {/* Search Header */}
      <div className="w-full px-8 md:px-16 pt-12 pb-8 relative z-20 max-w-4xl mx-auto">
        <div className="relative w-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute z-10 left-6 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
                type="text"
                placeholder="Search transcripts, action items, titles..."
                className="w-full py-4 pl-16 pr-8 text-lg font-medium transition-all bg-white/60 border rounded-2xl shadow-sm backdrop-blur-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-black/60 dark:border-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
            />
        </div>
      </div>

      <div className="flex flex-col flex-1 w-full px-8 md:px-16 pb-12">
          {!activeWorkspace ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed bg-white/40 backdrop-blur-3xl rounded-[2.5rem] shadow-sm dark:bg-black/40 dark:border-white/10 min-h-[50vh] flex-1">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">No Workspace Selected</h2>
              <p className="text-muted-foreground mt-2 max-w-sm">Select a workspace from the sidebar or create a new one to access your dashboard analytics.</p>
          </div>
          ) : (
          <>
              <div className="mb-10 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20 flex items-center justify-center text-white text-3xl font-black shrink-0">
                      {activeWorkspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 pb-4 leading-normal">{activeWorkspace.name}</h1>
                      <p className="mt-2 text-lg text-muted-foreground font-medium">Manage your async meetings and team productivity.</p>
                  </div>
              </div>

              {!isSearching && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                      <div className="flex flex-col gap-4">
                          <div className="relative overflow-hidden p-6 rounded-[2rem] border border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-3xl shadow-2xl transition-all duration-500 group hover:-translate-y-2 hover:shadow-primary/10">
                              <div className="flex items-center justify-between mb-8 z-10 relative">
                                  <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">Active Threads</h3>
                                  <div className="p-3 bg-primary/10 rounded-2xl text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                  </div>
                              </div>
                              <div className="text-6xl font-black tracking-tighter text-foreground z-10 relative">{activeThreads}</div>
                              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-700"></div>
                          </div>
                          
                          <div className="relative overflow-hidden p-6 rounded-[2rem] border border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-3xl shadow-2xl transition-all duration-500 group hover:-translate-y-2 hover:shadow-success/10">
                              <div className="flex items-center justify-between mb-8 z-10 relative">
                                  <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">Resolved</h3>
                                  <div className="p-3 bg-success/10 rounded-2xl text-success transition-all duration-500 group-hover:bg-success group-hover:text-success-foreground group-hover:scale-110">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                  </div>
                              </div>
                              <div className="text-6xl font-black tracking-tighter text-foreground z-10 relative">{resolvedDiscussions}</div>
                              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-success/20 rounded-full blur-[60px] group-hover:bg-success/30 transition-all duration-700"></div>
                          </div>

                          <div className="relative overflow-hidden p-6 rounded-[2rem] border border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-3xl shadow-2xl transition-all duration-500 group hover:-translate-y-2 hover:shadow-warning/10">
                              <div className="flex items-center justify-between mb-8 z-10 relative">
                                  <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">Total Videos</h3>
                                  <div className="p-3 bg-warning/10 rounded-2xl text-warning transition-all duration-500 group-hover:bg-warning group-hover:text-warning-foreground group-hover:scale-110">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                  </div>
                              </div>
                              <div className="text-6xl font-black tracking-tighter text-foreground z-10 relative">{totalVideos}</div>
                              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-warning/20 rounded-full blur-[60px] group-hover:bg-warning/30 transition-all duration-700"></div>
                          </div>
                      </div>

                      <div className="lg:col-span-2 relative p-10 rounded-[2.5rem] border border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-3xl shadow-2xl transition-all flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-12 z-10">
                              <div>
                                  <h3 className="text-2xl font-black tracking-tighter text-foreground">Top Active Discussions</h3>
                                  <p className="text-sm font-medium text-muted-foreground mt-2">Threads with the highest engagement.</p>
                              </div>
                              <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                              </div>
                          </div>
                          
                          <div className="flex-1 min-h-[250px] z-10">
                              {analyticsData.length === 0 ? (
                                  <div className="flex items-center justify-center w-full h-full border-2 border-dashed rounded-xl border-border/50 text-muted-foreground">
                                      No active discussions yet
                                  </div>
                              ) : (
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={analyticsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                          <defs>
                                              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                                              </linearGradient>
                                          </defs>
                                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                                          <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                                          <Bar dataKey="engagement" fill="url(#colorEngagement)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                      </BarChart>
                                  </ResponsiveContainer>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              {isSearching ? (
                  <div>
                      <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold tracking-tight text-primary">Search Results</h2>
                          <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow-sm bg-white/50 hover:bg-accent hover:text-accent-foreground dark:bg-black/50">Clear Search</button>
                      </div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {searchResults.map((result) => (
                              <div key={result._id} className="flex flex-col justify-between p-6 transition-all border cursor-pointer bg-white/65 backdrop-blur-md rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-primary/50 dark:bg-black/65 dark:border-white/5" onClick={() => navigate(`/meetings/${result.meetingId || result._id}`)}>
                                  <div>
                                      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">Meeting: {result.meetingTitle || result.title}</h3>
                                      <span className="inline-flex items-center px-2.5 py-0.5 mb-4 text-xs font-semibold transition-colors border border-transparent rounded-full bg-primary/10 text-primary">Match Found</span>
                                  </div>
                                  {result.textContent && (
                                      <p className="p-4 text-sm border-l-2 text-muted-foreground bg-white/50 rounded-r-md border-primary dark:bg-white/5">
                                          "...{result.textContent.substring(0, 100)}..."
                                      </p>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div>
                    <div className="flex flex-col mb-6">
                      <h3 className="text-xl font-semibold tracking-tight text-foreground">Active Threads</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {meetings.map(m => (
                          <div key={m._id} className="flex flex-col justify-between p-6 transition-all border cursor-pointer bg-white/65 backdrop-blur-md rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-primary/50 dark:bg-black/65 dark:border-white/5" onClick={() => navigate(`/meetings/${m._id}`)}>
                          <div>
                              <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{m.title}</h3>
                              <p className="mb-4 text-sm text-muted-foreground">{m.agenda || 'No agenda provided'}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors border border-transparent rounded-full w-fit ${m.status === 'Open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-secondary-foreground'}`}>{m.status}</span>
                          </div>
                      ))}
                      {meetings.length === 0 && (
                          <p className="text-muted-foreground">No meetings found. Start a new thread above!</p>
                      )}
                    </div>
                  </div>
              )}
          </>
          )}
      </div>

      <GlobalFooter />
    </div>
  );
}

export default Dashboard;