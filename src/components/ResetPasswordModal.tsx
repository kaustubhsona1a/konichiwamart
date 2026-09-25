import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordUpdated: (email?: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordUpdated
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Recovery credentials extracted from URL or inputs
  const [tokenHash, setTokenHash] = useState('');
  const [emailParam, setEmailParam] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [isLinkVerified, setIsLinkVerified] = useState(false);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const th = searchParams.get('token_hash') || '';
    const em = searchParams.get('email') || '';
    const otp = searchParams.get('otp') || '';
    const at = hashParams.get('access_token') || searchParams.get('access_token') || '';
    const rt = hashParams.get('refresh_token') || searchParams.get('refresh_token') || '';

    if (th) setTokenHash(th);
    if (em) setEmailParam(em);
    if (otp) setOtpCode(otp);
    if (at) setAccessToken(at);
    if (rt) setRefreshToken(rt);

    // If token_hash exists in URL, perform proactive background verification with Supabase Auth
    if (th) {
      setIsVerifyingLink(true);
      const client = getSupabaseClient();
      if (client) {
        client.auth.verifyOtp({ token_hash: th, type: 'recovery' })
          .then(({ data, error }) => {
            if (!error && data?.user) {
              setIsLinkVerified(true);
              if (data.user.email) setEmailParam(data.user.email);
              if (data.session?.access_token) {
                setAccessToken(data.session.access_token);
                setRefreshToken(data.session.refresh_token || '');
              }
            } else if (error) {
              console.warn('[ResetPasswordModal] Direct verifyOtp notice:', error.message);
            }
          })
          .catch(err => console.warn('[ResetPasswordModal] verifyOtp exception:', err))
          .finally(() => setIsVerifyingLink(false));
      } else {
        setIsVerifyingLink(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailParam || !emailParam.includes('@')) {
      setErrorMessage('Please enter a valid account email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);
    try {
      let activeAt = accessToken;
      let activeRt = refreshToken;

      if (!activeAt && typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search);
        activeAt = hashParams.get('access_token') || searchParams.get('access_token') || '';
        activeRt = hashParams.get('refresh_token') || searchParams.get('refresh_token') || '';
      }

      let updatedUserEmail = emailParam;
      let updatedSuccess = false;

      // Method 1: Client-side Supabase updateUser
      const client = getSupabaseClient();
      if (client) {
        try {
          if (activeAt) {
            await client.auth.setSession({ access_token: activeAt, refresh_token: activeRt });
          } else if (tokenHash && !isLinkVerified) {
            const verifyRes = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
            if (verifyRes.data?.session?.access_token) {
              activeAt = verifyRes.data.session.access_token;
            }
          } else if (otpCode && emailParam) {
            const verifyRes = await client.auth.verifyOtp({ email: emailParam, token: otpCode, type: 'recovery' });
            if (verifyRes.data?.session?.access_token) {
              activeAt = verifyRes.data.session.access_token;
            }
          }

          const { data, error } = await client.auth.updateUser({ password });
          if (!error && data?.user) {
            updatedUserEmail = data.user.email || emailParam;
            updatedSuccess = true;
          }
        } catch (clientErr) {
          console.warn('[ResetPasswordModal] Client update notice, delegating to server route:', clientErr);
        }
      }

      // Method 2: Fallback to server proxy API route (handles token_hash, OTP code, or session token)
      if (!updatedSuccess) {
        const res = await fetch('/api/customer/update-password', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(activeAt ? { 'Authorization': `Bearer ${activeAt}` } : {})
          },
          body: JSON.stringify({
            password,
            token_hash: tokenHash,
            tokenHash,
            otp: otpCode,
            email: emailParam,
            accessToken: activeAt,
            refreshToken: activeRt
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update password. Password reset link may be invalid or expired.');
        }
        updatedUserEmail = data.user?.email || emailParam;
        updatedSuccess = true;
      }

      // Auto-persist customer session in localStorage so user is seamlessly logged in
      if (updatedUserEmail) {
        try {
          const stored = localStorage.getItem('km_customer_session');
          const prev = stored ? JSON.parse(stored) : {};
          localStorage.setItem('km_customer_session', JSON.stringify({
            ...prev,
            email: updatedUserEmail,
            loggedInAt: new Date().toISOString()
          }));
        } catch {}
      }

      setSuccess(true);
      setTimeout(() => {
        onPasswordUpdated(updatedUserEmail);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('[Reset Password Error]:', err);
      setErrorMessage(err?.message || 'Failed to update password. Please check your verification link or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 select-text text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">
            Set New Password
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {emailParam ? (
              <>Resetting password for <strong className="text-slate-800 dark:text-slate-200">{emailParam}</strong></>
            ) : (
              'Please enter your new password to complete recovery for your Konichiwa Mart account.'
            )}
          </p>
        </div>

        {isVerifyingLink && (
          <div className="p-3 mb-4 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/40 text-pink-700 dark:text-pink-300 text-xs flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            <span>Verifying recovery security token...</span>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-stone-900 dark:text-white">Password Updated Successfully!</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Your account password has been updated. You are now logged in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Account Email Field if not pre-set or user wants to verify */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                required
                value={emailParam}
                onChange={(e) => setEmailParam(e.target.value.trim().toLowerCase())}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white transition-all font-medium"
              />
            </div>

            {/* Always Visible 8-Digit Security Code (OTP) Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-pink-600" />
                  <span>8-Digit Security Code / OTP</span>
                </label>
                {(tokenHash || isLinkVerified) ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                    ✓ Link Token Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    *From your email
                  </span>
                )}
              </div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                placeholder={(tokenHash || isLinkVerified) ? "Auto-verified via link (or enter 8-digit OTP from email)" : "Enter 8-digit OTP from email (e.g. 19973404)"}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white transition-all font-mono tracking-wider font-semibold placeholder:text-stone-400 placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
              />
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {(tokenHash || isLinkVerified) 
                  ? "Your 1-click email security token is active. You can enter or confirm the 8-digit code from your email here."
                  : "Check your email inbox for the 8-digit code sent from Konichiwa Mart."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || isVerifyingLink}
              className="w-full mt-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-rose-600/25 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Save New Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
