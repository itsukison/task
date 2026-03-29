'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

const companyInfo = [
  { labelKey: 'company.fields.name', value: '株式会社Core7' },
  { labelKey: 'company.fields.address', value: '東京都世田谷区桜3-9-24' },
  { labelKey: 'company.fields.ceo', value: '孫逸歓' },
  { labelKey: 'company.fields.established', value: '2026年4月1日' },
];

export const CompanyOverviewPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-[760px] mx-auto px-6 py-16 sm:py-24 text-foreground">
      <header className="mb-14 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          {t('company.title')}
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
          {t('company.intro')}
        </p>
      </header>

      <section className="border-t border-gray-100 pt-10">
        <h2 className="text-lg font-semibold tracking-tight mb-6">
          {t('company.section_title')}
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
          {companyInfo.map((item) => (
            <div key={item.labelKey}>
              <dt className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
                {t(item.labelKey)}
              </dt>
              <dd className="text-base text-gray-700 font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          {t('company.about_title')}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          {t('company.about_body')}
        </p>
      </section>

      <section className="mt-12 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          {t('company.history_title')}
        </h2>
        <ul className="text-gray-600 leading-relaxed space-y-2">
          <li>{t('company.history_item')}</li>
        </ul>
      </section>

      <section className="mt-12 border-t border-gray-100 pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-tight text-gray-900">
            {t('company.cta_title')}
          </p>
          <p className="text-sm text-gray-500 mt-1">{t('company.cta_subtitle')}</p>
        </div>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-foreground hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          {t('company.cta_button')}
        </Link>
      </section>
    </div>
  );
};
