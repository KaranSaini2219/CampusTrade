import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import CategoryChips from '../components/CategoryChips';

export default function Home() {
  const [searchParams] = useSearchParams();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          CampusTrade NITJ
        </h1>
        <p className="text-slate-600">
          Buy & sell within NIT Jalandhar. Meetup + cash only. Only legal items allowed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <CategoryChips />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort:</span>
          <select
            value={sort}
            onChange={(e) => updateSort(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {search && (
        <p className="text-slate-600 mb-4">
          Results for &quot;{search}&quot;
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600">No listings found.</p>
          <p className="text-sm text-slate-500 mt-2">Try a different search or category.</p>
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
      

      {/*<p className="mt-8 text-center text-sm text-slate-500">
        Only legal items allowed. Admins may remove listings. NIT Jalandhar students only.
      </p>*/}
    </div>
  );
}
