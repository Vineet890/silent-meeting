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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="px-6 py-10 md:px-12 max-w-7xl mx-auto w-full">
          
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Good morning, {user.name?.split(' ')[0] || 'there'}.</h1>
            <p className="text-lg text-muted-foreground">Here's what's happening in <span className="font-semibold text-foreground">{activeWorkspace?.name || 'your workspace'}</span>.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Actions & Activity */}
            <div className="lg:col-span-2 space-y-12">
                
                {/* CREATE THREAD WIDGET */}
                {activeWorkspace && user.id === activeWorkspace.ownerId && (
                <div className="relative group">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-indigo-500/30 opacity-20 blur-xl transition-opacity group-hover:opacity-40"></div>
                    <div className="relative flex flex-col bg-white/80 dark:bg-black/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-foreground">Start a New Thread</h3>
                            <p className="text-sm text-muted-foreground">Kick off an async discussion with your team</p>
                        </div>
                    </div>
                    <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4 w-full">
                        <div className="relative">
                            <input type="text" placeholder="Subject (e.g., Q3 Marketing Sync)" className="flex h-14 w-full rounded-xl bg-background/50 px-4 pt-1 pb-1 text-lg font-semibold outline-none placeholder:text-muted-foreground/60 border border-transparent hover:border-border focus:border-primary/50 focus:bg-background transition-all" value={newMeetingTitle} onChange={(e) => setNewMeetingTitle(e.target.value)} required />
                        </div>
                        <div className="relative">
                            <textarea placeholder="Add an agenda, context, or key questions to answer..." className="flex min-h-[100px] w-full rounded-xl bg-background/50 px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 border border-transparent hover:border-border focus:border-primary/50 focus:bg-background transition-all resize-y" value={newMeetingAgenda} onChange={(e) => setNewMeetingAgenda(e.target.value)} required />
                        </div>
                        <div className="flex justify-end mt-2 border-t border-border/50 pt-4">
                            <button type="submit" className="inline-flex items-center justify-center h-11 px-8 text-sm font-bold transition-all rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 group/btn">
                                Create Thread
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
                )}

                {/* RECENT ACTIVITY */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">Recent Threads</h3>
                        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                            View All <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentMeetings.map(m => (
                            <div key={m._id} className="flex flex-col justify-between p-5 transition-all border cursor-pointer bg-white/60 backdrop-blur-md rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-primary/50 dark:bg-black/60 dark:border-white/5" onClick={() => navigate(`/meetings/${m._id}`)}>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md ${m.status === 'Open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-secondary-foreground'}`}>{m.status}</span>
                                        <span className="text-xs text-muted-foreground">{getTimeAgo(m.createdAt)}</span>
                                    </div>
                                    <h3 className="mb-1 text-lg font-semibold tracking-tight text-foreground line-clamp-1">{m.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{m.agenda || 'No agenda provided'}</p>
                                </div>
                            </div>
                        ))}
                        {recentMeetings.length === 0 && (
                            <div className="col-span-1 md:col-span-2 p-8 text-center border-2 border-dashed rounded-2xl border-border/50">
                                <p className="text-muted-foreground">No recent threads found in this workspace.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: Needs Attention & Quick Links */}
            <div className="space-y-8">
                
                {/* NEEDS ATTENTION */}
                <div className="p-6 rounded-2xl border bg-white/50 dark:bg-black/50 backdrop-blur-md shadow-sm">
                    <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight mb-4 text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Needs Attention
                    </h3>
                    
                    <div className="space-y-4">
                        {activeInvites.length > 0 ? (
                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-800 dark:text-orange-200">
                                <p className="text-sm font-medium mb-2">You have {activeInvites.length} pending invite{activeInvites.length > 1 ? 's' : ''} to join your workspace.</p>
                                <button onClick={() => navigate('/team')} className="text-sm font-bold underline hover:text-orange-600 dark:hover:text-orange-300">Review Invites</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3 text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <p className="text-sm font-medium text-foreground">You're all caught up!</p>
                                <p className="text-xs text-muted-foreground mt-1">No pending action items right now.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* QUICK LINKS */}
                <div className="p-6 rounded-2xl border bg-white/50 dark:bg-black/50 backdrop-blur-md shadow-sm">
                    <h3 className="text-lg font-bold tracking-tight mb-4 text-foreground">Quick Links</h3>
                    <div className="space-y-2">
                        <button onClick={() => navigate('/team')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors text-left group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
                                <span className="font-medium text-sm">Invite Team Members</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors text-left group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
                                <span className="font-medium text-sm">Search All Threads</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                </div>

            </div>

          </div>

      </div>
      
      {/* FOOTER */}
      <footer className="px-12 py-12 mt-auto border-t bg-muted/20">
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
