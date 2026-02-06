import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get(`/listings/${id}`)
      .then((res) => setListing(res.data))
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && listing) {
      api.get('/listings/saved').then((res) => {
        const ids = res.data.map((l) => l._id);
        setSaved(ids.includes(id));
      }).catch(() => {});
    }
  }, [user, listing, id]);

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/listings/${id}/save`);
      setSaved(!saved);
    } catch (err) {}
  };

  const handleChat = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/chat', { state: { startListingId: id } });
  };

  const handleMarkSold = async () => {
    if (!confirm('Mark this item as sold?')) return;
    try {
      await api.post(`/listings/${id}/mark-sold`);
      setListing((l) => ({ ...l, isSold: true }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/listings/${id}`);
      navigate('/profile');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
        ) : (
          <p className="text-center text-slate-600">Listing not found.</p>
        )}
      </div>
    );
  }

  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(listing.price);

  const isOwner = user && listing.sellerId?._id === user.id;
  const seller = listing.sellerId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {listing.images?.length ? (
            <div className="space-y-2">
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full aspect-square object-cover rounded-xl"
              />
              {listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {listing.images.slice(0, 5).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-square bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
              No image
            </div>
          )}
        </div>

        <div>
          {listing.isSold && (
            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
              SOLD
            </span>
          )}
          <h1 className="text-2xl font-bold text-slate-800">{listing.title}</h1>
          <p className="text-2xl font-bold text-primary-600 mt-2">{price}</p>
          <p className="text-slate-500 mt-2">{listing.condition} · {listing.category}</p>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-800">Description</h3>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap">{listing.description}</p>
          </div>

          {seller && (
            <div className="mt-6 p-4 border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-800">Seller</h3>
              <p className="text-slate-600 mt-1">
                {seller.name} · Year {seller.year} · {seller.branch}
              </p>
              {showPhone && seller.phone && (
                <p className="text-slate-600 mt-1">Phone: {seller.phone}</p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {!listing.isSold && !isOwner && (
              <button
                onClick={handleChat}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Chat with Seller
              </button>
            )}
            {user && (
              <button
                onClick={handleSave}
                className={`px-6 py-3 rounded-lg font-medium border ${
                  saved ? 'bg-red-50 border-red-200 text-red-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {saved ? 'Saved' : 'Save'}
              </button>
            )}
            {user && !isOwner && (
              <button
                onClick={() => setReportOpen(true)}
                className="px-6 py-3 text-slate-500 hover:text-red-600"
              >
                Report
              </button>
            )}
            {isOwner && !listing.isSold && (
              <>
                <button
                  onClick={handleMarkSold}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Sold
                </button>
                <Link
                  to={`/listing/${id}/edit`}
                  className="px-6 py-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportModal
          listingId={id}
          onClose={() => setReportOpen(false)}
          onSuccess={() => setReportOpen(false)}
        />
      )}

      <p className="mt-8 text-sm text-slate-500">
        Only legal items allowed. Admins may remove listings.
      </p>
    </div>
  );
}
