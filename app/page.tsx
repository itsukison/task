import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing';
import { DEFAULT_OG_IMAGE, SITE_NAME_JA, SITE_URL } from '@/lib/seo/site';

export default async function Home() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // If user is authenticated, redirect to workspace
  if (session) {
    redirect('/workspace');
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME_JA,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME_JA,
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      url: SITE_URL,
      description:
        "チームの仕事を時間に落とし込む、非エンジニア向けのタスク管理ツール。",
      image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    },
  ];

  // Otherwise, show the landing page
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
