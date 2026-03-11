'use client';

import React from 'react';
import Image from 'next/image';
import { Reveal } from './Reveal';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export const FooterSection: React.FC = () => {
    const { t } = useLanguage();
    return (
        <footer className="w-full bg-background border-t border-gray-100 overflow-hidden relative">

            {/* --- Part 1: CTA Section --- */}
            <div className="relative w-full py-32 px-6 flex flex-col items-center justify-center text-center z-10">

                {/* Floating Shape Left (Accent Pyramid) */}
                <div className="hidden lg:block absolute left-10 top-1/2 -translate-y-1/2 -rotate-12 animate-[float_6s_ease-in-out_infinite]">
                    <Reveal delay={0.2} variant="fade-in">
                        <div className="w-32 h-32 md:w-60 md:h-60 bg-gradient-to-br from-accent to-accent rounded-2xl flex items-center justify-center ">
                            <Image src="/triangle.png" alt="Pyramid" width={240} height={240} />
                        </div>
                    </Reveal>
                </div>

                {/* Floating Shape Right (Glassy Cube) */}
                <div className="hidden lg:block absolute right-10 top-20 rotate-12 animate-[float_8s_ease-in-out_infinite_reverse]">
                    <Reveal delay={0.4} variant="fade-in">
                        <div className="w-24 h-24 mr-30 md:w-32 md:h-32 bg-gradient-to-bl from-gray-100 to-white rounded-2xl flex items-center justify-center ">
                            <Image src="/rectangular.png" alt="Clock" width={128} height={128} />
                        </div>
                    </Reveal>
                </div>

                <div className="max-w-2xl mx-auto relative z-10">
                    <Reveal delay={0.1}>
                        <h4 className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-4">
                            {t('landing.footer.cta_badge')}
                        </h4>
                        <h2 className="text-5xl md:text-6xl font-medium tracking-tight text-foreground mb-6 leading-[1.1]">
                            {t('landing.footer.cta_title_prefix')} <br />
                            <span className="text-accent">{t('landing.footer.cta_title_suffix')}</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <p className="text-lg text-gray-500 font-normal mb-10 max-w-lg mx-auto leading-relaxed">
                            {t('landing.footer.cta_subtitle')}
                        </p>
                    </Reveal>

                    <Reveal delay={0.3} variant="scale-up">
                        <Link
                            href="/signup"
                            className="inline-block bg-foreground text-background px-8 py-4 rounded-full text-base font-semibold hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {t('landing.footer.cta_button')}
                        </Link>
                    </Reveal>
                </div>
            </div>


            {/* --- Part 2: Split Footer --- */}
            <div className="relative w-full pb-20 md:pb-32">

                {/* Large Watermark Background (Behind the card) */}
                <div className="absolute bottom-0 w-full flex justify-center pointer-events-none select-none overflow-hidden z-0">
                    <span className="text-[25vw] font-bold text-gray-100/80 leading-[0.75] tracking-tighter translate-y-[25%] opacity-0 animate-[fadeIn_2s_ease-out_forwards]">Taskle</span>
                </div>

                <div className="max-w-[1440px] mx-auto px-4 md:px-6 relative z-10">
                    <Reveal delay={0.2} variant="fade-up">
                        <div className="bg-gray-100/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">

                                {/* Left: Brand Card (Accent Gradient) */}
                                <div className="lg:col-span-5 bg-gradient-to-br from-accent to-accent p-10 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
                                    {/* Decorative gradient blob */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-0.5 mb-8">
                                            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
                                                <Image src="/logo.png" alt={t('common.app_name') + " Logo"} width={28} height={28} className="object-cover" />
                                            </div>
                                            <span className="text-xl font-bold tracking-tight">{t('common.app_name')}</span>
                                        </div>
                                        <h3 className="text-3xl font-medium tracking-tight leading-snug max-w-sm text-white">
                                            {t('landing.footer.brand_desc_prefix')} <br />
                                            <span className="text-white/70">{t('landing.footer.brand_desc_suffix')}</span>
                                        </h3>
                                    </div>

                                    <div className="relative z-10 mt-12">
                                        <p className="text-sm font-medium text-white/80 mb-6 uppercase tracking-wider">{t('landing.footer.stay_in_touch')}</p>
                                        <div className="flex gap-3">
                                            {[
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
                                            <h4 className="text-sm font-semibold text-gray-900 mb-6">{t('landing.footer.nav_title')}</h4>
                                            <ul className="space-y-4">
                                                {[
                                                    { label: t('landing.footer.nav_items.features'), href: '#' },
                                                    { label: t('landing.footer.nav_items.how_it_works'), href: '#' },
                                                    { label: t('landing.footer.nav_items.pricing'), href: '#' },
                                                    { label: t('landing.footer.nav_items.testimonials'), href: '#' },
                                                    { label: t('landing.footer.nav_items.faq'), href: '#' },
                                                    { label: t('landing.footer.nav_items.changelog'), href: '#' },
                                                ].map(item => (
                                                    <li key={item.label}>
                                                        <a href={item.href} className="text-foreground font-medium hover:text-accent transition-colors">{item.label}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-6">{t('landing.footer.company_title')}</h4>
                                            <ul className="space-y-4">
                                                {[
                                                    { label: t('landing.footer.company_items.blog'), href: '/blog' },
                                                    { label: t('landing.footer.company_items.about'), href: '#' },
                                                    { label: t('landing.footer.company_items.contact'), href: '#' },
                                                    { label: t('landing.footer.company_items.terms'), href: '#' },
                                                    { label: t('landing.footer.company_items.privacy'), href: '#' },
                                                ].map(item => (
                                                    <li key={item.label}>
                                                        <a href={item.href} className="text-foreground font-medium hover:text-accent transition-colors">{item.label}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-200/50">
                                        <h4 className="text-2xl font-medium text-foreground tracking-tight mb-2">
                                            {t('landing.footer.subscribe_title_prefix')} <br />
                                            <span className="text-foreground/70">{t('landing.footer.subscribe_title_suffix')}</span>
                                        </h4>

                                        <div className="mt-6 flex gap-2">
                                            <input
                                                type="email"
                                                placeholder={t('landing.footer.email_placeholder')}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors text-foreground placeholder:text-gray-400"
                                            />
                                            <button className="bg-foreground text-background px-6 py-3 rounded-xl font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap">
                                                {t('landing.footer.subscribe_btn')}
                                            </button>
                                        </div>
                                        <div className="mt-6 flex justify-between items-center text-xs text-gray-400">
                                            <p>{t('landing.footer.copyright')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </footer>
    );
};
