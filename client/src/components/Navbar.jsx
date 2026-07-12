import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import CategoryChips from './CategoryChips';

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
const ProfileIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9.97 9.97 0 0112 15c2.5 0 4.78.92 6.879 2.438M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CartIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.1 2.2A1 1 0 006.8 17H17m0 0a2 2 0 100 4 2 2 0 000-4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);
const SearchIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
  </svg>
);
const PostIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileAppPages = ['/', '/profile', '/chat', '/new-listing'];
  const bottomNavPages = ['/', '/profile', '/chat', '/new-listing'];
  const isListingDetail = /^\/listing\/[^/]+$/.test(location.pathname);
  const usesMobileAppHeader = mobileAppPages.includes(location.pathname) || isListingDetail;
  const showsMobileBottomNav = bottomNavPages.includes(location.pathname) || isListingDetail;

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
    <>
      {usesMobileAppHeader && (
        <>
          <div className="sticky top-0 z-50 shadow-md md:hidden">
            <div className="bg-[#1e3a5f] px-4 py-2 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <span className="text-lg font-bold text-amber-400">CT</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-400">CampusTrade NITJ</p>
                  <p className="text-xs text-white/80">Dr. B.R. Ambedkar</p>
                  <p className="text-sm font-medium">National Institute of Technology Jalandhar</p>
                </div>
              </div>
            </div>
            <div className="h-0.5 bg-amber-400" />
            <div className="bg-[#2d3748] px-3 py-2">
              <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex flex-1 min-w-0">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search listings..."
                  className="min-w-0 flex-1 rounded-l-lg px-3 py-2 text-sm text-slate-900 outline-none"
                />
                <button type="submit" aria-label="Search listings" className="rounded-r-lg bg-amber-500 px-3 text-slate-900">
                  <span className="block h-5 w-5"><SearchIcon /></span>
                </button>
              </form>
              </div>
              {location.pathname === '/' && (
                <div className="mt-2 border-t border-white/10 pt-2">
                  <CategoryChips />
                </div>
              )}
            </div>
          </div>

          {showsMobileBottomNav && (
            <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(15,23,42,0.08)] md:hidden">
              <Link to="/" className={`flex min-w-16 flex-col items-center gap-0.5 text-xs font-medium ${location.pathname === '/' ? 'text-blue-800' : 'text-slate-600 hover:text-blue-800'}`} aria-current={location.pathname === '/' ? 'page' : undefined}>
                <span className="h-5 w-5"><HomeIcon /></span>
                Home
              </Link>
              <Link to="/chat" className={`flex min-w-12 flex-col items-center gap-0.5 text-xs font-medium ${location.pathname === '/chat' ? 'text-blue-800' : 'text-slate-600 hover:text-blue-800'}`} aria-current={location.pathname === '/chat' ? 'page' : undefined}>
                <span className="h-5 w-5"><ChatIcon /></span>
                Chat
              </Link>
              <Link to="/new-listing" className={`flex min-w-12 flex-col items-center gap-0.5 text-xs font-medium ${location.pathname === '/new-listing' ? 'text-blue-800' : 'text-slate-600 hover:text-blue-800'}`} aria-current={location.pathname === '/new-listing' ? 'page' : undefined}>
                <span className="h-5 w-5"><PostIcon /></span>
                Post
              </Link>
              <Link to="/profile" className={`flex min-w-16 flex-col items-center gap-0.5 text-xs font-medium ${location.pathname === '/profile' ? 'text-blue-800' : 'text-slate-600 hover:text-blue-800'}`} aria-current={location.pathname === '/profile' ? 'page' : undefined}>
                <span className="h-5 w-5"><ProfileIcon /></span>
                Profile
              </Link>
              <Link to="/profile#saved-items" className="flex min-w-12 flex-col items-center gap-0.5 text-xs font-medium text-slate-600 hover:text-blue-800">
                <span className="h-5 w-5"><CartIcon /></span>
                Cart
              </Link>
            </nav>
          )}
        </>
      )}

    <nav className={`${usesMobileAppHeader ? 'hidden md:block' : ''} z-50 shadow-md`}>
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
    </>
  );
}
