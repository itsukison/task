import { Metadata } from 'next';
import { BlogIndexContent } from '@/components/blog/BlogIndexContent';

export const metadata: Metadata = {
  title: 'Blog | Taskle',
  description: 'Insights and guides on timeboxing, task management, and team productivity.',
};

export default function BlogIndex() {
  return <BlogIndexContent />;
}

