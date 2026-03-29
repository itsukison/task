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

                                </div>

                                {/* Right: Navigation & Newsletter */}
                                <div className="lg:col-span-7 p-10 md:p-14 relative z-10 flex flex-col justify-between">
                                    <div className="grid grid-cols-2 gap-12 mb-12">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-6">{t('landing.footer.nav_title')}</h4>
                                            <ul className="space-y-4">
                                                {[
                                                    { label: t('landing.footer.nav_items.features'), href: '/#features' },
                                                    { label: t('landing.footer.nav_items.how_it_works'), href: '/#process' },
                                                    { label: t('landing.footer.nav_items.testimonials'), href: '/#testimonials' },
                                                    { label: t('landing.footer.nav_items.blog'), href: '/blog' },
                                                    { label: t('landing.footer.nav_items.vision'), href: '/vision/endpoint' },
                                                    { label: t('landing.footer.nav_items.company'), href: '/company' },
                                                ].map(item => (
                                                    <li key={item.label}>
                                                        <Link href={item.href} className="text-foreground font-medium hover:text-accent transition-colors">{item.label}</Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-6">{t('landing.footer.company_title')}</h4>
                                            <ul className="space-y-4">
                                                {[
                                                    { label: t('landing.footer.company_items.blog'), href: '/blog' },
                                                    { label: t('landing.footer.company_items.about'), href: '/company' },
                                                    { label: t('landing.footer.company_items.vision_endpoint'), href: '/vision/endpoint' },
                                                    { label: t('landing.footer.company_items.vision_employee'), href: '/vision/employee' },
                                                    { label: t('landing.footer.company_items.login'), href: '/login' },
                                                    { label: t('landing.footer.company_items.signup'), href: '/signup' },
                                                ].map(item => (
                                                    <li key={item.label}>
                                                        <Link href={item.href} className="text-foreground font-medium hover:text-accent transition-colors">{item.label}</Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="pt-8 border-t border-gray-200/50">
                                        <div className="flex justify-between items-center text-xs text-gray-400">
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
