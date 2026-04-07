export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.name || 'User'}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold ${className}`}
    >
      {initial}
    </div>
  );
}
