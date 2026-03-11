'use client';

import { BlogPost } from '@/lib/blog/posts';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { useLanguage } from '@/lib/i18n';

interface Props {
  post: BlogPost;
}

export function BlogPostContent({ post }: Props) {
  const { language } = useLanguage();

  return (
    <div className="max-w-[760px] mx-auto px-6 py-16 sm:py-24">
      <header className="mb-10 sm:mb-14">
        <time className="text-sm font-medium text-gray-400 block mb-3">
          {new Date(post.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
        <h1 className="text-3xl sm:text-[2.5rem] leading-[1.2] font-semibold tracking-tight text-foreground mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          {post.description}
        </p>
      </header>
      
      <div className="w-full bg-gray-100 h-[1px] mb-10 sm:mb-14" />
      
      <MarkdownRenderer content={post.content} />
    </div>
  );
}
