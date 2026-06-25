import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function MeetingView() {
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
  const chatScrollRef = useRef(null);

  const [comments, setComments] = useState({}); 
  const [newCommentText, setNewCommentText] = useState({}); 
  const [activeReplyBox, setActiveReplyBox] = useState(null); 

  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const socketRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    fetch(`http://localhost:5000/api/meetings/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setMeeting(data.meeting);
        setReplies(data.replies);
        setWorkspace(data.workspace);

        data.replies.forEach(reply => {
            fetch(`http://localhost:5000/api/comments/${reply._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(r => r.json())
            .then(cData => {
                setComments(prev => ({ ...prev, [reply._id]: cData }));
            });
        });
      });

    const newSocket = io('http://localhost:5000');
    socketRef.current = newSocket;
    newSocket.emit('join_meeting', id);

    newSocket.on('new_reply', (newReply) => {
      setReplies((prev) => [newReply, ...prev]);
    });

    newSocket.on('reply_deleted', (deletedReplyId) => {
      setReplies((prev) => prev.filter(r => r._id !== deletedReplyId));
    });

    newSocket.on('meeting_closed', (updatedMeeting) => {
      setMeeting(updatedMeeting);
    });

    newSocket.on('new_comment', (newComment) => {
        setComments(prev => ({
            ...prev,
            [newComment.replyId]: [...(prev[newComment.replyId] || []), newComment]
        }));
    });

    return () => newSocket.disconnect();
  }, [id]);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = handleUpload;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone/Camera permission denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      const stream = videoPreviewRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('video', videoBlob, 'reply.webm');
    formData.append('meetingId', id);

    const token = localStorage.getItem('token');
    await fetch('http://localhost:5000/api/replies', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    setIsUploading(false);
  };

  const handleDeleteVideo = async (replyId) => {
    if (!window.confirm("Are you sure you want to permanently delete this video?")) return;
    
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/replies/${replyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
  };

  const handleCloseMeeting = async () => {
    if (!window.confirm("Are you sure? Once closed, no one can upload new videos!")) return;

    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/meetings/${id}/close`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true); 

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/meetings/${id}/chat`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message: userMessage.text })
    });

    const data = await response.json();
    if (response.ok) {
        setChatMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
    } else {
        setChatMessages((prev) => [...prev, { role: 'ai', text: `Error: ${data.error}` }]);
    }
    setIsChatting(false);
  };

  const handlePostComment = async (replyId, parentCommentId = null) => {
      const textKey = parentCommentId ? parentCommentId : replyId;
      const text = newCommentText[textKey];
      if (!text || !text.trim()) return;

      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/comments', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ replyId, text, parentCommentId })
      });

      setNewCommentText(prev => ({ ...prev, [textKey]: '' }));
      if (parentCommentId) setActiveReplyBox(null);
  };

  if (!meeting) return <div className="app-container"><p>Loading Meeting...</p></div>;

  return (
    <div className="app-container">
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '1rem' }}>
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', gap: '2rem' }}>
        
        <div style={{ flex: 2 }}>
          <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ marginBottom: '0.5rem', color: '#c084fc' }}>{meeting.title}</h1>
              <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '1rem' }}>{meeting.agenda}</p>
              <span className={meeting.status === 'Open' ? 'status-badge' : 'status-badge closed'}>
                {meeting.status}
              </span>
            </div>
            
            {workspace && user.id === workspace.ownerId && meeting.status === 'Open' && (
              <button onClick={handleCloseMeeting} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                🔒 Close Meeting
              </button>
            )}
          </div>

          <div className="replies-feed">
            <h3>Video Thread</h3>
            {replies.map((reply) => (
              <div key={reply._id} className="reply-card">
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="date-text">{new Date(reply.createdAt).toLocaleString()}</span>
                  {reply.userId === user.id && (
                    <button onClick={() => handleDeleteVideo(reply._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Delete Video">🗑️</button>
                  )}
                </div>

                <video src={reply.videoUrl} controls style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
                
                <div className="ai-summary-box" style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ AI Summary</h4>
                  <p>{reply.textContent}</p>
                </div>

                {/* THREADED COMMENTS UI */}
                <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Discussion</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {(comments[reply._id] || []).filter(c => !c.parentCommentId).map(comment => (
                            <div key={comment._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                
                                {/* THE UPDATED PARENT COMMENT WITH CSS FIX */}
                                <div style={{ backgroundColor: '#1e293b', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ color: '#c084fc', fontSize: '0.85rem' }}>{comment.userName}: </strong>
                                        <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{comment.text}</span>
                                    </div>
                                    <button 
                                        onClick={() => setActiveReplyBox(activeReplyBox === comment._id ? null : comment._id)}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                                        onMouseOver={(e) => e.target.style.color = '#c084fc'}
                                        onMouseOut={(e) => e.target.style.color = '#94a3b8'}
                                    >
                                        Reply
                                    </button>
                                </div>

                                {(comments[reply._id] || []).filter(c => c.parentCommentId === comment._id).map(nestedReply => (
                                    <div key={nestedReply._id} style={{ backgroundColor: '#1e293b', padding: '0.5rem 0.75rem', borderRadius: '6px', marginLeft: '2rem', borderLeft: '2px solid #334155' }}>
                                        <strong style={{ color: '#10b981', fontSize: '0.85rem' }}>{nestedReply.userName}: </strong>
                                        <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{nestedReply.text}</span>
                                    </div>
                                ))}

                                {activeReplyBox === comment._id && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem', marginTop: '0.25rem' }}>
                                        <input 
                                            type="text" 
                                            className="glass-input" 
                                            placeholder={`Reply to ${comment.userName}...`} 
                                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', margin: 0 }}
                                            value={newCommentText[comment._id] || ''}
                                            onChange={(e) => setNewCommentText(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(reply._id, comment._id); }}
                                        />
                                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handlePostComment(reply._id, comment._id)}>
                                            Send
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Write a comment..." 
                            style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', margin: 0 }}
                            value={newCommentText[reply._id] || ''}
                            onChange={(e) => setNewCommentText(prev => ({ ...prev, [reply._id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(reply._id, null); }}
                        />
                        <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => handlePostComment(reply._id, null)}>
                            Comment
                        </button>
                    </div>
                </div>

              </div>
            ))}
            {replies.length === 0 && <p style={{ color: '#94a3b8' }}>No replies yet. Be the first to speak!</p>}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {meeting.status === 'Open' ? (
            <div className="glass-panel" style={{ position: 'sticky', top: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Record a Reply</h3>
              <div className="video-preview-container" style={{ marginBottom: '1rem', background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                <video ref={videoPreviewRef} autoPlay muted style={{ width: '100%', display: isRecording ? 'block' : 'none' }} />
                {!isRecording && <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Camera Off</div>}
              </div>
              {isUploading ? (
                <button className="btn-primary" disabled style={{ width: '100%', opacity: 0.7 }}>⏳ AI is analyzing video...</button>
              ) : isRecording ? (
                <button onClick={stopRecording} className="btn-primary" style={{ width: '100%', backgroundColor: '#ef4444' }}>⏹ Stop & Upload</button>
              ) : (
                <button onClick={startRecording} className="btn-primary" style={{ width: '100%' }}>▶️ Start Camera</button>
              )}
            </div>
          ) : (
             <div className="glass-panel" style={{ position: 'sticky', top: '2rem', textAlign: 'center' }}>
                <h3 style={{ color: '#ef4444' }}>Meeting Closed</h3>
                <p style={{ color: '#94a3b8' }}>No further videos can be added to this thread.</p>
             </div>
          )}

          <div className="glass-panel ai-summary-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '400px', position: 'sticky', top: meeting.status === 'Open' ? '30rem' : '15rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Meeting Chatbot</h3>
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: msg.role === 'user' ? '#c084fc' : '#1e293b', padding: '0.75rem 1rem', borderRadius: '12px', maxWidth: '85%', color: 'white', border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</p>
                </div>
              ))}
              {chatMessages.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>Ask me anything about this meeting!</p>}
              {isChatting && <div style={{ alignSelf: 'flex-start', backgroundColor: '#1e293b', padding: '0.75rem 1rem', borderRadius: '12px', color: '#94a3b8', fontSize: '0.9rem' }}>Thinking...</div>}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a question..." className="glass-input" style={{ flex: 1, padding: '0.5rem', margin: 0 }} disabled={isChatting} />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={isChatting}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingView;