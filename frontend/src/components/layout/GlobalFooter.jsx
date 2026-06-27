import { Link } from 'react-router-dom';

export default function GlobalFooter() {
  return (
    <footer className="px-6 md:px-12 py-12 mt-auto border-t border-border/50 bg-background">
      <div className="flex flex-col items-center justify-between gap-6 mx-auto md:flex-row max-w-7xl">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
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
  );
}
