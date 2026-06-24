import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/meetings')
      .then((response) => response.json())
      .then((data) => setMeetings(data))
      .catch((error) => console.error("Error fetching meetings:", error));
  }, []);

  return (
    <main className="dashboard">
      <h2>Active Meetings</h2>
      
      <div className="meeting-grid">
        {meetings.map((meeting) => (
          <div 
            key={meeting._id} 
            className="meeting-card"
            onClick={() => navigate(`/meeting/${meeting._id}`)}
          >
            <h3>{meeting.title}</h3>
            <p>{meeting.agenda}</p>
            <div className="meeting-meta">
              <span className="status-badge">{meeting.status}</span>
              <span className="date-text">
                {new Date(meeting.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        
        {meetings.length === 0 && <p>Loading meetings or no meetings found...</p>}
      </div>
    </main>
  );
}

export default Dashboard;