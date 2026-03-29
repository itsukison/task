import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/seo/site";

const staticLastModified = new Date("2026-03-23");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: staticLastModified,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: staticLastModified,
    },
    {
      url: `${SITE_URL}/company`,
      lastModified: staticLastModified,
    },
    {
      url: `${SITE_URL}/vision`,
      lastModified: staticLastModified,
    },
    {
      url: `${SITE_URL}/vision/endpoint`,
      lastModified: staticLastModified,
    },
    {
      url: `${SITE_URL}/vision/employee`,
      lastModified: staticLastModified,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticPages, ...blogPages];
}
