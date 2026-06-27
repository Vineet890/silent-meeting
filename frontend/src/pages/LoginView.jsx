import { useState } from 'react';
import { apiFetch } from '../utils/api';

function LoginView() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.location.href = '/'; 
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error. Is the backend running?");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* LEFT SIDE - BRANDING & FEATURES */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-950 border-r border-white/10 relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => window.location.href='/'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary drop-shadow-md" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
            </svg>
            <span className="text-3xl font-black tracking-tighter">SyncLoop</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-6">
            The asynchronous video platform for high-performance teams.
          </h1>
          <div className="space-y-6 text-zinc-400">
            <div className="flex items-start gap-4">
               <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
               </div>
               <div>
                 <h3 className="font-semibold text-zinc-200">Smart AI Summaries</h3>
                 <p className="text-sm leading-relaxed">Automated transcription and action items for every video update.</p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300">💬</div>
               <div>
                 <h3 className="font-semibold text-zinc-200">Threaded Discussions</h3>
                 <p className="text-sm leading-relaxed">Keep conversations contextual with deep, nested video threading.</p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300">🏢</div>
               <div>
                 <h3 className="font-semibold text-zinc-200">Secure Workspaces</h3>
                 <p className="text-sm leading-relaxed">Enterprise-grade role-based access for all your team directories.</p>
               </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-sm text-zinc-500">
          © 2026 SyncLoop. All rights reserved. Built by Vineet Kumar.
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex items-center justify-center flex-1 p-8 bg-zinc-50/30 dark:bg-background">
        <div className="w-full max-w-sm space-y-8">
          
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? 'Enter your email to sign in to your account' : 'Enter your details below to create your account'}
            </p>
          </div>
          
          {error && (
            <div className="p-3 text-sm font-medium text-center border rounded-md text-destructive bg-destructive/10 border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary hover:border-primary/50" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
            )}
            
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                <input 
                type="email" 
                placeholder="name@gmail.com" 
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary hover:border-primary/50" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
                />
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                    {isLogin && <a href="#" className="text-sm font-medium hover:underline text-primary">Forgot password?</a>}
                </div>
                <input 
                type="password" 
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary hover:border-primary/50" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
                />
            </div>

            <button type="submit" className="inline-flex items-center justify-center w-full h-12 px-4 py-2 mt-2 text-sm font-bold transition-all rounded-xl shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              className="font-medium underline cursor-pointer text-primary underline-offset-4 hover:text-primary/90" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginView;