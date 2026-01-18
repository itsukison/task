'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import to avoid SSR issues with Three.js
const Dither = dynamic(() => import('./ditherbg'), { ssr: false });



export const ProductSection: React.FC = () => {
    return (
        <section id="features" className="w-full min-h-[700px] py-24 bg-background relative overflow-hidden flex items-center justify-center border-b border-gray-100">

            {/* Background Dither & Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-[80%] pointer-events-none z-0">
                {/* Dither Background */}
                <div className="absolute inset-0 opacity-50">
                    <Dither
                        waveColor={[1.0, 0.33, 0.0]}  /* #FF5500 in RGB normalized */
                        disableAnimation={false}
                        enableMouseInteraction={false}
                        mouseRadius={0.3}
                        colorNum={5}
                        waveAmplitude={0.2}
                        waveFrequency={2}
                        waveSpeed={0.02}
                        invertColors={true}
                    />
                </div>

                {/* Fade Mask (White to Transparent) to blend top of dither */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-transparent h-1/2"></div>

                {/* Bottom Accent Glow */}
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#FF5500]/10 via-[#FF5500]/5 to-transparent"></div>
            </div>

            <div className="max-w-[1280px] mx-auto px-6 relative w-full z-10">

                {/* Floating Element Left - Square (positioned higher) */}
                <div className="hidden lg:block absolute top-1/4 -mt-20 -translate-y-1/2 left-0 xl:left-20">
                    <Reveal delay={0.2} variant="fade-in">
                        <div className="animate-[bounce_5s_infinite]">
                            <div className="relative w-28 h-28">
                                <Image
                                    src="/square.png"
                                    alt="Task Box"
                                    width={112}
                                    height={112}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* Floating Element Right - Donut (positioned lower) */}
                <div className="hidden lg:block absolute top-2/3 -translate-y-1/2 right-0 xl:right-20">
                    <Reveal delay={0.3} variant="fade-in">
                        <div className="animate-[bounce_5s_infinite]">
                            <div className="relative w-56 h-56">
                                <Image
                                    src="/donut.png"
                                    alt="Clock"
                                    width={224}
                                    height={224}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* Centered Content */}
                <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">

                    <Reveal delay={0.1}>
                        <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-foreground leading-[1.1] mb-8">
                            One tool. Two views. <br />
                            <span className="text-[#FF5500]">Complete clarity.</span>
                        </h2>
                    </Reveal>

                    <Reveal delay={0.2} variant="fade-up">
                        <div className="flex items-center gap-6 w-full justify-center mb-10">
                            <div className="h-[1px] bg-gray-200 w-16"></div>
                            <p className="text-lg text-foreground/70 font-normal max-w-lg text-center leading-relaxed">
                                Your tasks and calendar finally speak the same language. <br /> See exactly what fits in your day.
                            </p>
                            <div className="h-[1px] bg-gray-200 w-16"></div>
                        </div>
                    </Reveal>

                    <Reveal delay={0.3}>
                        <Link
                            href="/signup"
                            className="group text-foreground text-base font-semibold py-3 px-6 rounded-full flex items-center gap-2 transition-all hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-lg"
                        >
                            Get Started Free
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Reveal>

                </div>
            </div>
        </section>
    );
};
