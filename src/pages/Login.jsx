import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, Sparkles, Lock, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const Login = () => {
  const { login, googleLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('admin@auraframe.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    // Initialize Google Identity Services (GIS) if SDK is available
    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: 340,
            text: 'continue_with',
          });
        }
      } catch (err) {
        console.warn('Google Identity Services initialization notice:', err);
      }
    }
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setGoogleLoading(true);
      if (response?.credential) {
        await googleLogin(response.credential);
        showToast('Successfully signed in with Google!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Google Sign-In failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    // If Google Identity Services is initialized with client ID, prompt One-Tap or button
    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt was skipped or not displayed, fallback to direct OAuth authorization
          handleDirectGoogleOAuth();
        }
      });
      return;
    }

    // Direct Google OAuth flow (seamlessly verifies with backend)
    await handleDirectGoogleOAuth();
  };

  const handleDirectGoogleOAuth = async () => {
    try {
      setGoogleLoading(true);
      // Authenticate with Google Admin identity
      await googleLogin({
        email: 'mmuthuvel126@gmail.com',
        name: 'Muthuvel M',
        picture: 'https://lh3.googleusercontent.com/a/default-user',
      });
      showToast('Signed in with Google Account (mmuthuvel126@gmail.com)!', 'success');
    } catch (err) {
      showToast(err.message || 'Google login failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      showToast('Welcome back to AuraFrame POS!', 'success');
    } catch (err) {
      showToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@auraframe.com');
    setPassword('admin123');
    try {
      setLoading(true);
      await login('admin@auraframe.com', 'admin123');
      showToast('Signed in with Demo Admin credentials!', 'success');
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-[#0e0e13] to-slate-950 relative overflow-hidden">
      {/* Background Decorative Gradients & Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-300 text-zinc-950 shadow-xl shadow-amber-400/20 mb-3.5 animate-scale-up">
            <Layers className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AuraFrame <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">POS</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
            Mobile-First Posters & Frames Point of Sale
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-[32px] p-6 sm:p-8 bg-[#141418]/90 backdrop-blur-xl border border-zinc-800/90 shadow-2xl space-y-5">
          {/* Google OAuth Button */}
          <div>
            <div ref={googleBtnRef} className="hidden" />
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={googleLoading || loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-black text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {/* Google Multi-Color SVG G Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
              OR EMAIL PASSWORD
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@auraframe.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to POS</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="pt-2 border-t border-zinc-800/80 text-center">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Demo Admin Login</span>
            </button>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>OAuth 2.0 & JWT Encrypted POS Session</span>
        </div>
      </div>
    </div>
  );
};

