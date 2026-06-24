import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MeetingView from './pages/MeetingView';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="glass-header">
          {/* 2. <Link> replaces the traditional <a href> tag */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1>Silent Meeting</h1>
            <p>Async collaboration for modern teams</p>
          </Link>
        </header>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
              <Route path="/meeting/:id" element={<MeetingView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;