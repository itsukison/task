'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Reveal } from './Reveal';
import Link from 'next/link';

export const AutomationSection: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const { top } = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            const start = windowHeight * 0.8;
            const end = windowHeight * 0.2;

            const rawProgress = (start - top) / (start - end);
            const clamped = Math.max(0, Math.min(1, rawProgress));

            setScrollProgress(clamped);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getLineStyle = (index: number): React.CSSProperties => {
        const start = index * 0.2;
        const duration = 0.4;

        const localProgress = (scrollProgress - start) / duration;
        const clamped = Math.max(0, Math.min(1, localProgress));

        const targetColor = index === 3 ? 'var(--color-accent)' : '#ffffff';
        const baseColor = '#222222';

        return {
            backgroundImage: `linear-gradient(90deg, ${targetColor} ${clamped * 100}%, ${baseColor} ${clamped * 100}%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'block',
            width: 'fit-content',
            transition: 'all 0.1s linear'
        };
    };

    return (
        <section ref={containerRef} className="w-full min-h-[110vh] bg-[#050505] relative flex flex-col items-center justify-center py-20 border-t border-gray-900 overflow-hidden">

            {/* Background Gradients & Halftone */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Deep Accent Glow Base */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-accent rounded-full blur-[120px] opacity-20"></div>

                {/* Halftone Dot Pattern */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: 'radial-gradient(circle, var(--color-accent) 3px, transparent 3.5px)',
                        backgroundSize: '32px 32px',
                        maskImage: 'radial-gradient(circle at center, black 0%, rgba(0,0,0,0.5) 40%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 0%, rgba(0,0,0,0.5) 40%, transparent 70%)'
                    }}
                ></div>

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]"></div>
            </div>

            <div className="max-w-[1440px] w-full px-6 md:px-12 relative z-10 flex flex-col justify-center h-full">

                {/* Side Label */}
                <div className="absolute left-6 md:left-12 top-1/3 hidden 2xl:flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    <span className="text-white/60 font-mono text-xs tracking-widest uppercase">State of 2026</span>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto w-full lg:pl-16 mt-10 md:mt-0">
                    {/* Scroll Text Animation */}
                    <h2 className="text-3xl md:text-5xl lg:text-[4.5rem] leading-[1.0] font-bold tracking-tighter mb-12">
                        <span style={getLineStyle(0)}>Answers. Tasks. Operations.</span>
                        <span style={getLineStyle(1)}>AI handles the first two.</span>
                        <span style={getLineStyle(2)}>Almost no one automates the third.</span>
                        <span style={getLineStyle(3)} className="mt-2">Until now.</span>
                    </h2>

                    {/* Actions */}
                    <Reveal delay={0.5} priority>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 md:gap-10 pl-1">
                            <Link
                                href="/signup"
                                className="bg-white text-foreground px-7 py-3.5 rounded-full font-semibold text-base md:text-lg hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(218,119,86,0.3)]"
                            >
                                See it in action
                            </Link>
                            <p className="text-zinc-500 text-base md:text-lg max-w-md leading-relaxed">
                                <span className="text-white font-semibold">It&apos;s time.</span> Start building fully automated processes with Taskos Workflow.
                            </p>
                        </div>
                    </Reveal>
                </div>

            </div>

        </section>
    );
};
