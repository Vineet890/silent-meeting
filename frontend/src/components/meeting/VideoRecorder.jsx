import { useState } from 'react';
import { CameraIcon } from '../ui/Icons';

export default function VideoRecorder({
    meetingStatus,
    videoPreviewRef,
    isRecording,
    isUploading,
    cancelRecording,
    stopRecording,
    startRecording,
    startScreenRecording,
    recordingMode
}) {
    if (meetingStatus !== 'Open') {
        return (
            <div className="p-8 text-center border bg-card text-card-foreground rounded-2xl shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-destructive">Meeting Closed</h3>
                <p className="text-muted-foreground">No further videos can be added to this thread.</p>
            </div>
        );
    }

    return (
        <div className="p-6 border bg-card text-card-foreground rounded-2xl shadow-sm">
            <h3 className="mb-4 text-lg font-semibold tracking-tight">Record a Reply</h3>
            <div className="overflow-hidden mb-4 border rounded-xl bg-muted">
                <video ref={videoPreviewRef} autoPlay muted className={`w-full aspect-video bg-black ${isRecording ? 'block' : 'hidden'}`} />
                {!isRecording && (
                    <div className="flex flex-col items-center justify-center gap-3 p-12 text-muted-foreground aspect-video">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                            <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
                        </svg>
                        <span className="text-sm font-medium">Choose a recording mode below</span>
                    </div>
                )}
            </div>

            {isRecording && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        {recordingMode === 'screen' ? 'Screen Recording' : 'Camera Recording'}
                    </span>
                </div>
            )}

            {isUploading ? (
                <button className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Processing video & generating insights...
                </button>
            ) : isRecording ? (
                <div className="flex gap-3">
                    <button onClick={cancelRecording} className="flex-1 inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors border rounded-md text-destructive border-destructive hover:bg-destructive/10">
                        Cancel
                    </button>
                    <button onClick={stopRecording} className="flex-[2] inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-green-600 text-white hover:bg-green-700">
                        Finish & Upload
                    </button>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button onClick={startRecording} className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
                            <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
                        </svg>
                        <span>Camera</span>
                    </button>
                    <button onClick={startScreenRecording} className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
                            <rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
                        </svg>
                        <span>Screen</span>
                    </button>
                </div>
            )}
        </div>
    );
}

