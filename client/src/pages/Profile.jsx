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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{user?.name}</h1>
        <p className="text-slate-600 mt-1">
          Year {user?.year} · {user?.branch}
        </p>
        <p className="text-slate-500 text-sm mt-2">{user?.email}</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('listings')}
          className={`px-4 py-2 font-medium ${
            tab === 'listings' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'
          }`}
        >
          My Listings
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`px-4 py-2 font-medium ${
            tab === 'saved' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'
          }`}
        >
          Saved
        </button>
        <Link
          to="/chat"
          className={`px-4 py-2 font-medium ${
            tab === 'chats' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'
          }`}
        >
          My Chats
        </Link>
      </div>

      <Link
        to="/new-listing"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mb-6"
      >
        + Post New Item
      </Link>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === 'listings' ? (
        myListings.length === 0 ? (
          <p className="text-slate-600">You haven&apos;t posted any items yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )
      ) : (
        savedListings.length === 0 ? (
          <p className="text-slate-600">No saved items.</p>
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
  );
}
