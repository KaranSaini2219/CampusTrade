import { Link, useSearchParams } from 'react-router-dom';

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Sports', 'Clothing', 'Study Material', 'Other'];

export default function CategoryChips() {
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';

  const buildUrl = (category) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (category) params.set('category', category);
    return params.toString() ? `/?${params}` : '/';
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pb-0">
      <Link
        to={buildUrl('')}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !currentCategory
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
        }`}
      >
        All
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat}
          to={buildUrl(cat)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            currentCategory === cat
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
          }`}
        >
          {cat}
        </Link>
      ))}
    </div>
  );
}
