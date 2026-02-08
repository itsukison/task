'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import { useLanguage } from '@/lib/i18n';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.error_password_match'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.error_password_length'));
      return;
    }

    if (!displayName.trim()) {
      setError(t('auth.error_name_required'));
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName);
      // Redirect to onboarding or workspace
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || t('auth.error_generic_signup'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 pb-38">
      <div className="w-full max-w-sm">
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
            <label htmlFor="displayName" className="block text-sm font-medium text-[#37352F] mb-1">
              {t('auth.display_name_label')}
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E3E3E1] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#37352F] focus:border-transparent text-sm transition-all"
              placeholder={t('auth.display_name_placeholder')}
              required
            />
          </div>
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
      </div>
    </div>
  );
}
