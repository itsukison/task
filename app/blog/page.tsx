import { Metadata } from 'next';
import { BlogIndexContent } from '@/components/blog/BlogIndexContent';

export const metadata: Metadata = {
  title: 'ブログ',
  description: 'タイムボクシング、タスク管理、チームの生産性に関する洞察とガイド。',
};

export default function BlogIndex() {
  return <BlogIndexContent />;
}

