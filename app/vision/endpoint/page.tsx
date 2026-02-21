'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { useLanguage } from '@/lib/i18n';
import { ArrowRight, Download } from 'lucide-react';

export default function EndpointVisionPage() {
    const { language } = useLanguage();

    if (language === 'ja') {
        return <EndpointVisionPageJP />;
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-900 pt-20">
            <Navbar />

            <div className="flex mx-auto max-w-[1440px] px-4 md:px-8">
                {/* Left Sidebar */}
                <aside className="hidden lg:block w-64 shrink-0 py-10 pr-6 border-r border-gray-100">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <ul className="space-y-3 text-sm font-medium text-gray-500">
                                <li><Link href="/vision/endpoint" className="text-black bg-gray-50 py-1.5 px-3 -ml-3 rounded-md flex justify-between tracking-tight">AI-Tailored Endpoints</Link></li>
                                <li><Link href="/vision/employee" className="hover:text-black transition-colors flex justify-between">The True AI Employee</Link></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-10 min-w-0">
                    <article className="max-w-[750px] mx-auto xl:ml-12 2xl:ml-16">
                        <div className="mb-10">
                            <h1 className="text-4xl md:text-[40px] font-bold tracking-tight text-black mb-4 h1-style">
                                AI-Tailored Endpoints
                            </h1>
                            <p className="text-sm text-gray-500">
                                Optimizing the interface between Workspace and Agent.
                            </p>
                        </div>

                        <div className="prose prose-gray max-w-none text-base leading-relaxed text-gray-700">
                            <p className="text-lg text-gray-900 mb-8 border-b border-gray-100 pb-8">
                                Most modern websites and applications are designed for humans. Their APIs are designed for programmatic servers. Neither of these are optimal for an AI agent trying to get work done. Chrono fixes this by exposing <strong>clean, markdown-dense endpoints directly to the browser.</strong>
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                The Noise Problem
                            </h2>
                            <p className="mb-6">
                                When you point an AI agent at a traditional SaaS platform, it struggles. The DOM is heavily obfuscated by modern frameworks (React, Tailwind), filled with thousands of irrelevant nodes. Even if you use their official REST or GraphQL APIs, they return deeply nested JSON graph structures that waste valuable LLM token space on metadata that the agent doesn't need.
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                WebMCP & Zero-Friction Auth
                            </h2>
                            <p className="mb-6">
                                We bypass the traditional Developer API route entirely. Leveraging the <strong>Browser Model Context Protocol (WebMCP)</strong>, Chrono registers its internal tools directly into your active browser session.
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mb-8">
                                <li>
                                    <strong>No API Keys:</strong> The AI agent shares the exact access context of the human sitting at the browser. There is no creating OAuth developer applications, generating keys, or worrying about token leakage.
                                </li>
                                <li>
                                    <strong>Markdown-Dense Payloads:</strong> Instead of bloated JSON, our internal read tools immediately serialize your workspace state (tasks, calendar blocks, documents) into highly-compressed Markdown. This gives the AI exactly what it needs to understand the context, drastically improving reasoning capabilities and saving token costs.
                                </li>
                                <li>
                                    <strong>Instant Integration:</strong> For any compatible browser agent (like OpenClaw or Claude Computer Use), Chrono is instantly integrated the moment you log in.
                                </li>
                            </ul>

                            <div className="border border-gray-200 rounded-lg p-5 mb-8 mt-12 hover:bg-gray-50/50 transition-colors group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-medium text-black mb-1 flex items-center gap-2">
                                        <Download size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors" /> WebMCP Skill Definition
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Download our official WebMCP integration skill instructions.
                                    </p>
                                </div>
                                <a href="/downloads/webmcp-integration.md" download className="shrink-0 inline-flex items-center justify-center bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm">
                                    Download SKILL.md
                                </a>
                            </div>

                            {/* Navigation Footer */}
                            <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-end">
                                <Link href="/vision/employee" className="group flex items-center gap-4 text-right">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Next Concept</p>
                                        <p className="text-base font-medium text-black group-hover:text-orange-600 transition-colors">The True AI Employee</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                                        <ArrowRight size={18} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
                                    </div>
                                </Link>
                            </div>

                        </div>

                        {/* Minimal Footer */}
                        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                            <p>© 2026 Chrono Inc. All rights reserved.</p>
                            <div className="flex gap-4">
                                <Link href="#" className="hover:text-black transition-colors">Twitter</Link>
                                <Link href="#" className="hover:text-black transition-colors">GitHub</Link>
                            </div>
                        </div>
                    </article>
                </main>
            </div>
        </div>
    );
}

