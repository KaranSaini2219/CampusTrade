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
  const [selectedImage, setSelectedImage] = useState(0); // For image carousel

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

  const nextImage = () => {
    setSelectedImage((prev) => 
      prev === (listing.images?.length || 0) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImage((prev) => 
      prev === 0 ? (listing.images?.length || 0) - 1 : prev - 1
    );
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
  const hasImages = listing.images?.length > 0;
  const hasMultipleImages = listing.images?.length > 1;

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 md:px-4 md:py-8">
      <div className="grid gap-5 lg:grid-cols-2 md:gap-8">
        {/* Image Gallery Section */}
        <div className="space-y-4">
          {hasImages ? (
            <>
              {/* Main Image Display */}
              <div className="relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden group sm:aspect-square">
                <img
                  src={listing.images[selectedImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation Arrows - Only show if multiple images */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-100 transition-opacity hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-100 transition-opacity hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImage + 1} / {listing.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery - Only show if multiple images */}
              {hasMultipleImages && (
                <div className="grid grid-cols-5 gap-2">
                  {listing.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === i 
                          ? 'border-blue-900 ring-2 ring-blue-200' 
                          : 'border-slate-200 hover:border-blue-500'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-[4/3] bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 sm:aspect-square">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No image</p>
              </div>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-4 md:space-y-6">
          {listing.isSold && (
            <span className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold">
              ❌ SOLD
            </span>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{listing.title}</h1>
            <p className="mt-2 text-2xl font-bold text-blue-900 md:mt-3 md:text-3xl">{price}</p>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
              {listing.condition}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              {listing.category}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>

          {seller && (
            <div className="p-4 border-2 border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Seller Information</h3>
              <p className="text-slate-700">
                <span className="font-medium">{seller.name}</span>
              </p>
              <p className="text-slate-600 text-sm mt-1">
                Year {seller.year} · {seller.branch}
              </p>
              {showPhone && seller.phone && (
                <p className="text-slate-700 mt-2 font-medium">
                  📞 {seller.phone}
                </p>
              )}
              {!showPhone && seller.phone && !isOwner && (
                <button
                  onClick={() => setShowPhone(true)}
                  className="mt-2 text-sm text-blue-900 hover:text-blue-700 font-medium"
                >
                  Show contact number
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            {!listing.isSold && !isOwner && (
              <button
                onClick={handleChat}
                className="w-full px-6 py-3 bg-yellow-500 text-slate-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors sm:flex-1"
              >
                💬 Chat with Seller
              </button>
            )}
            
           {user && !listing.isSold && (
              <button
                onClick={handleSave}
                className={`w-full px-6 py-3 rounded-lg font-medium border-2 transition-all sm:w-auto ${
                  saved 
                    ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {saved ? '❤️ Saved' : '🤍 Save'}
              </button>
            )}
            
            {user && !isOwner && (
              <button
                onClick={() => setReportOpen(true)}
                className="w-full px-6 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors sm:w-auto"
              >
                🚩 Report
              </button>
            )}
            
            {isOwner && !listing.isSold && (
              <>
                <button
                  onClick={handleMarkSold}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors sm:w-auto"
                >
                  ✓ Mark as Sold
                </button>
                <Link
                  to={`/listing/${id}/edit`}
                  className="w-full px-6 py-3 border-2 border-blue-900 text-blue-900 rounded-lg font-medium hover:bg-blue-50 transition-colors sm:w-auto"
                >
                  ✏️ Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium disabled:opacity-50 transition-colors sm:w-auto"
                >
                  🗑️ Delete
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

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-slate-700">
          ⚠️ <strong>Safety Notice:</strong> Only legal items allowed. Meet on campus in public areas. Cash transactions only. Admins may remove listings.
        </p>
      </div>
    </div>
  );
}
