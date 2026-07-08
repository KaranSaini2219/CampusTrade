import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Forgot your password?</h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter your NITJ email and we'll send you a code to reset it.
        </p>

        {submitted ? (
          <div>
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded px-3 py-2 mb-4">
              {message}
            </p>
            <Link
              to="/reset-password"
              state={{ email }}
              className="block text-center bg-blue-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800"
            >
              Enter code
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nitj.ac.in"
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
            <Link to="/login" className="block text-center text-sm text-slate-500 hover:underline">
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}