import { Link } from 'react-router-dom';

export default function ListingCard({ listing, saved, onSaveToggle }) {
  const image = listing.images?.[0] || '/placeholder.svg';
  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(listing.price);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative">
      <Link to={`/listing/${listing._id}`} className="block">
        <div className="aspect-square bg-slate-100 relative">
          <img
            src={image}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
          {listing.isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded font-bold">SOLD</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 line-clamp-1">{listing.title}</h3>
          <p className="text-primary-600 font-bold mt-1">{price}</p>
          <p className="text-sm text-slate-500 mt-1">{listing.condition} · {listing.category}</p>
        </div>
      </Link>
      {onSaveToggle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onSaveToggle(listing._id);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow"
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          {saved ? (
            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
