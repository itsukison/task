'use client';

import React from 'react';
import { ArrowRight, Search, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from './Reveal';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Dither = dynamic(() => import('./ditherbg'), { ssr: false });

interface MockFolderProps {
    name: string;
    count: number;
    rotate?: number;
    x?: number;
    y?: number;
    delay?: number;
}

// Mock Components for Hero
const MockFolder: React.FC<MockFolderProps> = ({ name, count, rotate = 0, x = 0, y = 0, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, rotate: rotate - 5 }}
        animate={{ opacity: 1, y: 0, rotate: rotate }}
        transition={{ delay, duration: 0.8, type: "spring" }}
        className="absolute hidden lg:flex flex-col items-center justify-start w-[100px] h-[120px] bg-white rounded-xl shadow-lg border border-black/5 p-3 select-none pointer-events-none z-20"
        style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
    >
        <div className="p-2 rounded-lg bg-[#FFD659]/20 mb-2">
            <Folder size={24} className="text-[#eebc1d]" fill="#FFD659" />
        </div>
        <div className="text-center w-full">
            <div className="text-[10px] font-medium text-gray-700 truncate">{name}</div>
            <div className="text-[9px] text-gray-400">{count} items</div>
        </div>
    </motion.div>
);

interface MockFileProps {
    title: string;
    type: 'pdf' | 'doc' | 'sheet';
    rotate?: number;
    x?: number;
    y?: number;
    delay?: number;
}

const MockFile: React.FC<MockFileProps> = ({ title, type, rotate = 0, x = 0, y = 0, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, rotate: rotate + 5 }}
        animate={{ opacity: 1, y: 0, rotate: rotate }}
        transition={{ delay, duration: 0.8, type: "spring" }}
        className="absolute hidden lg:flex flex-col items-center w-[110px] h-[140px] bg-white rounded-lg shadow-xl border border-black/5 p-0 overflow-hidden select-none pointer-events-none z-10"
        style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
    >
        <div className="w-full h-[90px] bg-gray-50/50 p-2 flex flex-col gap-1.5 border-b border-gray-100">
            <div className="w-3/4 h-1.5 bg-gray-200 rounded-full" />
            <div className="w-full h-1.5 bg-gray-100 rounded-full" />
            <div className="w-5/6 h-1.5 bg-gray-100 rounded-full" />
        </div>
        <div className="w-full p-2 flex flex-col items-center justify-center flex-1">
            <div className="flex items-center gap-1.5 mb-1">
                {type === 'pdf' ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
                <span className="text-[8px] font-bold text-gray-400 uppercase">{type}</span>
            </div>
            <div className="text-[9px] font-medium text-gray-700 truncate w-full text-center">{title}</div>
        </div>
    </motion.div>
);

export const HeroSection: React.FC = () => {
    return (
        <main className="w-full min-h-[100vh] relative flex flex-col items-center justify-center bg-background overflow-hidden pt-24 pb-10">

            {/* Background Dither & Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none z-0">
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
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-accent/10 via-accent/5 to-transparent"></div>
            </div>


            {/* Content Container */}
            <div className="max-w-[1280px] mx-auto px-6 relative z-10 w-full flex flex-col items-center text-center">

                {/* Headline */}
                <Reveal delay={0.2} variant="fade-up">
                    <h1 className="text-4xl md:text-6xl lg:text-[5.5rem] leading-[0.95] text-foreground tracking-tighter mb-8 max-w-5xl mx-auto">
                        Built for AI agents. <br />
                        <span className="text-accent">Not retrofitted for them.</span>
                    </h1>
                </Reveal>

                {/* Subheadline */}
                <Reveal delay={0.3} variant="fade-up">
                    <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-normal max-w-2xl mx-auto mb-12">
                        Stop fighting with API endpoints and token limits. Chrono is the workspace designed from the ground up for how humans and AI work together.
                    </p>
                </Reveal>

                {/* Floating Mock Elements (Left Side) - Reduced Count */}
                <MockFolder name="Q3 Reports" count={12} x={-540} y={-80} rotate={-12} delay={0.5} />
                <MockFile title="Strategy.pdf" type="pdf" x={-490} y={60} rotate={-6} delay={0.6} />

                {/* Floating Mock Elements (Right Side) - Reduced Count */}
                <MockFolder name="Assets" count={24} x={420} y={-60} rotate={12} delay={0.5} />
                <MockFile title="Budget_v2.csv" type="sheet" x={380} y={80} rotate={8} delay={0.6} />
                <MockFolder name="Projects" count={5} x={500} y={20} rotate={6} delay={0.7} />


                {/* Intelligent Input Box */}
                <Reveal delay={0.4} variant="scale-up" className="w-full max-w-2xl mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-300 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                    <div className="relative bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <Search className="w-5 h-5 text-orange-500" />
                        </div>
                        <input
                            type="text"
                            disabled
                            placeholder="Generate a weekly schedule from my Q3 goals doc..."
                            className="flex-1 bg-transparent border-none outline-none text-base text-gray-600 placeholder:text-gray-400 px-2 cursor-default"
                        />
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="px-2 py-1 bg-gray-50 rounded text-[10px] font-medium text-gray-400 border border-gray-100">Web Search</div>
                            <div className="px-2 py-1 bg-gray-50 rounded text-[10px] font-medium text-gray-400 border border-gray-100">Notebook</div>
                        </div>
                        <button className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2">
                            Ask AI <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </Reveal>

                {/* CTA Buttons - Below Input */}
                <Reveal delay={0.5} variant="fade-up">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                        <Link
                            href="/signup"
                            className="bg-foreground text-background px-8 py-3.5 rounded-full font-medium text-base hover:scale-105 transition-transform duration-200 shadow-xl shadow-black/5"
                        >
                            Start Free Trial
                        </Link>
                        <Link
                            href="/login"
                            className="px-8 py-3.5 rounded-full font-medium text-base text-foreground/70 hover:text-foreground hover:bg-gray-50 transition-colors"
                        >
                            View Documentation
                        </Link>
                    </div>
                </Reveal>

            </div>
        </main>
    );
};
