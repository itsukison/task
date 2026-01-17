'use client';

import React from 'react';
import { AsciiArt } from './AsciiArt';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import Link from 'next/link';

const PLAN_ASCII = `
   [x]
  ====
  ====
   --
`;

const CLOCK_ASCII = `
  .--.
 ( 12 )
 | 09 |
 '----'
`;

export const ProductSection: React.FC = () => {
    return (
        <section id="features" className="w-full h-screen bg-background relative overflow-hidden flex items-center justify-center border-b border-gray-100">

            {/* Background Halftone & Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-[70%] pointer-events-none z-0">
                {/* Halftone Pattern */}
                <div
                    className="absolute inset-0 opacity-25"
                    style={{
                        backgroundImage: 'radial-gradient(circle, var(--color-accent) 2px, transparent 2.5px)',
                        backgroundSize: '24px 24px',
                        backgroundPosition: 'center bottom'
                    }}
                ></div>

                {/* Fade Mask (White to Transparent) to blend top of halftone */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent h-2/3"></div>

                {/* Bottom Accent Glow */}
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-accent/15 via-accent/5 to-transparent"></div>
            </div>

            <div className="max-w-[1280px] mx-auto px-6 relative w-full z-10">

                {/* Floating Element Left */}
                <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-0 xl:left-20">
                    <Reveal delay={0.2} variant="fade-in">
                        <div className="animate-[bounce_5s_infinite]">
                            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-[2rem] p-6 w-40 h-32 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                <AsciiArt art={PLAN_ASCII} className="bg-transparent border-none text-accent scale-125 font-bold" />
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* Floating Element Right */}
                <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-0 xl:right-20">
                    <Reveal delay={0.3} variant="fade-in">
                        <div className="animate-[pulse_4s_infinite]">
                            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-[2rem] p-6 w-40 h-32 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                <AsciiArt art={CLOCK_ASCII} className="bg-transparent border-none text-gray-800 scale-125 font-bold" />
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* Centered Content */}
                <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">

                    <Reveal delay={0.1}>
                        <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter text-foreground leading-[1.1] mb-8">
                            Your single source of <br />
                            truth for <span className="text-accent">daily operations</span> <br />
                            and <span className="text-gray-400">team rhythm.</span>
                        </h2>
                    </Reveal>

                    <Reveal delay={0.2} variant="fade-up">
                        <div className="flex items-center gap-6 w-full justify-center mb-10">
                            <div className="h-[1px] bg-gray-200 w-16"></div>
                            <p className="text-lg text-foreground/70 font-normal max-w-lg text-center leading-relaxed">
                                Experience the clarity that comes with having <br /> your execution under control.
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
