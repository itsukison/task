'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

export default function EmployeeVisionPage() {
    const { language } = useLanguage();

    if (language === 'ja') {
        return <EmployeeVisionPageJP />;
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
                                <li><Link href="/vision/endpoint" className="hover:text-black transition-colors flex justify-between">AI-Tailored Endpoints</Link></li>
                                <li><Link href="/vision/employee" className="text-black bg-gray-50 py-1.5 px-3 -ml-3 rounded-md flex justify-between tracking-tight">The True AI Employee</Link></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-10 min-w-0">
                    <article className="max-w-[750px] mx-auto xl:ml-12 2xl:ml-16">
                        <div className="mb-10">
                            <h1 className="text-4xl md:text-[40px] font-bold tracking-tight text-black mb-4 h1-style">
                                The True AI Employee
                            </h1>
                            <p className="text-sm text-gray-500">
                                Bridging context, workflows, and execution.
                            </p>
                        </div>

                        <div className="prose prose-gray max-w-none text-base leading-relaxed text-gray-700">
                            <p className="text-lg text-gray-900 mb-8 border-b border-gray-100 pb-8">
                                A chatbot that only answers your questions is a tool. An intelligence that understands your company's deepest context, learns your specific workflows, and delegates tasks autonomously is an <strong>employee</strong>. Taskle represents the transition from the former to the latter.
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                Absolute Company Context
                            </h2>
                            <p className="mb-6">
                                Most AI tools lack the systemic context needed to make independent decisions. When a true AI employee joins your workspace, it doesn't start with a blank slate. Taskle gives its internal agents a holistic, constantly updating view of your company. It has access to real-time project documentation, individual team members' schedules, ongoing code changes, and task dependencies.
                            </p>
                            <p className="mb-6">
                                When you tell it, "Schedule a sync for the Q3 Launch," it already knows who the key stakeholders are, when they are free, and what the latest blockers on the launch are.
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                Video-to-Workflow Automation
                            </h2>
                            <p className="mb-6">
                                Programming an AI shouldn't require code. It shouldn't even require writing out complex standard operating procedures (SOPs).
                            </p>
                            <p className="mb-6">
                                Taskle introduces <strong>Video-to-Workflow</strong> capability. You simply upload a screen recording of your human employee executing a task—like resolving a specific type of customer support ticket, or generating a weekly analytics report. Taskle's vision models break down the video frame-by-frame, reverse-engineering the steps into executable WebMCP skills. The AI watches you work once, and then takes over the job entirely.
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                AI-to-AI Delegation
                            </h2>
                            <p className="mb-6">
                                A true employee doesn't just do all the work themselves—they know when to hand things off. The AI running inside Taskle's workspace isn't trapped there.
                            </p>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 mt-4 font-mono text-sm leading-relaxed overflow-x-auto text-gray-800">
                                <p className="text-gray-500 mb-2">// How Taskle delegates a task to an external agent like OpenClaw</p>
                                <p className="mb-4">window.dispatchEvent(new CustomEvent('OPENCLAW_TASK_DISPATCH', &#123;<br />
                                    &nbsp;&nbsp;detail: &#123;<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;prompt: "Log into Adobe and cancel the company subscription",<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;context: "Use the corporate card ending in 1234",<br />
                                    &nbsp;&nbsp;&#125;<br />
                                    &#125;));</p>
                            </div>

                            <p className="mb-6">
                                Because Taskle exposes web events to the browser securely, the internal AI can dispatch highly unstructured, external web tasks to execution agents like OpenClaw. "Cancel the Adobe subscription" or "Research our top 3 competitors and build a pricing spreadsheet." Taskle orchestrates the plan, delegates the external web navigation, and verifies the results. This transforms your workspace into an engine of work, where AI agents collaborate with each other to solve your problems.
                            </p>

                            {/* Navigation Footer */}
                            <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-start">
                                <Link href="/vision/endpoint" className="group flex items-center gap-4 text-left">
                                    <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                                        <ArrowLeft size={18} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Previous Concept</p>
                                        <p className="text-base font-medium text-black group-hover:text-orange-600 transition-colors">AI-Tailored Endpoints</p>
                                    </div>
                                </Link>
                            </div>

                        </div>

                        {/* Minimal Footer */}
                        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                            <p>© 2026 Core7 Inc. All rights reserved.</p>
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

function EmployeeVisionPageJP() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-900 pt-20">
            <Navbar />

            <div className="flex mx-auto max-w-[1440px] px-4 md:px-8">
                {/* Left Sidebar */}
                <aside className="hidden lg:block w-64 shrink-0 py-10 pr-6 border-r border-gray-100">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <ul className="space-y-3 text-sm font-medium text-gray-500">
                                <li><Link href="/vision/endpoint" className="hover:text-black transition-colors flex justify-between">AI最適化エンドポイント</Link></li>
                                <li><Link href="/vision/employee" className="text-black bg-gray-50 py-1.5 px-3 -ml-3 rounded-md flex justify-between tracking-tight">真のAI従業員</Link></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-10 min-w-0">
                    <article className="max-w-[750px] mx-auto xl:ml-12 2xl:ml-16">
                        <div className="mb-10">
                            <h1 className="text-4xl md:text-[40px] font-bold tracking-tight text-black mb-4 h1-style">
                                真のAI従業員
                            </h1>
                            <p className="text-sm text-gray-500">
                                コンテキスト、ワークフロー、そして実行能力を統合する
                            </p>
                        </div>

                        <div className="prose prose-gray max-w-none text-base leading-relaxed text-gray-700">
                            <p className="text-lg text-gray-900 mb-8 border-b border-gray-100 pb-8">
                                質問に答えるだけのチャットボットは単なる「ツール」に過ぎません。しかし、会社の深いコンテキストを理解し、特有のワークフローを学習し、自立してタスクを委任できるAIは<strong>「従業員」</strong>です。タスクルは前者を後者へと変革させます。
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                会社のコンテキストを完全に理解する
                            </h2>
                            <p className="mb-6">
                                一般的なAIツールの多くは、自律的に判断を下すための体系的なコンテキストを持っていません。真のAI従業員がチームに加わるとき、白紙の状態で始まるべきではありません。タスクルは内部エージェントに対し、会社の全体像を常に最新の状態で提供します。プロジェクト文書からチームのスケジュール、コードの変更履歴、タスクの依存関係まで全てをリアルタイムで把握しています。
                            </p>
                            <p className="mb-6">
                                あなたが「Q3のローンチに向けた会議の時間を調整して」と言うだけで、キーパーソンが誰か、全員が空いている時間はいつか、現在のローンチのブロッカーは何かをすでに知っているのです。
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                動画からワークフローを自動生成
                            </h2>
                            <p className="mb-6">
                                AIに作業を教えるために、コードを書いたり、複雑な標準作業手順書（SOP）を書き起こす必要はありません。
                            </p>
                            <p className="mb-6">
                                タスクルは<strong>Video-to-Workflow（動画からワークフローへの変換）</strong>機能を導入します。人間のスタッフが特定の種類の対応タスクや、週次の分析レポートを作成している画面の録画をアップロードするだけです。タスクルのビジョンモデルがその動画をフレームごとに分析し、ステップを逆算して実行可能なWebMCPスキルへと分解します。AIはあなたの作業を一度見るだけで、その後は業務を完全に引き継ぎます。
                            </p>

                            <h2 className="text-2xl font-semibold text-black mt-12 mb-4 tracking-tight border-b border-gray-100 pb-2">
                                AIによるAIへのタスク委任
                            </h2>
                            <p className="mb-6">
                                優秀な従業員は、すべてを一人で抱え込むことはしません。適切なタイミングで仕事を他の人に任せます。タスクル上のAIは、ワークスペースの中に閉じ込められているわけではありません。
                            </p>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 mt-4 font-mono text-sm leading-relaxed overflow-x-auto text-gray-800">
                                <p className="text-gray-500 mb-2">// タスクルが外部エージェント(OpenClawなど)にタスクを委任する例</p>
                                <p className="mb-4">window.dispatchEvent(new CustomEvent('OPENCLAW_TASK_DISPATCH', &#123;<br />
                                    &nbsp;&nbsp;detail: &#123;<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;prompt: "Adobeにログインして会社のサブスクリプションを解約する",<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;context: "末尾1234のコーポレートカードを使用",<br />
                                    &nbsp;&nbsp;&#125;<br />
                                    &#125;));</p>
                            </div>

                            <p className="mb-6">
                                タスクルはブラウザイベントを通じて安全に要求を発行できるため、内部のAIがOpenClawのような実行エージェントに対し、外部の非構造化されたウェブ操作タスクを委任できます。「Adobeのサブスクリプションを解約して」や「主要な競合3社を調査して料金表スプレッドシートを作成して」といった指示が可能です。タスクルがプランニングと指揮を行い、外部エージェントにWeb操作を委任し、その結果を検証します。これにより、ワークスペースは単なる記録ツールではなく、AI同士が協力して問題を解決する「作業エンジン」へと進化します。
                            </p>

                            {/* Navigation Footer */}
                            <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-start">
                                <Link href="/vision/endpoint" className="group flex items-center gap-4 text-left">
                                    <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                                        <ArrowLeft size={18} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">前のコンセプトへ</p>
                                        <p className="text-base font-medium text-black group-hover:text-orange-600 transition-colors">AI最適化エンドポイント</p>
                                    </div>
                                </Link>
                            </div>

                        </div>

                        {/* Minimal Footer */}
                        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                            <p>© 2026 Core7 Inc. All rights reserved.</p>
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
