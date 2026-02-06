import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-700">CampusTrade</span>
              <span className="text-sm font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded">
                NITJ
              </span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="w-full px-4 py-2 border border-slate-200 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/new-listing"
                  className="hidden sm:inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  + Post Item
                </Link>
                <Link
                  to="/chat"
                  className="text-slate-600 hover:text-primary-600"
                >
                  Chats
                </Link>
                <Link
                  to="/profile"
                  className="text-slate-600 hover:text-primary-600"
                >
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-amber-600 hover:text-amber-700 font-medium">
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-slate-500 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-primary-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Register
                </Link>
              </>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="w-full px-4 py-2 border rounded-lg"
              />
              <button type="submit" className="mt-2 w-full py-2 bg-primary-600 text-white rounded-lg">
                Search
              </button>
            </form>
            {user && (
              <div className="space-y-2">
                <Link to="/new-listing" className="block py-2" onClick={() => setMobileOpen(false)}>
                  + Post Item
                </Link>
                <Link to="/chat" className="block py-2" onClick={() => setMobileOpen(false)}>
                  Chats
                </Link>
                <Link to="/profile" className="block py-2" onClick={() => setMobileOpen(false)}>
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block py-2 text-amber-600" onClick={() => setMobileOpen(false)}>
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
