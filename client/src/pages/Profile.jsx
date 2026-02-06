import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState('listings');
  const [myListings, setMyListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/listings?mine=1').then((res) => setMyListings(res.data)).catch(() => {});
    api.get('/listings/saved').then((res) => setSavedListings(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (tab === 'listings') {
      api.get('/listings?mine=1').then((res) => setMyListings(res.data));
    }
  }, [tab]);

  const handleSaveToggle = async (listingId) => {
    try {
      await api.post(`/listings/${listingId}/save`);
      setSavedListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {}
  };

  // Calculate stats
  const activeListings = myListings.filter(l => !l.isSold).length;
  const soldListings = myListings.filter(l => l.isSold).length;
  const totalListings = myListings.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 border-b-4 border-yellow-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
          <p className="text-blue-200 text-sm mt-1">Manage your listings and saved items</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Student ID Card Section */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-semibold text-sm">STUDENT PROFILE</span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
              </div>

              {/* Student Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {user?.name || 'Student'}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="w-4 h-4 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                    <span><span className="font-semibold">Year {user?.year || 'N/A'}</span> • {user?.branch || 'Branch'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="w-4 h-4 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-slate-600">{user?.email || 'email@nitj.ac.in'}</span>
                  </div>
                  {user?.rollNumber && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <svg className="w-4 h-4 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Roll No: {user.rollNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                <Link
                  to="/new-listing"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-400 font-semibold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Item
                </Link>
                <Link
                  to="/chat"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Listings</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{totalListings}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{activeListings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Sold</p>
                <p className="text-3xl font-bold text-slate-700 mt-1">{soldListings}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Saved Items</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{savedListings.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-t-lg shadow-sm border border-slate-200 border-b-0">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setTab('listings')}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${
                tab === 'listings' 
                  ? 'bg-blue-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📋 My Listings ({totalListings})
            </button>
            <button
              onClick={() => setTab('saved')}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${
                tab === 'saved' 
                  ? 'bg-blue-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              ❤️ Saved ({savedListings.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-lg shadow-sm border border-slate-200 p-6 min-h-96">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tab === 'listings' ? (
            myListings.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No listings yet</h3>
                <p className="text-slate-600 mb-6">Start selling items you no longer need!</p>
                <Link
                  to="/new-listing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-slate-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Your First Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            )
          ) : (
            savedListings.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No saved items</h3>
                <p className="text-slate-600 mb-6">Browse listings and save items you're interested in</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                >
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedListings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    saved
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
