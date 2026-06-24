import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder';

function MeetingView() {
  const { id } = useParams(); 
  const [meeting, setMeeting] = useState(null);
  
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/meetings/${id}`)
      .then((response) => response.json())
      .then((data) => setMeeting(data));

    fetch(`http://localhost:5000/api/replies/${id}`)
      .then((response) => response.json())
      .then((data) => setReplies(data));
      
  }, [id]);

  if (!meeting) return <div className="app-container"><p>Loading...</p></div>;

  return (
    <div className="meeting-view">
      <div className="meeting-header">
        <h2>{meeting.title}</h2>
        <p className="agenda-text">{meeting.agenda}</p>
        <span className="status-badge">{meeting.status}</span>
      </div>

      <div className="meeting-content">
        <div className="video-thread-section">
          
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <VideoRecorder meetingId={id} />
          </div>

          <h3>Video Thread ({replies.length} Replies)</h3>
          
          <div className="replies-list">
            {replies.map((reply) => (
              <div key={reply._id} className="glass-panel" style={{ marginBottom: '1rem' }}>
                <video 
                  src={reply.videoUrl} 
                  controls 
                  style={{ width: '100%', borderRadius: '8px' }}
                />
                
                {/* Paint the Groq AI Summary if it exists! */}
                {reply.transcript && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(192, 132, 252, 0.1)', borderRadius: '8px', borderLeft: '3px solid #c084fc' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#c084fc' }}>✨ AI Summary</h4>
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {reply.transcript}
                    </p>
                  </div>
                )}

                <p className="date-text" style={{ marginTop: '0.5rem' }}>
                  Posted on {new Date(reply.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            
            {replies.length === 0 && <p>No replies yet. Be the first to record one!</p>}
          </div>

        </div>

        <div className="ai-summary-sidebar">
          <h3>✨ AI Summary</h3>
          <div className="glass-panel">
            <p><strong>Decisions:</strong> Pending...</p>
            <p><strong>Action Items:</strong> Waiting for videos...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingView;