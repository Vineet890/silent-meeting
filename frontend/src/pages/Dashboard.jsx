import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { apiFetch } from '../utils/api';

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
    <div className="flex flex-col flex-1 w-full">
      
      {/* SEARCH BAR */}
      <div className="w-full px-16 pt-12 pb-6 max-w-4xl mx-auto">
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

      <div className="flex-1 w-full px-16 pb-12">
          {!activeWorkspace ? (
          <div className="p-16 text-center border bg-white/65 backdrop-blur-md rounded-2xl shadow-sm dark:bg-black/65 dark:border-white/5">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Select or create a workspace to begin!</h2>
          </div>
          ) : (
          <>
              <div className="mb-10 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20 flex items-center justify-center text-white text-3xl font-black shrink-0">
                      {activeWorkspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">{activeWorkspace.name}</h1>
                      <p className="mt-2 text-lg text-muted-foreground font-medium">Manage your async meetings and team productivity.</p>
                  </div>
              </div>

              {!isSearching && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                      <div className="flex flex-col gap-4">
                          <div className="relative overflow-hidden p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-900/20 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Active Threads</h3>
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                  </div>
                              </div>
                              <div className="text-4xl font-black tracking-tight text-blue-900 dark:text-blue-100">{activeThreads}</div>
                              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                          </div>
                          
                          <div className="relative overflow-hidden p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-900/20 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Resolved Discussions</h3>
                                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                  </div>
                              </div>
                              <div className="text-4xl font-black tracking-tight text-emerald-900 dark:text-emerald-100">{resolvedDiscussions}</div>
                              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                          </div>

                          <div className="relative overflow-hidden p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-900/20 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Total Videos</h3>
                                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                  </div>
                              </div>
                              <div className="text-4xl font-black tracking-tight text-purple-900 dark:text-purple-100">{totalVideos}</div>
                              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                          </div>
                      </div>

                      <div className="lg:col-span-2 relative p-8 rounded-2xl border border-border/50 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-8 z-10">
                              <div>
                                  <h3 className="text-xl font-bold tracking-tight text-foreground">Top Active Discussions</h3>
                                  <p className="text-sm text-muted-foreground mt-1">Threads with the highest engagement.</p>
                              </div>
                              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
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
                    {activeWorkspace && user.id === activeWorkspace.ownerId && (
                    <div className="flex flex-col mb-12">
                      <h3 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Start a New Discussion</h3>
                      <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4 w-full bg-white/40 dark:bg-black/40 p-5 rounded-xl border shadow-sm backdrop-blur-md">
                          <input type="text" placeholder="What do you want to discuss? (e.g., Q3 Marketing Sync)" className="flex h-12 w-full rounded-lg bg-background px-4 py-2 text-base outline-none placeholder:text-muted-foreground border focus:ring-2 focus:ring-primary/20" value={newMeetingTitle} onChange={(e) => setNewMeetingTitle(e.target.value)} required />
                          <textarea placeholder="Add a brief agenda or description..." className="flex min-h-[80px] w-full rounded-lg bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground border focus:ring-2 focus:ring-primary/20 resize-y" value={newMeetingAgenda} onChange={(e) => setNewMeetingAgenda(e.target.value)} required />
                          <div className="flex justify-end mt-2">
                              <button type="submit" className="whitespace-nowrap inline-flex items-center justify-center h-10 px-8 text-sm font-bold transition-all rounded-lg shadow-md bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95">Create Thread</button>
                          </div>
                      </form>
                    </div>
                    )}

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

      {/* PRO FOOTER */}
      <footer className="px-12 py-12 mt-auto border-t bg-muted/20">
        <div className="flex flex-col items-center justify-between gap-6 mx-auto md:flex-row max-w-7xl">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
            </svg>
            <span className="font-semibold text-muted-foreground">SyncLoop</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <p>Built by Vineet Kumar</p>
            <a href="mailto:vineet765245@gmail.com" className="transition-colors hover:text-primary">Contact Support</a>
            <a href="https://github.com/vineet765245" target="_blank" rel="noreferrer" className="transition-colors hover:text-primary">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;