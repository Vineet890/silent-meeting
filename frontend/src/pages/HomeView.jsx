import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function HomeView({ activeWorkspace }) {
  const navigate = useNavigate();
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingAgenda, setNewMeetingAgenda] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (activeWorkspace) {
      fetchRecentMeetings(activeWorkspace._id);
    }
  }, [activeWorkspace]);

  const fetchRecentMeetings = async (workspaceId) => {
    const res = await apiFetch(`/api/meetings?workspaceId=${workspaceId}`);
    if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
            // Get up to 4 most recent meetings
            setRecentMeetings(data.slice(0, 4));
        }
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeetingTitle.trim() || !activeWorkspace) return;
    const response = await apiFetch('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({ title: newMeetingTitle, agenda: newMeetingAgenda, workspaceId: activeWorkspace._id })
    });
    if (response && response.ok) {
        const newMeeting = await response.json();
        setNewMeetingTitle('');
        setNewMeetingAgenda('');
        navigate(`/meetings/${newMeeting._id}`);
    }
  };

  const getTimeAgo = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " mins ago";
      return "just now";
  };

  const activeInvites = activeWorkspace?.pendingInvites || [];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      
      {/* IMMERSIVE HERO SECTION */}
      <div className="relative w-full pt-20 pb-28 flex flex-col items-center justify-center overflow-hidden">
          {/* Animated Background Blobs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[40rem] h-96 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-4000"></div>

          <div className="relative z-10 max-w-3xl w-full px-6 text-center flex flex-col items-center">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 pb-4 leading-normal bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Good morning, {user.name?.split(' ')[0] || 'there'}.
              </h1>
              <p className="text-xl text-muted-foreground mb-12 max-w-xl">
                Ready to sync with <span className="font-semibold text-foreground">{activeWorkspace?.name || 'your team'}</span>? Start a new thread below.
              </p>

              {/* CENTERED FLOATING COMPOSER */}
              {activeWorkspace && user.id === activeWorkspace.ownerId && (
              <form onSubmit={handleCreateMeeting} className="w-full relative group">
                  <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-r from-primary/40 via-indigo-500/40 to-fuchsia-500/40 opacity-30 blur-xl transition-all duration-500 group-hover:opacity-60 group-hover:duration-200"></div>
                  <div className="relative flex flex-col bg-white/80 dark:bg-black/60 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-2xl transition-all">
                      <input 
                          type="text" 
                          placeholder="What do you want to discuss? (e.g., Q3 Marketing Sync)" 
                          className="w-full h-16 bg-transparent px-6 text-lg font-semibold outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-border transition-colors" 
                          value={newMeetingTitle} 
                          onChange={(e) => setNewMeetingTitle(e.target.value)} 
                          required 
                      />
                      
                      {/* Agenda field appears smoothly */}
                      <div className="px-2 pt-2 pb-2">
                        <textarea 
                            placeholder="Add an agenda, context, or key questions to answer..." 
                            className="w-full min-h-[80px] bg-black/5 dark:bg-white/5 rounded-xl px-4 py-3 text-base outline-none placeholder:text-muted-foreground/50 resize-y focus:bg-black/10 dark:focus:bg-white/10 transition-colors" 
                            value={newMeetingAgenda} 
                            onChange={(e) => setNewMeetingAgenda(e.target.value)} 
                            required 
                        />
                      </div>
                      
                      <div className="flex justify-between items-center px-4 pb-2 pt-2">
                          <div className="flex gap-2">
                              {/* Quick Action Pills instead of a massive box */}
                              <button type="button" onClick={() => navigate('/team')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                                  Invite Team
                              </button>
                              <button type="button" onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                  Search
                              </button>
                          </div>

                          <button type="submit" className="inline-flex items-center justify-center h-12 px-8 text-sm font-bold transition-all rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 group/btn">
                              Create Thread
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                          </button>
                      </div>
                  </div>
              </form>
              )}
          </div>
      </div>

      {/* FLOATING ACTION STRIP (If there are invites) */}
      {activeInvites.length > 0 && (
          <div className="max-w-2xl mx-auto w-full px-6 -mt-16 mb-12 relative z-30">
              <div className="flex items-center justify-between p-4 px-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xl shadow-orange-500/20 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-md">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <span className="font-medium text-sm md:text-base">You have {activeInvites.length} pending workspace invite{activeInvites.length > 1 ? 's' : ''}.</span>
                  </div>
                  <button onClick={() => navigate('/team')} className="px-4 py-2 bg-white text-orange-600 font-bold text-sm rounded-full shadow-sm hover:scale-105 active:scale-95 transition-transform">
                      Review Now
                  </button>
              </div>
          </div>
      )}

      {/* RECENT THREADS - PREMIUM GRID */}
      <div className="w-full px-6 pb-24 relative z-20 -mt-8 flex-1">
          <div className="max-w-7xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      </div>
                      Jump back in
                  </h3>
                  <button onClick={() => navigate('/dashboard')} className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 group/link">
                      View all threads 
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/link:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
              </div>

              {recentMeetings.length === 0 ? (
                  <div className="w-full py-16 flex flex-col items-center justify-center text-center opacity-60 bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/5">
                      <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                      </div>
                      <p className="text-lg font-medium text-foreground">No threads yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">Start a new discussion using the composer above.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {recentMeetings.map((m, i) => (
                          <div 
                              key={m._id} 
                              onClick={() => navigate(`/meetings/${m._id}`)}
                              className="group cursor-pointer relative overflow-hidden flex flex-col justify-between h-[240px] p-6 rounded-3xl bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/90 dark:hover:bg-black/80 transition-all duration-500 hover:-translate-y-1.5"
                          >
                              {/* Accent Glow based on index */}
                              <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 ${i % 2 === 0 ? 'bg-primary' : 'bg-fuchsia-500'}`}></div>

                              <div>
                                  <div className="flex items-center justify-between mb-5 relative z-10">
                                      <span className={`inline-flex items-center px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full ${m.status === 'Open' ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-foreground/10 text-foreground/70'}`}>
                                          {m.status}
                                      </span>
                                      <span className="text-xs font-medium text-muted-foreground">{getTimeAgo(m.createdAt)}</span>
                                  </div>
                                  <h3 className="text-xl font-bold tracking-tight text-foreground line-clamp-2 leading-snug mb-3 relative z-10 group-hover:text-primary transition-colors">
                                      {m.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2 relative z-10 leading-relaxed font-medium">
                                      {m.agenda || 'No agenda provided'}
                                  </p>
                              </div>

                              <div className="flex items-center gap-2 mt-4 text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 relative z-10">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                  </div>
                                  <span>Open Thread</span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
      
      {/* FOOTER */}
      <footer className="px-6 md:px-12 py-12 mt-auto border-t bg-background">
        <div className="flex flex-col items-center justify-between gap-6 mx-auto md:flex-row max-w-7xl">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
            </svg>
            <span className="font-semibold text-muted-foreground">SyncLoop</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <p>Built by Vineet Kumar</p>
            <a href="mailto:vineet765245@gmail.com" className="transition-colors hover:text-primary">Contact Support</a>
            <a href="https://github.com/Vineet890/silent-meeting" target="_blank" rel="noreferrer" className="transition-colors hover:text-primary">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomeView;