function EndpointVisionPageJP() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-900 pt-20">
            <Navbar />

            <div className="flex mx-auto max-w-[1440px] px-4 md:px-8">
                {/* Left Sidebar */}
                <aside className="hidden lg:block w-64 shrink-0 py-10 pr-6 border-r border-gray-100">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <ul className="space-y-3 text-sm font-medium text-gray-500">
                                <li><Link href="/vision/endpoint" className="text-black bg-gray-50 py-1.5 px-3 -ml-3 rounded-md flex justify-between tracking-tight">AI最適化エンドポイント</Link></li>
                                <li><Link href="/vision/employee" className="hover:text-black transition-colors flex justify-between">真のAI従業員</Link></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-10 min-w-0">
                    <article className="max-w-[750px] mx-auto xl:ml-12 2xl:ml-16">
                        <div className="mb-10">
                            <h1 className="text-4xl md:text-[40px] font-bold tracking-tight text-black mb-4 h1-style">
                                AI最適化エンドポイント
                            </h1>
                            <p className="text-sm text-gray-500">
                                ワークスペースとエージェントのインターフェース
                            </p>
                        </div>

                        <div className="prose prose-gray max-w-none text-base leading-relaxed text-gray-700">
                            <p className="text-lg text-gray-900 mb-8 border-b border-gray-100 pb-8">
                                多くのウェブサイトやアプリケーションは人間向けにデザインされています。そして、それらのAPIはサーバー向けに設計されています。どちらも、AIエージェントが作業を行うには適していません。Chronoは、<strong>ブラウザ上で直接、Markdownベースのクリーンなエンドポイントを提供する</strong>ことでこの問題を解決します。
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                ノイズの問題
                            </h2>
                            <p className="mb-6">
                                AIエージェントに従来のSaaSプラットフォームを操作させようとすると、多くの困難に直面します。ReactやTailwindなどの最新フレームワークによるDOMは難読化され、無関係なノードで溢れています。公式のRESTやGraphQLのAPIを使用したとしても、AIにとって不要なメタデータを含む深くネストされたJSONが返され、貴重なLLMのトークン枠を浪費してしまいます。
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                WebMCPとゼロフリクション認証
                            </h2>
                            <p className="mb-6">
                                私たちは、従来の開発者向けAPIのルートを完全にバイパスします。<strong>Browser Model Context Protocol (WebMCP)</strong>を活用することで、Chronoはブラウザのセッションに直接、内部ツールを登録します。
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mb-8">
                                <li>
                                    <strong>APIキー不要：</strong>AIエージェントは、ブラウザを操作している人間のアクセス権限をそのまま共有します。OAuthアプリの作成、キーの生成、トークン漏洩の心配は一切ありません。
                                </li>
                                <li>
                                    <strong>Markdownに最適化されたペイロード：</strong>肥大化したJSONの代わりに、Chronoの読み取りツールはワークスペースの現在の状態（タスク、カレンダー、ドキュメントなど）を瞬時に短縮されたMarkdownにシリアライズします。これにより、AIはコンテキストの理解に必要な正確な情報を得られ、推論能力の向上とトークンコストの削減を実現します。
                                </li>
                                <li>
                                    <strong>即座に統合：</strong>OpenClawやClaude Computer Useなどの互換性のあるブラウザエージェントであれば、ログインした瞬間にChronoと統合されます。
                                </li>
                            </ul>

                            <div className="border border-gray-200 rounded-lg p-5 mb-8 mt-12 hover:bg-gray-50/50 transition-colors group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-medium text-black mb-1 flex items-center gap-2">
                                        <Download size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors" /> WebMCPスキル定義ファイル
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        公式WebMCP統合スキル定義（Markdown）をダウンロード。
                                    </p>
                                </div>
                                <a href="/downloads/webmcp-integration.md" download className="shrink-0 inline-flex items-center justify-center bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm">
                                    SKILL.md をダウンロード
                                </a>
                            </div>

                            {/* Navigation Footer */}
                            <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-end">
                                <Link href="/vision/employee" className="group flex items-center gap-4 text-right">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">次のコンセプトへ</p>
                                        <p className="text-base font-medium text-black group-hover:text-orange-600 transition-colors">真のAI従業員</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                                        <ArrowRight size={18} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
                                    </div>
                                </Link>
                            </div>

                        </div>

                        {/* Minimal Footer */}
                        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                            <p>© 2026 Chrono Inc. All rights reserved.</p>
                            <div className="flex gap-4">
                                <Link href="#" className="hover:text-black transition-colors">Twitter</Link>
                                <Link href="#" className="hover:text-black transition-colors">GitHub</Link>
                            </div>
                        </div>
                    </article>
                </main>
            </div>
        </div>
    );
}
