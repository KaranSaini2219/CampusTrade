import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const Icon = ({ children, className = '' }) => (
  <span className={`inline-flex items-center justify-center w-4 h-4 ${className}`}>{children}</span>
);

const HomeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const ChatIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const LogoutIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    } else {
      navigate('/');
    }
    setMobileOpen(false);
  };

  return (
    <nav className="z-50 shadow-md">
      {/* Top tier - NITJ branding */}
      <div className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-amber-400">CT</span>
            </div>
            <div>
              <p className="text-xs text-white/80">Dr. B.R. Ambedkar</p>
              <p className="text-sm font-medium">National Institute of Technology Jalandhar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Yellow accent line */}
      <div className="h-0.5 bg-amber-400" />

      {/* Lower tier - Navigation */}
      <div className="bg-[#2d3748] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 gap-6">
            {/* Left: CampusTrade NITJ, Home */}
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-amber-400 font-semibold">| CampusTrade NITJ |</span>
              <Link to="/" className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors">
                <Icon><HomeIcon /></Icon>
                Home
              </Link>
            </div>

            {/* Center: Search bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 justify-center max-w-md mx-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="w-full px-3 py-1.5 text-sm text-slate-900 bg-white rounded-l border-0 focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-[#2d3748]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-r hover:bg-amber-400 text-sm font-medium shrink-0"
              >
                Search
              </button>
            </form>

            {/* Right: Post Item, Chats, Profile (with avatar), Admin, Logout */}
            <div className="flex items-center gap-4 shrink-0 ml-auto">
              {user ? (
                <>
                  <Link to="/new-listing" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-900 rounded hover:bg-amber-400 font-medium text-sm">
                    + Post Item
                  </Link>
                  <Link to="/chat" className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors">
                    <Icon><ChatIcon /></Icon>
                    Chats
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors">
                    <Avatar user={user} size="sm" />
                    <span className="hidden lg:inline">Profile</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-amber-400 hover:text-amber-300 font-medium">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
                  >
                    <Icon><LogoutIcon /></Icon>
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-200 hover:text-white">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded hover:bg-amber-400 font-medium text-sm"
                  >
                    Register
                  </Link>
                </>
              )}
              <button
                className="md:hidden p-2 text-gray-300 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#2d3748] border-t border-white/10 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="w-full px-4 py-2 text-slate-900 rounded-lg mb-2"
            />
            <button type="submit" className="w-full py-2 bg-amber-500 text-slate-900 rounded-lg font-medium">
              Search
            </button>
          </form>
          {user && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <Link to="/new-listing" className="flex items-center gap-2 py-2 text-gray-200" onClick={() => setMobileOpen(false)}>
                + Post Item
              </Link>
              <Link to="/chat" className="flex items-center gap-2 py-2 text-gray-200" onClick={() => setMobileOpen(false)}>
                Chats
              </Link>
              <Link to="/profile" className="flex items-center gap-3 py-2 text-gray-200" onClick={() => setMobileOpen(false)}>
                <Avatar user={user} size="sm" />
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="block py-2 text-amber-400" onClick={() => setMobileOpen(false)}>Admin</Link>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
