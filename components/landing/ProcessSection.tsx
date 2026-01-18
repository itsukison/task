'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';



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
            title: "Start with Clarity",
            text: "Plan your day based on available time, not wishful thinking. Chrono shows exactly what fits in your calendar, so you start every day with realistic expectations.",
            image: "/rectangular.png",
            color: "bg-[#E7E5E4]", // Warm Stone
            cardColor: "text-stone-800"
        },
        {
            id: 1,
            label: 'Execute',
            title: "Stay in Flow",
            text: "Drag tasks into your calendar. Resize blocks as reality unfolds. Chrono adapts with you, keeping time and tasks synchronized without breaking your focus.",
            image: "/triangle.png",
            color: "bg-[#FFDBC7]", // Soft Apricot/Clay
            cardColor: "text-orange-950"
        },
        {
            id: 2,
            label: 'Review',
            title: "Learn Your Rhythm",
            text: "See where time actually goes. Spot patterns in your execution. Improve daily. With Chrono, execution wisdom compounds over time.",
            image: "/donut.png",
            color: "bg-[#D4DEE7]", // Muted Steel/Slate
            cardColor: "text-slate-800"
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
                                <div className={`w-full aspect-square md:aspect-[4/3] ${slide.color} rounded-[2rem] md:rounded-[2rem] p-8 md:p-12 relative flex items-center justify-center shadow-sm overflow-hidden`}>

                                    {/* Background Pattern (Subtle) */}
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>

                                    {/* Floating UI Card - Replaced with Shape Image */}
                                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center transform transition-transform hover:scale-105 duration-500">
                                        <Image
                                            src={slide.image}
                                            alt={slide.label}
                                            width={320}
                                            height={320}
                                            className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply opacity-90"
                                        />
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
