import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="prose prose-neutral prose-lg max-w-none prose-headings:font-medium prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Notion-style specific component overrides
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mt-12 mb-6" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mt-10 mb-5 pb-2 border-b border-gray-100" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-medium tracking-tight text-foreground mt-8 mb-4 lg:mt-10 lg:mb-4" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-gray-600 leading-relaxed mb-6" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside pl-6 mb-6 text-gray-600 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside pl-6 mb-6 text-gray-600 space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-1" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-foreground bg-orange-50 px-1 rounded" {...props} />
          ),
          img: ({ node, alt, src, ...props }) => (
            <div className="my-8 rounded-lg overflow-hidden border border-gray-100">
              <img src={src} alt={alt} className="w-full h-auto object-cover" {...props} />
              {alt && <div className="text-center text-sm text-gray-400 mt-2">{alt}</div>}
            </div>
          ),
          a: ({ node, href, children, ...props }) => {
            const isInternal = href?.startsWith('/');
            if (isInternal) {
              return (
                <Link href={href!} className="text-orange-600 hover:text-orange-700 font-medium underline-offset-4 decoration-orange-200" {...props}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 font-medium underline-offset-4 decoration-orange-200" {...props}>
                {children}
              </a>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-accent pl-4 italic text-gray-500 my-6 bg-gray-50 py-2 pr-4 rounded-r" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
