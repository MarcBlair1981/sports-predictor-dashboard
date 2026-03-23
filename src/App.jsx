import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Settings, History, Activity, BookOpen } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/Settings';
import HistoryPage from './pages/History';
import GuidePage from './pages/Guide';

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-sportsbook-accent border-b-2 border-sportsbook-accent' : 'text-gray-400 hover:text-white';

  return (
    <nav className="bg-sportsbook-card border-b border-gray-800 px-4 py-3 sticky top-0 z-50 shadow-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 group cursor-pointer">
          <div className="bg-sportsbook-accent/20 p-2 rounded-xl group-hover:bg-sportsbook-accent/30 transition-colors">
            <Activity className="text-sportsbook-accent" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:to-white transition-colors duration-300">
            Rootz NBA Edge
          </span>
        </div>
        <div className="flex space-x-6 mt-1">
          <Link to="/" className={`flex items-center space-x-2 pb-1 transition-all duration-300 ${isActive('/')}`}>
            <Home size={18} />
            <span className="hidden sm:inline font-medium">Dashboard</span>
          </Link>
          <Link to="/history" className={`flex items-center space-x-2 pb-1 transition-all duration-300 ${isActive('/history')}`}>
            <History size={18} />
            <span className="hidden sm:inline font-medium">History</span>
          </Link>
          <Link to="/settings" className={`flex items-center space-x-2 pb-1 transition-all duration-300 ${isActive('/settings')}`}>
            <Settings size={18} />
            <span className="hidden sm:inline font-medium">Settings</span>
          </Link>
          <Link to="/guide" className={`flex items-center space-x-2 pb-1 transition-all duration-300 ${isActive('/guide')}`}>
            <BookOpen size={18} />
            <span className="hidden sm:inline font-medium">Guide</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-sportsbook-dark text-sportsbook-light font-sans selection:bg-sportsbook-accent/30 selection:text-white flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/guide" element={<GuidePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
