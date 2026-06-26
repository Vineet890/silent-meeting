import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MeetingView from './pages/MeetingView';
import LoginView from './pages/LoginView';
import TeamView from './pages/TeamView';
import SettingsView from './pages/SettingsView';
import LandingView from './pages/LandingView';
import HomeView from './pages/HomeView';
import ProtectedLayout from './components/layout/ProtectedLayout';
import './index.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
      return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('darkMode', 'true');
      } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('darkMode', 'false');
      }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginView />} />
        
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <ProtectedLayout activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
              <HomeView activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
            </ProtectedLayout> 
            : <LandingView />
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
            <ProtectedLayout activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
              <Dashboard activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
            </ProtectedLayout> 
            : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/team" 
          element={
            isAuthenticated ? 
            <ProtectedLayout activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
              <TeamView activeWorkspace={activeWorkspace} />
            </ProtectedLayout> 
            : <Navigate to="/login" />
          } 
        />

        <Route 
          path="/settings" 
          element={
            isAuthenticated ? 
            <ProtectedLayout activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
              <SettingsView />
            </ProtectedLayout> 
            : <Navigate to="/login" />
          } 
        />

        <Route 
          path="/meetings/:id" 
          element={
            isAuthenticated ? 
            <MeetingView isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} /> 
            : <Navigate to="/login" />
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;