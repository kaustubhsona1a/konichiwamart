import React, { useState } from 'react';
import { X, Lock, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
      // Extract access_token and refresh_token from hash or search if present
      let accessToken = '';
      let refreshToken = '';
      if (typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search);
        accessToken = hashParams.get('access_token') || searchParams.get('access_token') || '';
        refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || '';
      }

      let updatedUserEmail = '';
      let updatedSuccess = false;

      // Method 1: Try client-side Supabase if initialized
      const client = getSupabaseClient();
      if (client) {
        try {
          if (accessToken) {
            await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
          const { data, error } = await client.auth.updateUser({ password });
          if (!error && data?.user) {
            updatedUserEmail = data.user.email || '';
            updatedSuccess = true;
          }
        } catch (clientErr) {
          console.warn('[ResetPasswordModal] Client update warning, switching to server route:', clientErr);
        }
      }

      // Method 2: Fallback to server proxy API route
      if (!updatedSuccess) {
        const res = await fetch('/api/customer/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            accessToken,
            refreshToken
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update password. Password reset link may be invalid or expired.');
        }
        updatedUserEmail = data.user?.email || '';
        updatedSuccess = true;
      }

      setSuccess(true);
      setTimeout(() => {
        onPasswordUpdated(updatedUserEmail);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('[Reset Password Error]:', err);
      setErrorMessage(err?.message || 'Failed to update password. Please try again or request a new link.');
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
            Please enter your new password to complete recovery for your Konichiwa Mart account.
          </p>
        </div>

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
              disabled={loading}
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
