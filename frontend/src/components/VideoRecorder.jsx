import { useState, useRef } from 'react';

function VideoRecorder({ meetingId }) {
  const liveVideoRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false); 

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(e => console.error(e));
      }

      const recorder = new MediaRecorder(stream);
      let chunks = []; 

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(finalBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start(1000); 
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Please allow camera access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!videoBlob) return;
    setIsUploading(true); 
    
    const formData = new FormData();
    formData.append('video', videoBlob, 'reply.webm');
    formData.append('meetingId', meetingId);

    try {
      console.log("Throwing video to backend...");
      const response = await fetch('http://localhost:5000/api/replies', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert("Upload successful! Your video is in the cloud!");
        setVideoBlob(null);
      } else {
        alert("Upload failed. Check the backend console.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="video-recorder-container">
      {!videoBlob ? (
        <div className="recording-mode">
          <video ref={liveVideoRef} autoPlay muted playsInline className="live-video-preview" />
          
          <div className="controls">
            {!isRecording ? (
              <button className="btn-primary" onClick={startCamera}>🔴 Start Recording</button>
            ) : (
              <button className="btn-danger" onClick={stopRecording}>⏹ Stop Recording</button>
            )}
          </div>
        </div>
      ) : (
        <div className="playback-mode">
          <h3>Review Your Reply</h3>
          <video src={URL.createObjectURL(videoBlob)} controls className="recorded-video-preview" />
          
          <div className="controls">
            <button className="btn-secondary" onClick={() => setVideoBlob(null)}>
              🗑 Retake
            </button>
            
            <button className="btn-success" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "⏳ Uploading to Cloud..." : "🚀 Upload Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;