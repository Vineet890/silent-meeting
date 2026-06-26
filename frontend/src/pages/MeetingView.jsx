import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { UsersIcon, LogoIcon } from '../components/ui/Icons';
import VideoRecorder from '../components/meeting/VideoRecorder';
import VideoThread from '../components/meeting/VideoThread';
import SyncIntelligenceChat from '../components/meeting/SyncIntelligenceChat';
import { apiFetch } from '../utils/api';

export default function MeetingView({ isDarkMode, toggleDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [workspace, setWorkspace] = useState(null); 
  const [replies, setReplies] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const [comments, setComments] = useState({}); 
  const [newCommentText, setNewCommentText] = useState({}); 
  const [activeReplyBox, setActiveReplyBox] = useState(null); 

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmButtonText, setConfirmButtonText] = useState("Confirm");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [membersDropdownOpen, setMembersDropdownOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const socketRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    apiFetch(`/api/meetings/${id}`)
      .then((res) => res && res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setMeeting(data.meeting);
        setReplies(data.replies);
        setWorkspace(data.workspace);

        data.replies.forEach(reply => {
            apiFetch(`/api/comments/${reply._id}`)
            .then(r => r && r.ok ? r.json() : null)
            .then(cData => {
                if(cData) setComments(prev => ({ ...prev, [reply._id]: cData }));
            });
        });
      });

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
    });
    socketRef.current = newSocket;
    newSocket.emit('join_meeting', id);

    newSocket.on('new_reply', (newReply) => setReplies((prev) => [newReply, ...prev]));
    newSocket.on('reply_deleted', (deletedReplyId) => setReplies((prev) => prev.filter(r => r._id !== deletedReplyId)));
    newSocket.on('meeting_closed', (updatedMeeting) => setMeeting(updatedMeeting));

    newSocket.on('new_comment', (newComment) => {
        setComments(prev => ({ ...prev, [newComment.replyId]: [...(prev[newComment.replyId] || []), newComment] }));
    });

    newSocket.on('comment_deleted', (deletedCommentId) => {
      setComments(prev => {
         const newComments = { ...prev };
         Object.keys(newComments).forEach(replyId => {
             newComments[replyId] = newComments[replyId].filter(c => c._id !== deletedCommentId && c.parentCommentId !== deletedCommentId);
         });
         return newComments;
      });
    });

    return () => newSocket.disconnect();
  }, [id]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = handleUpload;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { console.error("Permission denied", err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      const stream = videoPreviewRef.current.srcObject;
      if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null; 
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      const stream = videoPreviewRef.current.srcObject;
      if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
      }
      videoPreviewRef.current.srcObject = null;
      videoChunksRef.current = [];
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('video', videoBlob, 'reply.webm');
    formData.append('meetingId', id);

    await apiFetch('/api/replies', { method: 'POST', body: formData });
    setIsUploading(false);
  };

  const handleDeleteVideo = (replyId) => {
    setConfirmMessage("Are you sure you want to permanently delete this video? This cannot be undone.");
    setConfirmButtonText("Delete Video");
    setConfirmAction(() => async () => {
        await apiFetch(`/api/replies/${replyId}`, { method: 'DELETE' });
        setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleCloseMeeting = () => {
    setConfirmMessage("Are you sure you want to lock this meeting? Once closed, no one can upload new videos.");
    setConfirmButtonText("Lock Meeting");
    setConfirmAction(() => async () => {
        await apiFetch(`/api/meetings/${id}/close`, { method: 'PUT' });
        setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleDeleteComment = (commentId) => {
      setConfirmMessage("Delete this comment? Nested replies will also be removed.");
      setConfirmButtonText("Delete Comment");
      setConfirmAction(() => async () => {
          await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
          setShowConfirmModal(false);
      });
      setShowConfirmModal(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true); 

    const response = await apiFetch(`/api/meetings/${id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: userMessage.text })
    });

    const data = await response.json();
    setChatMessages((prev) => [...prev, { role: 'ai', text: response.ok ? data.answer : `Error: ${data.error}` }]);
    setIsChatting(false);
  };

  const handlePostComment = async (replyId, parentCommentId = null) => {
      const textKey = parentCommentId ? parentCommentId : replyId;
      const text = newCommentText[textKey];
      if (!text || !text.trim()) return;

      await apiFetch('/api/comments', {
          method: 'POST',
          body: JSON.stringify({ replyId, text, parentCommentId })
      });

      setNewCommentText(prev => ({ ...prev, [textKey]: '' }));
      if (parentCommentId) setActiveReplyBox(null);
  };

  if (!meeting) return <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">Loading Meeting...</div>;

  return (
    <div className="flex flex-col min-h-screen overflow-y-auto bg-background text-foreground">
      
      {/* HEADER WITH BACK BUTTON AND PROFILE */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-12 py-4 border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center flex-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              Back
            </button>
        </div>
        
        <div className="flex items-center flex-1 gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <LogoIcon className="text-primary drop-shadow-md" />
            <span className="text-2xl font-black tracking-tighter">SyncLoop</span>
        </div>

        <div className="flex items-center justify-end flex-1 gap-4">
            <button 
                onClick={() => navigate('/team')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Invite
            </button>
            <button 
                onClick={toggleDarkMode} 
                className="relative flex items-center justify-center w-10 h-10 transition-all rounded-full bg-white/50 border border-black/5 hover:bg-white dark:bg-black/50 dark:border-white/10 dark:hover:bg-black/80 shadow-sm hover:shadow hover:scale-105 active:scale-95" 
                title="Toggle Dark Mode" 
            >
                {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 drop-shadow-sm"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 drop-shadow-sm"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
                )}
            </button>
            <div className="relative">
                <div className="flex items-center justify-center w-8 h-8 text-sm font-medium cursor-pointer bg-primary text-primary-foreground rounded-full" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'V'}
                </div>
                {dropdownOpen && (
                    <div className="absolute right-0 z-50 p-2 mt-2 border shadow-lg rounded-xl w-48 bg-popover text-popover-foreground animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-2 mb-2 border-b">
                            <p className="text-sm font-bold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <button className="w-full px-4 py-2 text-left text-sm transition-colors rounded-md hover:bg-accent" onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>Account Settings</button>
                        <button className="w-full px-4 py-2 text-left text-sm transition-colors rounded-md hover:bg-accent" onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>Workspace Preferences</button>
                        <div className="my-1 border-t"></div>
                        <button className="w-full px-4 py-2 text-left text-sm text-destructive transition-colors rounded-md hover:bg-destructive/10" onClick={handleLogout}>Log Out</button>
                    </div>
                )}
            </div>
        </div>
      </header>

      <div className="flex-1 w-full px-16 py-12">
        <div className="flex gap-8">
          
          {/* LEFT COLUMN: VIDEOS & THREADS */}
          <div className="flex-[2]">
            <div className="flex items-start justify-between p-8 mb-8 border bg-card text-card-foreground rounded-2xl shadow-sm">
              <div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-primary">{meeting.title}</h1>
                <p className="mb-4 text-lg text-muted-foreground">{meeting.agenda}</p>
                <div className="flex flex-wrap items-center gap-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors border border-transparent rounded-full ${meeting.status === 'Open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-secondary-foreground'}`}>{meeting.status}</span>
                    {workspace && workspace.members && (
                        <div className="relative">
                            <button 
                                onClick={() => setMembersDropdownOpen(!membersDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium transition-colors border bg-background rounded-full hover:bg-accent" 
                            >
                                <UsersIcon />
                                {workspace.members.length} {workspace.members.length === 1 ? 'Member' : 'Members'}
                            </button>
                            
                            {membersDropdownOpen && (
                                <div className="absolute left-0 z-50 w-56 p-2 mt-2 overflow-y-auto border shadow-lg max-h-72 rounded-xl bg-popover text-popover-foreground animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-2 mb-2 border-b">
                                        <p className="text-sm font-bold">Team Members</p>
                                    </div>
                                    {workspace.members.map((member) => (
                                        <div key={member._id} className="flex items-center gap-3 px-4 py-2">
                                            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                                                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-sm font-medium truncate">{member.name || 'User'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
              </div>
              
              <div className="flex gap-4">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Meeting link copied to clipboard!'); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md border-primary text-primary hover:bg-primary/10">
                  📋 Copy Link
                </button>
                {workspace && user.id === workspace.ownerId && meeting.status === 'Open' && (
                  <button onClick={handleCloseMeeting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md text-destructive border-destructive hover:bg-destructive/10">
                    🔒 Close Meeting
                  </button>
                )}
              </div>
            </div>

            <VideoThread 
                replies={replies}
                comments={comments}
                user={user}
                handleDeleteVideo={handleDeleteVideo}
                handleDeleteComment={handleDeleteComment}
                activeReplyBox={activeReplyBox}
                setActiveReplyBox={setActiveReplyBox}
                newCommentText={newCommentText}
                setNewCommentText={setNewCommentText}
                handlePostComment={handlePostComment}
            />

          </div>

          {/* RIGHT COLUMN: RECORDING & CHAT */}
          <div className="flex flex-col flex-1 gap-8 sticky top-24 h-fit">
            
            <VideoRecorder 
                meetingStatus={meeting.status}
                videoPreviewRef={videoPreviewRef}
                isRecording={isRecording}
                isUploading={isUploading}
                cancelRecording={cancelRecording}
                stopRecording={stopRecording}
                startRecording={startRecording}
            />

            <SyncIntelligenceChat 
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendMessage={handleSendMessage}
                isChatting={isChatting}
            />

          </div>
        </div>
      </div>

      {/* PRO FOOTER */}
      <footer className="px-12 py-12 mt-auto border-t bg-muted/20">
        <div className="flex flex-col items-center justify-between gap-6 mx-auto md:flex-row max-w-7xl">
          <div className="flex items-center gap-2">
            <LogoIcon className="text-muted-foreground w-6 h-6" />
            <span className="font-semibold text-muted-foreground">SyncLoop</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <p>Built by Vineet Kumar</p>
            <a href="mailto:vineet765245@gmail.com" className="transition-colors hover:text-primary">Contact Support</a>
            <a href="https://github.com/vineet765245" target="_blank" rel="noreferrer" className="transition-colors hover:text-primary">GitHub</a>
          </div>
        </div>
      </footer>

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-[400px] p-8 text-center border bg-background rounded-2xl shadow-lg animate-in zoom-in-95">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Are you sure?</h2>
            <p className="mb-8 text-muted-foreground">{confirmMessage}</p>
            <div className="flex gap-4 justify-center">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors border rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground">Cancel</button>
                <button onClick={confirmAction} className="flex-1 inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-destructive text-destructive-foreground hover:bg-destructive/90">{confirmButtonText}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}