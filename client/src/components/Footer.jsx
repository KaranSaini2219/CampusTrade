export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t-2 border-yellow-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-slate-300 text-sm text-center">
          © 2026 CampusTrade – NIT Jalandhar <br />
          <span className="text-slate-400 text-xs">
            Developed as an academic project by B.Tech CSE students, NIT Jalandhar
          </span>
        </p>
      </div>

      {/* Gold bottom line (optional, matches navbar) */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-1"></div>
    </footer>
  );
}
