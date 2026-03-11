'use client';

import { posts } from '@/lib/blog/posts';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export function BlogIndexContent() {
  const { t, language } = useLanguage();
  
  return (
    <div className="max-w-[760px] mx-auto px-6 py-16 sm:py-24">
      <header className="mb-16">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4">
          {t('blog_index.title')}
        </h1>
        <p className="text-lg text-gray-500">
          {t('blog_index.subtitle')}
        </p>
      </header>
      
      <div className="flex flex-col gap-12">
        {posts.map((post) => (
          <Link 
            key={post.slug} 
            href={`/blog/${post.slug}`}
            className="group flex flex-col items-start gap-3 no-underline"
          >
            <time className="text-sm font-medium text-gray-400">
              {new Date(post.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-600 leading-relaxed max-w-2xl">
              {post.description}
            </p>
            <div className="text-sm font-medium text-accent mt-2 flex items-center gap-1">
              {t('blog_index.read_more')}
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
