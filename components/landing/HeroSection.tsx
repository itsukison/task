'use client';

import React from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';

import { Reveal } from './Reveal';
import Link from 'next/link';



export const HeroSection: React.FC = () => {
    return (
        <main className="w-full h-screen min-h-[700px] max-h-[1080px] relative flex flex-col justify-center bg-background overflow-hidden pt-24 pb-8 md:pt-28 md:pb-10">

            <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full h-full flex flex-col justify-center">

                {/* Top Section: Headline */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 lg:mb-14">
                    <div className="lg:col-span-10">
                        <Reveal delay={0.1} variant="fade-up" priority>
                            <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] leading-[0.9] font-medium text-foreground tracking-tighter">
                                Master Your Time. <br />
                                <span className="text-[#FF5500]">Master Your Day.</span>
                            </h1>
                        </Reveal>
                    </div>
                </div>

                {/* Bottom Section: Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">

                    {/* Left: Large Visual Placeholder (Accent Theme) */}
                    <div className="lg:col-span-7 relative min-h-[300px] flex items-center justify-center lg:justify-start">
                        <Reveal delay={0.3} variant="scale-up" priority className="w-full max-w-lg">
                            <div className="relative w-full aspect-[4/3] flex items-center ml-20 justify-center transform hover:scale-[1.02] transition-transform duration-700 ease-out group">
                                {/* Back Glow */}

                                {/* Image Container */}
                                <div className="relative w-full h-full flex items-center justify-center p-16">
                                    <Image
                                        src="/capsule.png"
                                        alt="Visual"
                                        width={800}
                                        height={600}
                                        className="w-full h-full object-contain mix-blend-multiply scale-125"
                                        priority
                                        quality={90}
                                    />
                                </div>

                            </div>
                        </Reveal>
                    </div>

                    {/* Right: Content */}
                    <div className="lg:col-span-5 flex flex-col gap-8 lg:pl-8 pb-4">
                        <Reveal delay={0.4} priority>
                            <p className="text-lg md:text-xl text-foreground leading-relaxed font-medium">
                                The only daily planner that treats time and tasks as equals. Chrono helps startups plan smarter, execute faster, and maintain transparent visibility—without the bloat.
                            </p>
                        </Reveal>

                        {/* CTA Box */}
                        <Reveal delay={0.5} priority>
                            <div className="flex flex-col sm:flex-row items-center p-1 bg-gray-100 rounded-xl max-w-md">
                                <Link
                                    href="/signup"
                                    className="flex-1 w-full bg-foreground text-background px-5 py-3.5 rounded-lg font-medium text-base flex items-center justify-between group shadow-lg"
                                >
                                    Get Free Trial
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="flex-1 w-full flex items-center justify-between px-5 py-3.5 text-foreground font-medium text-base hover:bg-gray-200/50 rounded-lg transition-colors"
                                >
                                    Sign In
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </Reveal>

                        {/* Divider & Social Proof */}
                        <Reveal delay={0.6} priority>
                            <div className="pt-6 border-t border-gray-200 mt-2">
                                <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-4">Trusted by 300+ Companies</p>
                                <div className="flex flex-wrap gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                                    <span className="text-xl font-bold font-serif text-foreground">Acme</span>
                                    <span className="text-xl font-bold font-sans italic text-foreground">Global</span>
                                    <span className="text-xl font-bold font-mono text-foreground">Stark</span>
                                    <span className="text-xl font-bold font-sans text-foreground">Wayne</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                </div>

            </div >
        </main >
    );
};
