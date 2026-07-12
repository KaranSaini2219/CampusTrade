import { Link } from 'react-router-dom';

export default function ListingCard({ listing, saved, onSaveToggle, compactOnMobile = false }) {
  const image = listing.images?.[0] || '/placeholder.svg';
  const hasMultipleImages = listing.images?.length > 1;
  const imageCount = listing.images?.length || 0;
  
  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(listing.price);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-700 transition-all relative group">
      <Link to={`/listing/${listing._id}`} className="block">
        <div className={`${compactOnMobile ? 'aspect-[4/3] sm:aspect-square' : 'aspect-square'} bg-slate-100 relative overflow-hidden`}>
          <div className={`${compactOnMobile ? 'aspect-[4/3] sm:aspect-square' : 'aspect-square'} bg-slate-100 relative overflow-hidden`}>
  {listing.images?.length > 0 ? (
    <img
      src={listing.images[0]}
      alt={listing.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  ) : null}

  {/* Placeholder shown when no image or image fails to load */}
  <div
    style={{ display: listing.images?.length > 0 ? 'none' : 'flex' }}
    className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400"
  >
    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    <span className="text-xs font-medium">No Image</span>
  </div>

  {/* Multiple Images Indicator */}
  {hasMultipleImages && (
    <div className="absolute top-2 left-2 bg-slate-900/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
      {imageCount}
    </div>
  )}

  {/* Sold Overlay */}
  {listing.isSold && (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
      <span className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold text-lg">
        SOLD
      </span>
    </div>
  )}
</div>
          
          {/* Multiple Images Indicator */}
          {hasMultipleImages && (
            <div className="absolute top-2 left-2 bg-slate-900/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {imageCount}
            </div>
          )}
          
          {/* Sold Overlay */}
          {listing.isSold && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold text-lg">
                SOLD
              </span>
            </div>
          )}
        </div>
        
        <div className={compactOnMobile ? 'p-2.5 sm:p-4' : 'p-4'}>
          <h3 className={`${compactOnMobile ? 'text-sm sm:text-base' : ''} font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-900 transition-colors`}>
            {listing.title}
          </h3>
          <p className={`${compactOnMobile ? 'text-base sm:text-lg' : 'text-lg'} text-blue-900 font-bold mt-1`}>{price}</p>
          <div className={`${compactOnMobile ? 'mt-1.5 gap-1' : 'mt-2 gap-2'} flex items-center`}>
            <span className={`${compactOnMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'} text-xs bg-slate-100 text-slate-700 rounded`}>
              {listing.condition}
            </span>
            <span className={`${compactOnMobile ? 'hidden sm:inline' : ''} text-xs text-slate-500`}>
              {listing.category}
            </span>
          </div>
        </div>
      </Link>
      
      {/* Save Button */}
      {onSaveToggle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onSaveToggle(listing._id);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg z-10 transition-all hover:scale-110"
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          {saved ? (
            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
