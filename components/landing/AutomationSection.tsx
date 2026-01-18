'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Reveal } from './Reveal';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import to avoid SSR issues with Three.js
const Dither = dynamic(() => import('./ditherbg'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#050505]">
      {/* Placeholder matching the dither background */}
    </div>
  )
});

export const AutomationSection: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [shouldLoadDither, setShouldLoadDither] = useState(false);

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

    // Intersection Observer for deferred Three.js loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setShouldLoadDither(true);
                }
            },
            { rootMargin: '200px' } // Start loading 200px before visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const getLineStyle = (index: number): React.CSSProperties => {
        const start = index * 0.25;
        const duration = 0.2;

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
        <section ref={containerRef} className="w-full h-screen max-h-screen bg-[#050505] relative flex flex-col items-center justify-center border-t border-gray-900 overflow-hidden">

            {/* Background Gradients & Dither */}
            <div className="absolute inset-0 z-0">
                {/* Deep Accent Glow Base */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#FF5500] rounded-full blur-[120px] opacity-10"></div>

                {/* Dither Canvas */}
                {shouldLoadDither && (
                    <div className="absolute inset-0 opacity-50 mix-blend-screen">
                        <Dither
                            waveColor={[1.0, 0.33, 0.0]}  /* #FF5500 in RGB normalized */
                            disableAnimation={false}
                            enableMouseInteraction={true}
                            mouseRadius={0.4}
                            colorNum={3}
                            waveAmplitude={0.35}
                            waveFrequency={2}
                            waveSpeed={0.04}
                        />
                    </div>
                )}

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_75%)] pointer-events-none"></div>
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
                    <h2 className="text-3xl md:text-3xl lg:text-[3.5rem] leading-[1.0] tracking-tighter mb-12">
                        <span style={getLineStyle(0)}>Tasks. Meetings. Execution.</span>
                        <span style={getLineStyle(1)}>Most tools handle the first two.</span>
                        <span style={getLineStyle(2)}>Almost no one synchronizes the third.</span>
                        <span style={getLineStyle(3)} className="mt-2">Until Chrono.</span>
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
                                <span className="text-white font-semibold">It&apos;s time.</span> Start building your daily rhythm with Chrono.
                            </p>
                        </div>
                    </Reveal>
                </div>

            </div>

        </section>
    );
};
