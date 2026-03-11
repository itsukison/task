import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const languageCookie = (await cookieStore).get('taskos-language');
  const isJapanese = languageCookie?.value === 'ja';
  
  const title = isJapanese 
    ? {
        default: "タスクル | チームのタスクをカレンダーに落とし込む",
        template: "%s | タスクル"
      }
    : {
        default: "Taskle | Put your team's work on the clock",
        template: "%s | Taskle"
      };

  const description = isJapanese 
    ? "営業チームや中小企業など、非エンジニア向けに設計されたシンプルなタスク管理ツール。タイムボクシングを活用し、全員の進捗を見える化します。" 
    : "The workspace designed for the AI era. Simple task management for non-engineers, with timeboxing and progress tracking.";

  return {
    title,
    description,
    icons: {
      icon: "/logo.png",
      shortcut: "/logo.png",
      apple: "/logo.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
