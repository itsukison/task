import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/", "/vision", "/vision/"],
        disallow: [
          "/login",
          "/signup",
          "/onboarding",
          "/workspace",
          "/progress",
          "/settings",
          "/documents",
          "/workflows",
          "/chat",
          "/auth",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
