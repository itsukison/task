'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import { useLanguage } from '@/lib/i18n';
import { Mail } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUser, setExistingUser] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExistingUser(false);

    if (password !== confirmPassword) {
      setError(t('auth.error_password_match'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.error_password_length'));
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password);

      if (result.error) {
        if (result.error.message.includes('User already registered') || result.error.status === 400 || result.error.status === 422) {
          // Supabase sometimes returns ambiguous errors for duplicates, but messge usually contains it.
          // However, for security, sometimes it masks it. But commonly it says "User already registered".
          // If we get an error, we can check.
          if (result.error.message.toLowerCase().includes('already registered') || result.error.message.toLowerCase().includes('already exists')) {
            setExistingUser(true);
            setLoading(false);
            return;
          }
        }
        setError(result.error.message || t('auth.error_generic_signup'));
        return;
      }

      // Check if email confirmation is required
      if (result.data.user && !result.data.session) {
        // Email verification required
        setEmailSent(true);
      } else {
        // Auto-confirmed, proceed to onboarding
        router.push('/onboarding');
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('already registered')) {
        setExistingUser(true);
      } else {
        setError(err.message || t('auth.error_generic_signup'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (existingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 pb-38">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F7F7F5] flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#37352F]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-[#37352F]">{t('auth.already_have_account_title')}</h2>
            <p className="text-sm text-[#787774]">
              {t('auth.already_have_account_subtitle', { email })}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="block w-full bg-[#f35513] text-white font-medium py-2 rounded-sm hover:bg-[#e04e11] transition-colors"
            >
              {t('auth.signin_with_email_btn')}
            </Link>
          </div>
          <div>
            <button
              onClick={() => setExistingUser(false)}
              className="text-sm text-[#787774] hover:text-[#37352F] transition-colors"
            >
              {t('auth.use_different_email_btn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 pb-38">
      <div className="w-full max-w-sm">
        {emailSent ? (
          // Email verification screen
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F7F7F5] flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#37352F]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[#37352F]">{t('auth.check_email_title')}</h2>
              <p className="text-sm text-[#787774] leading-relaxed">
                {t('auth.check_email_subtitle')}<br />
                <span className="font-medium text-[#37352F]">{email}</span>
              </p>
            </div>
            <p className="text-xs text-[#9B9A97]">
              {t('auth.verify_account_instruction')}
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="text-sm text-[#787774] hover:text-[#37352F] transition-colors"
              >
                {t('auth.back_to_login')}
              </Link>
            </div>
          </div>
        ) : (
          // Signup form
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-[#37352F] mb-2">{t('auth.signup_title')}</h1>
              <p className="text-sm text-[#787774]">{t('auth.signup_subtitle')}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#37352F] mb-1">
                  {t('auth.email_label')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E3E3E1] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#37352F] focus:border-transparent text-sm transition-all"
                  placeholder={t('auth.email_placeholder')}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#37352F] mb-1">
                  {t('auth.password_label')}
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E3E3E1] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#37352F] focus:border-transparent text-sm transition-all"
                  placeholder={t('auth.password_min_length')}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#37352F] mb-1">
                  {t('auth.confirm_password_label')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E3E3E1] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#37352F] focus:border-transparent text-sm transition-all"
                  placeholder={t('auth.confirm_password_placeholder')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f35513] text-white font-medium py-2 rounded-sm hover:bg-[#e04e11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? t('auth.creating_account_btn') : t('auth.sign_up_btn')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#787774]">
              {t('auth.has_account')} {' '}
              <Link href="/login" className="text-[#f35513] font-medium hover:underline">
                {t('auth.sign_in_btn')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
