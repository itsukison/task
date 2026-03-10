'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import { useLanguage } from '@/lib/i18n';
import { useLoginWebMCPRegistration } from '@/lib/ai/use-login-webmcp';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  useLoginWebMCPRegistration(
    async (emailToUse, passToUse) => {
      await signIn(emailToUse, passToUse);
      router.push('/workspace');
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/workspace');
    } catch (err: any) {
      setError(err.message || t('auth.error_generic_signin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 pb-38">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#37352F] mb-2">{t('auth.login_title')}</h1>
          <p className="text-sm text-[#787774]">{t('auth.login_subtitle')}</p>
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
              placeholder={t('auth.password_placeholder')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f35513] text-white font-medium py-2 rounded-sm hover:bg-[#e04e11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? t('auth.signing_in_btn') : t('auth.sign_in_btn')}
          </button>
        </form>

        <div className="relative flex items-center my-4">
          <div className="flex-grow border-t border-[#E3E3E1]" />
          <span className="mx-3 text-xs text-[#787774]">{t('auth.or_divider')}</span>
          <div className="flex-grow border-t border-[#E3E3E1]" />
        </div>

        <button
          type="button"
          onClick={() => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback?next=/workspace` },
          })}
          className="w-full flex items-center justify-center gap-2 border border-[#E3E3E1] text-[#37352F] font-medium py-2 rounded-sm hover:bg-[#F7F7F5] transition-colors text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          {t('auth.google_signin_btn')}
        </button>

        <div className="mt-6 text-center text-sm text-[#787774]">
          {t('auth.no_account')} {' '}
          <Link href="/signup" className="text-[#f35513] font-medium hover:underline">
            {t('auth.sign_up_btn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
