import { Link } from 'react-router-dom';
import GlobalFooter from '../components/layout/GlobalFooter';

function LandingView() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* GLOBAL VIBRANT BACKGROUND ORBS */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-40"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-info/10 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-40"></div>
      </div>
      
      {/* HEADER */}
      <header className="fixed w-full top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary drop-shadow-md" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
          </svg>
          <span className="text-2xl font-black tracking-tighter">SyncLoop</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 text-sm font-medium transition-colors rounded-xl text-muted-foreground hover:text-foreground">
            Sign In
          </Link>
          <Link to="/login" className="px-4 py-2 text-sm font-bold transition-all rounded-xl shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1">
        <section className="relative flex flex-col items-center justify-center px-4 py-32 text-center overflow-hidden">
          <div className="relative z-10 mt-12 w-full max-w-6xl mx-auto">
            <h1 className="max-w-5xl mx-auto mb-8 text-5xl font-black tracking-tighter sm:text-7xl lg:text-[6rem] leading-[1.1]">
              <span className="block pb-2">Meetings that</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-info to-fuchsia-500 drop-shadow-sm pb-4">don't waste your time.</span>
            </h1>
            <p className="max-w-2xl mx-auto mb-12 text-xl font-medium text-muted-foreground leading-relaxed">
              SyncLoop replaces endless live calls with asynchronous video threads. Record your updates, watch them on your own time, and let AI summarize the key takeaways.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold transition-all rounded-full shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)] bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95">
                Start for free
              </Link>
              <a href="#features" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold transition-all rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-foreground hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/40 shadow-xl hover:shadow-2xl">
                Explore Features
              </a>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="px-4 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-2xl font-black text-primary">1</div>
                <h3 className="text-2xl font-bold mb-4">Record your update</h3>
                <p className="text-muted-foreground leading-relaxed">Turn on your camera and screen. Talk through your project, give feedback, or explain a complex issue.</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-2xl font-black text-primary">2</div>
                <h3 className="text-2xl font-bold mb-4">AI processes it</h3>
                <p className="text-muted-foreground leading-relaxed">AI automatically transcribes your video and extracts key action items and summaries instantly.</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-2xl font-black text-primary">3</div>
                <h3 className="text-2xl font-bold mb-4">Team responds</h3>
                <p className="text-muted-foreground leading-relaxed">Teammates watch when they are free, read the summary, and reply with their own nested video threads.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 bg-muted/30 border-y">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">Built for speed and clarity.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to communicate effectively without ever scheduling a live call.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Video Threads</h3>
                <p className="text-muted-foreground leading-relaxed">Record your screen and camera directly in the browser. Reply to specific videos to keep the conversation perfectly contextual.</p>
              </div>
              <div className="bg-background border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Smart AI Summaries</h3>
                <p className="text-muted-foreground leading-relaxed">Every video is instantly transcribed and summarized. Stop watching 10-minute videos just to find one action item.</p>
              </div>
              <div className="bg-background border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Team Workspaces</h3>
                <p className="text-muted-foreground leading-relaxed">Create private workspaces for different projects or departments. Invite your teammates and organize discussions securely.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-6">Ready to cancel your next meeting?</h2>
            <p className="text-xl text-muted-foreground mb-10">Join the waitlist of teams switching to asynchronous communication.</p>
            <Link to="/login" className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold transition-transform rounded-full shadow-xl bg-primary text-primary-foreground hover:scale-105 active:scale-95">
              Get Started for Free
            </Link>
          </div>
        </section>

      </main>

      <GlobalFooter />
    </div>
  );
}

export default LandingView;
