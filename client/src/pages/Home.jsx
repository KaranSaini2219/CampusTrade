import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import CategoryChips from '../components/CategoryChips';

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort && sort !== 'newest') params.set('sort', sort);
    api
      .get(`/listings?${params}`)
      .then((res) => setListings(res.data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [search, category, sort]);

  useEffect(() => {
    if (user) {
      api.get('/listings/saved').then((res) => {
        const ids = new Set(res.data.map((l) => l._id));
        setSavedIds(ids);
      }).catch(() => {});
    }
  }, [user]);

  const handleSaveToggle = async (listingId) => {
    if (!user) return;
    try {
      await api.post(`/listings/${listingId}/save`);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(listingId)) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
    } catch (err) {}
  };

  const updateSort = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Campus Marketplace
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-2xl mx-auto">
              Official student marketplace for NIT Jalandhar • Safe campus trades • Cash only
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-center text-sm text-slate-700">
            ⚠️ <strong>Important:</strong> Meet only on campus in public areas. Only legal items allowed. Admins monitor all listings.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Filters & Sort Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filters */}
            <div className="flex-1">
              <CategoryChips />
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <label htmlFor="sort-select" className="text-sm font-medium text-slate-700">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => updateSort(e.target.value)}
                className="border-2 border-slate-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="newest">📅 Newest First</option>
                <option value="price-asc">💰 Price: Low → High</option>
                <option value="price-desc">💎 Price: High → Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results Info */}
        {search && (
          <div className="bg-blue-50 border-l-4 border-blue-700 p-4 mb-6 rounded-r-lg">
            <p className="text-slate-800 font-medium">
              🔍 Search results for: <span className="text-blue-900 font-bold">&quot;{search}&quot;</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Found {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Stats Bar */}
        {!loading && listings.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{listings.length}</span> active listing{listings.length !== 1 ? 's' : ''}
            </p>
            {category && (
              <span className="text-sm text-slate-500">
                Category: <span className="font-medium text-blue-900">{category}</span>
              </span>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <div className="max-w-md mx-auto">
              <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No listings found</h3>
              <p className="text-slate-600 mb-4">
                {search || category 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to post an item!'}
              </p>
              {user && (
                <button
                  onClick={() => navigate('/new-listing')}
                  className="inline-flex items-center px-6 py-3 bg-yellow-500 text-slate-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                >
                  📋 Post Your First Item
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                saved={savedIds.has(listing._id)}
                onSaveToggle={user ? handleSaveToggle : undefined}
              />
            ))}
          </div>
        )}

        {/* Footer Info */}
        {listings.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              All listings are verified by NIT Jalandhar students
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
