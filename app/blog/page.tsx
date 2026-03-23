import { Metadata } from 'next';
import { BlogIndexContent } from '@/components/blog/BlogIndexContent';
import { DEFAULT_OG_IMAGE, SITE_NAME_JA, SITE_URL } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'ブログ',
  description: 'タイムボクシング、タスク管理、チームの生産性に関する洞察とガイド。',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'ブログ',
    description: 'タイムボクシング、タスク管理、チームの生産性に関する洞察とガイド。',
    url: `${SITE_URL}/blog`,
    type: 'website',
    siteName: SITE_NAME_JA,
    locale: 'ja_JP',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ブログ',
    description: 'タイムボクシング、タスク管理、チームの生産性に関する洞察とガイド。',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function BlogIndex() {
  return <BlogIndexContent />;
}
