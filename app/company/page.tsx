import { Metadata } from 'next';
import { CompanyOverviewPage } from '@/components/company/CompanyOverviewPage';
import { DEFAULT_OG_IMAGE, SITE_NAME_JA, SITE_URL } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: '会社概要',
  description: '株式会社Core7の会社概要。',
  alternates: {
    canonical: `${SITE_URL}/company`,
  },
  openGraph: {
    title: '会社概要',
    description: '株式会社Core7の会社概要。',
    url: `${SITE_URL}/company`,
    type: 'website',
    siteName: SITE_NAME_JA,
    locale: 'ja_JP',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: '会社概要',
    description: '株式会社Core7の会社概要。',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function CompanyPage() {
  return <CompanyOverviewPage />;
}
