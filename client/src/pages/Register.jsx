import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const YEARS = ['1', '2', '3', '4', 'MTech'];
const BRANCHES = [
  'CSE', 'ECE', 'EE', 'ME', 'CE', 'CHE', 'MSE', 'ICE', 'BT',
  'Mathematics', 'Physics', 'Chemistry', 'Other'
];

export default function Register() {
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [form, setForm] = useState({
    email: '', password: '', name: '', year: '', branch: '',
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRegister = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    await authApi.post('/auth/register', form);
    setStep('otp');
    startResendTimer();
  } catch (err) {
    const data = err.response?.data;
    if (data?.canResend) {
      setError('Email failed to send. Click Resend OTP below.');
      setStep('otp');
      startResendTimer();
    } else {
      setError(data?.message || 'Registration failed.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.post('/auth/verify-otp', {
        email: form.email,
        otp,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      await authApi.post('/auth/resend-otp', { email: form.email });
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // OTP Screen
  if (step === 'otp') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Check your email</h1>
              <p className="text-slate-600 text-sm mt-2">
                We sent a 6-digit OTP to
              </p>
              <p className="font-semibold text-blue-900">{form.email}</p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="mt-1 w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl font-bold tracking-widest"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-600">
                Didn't receive it?{' '}
                <button
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0}
                  className="text-blue-900 font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </p>
            </div>

            <button
              onClick={() => { setStep('register'); setError(''); setOtp(''); }}
              className="mt-3 w-full text-sm text-slate-500 hover:text-slate-700"
            >
              ← Back to Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Register Screen
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-800 text-center">Register</h1>
          <p className="text-slate-600 text-center mt-2 text-sm">
            NIT Jalandhar students only. Use @nitj.ac.in email.
          </p>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@nitj.ac.in"
                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password (min 6)</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Year</label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                required
                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Branch</label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                required
                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-900 font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}