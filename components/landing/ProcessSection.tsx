'use client';

import React, { useRef, useEffect, useState } from 'react';
import { AsciiArt } from './AsciiArt';
import { ArrowRight } from 'lucide-react';

const PLAN_UI_ART = `
    [ Criteria ]
    
    Country *
    [ United States     v ]
    
    Age
    24 ●────────────── 45
    
    Sex
    (o) Any   ( ) Man
`;

const FOCUS_UI_ART = `
    +-------------------+
    |                   |
    |   AI-SUGGESTED    |
    |                   |
    |   The user uses   |
    |   expense track   |
    |   features...     |
    |                   |
    |   [ Add themes ]  |
    +-------------------+
`;

const REVIEW_UI_ART = `
    Team Workload
    
    Tanaka    ████ 95%
    Suzuki    █░░░ 20%
    
    [ Export Report ]
`;

export const ProcessSection: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const { top, height } = containerRef.current.getBoundingClientRect();
            const scrollLength = height - window.innerHeight;
            const p = Math.max(0, Math.min(1, -top / scrollLength));
            setProgress(p);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const activeIndex = Math.min(Math.round(progress * 2), 2);
    const translateX = progress * 200;

    const sections = [
        {
            id: 0,
            label: 'Plan',
            title: "Reach the right clarity, effortlessly",
            text: "Instantly tap into your daily tasks or connect with your team's rhythm. Taskos handles scheduling and prioritization, giving you room to ask smarter questions.",
            art: PLAN_UI_ART,
            color: "bg-[#d8b4fe]",
            cardColor: "text-purple-900"
        },
        {
            id: 1,
            label: 'Focus',
            title: "Gain the clarity to shape work",
            text: "Empower more people to run deep work sessions. Our AI cuts through the noise to surface patterns, so you can spend less time on busywork and more time shipping.",
            art: FOCUS_UI_ART,
            color: "bg-[#fcd34d]",
            cardColor: "text-amber-900"
        },
        {
            id: 2,
            label: 'Review',
            title: "Analyze insights at scale",
            text: "Visualize team capacity and velocity. Spot bottlenecks before they become blockers with our automated workload analysis.",
            art: REVIEW_UI_ART,
            color: "bg-[#bae6fd]",
            cardColor: "text-blue-900"
        }
    ];

    return (
        <section id="process" ref={containerRef} className="relative h-[300vh] bg-background">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col pt-28 md:pt-40">

                {/* Header / Tabs */}
                <div className="w-full max-w-[1280px] mx-auto px-6 mb-12 md:mb-16">
                    <div className="flex flex-wrap items-baseline gap-4 md:gap-12">
                        {sections.map((item) => (
                            <div key={item.id} className="relative group">
                                {activeIndex === item.id && (
                                    <div className="absolute inset-0 -inset-x-4 -inset-y-2 bg-[#eaeaea] rounded-lg -z-10 transition-all duration-300 origin-center" />
                                )}
                                <button
                                    className={`text-4xl md:text-6xl lg:text-7xl font-normal tracking-tight transition-colors duration-500 ${activeIndex === item.id ? 'text-foreground' : 'text-gray-300 hover:text-gray-400'
                                        }`}
                                    onClick={() => {
                                        if (containerRef.current) {
                                            const scrollLength = containerRef.current.offsetHeight - window.innerHeight;
                                            const targetY = containerRef.current.offsetTop + (scrollLength * (item.id / 2));
                                            window.scrollTo({ top: targetY, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    {item.label}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Slides */}
                <div className="flex-1 flex w-[300vw] will-change-transform transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${translateX}vw)` }}>

                    {sections.map((slide) => (
                        <div key={slide.id} className="w-[100vw] flex justify-center h-full">
                            <div className="w-full max-w-[1280px] px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start pt-4">

                                {/* Left: Text Content */}
                                <div className="max-w-xl pt-4 md:pt-8">
                                    <h3 className="text-4xl md:text-5xl font-medium text-foreground mb-8 leading-[1.1] tracking-tight">
                                        {slide.title}
                                    </h3>
                                    <p className="text-lg md:text-xl text-foreground/70 leading-relaxed mb-8">
                                        {slide.text}
                                    </p>
                                    <a href="#" className="inline-flex items-center text-foreground font-semibold text-lg hover:text-accent transition-colors group">
                                        Learn more <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>

                                {/* Right: Visual Card */}
                                <div className={`w-full aspect-square md:aspect-[4/3] ${slide.color} rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 relative flex items-center justify-center shadow-sm overflow-hidden`}>

                                    {/* Background Pattern (Subtle) */}
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>

                                    {/* Floating UI Card */}
                                    <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md transform transition-transform hover:scale-105 duration-500">
                                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        </div>
                                        <AsciiArt art={slide.art} className={`bg-transparent border-none ${slide.cardColor} font-medium scale-110 md:scale-125`} />
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
};
