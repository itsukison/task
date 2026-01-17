'use client';

import React from 'react';
import { AsciiArt } from './AsciiArt';
import { Reveal } from './Reveal';
import Link from 'next/link';

const PYRAMID_ASCII = `
    /\\
   /  \\
  /____\\
`;

const CUBE_ASCII = `
   +---+
  /   /|
 +---+ |
 |   | +
 |   |/
 +---+
`;

export const FooterSection: React.FC = () => {
    return (
        <footer className="w-full bg-background border-t border-gray-100 overflow-hidden relative">

            {/* --- Part 1: CTA Section --- */}
            <div className="relative w-full py-32 px-6 flex flex-col items-center justify-center text-center z-10">

                {/* Floating Shape Left (Accent Pyramid) */}
                <div className="hidden lg:block absolute left-10 top-1/2 -translate-y-1/2 -rotate-12 animate-[float_6s_ease-in-out_infinite]">
                    <Reveal delay={0.2} variant="fade-in">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-accent-light to-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-accent/20 border border-white/20">
                            <AsciiArt art={PYRAMID_ASCII} className="bg-transparent border-none text-white scale-150 font-black mix-blend-overlay opacity-80" />
                        </div>
                    </Reveal>
                </div>

                {/* Floating Shape Right (Glassy Cube) */}
                <div className="hidden lg:block absolute right-10 top-20 rotate-12 animate-[float_8s_ease-in-out_infinite_reverse]">
                    <Reveal delay={0.4} variant="fade-in">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-bl from-gray-100 to-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-200">
                            <AsciiArt art={CUBE_ASCII} className="bg-transparent border-none text-foreground scale-125 opacity-50" />
                        </div>
                    </Reveal>
                </div>

                <div className="max-w-2xl mx-auto relative z-10">
                    <Reveal delay={0.1}>
                        <span className="font-serif italic text-gray-400 text-xl mb-4 block">Get Started!</span>
                        <h2 className="text-5xl md:text-6xl font-semibold tracking-tighter text-foreground mb-6 leading-[1.1]">
                            Let&apos;s automate your <br />
                            <span className="text-accent">daily workflows</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <p className="text-lg text-foreground/70 mb-10 max-w-lg mx-auto">
                            Spend less time updating tools and more time shipping value to your customers.
                        </p>
                    </Reveal>

                    <Reveal delay={0.3} variant="scale-up">
                        <Link
                            href="/signup"
                            className="inline-block bg-foreground text-background px-8 py-4 rounded-full text-base font-semibold hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Start Free Trial
                        </Link>
                    </Reveal>
                </div>
            </div>


            {/* --- Part 2: Split Footer --- */}
            <div className="relative w-full pb-20 md:pb-32">

                {/* Large Watermark Background (Behind the card) */}
                <div className="absolute bottom-0 w-full flex justify-center pointer-events-none select-none overflow-hidden z-0">
                    <span className="text-[25vw] font-bold text-gray-100/80 leading-[0.75] tracking-tighter translate-y-[25%] opacity-0 animate-[fadeIn_2s_ease-out_forwards]">Taskos</span>
                </div>

                <div className="max-w-[1440px] mx-auto px-4 md:px-6 relative z-10">
                    <Reveal delay={0.2} variant="fade-up">
                        <div className="bg-gray-100/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">

                                {/* Left: Brand Card (Accent Gradient) */}
                                <div className="lg:col-span-5 bg-gradient-to-br from-accent-light to-accent p-10 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
                                    {/* Decorative gradient blob */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-8">
                                            <div className="bg-white text-accent w-8 h-8 rounded flex items-center justify-center">
                                                <svg width="16" height="16" viewBox="0 0 40 40" fill="currentColor">
                                                    <path d="M20 5L35 30H5L20 5Z" />
                                                </svg>
                                            </div>
                                            <span className="text-xl font-bold tracking-tight">Taskos</span>
                                        </div>
                                        <h3 className="text-3xl font-medium tracking-tight leading-snug max-w-sm text-white">
                                            Smarter daily planning, <br />
                                            <span className="text-white/70">powered by rhythm.</span>
                                        </h3>
                                    </div>

                                    <div className="relative z-10 mt-12">
                                        <p className="font-serif italic text-white/80 mb-6">Stay in touch!</p>
                                        <div className="flex gap-3">
                                            {[
                                                { name: 'Discord', path: 'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.564 13.564 0 0 0-1.895 3.96 19.167 19.167 0 0 0-6.91 0 13.682 13.682 0 0 0-1.902-3.96.075.075 0 0 0-.079-.037A19.736 19.736 0 0 0 0 4.37a.077.077 0 0 0-.032.027C.533 12.688 3.016 19.047 6.326 23.33a.077.077 0 0 0 .085.021 19.897 19.897 0 0 0 6.007-1.923.078.078 0 0 0 .046-.057c.563-.787 1.059-1.62 1.48-2.484a.075.075 0 0 0-.04-.105 12.748 12.748 0 0 1-1.886-.902.077.077 0 0 1-.008-.127c.125-.094.25-.19.372-.29a.073.073 0 0 1 .077-.01c3.977 1.838 8.286 1.838 12.222 0a.077.077 0 0 1 .078.01c.122.1.25.196.375.29a.074.074 0 0 1-.006.128 12.33 12.33 0 0 1-1.89.902.077.077 0 0 0-.04.105c.42.864.919 1.697 1.485 2.484a.075.075 0 0 0 .045.057 19.866 19.866 0 0 0 6.012 1.922.077.077 0 0 0 .084-.02C36.974 19.047 39.458 12.688 40 4.397a.071.071 0 0 0-.032-.027ZM13.435 16.63c-1.18 0-2.152-1.096-2.152-2.435 0-1.34 0.948-2.435 2.152-2.435 1.21 0 2.176 1.096 2.152 2.435 0 1.34-.943 2.435-2.152 2.435Zm13.13 0c-1.18 0-2.152-1.096-2.152-2.435 0-1.34.947-2.435 2.152-2.435 1.21 0 2.176 1.096 2.152 2.435 0 1.34-.943 2.435-2.152 2.435Z' },
                                                { name: 'X', path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
                                                { name: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                                                { name: 'GitHub', path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' }
                                            ].map((icon) => (
                                                <a key={icon.name} href="#" className="w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-accent rounded-lg flex items-center justify-center transition-all">
                                                    <svg width="20" height="20" fill="currentColor" viewBox={icon.name === 'Discord' ? "0 0 40 40" : "0 0 24 24"}>
                                                        <path d={icon.path} />
                                                    </svg>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Navigation & Newsletter */}
                                <div className="lg:col-span-7 p-10 md:p-14 relative z-10 flex flex-col justify-between">
                                    <div className="grid grid-cols-2 gap-12 mb-12">
                                        <div>
                                            <h4 className="font-serif italic text-gray-400 mb-6 text-lg">Navigation</h4>
                                            <ul className="space-y-4">
                                                {['Features', 'How it works', 'Pricing', 'Testimonials', 'FAQ', 'Changelog'].map(item => (
                                                    <li key={item}>
                                                        <a href="#" className="text-foreground font-medium hover:text-accent transition-colors">{item}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-serif italic text-gray-400 mb-6 text-lg">Company</h4>
                                            <ul className="space-y-4">
                                                {['Blog', 'About', 'Contact Us', 'Terms & Conditions', 'Privacy Policy'].map(item => (
                                                    <li key={item}>
                                                        <a href="#" className="text-foreground font-medium hover:text-accent transition-colors">{item}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-200/50">
                                        <h4 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
                                            Execution moves fast. <br />
                                            <span className="text-foreground/70">Stay ahead with Taskos.</span>
                                        </h4>

                                        <div className="mt-6 flex gap-2">
                                            <input
                                                type="email"
                                                placeholder="Enter email address"
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors text-foreground placeholder:text-gray-400"
                                            />
                                            <button className="bg-foreground text-background px-6 py-3 rounded-xl font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap">
                                                Subscribe
                                            </button>
                                        </div>
                                        <div className="mt-6 flex justify-between items-center text-xs text-gray-400">
                                            <p>© 2024 Taskos Inc. All rights reserved.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Made by text */}
                    <Reveal delay={0.4}>
                        <div className="flex justify-end mt-4 px-6">
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                                <span className="italic font-serif">Made by</span>
                                <span className="font-bold text-gray-500 uppercase tracking-wider">Taskos Team</span>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </footer>
    );
};
