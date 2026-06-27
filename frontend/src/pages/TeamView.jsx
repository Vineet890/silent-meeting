import { useState } from 'react';
import { apiFetch } from '../utils/api';

function TeamView({ activeWorkspace, setActiveWorkspace }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [memberToRemove, setMemberToRemove] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const showToast = (message, type = 'success') => {
      setToast({ visible: true, message, type });
      setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    const res = await apiFetch(`/api/workspaces/${activeWorkspace._id}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email: inviteEmail })
    });
    
    if (res && res.ok) {
        setInviteEmail('');
        showToast('Invite sent successfully!');
    } else {
        const err = await res.json();
        showToast(err.error || 'Failed to send invite.', 'error');
    }
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove || !activeWorkspace) return;
    const res = await apiFetch(`/api/workspaces/${activeWorkspace._id}/members/${memberToRemove._id}`, {
        method: 'DELETE'
    });
    if (res && res.ok) {
        setActiveWorkspace(prev => ({
            ...prev,
            members: prev.members.filter(m => m._id !== memberToRemove._id)
        }));
        setMemberToRemove(null);
        showToast('Member removed from workspace.');
    } else {
        const err = await res.json();
        setMemberToRemove(null);
        showToast(err.error || 'Failed to remove member.', 'error');
    }
  };

  if (!activeWorkspace) {
      return (
          <div className="flex flex-col flex-1 w-full px-8 md:px-16 pb-12 pt-12">
              <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed bg-white/40 backdrop-blur-3xl rounded-[2.5rem] shadow-sm dark:bg-black/40 dark:border-white/10 min-h-[50vh] flex-1">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M16 11h6"/></svg>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">No Workspace Selected</h2>
                  <p className="text-muted-foreground mt-2 max-w-sm">Select a workspace from the sidebar or create a new one to manage your team directory.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex-1 w-full px-16 py-12 relative">
        {/* Toast Notification */}
        {toast.visible && (
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg border backdrop-blur-md font-medium text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4 transition-all ${toast.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-success/10 border-success/20 text-success'}`}>
                {toast.type === 'error' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                )}
                {toast.message}
            </div>
        )}

        {/* Remove Member Confirmation Modal */}
        {memberToRemove && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
                <div className="bg-card text-card-foreground p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border animate-in zoom-in-95">
                    <h3 className="text-xl font-bold mb-2">Remove Member?</h3>
                    <p className="text-muted-foreground mb-8">
                        Are you sure you want to remove <strong className="text-foreground">{memberToRemove.name || memberToRemove.email}</strong> from this workspace? They will lose access to all threads.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setMemberToRemove(null)}
                            className="px-5 py-2.5 text-sm font-medium rounded-full hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={executeRemoveMember}
                            className="px-5 py-2.5 text-sm font-bold rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                        >
                            Yes, remove
                        </button>
                    </div>
                </div>
            </div>
        )}

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Team Directory</h1>
        <p className="mb-12 text-lg text-muted-foreground">Manage members of {activeWorkspace.name}</p>

        <div className="flex gap-8">
            <div className="flex-[2]">
                <div className="p-8 border bg-card text-card-foreground rounded-2xl shadow-sm">
                    <h3 className="mb-6 text-xl font-semibold tracking-tight">Workspace Members</h3>
                    <div className="flex flex-col gap-3">
                        {activeWorkspace.members && activeWorkspace.members.map(member => (
                            <div key={member._id} className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-primary/10 text-primary">
                                        {(member.name || member.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{member.name || member.email}</p>
                                        <p className="text-sm text-muted-foreground">{member._id === activeWorkspace.ownerId ? 'Workspace Owner' : 'Member'}</p>
                                    </div>
                                </div>
                                {user.id === activeWorkspace.ownerId && member._id !== activeWorkspace.ownerId && (
                                    <button 
                                        onClick={() => setMemberToRemove(member)}
                                        className="text-xs font-bold px-4 py-2 rounded-full text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {activeWorkspace.pendingInvites && activeWorkspace.pendingInvites.length > 0 && (
                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-semibold tracking-tight text-muted-foreground">Pending Invites</h3>
                            <div className="flex flex-col gap-3">
                                {activeWorkspace.pendingInvites.map(invitee => (
                                    <div key={invitee._id} className="flex items-center gap-4 p-4 border border-dashed rounded-xl opacity-70">
                                        <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-muted text-muted-foreground">
                                            {(invitee.name || invitee.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{invitee.name || invitee.email}</p>
                                            <p className="text-sm text-muted-foreground">Invited</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                <div className="p-8 border bg-card text-card-foreground rounded-2xl shadow-sm">
                    <h3 className="mb-4 text-xl font-semibold tracking-tight">Invite Teammate</h3>
                    <p className="mb-6 text-sm text-muted-foreground">Add a coworker to <strong className="font-medium text-foreground">{activeWorkspace.name}</strong>.</p>
                    <form onSubmit={handleInvite} className="flex flex-col gap-4">
                        <input type="email" placeholder="Email address" className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                        <button type="submit" className="inline-flex items-center justify-center h-11 px-4 py-2 text-sm font-bold text-white transition-all bg-primary rounded-xl shadow-md hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-95">Send Invite</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
}

export default TeamView;
