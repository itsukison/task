import { getPostBySlug, posts } from '@/lib/blog/posts';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { BlogPostContent } from '@/components/blog/BlogPostContent';
import { DEFAULT_OG_IMAGE, SITE_NAME_JA, SITE_URL } from '@/lib/seo/site';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    return {
      title: '記事が見つかりません',
    };
  }

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const publishedTime = new Date(post.date).toISOString();

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonicalUrl,
      type: 'article',
      siteName: SITE_NAME_JA,
      locale: 'ja_JP',
      publishedTime,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const publishedTime = new Date(post.date).toISOString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: publishedTime,
    dateModified: publishedTime,
    mainEntityOfPage: canonicalUrl,
    author: {
      "@type": "Organization",
      name: SITE_NAME_JA,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME_JA,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostContent post={post} />
    </>
  );
}
