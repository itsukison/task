'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Calendar, User, Database, Globe, MessageSquare, Zap, FileText, Mail } from 'lucide-react';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { OrbitingCircles } from '@/components/ui/orbiting-circles';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';

// --- Card 1: Chat UI (Real-time AI Collaboration) - Blue #72b0ff ---
const ChatDemo = () => {
    const { t } = useLanguage();
    return (
        <div className="w-full h-full flex flex-col justify-center items-center p-8">
            {/* User Message (Right) */}
            <div className="w-full flex justify-end mb-6">
                <div className="bg-[#72b0ff] text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                    <p className="text-sm font-medium leading-relaxed">
                        {t('landing.process.demo_chat_user')}
                    </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 ml-3 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm mt-auto">
                    <User className="w-full h-full p-1 text-gray-400" />
                </div>
            </div>

            {/* AI Response (Left) */}
            <div className="w-full flex justify-start">
                <div className="w-8 h-8 rounded-full bg-[#72b0ff]/20 mr-3 flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm mt-auto">
                    <Zap className="w-4 h-4 text-[#72b0ff]" />
                </div>
                <div className="bg-white border border-gray-100 text-gray-600 p-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                    <p className="text-sm leading-relaxed">
                        {t('landing.process.demo_chat_ai')}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button className="px-3 py-1.5 bg-[#72b0ff]/10 text-[#72b0ff] text-xs font-medium rounded-full hover:bg-[#72b0ff]/20 transition-colors">
                            {t('landing.process.demo_chat_btn_book')}
                        </button>
                        <button className="px-3 py-1.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-full hover:bg-gray-100 transition-colors">
                            {t('landing.process.demo_chat_btn_attendees')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Card 2: Animated Beam (Natural Language to Action) - Yellow/Amber #ffce18 ---
const BeamDemo = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const div1Ref = useRef<HTMLDivElement>(null);
    const div2Ref = useRef<HTMLDivElement>(null);
    const div3Ref = useRef<HTMLDivElement>(null);
    const div4Ref = useRef<HTMLDivElement>(null);
    const div5Ref = useRef<HTMLDivElement>(null);
    const div6Ref = useRef<HTMLDivElement>(null);
    const div7Ref = useRef<HTMLDivElement>(null);

    // Using #ffce18 for the main accent. 
    // Gradient from #ffce18 to a slightly lighter/darker shade or keeping it consistent.
    const beamColor = "#ffce18";

    return (
        <div
            className="relative flex w-full h-full items-center justify-center overflow-hidden p-10"
            ref={containerRef}
        >
            <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
                <div className="flex flex-col justify-center gap-2">
                    <Circle ref={div1Ref} className="bg-white border-gray-200">
                        <User className="h-6 w-6 text-gray-600" />
                    </Circle>
                    <Circle ref={div2Ref} className="bg-white border-gray-200">
                        <FileText className="h-6 w-6 text-gray-600" />
                    </Circle>
                    <Circle ref={div3Ref} className="bg-white border-gray-200">
                        <MessageSquare className="h-6 w-6 text-gray-600" />
                    </Circle>
                    <Circle ref={div4Ref} className="bg-white border-gray-200">
                        <Mail className="h-6 w-6 text-gray-600" />
                    </Circle>
                    <Circle ref={div5Ref} className="bg-white border-gray-200">
                        <Globe className="h-6 w-6 text-gray-600" />
                    </Circle>
                </div>
                <div className="flex flex-col justify-center">
                    <Circle ref={div6Ref} className="size-16 bg-[#ffce18] border-none shadow-[#ffce18]/40 shadow-xl">
                        <Zap className="h-8 w-8 text-white" />
                    </Circle>
                </div>
                <div className="flex flex-col justify-center">
                    <Circle ref={div7Ref} className="bg-white border-gray-200">
                        <Database className="h-6 w-6 text-gray-600" />
                    </Circle>
                </div>
            </div>

            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div1Ref}
                toRef={div6Ref}
                pathColor="#e4e4e7" // gray-200
                gradientStartColor={beamColor}
                gradientStopColor={beamColor}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div2Ref}
                toRef={div6Ref}
                pathColor="#e4e4e7"
                gradientStartColor={beamColor}
                gradientStopColor={beamColor}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div3Ref}
                toRef={div6Ref}
                pathColor="#e4e4e7"
                gradientStartColor={beamColor}
                gradientStopColor={beamColor}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div4Ref}
                toRef={div6Ref}
                pathColor="#e4e4e7"
                gradientStartColor={beamColor}
                gradientStopColor={beamColor}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div5Ref}
                toRef={div6Ref}
                pathColor="#e4e4e7"
                gradientStartColor={beamColor}
                gradientStopColor={beamColor}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div6Ref}
                toRef={div7Ref}
                pathColor="#e4e4e7"
                gradientStartColor={beamColor}
                gradientStopColor={beamColor}
            />
        </div>
    );
};

const Circle = React.forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
                className,
            )}
        >
            {children}
        </div>
    );
});
Circle.displayName = "Circle";


// --- Card 3: Orbiting Circles (Integrations) - Purple #c79ffb ---
const OrbitDemo = () => {
    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
            <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300 bg-clip-text text-center text-3xl font-semibold leading-none text-transparent dark:from-white dark:to-black">
                Chrono
            </span>

            {/* Inner Circles */}
            <OrbitingCircles
                className="size-[45px] border-none bg-transparent"
                duration={20}
                delay={0}
                radius={80}
            >
                <Image src="/notion.png" alt="Notion" width={45} height={45} className="object-contain" />
                <Image src="/Slack_icon_2019.svg.png" alt="Slack" width={45} height={45} className="object-contain" />
            </OrbitingCircles>

            {/* Outer Circles (Reverse) */}
            <OrbitingCircles
                className="size-[50px] border-none bg-transparent"
                radius={150}
                duration={25}
                delay={0}
                reverse
            >
                <Image src="/Microsoft_Teams.png" alt="Teams" width={50} height={50} className="object-contain" />
                <Image src="/gmail.png" alt="Gmail" width={50} height={50} className="object-contain" />
            </OrbitingCircles>
        </div>
    );
};


export const ProcessSection: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const { t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const { top, height } = containerRef.current.getBoundingClientRect();
            // scrollLength is the total scrollable distance within the component
            const scrollLength = height - window.innerHeight;
            // Calculate progress 0 to 1
            const p = Math.max(0, Math.min(1, -top / scrollLength));
            setProgress(p);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // activeIndex: 0, 1, or 2 based on scroll progress
    const activeIndex = Math.min(Math.round(progress * 2), 2);
    // translateX moves the slides horizontally
    const translateX = progress * 200;

    const sections = [
        {
            id: 0,
            label: t('landing.process.collab_tab'),
            title: t('landing.process.collab_title'),
            text: t('landing.process.collab_text'),
            bgColor: "bg-[#72b0ff]/10", // Blue tint
            borderColor: "border-[#72b0ff]/20",
            component: <ChatDemo />
        },
        {
            id: 1,
            label: t('landing.process.processing_tab'),
            title: t('landing.process.processing_title'),
            text: t('landing.process.processing_text'),
            bgColor: "bg-[#ffce18]/10", // Yellow tint
            borderColor: "border-[#ffce18]/20",
            component: <BeamDemo />
        },
        {
            id: 2,
            label: t('landing.process.integration_tab'),
            title: t('landing.process.integration_title'),
            text: t('landing.process.integration_text'),
            bgColor: "bg-[#c79ffb]/10", // Purple tint
            borderColor: "border-[#c79ffb]/20",
            component: <OrbitDemo />
        }
    ];

    return (
        <section id="process" ref={containerRef} className="relative h-[300vh] bg-background">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col pt-24 md:pt-36">

                {/* Header / Tabs */}
                <div className="w-full max-w-[1280px] mx-auto px-6 mb-12">
                    <div className="flex flex-wrap items-baseline gap-4 md:gap-12">
                        {sections.map((item) => (
                            <div key={item.id} className="relative group">
                                {activeIndex === item.id && (
                                    <div className="absolute inset-0 -inset-x-4 -inset-y-2 bg-[#fbfbfb] rounded-lg -z-10 transition-all duration-300 origin-center" />
                                )}
                                <button
                                    className={`text-4xl md:text-5xl lg:text-7xl tracking-tight transition-colors duration-500 ${activeIndex === item.id ? 'text-foreground' : 'text-gray-300 hover:text-gray-400'
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
                                <div className="max-w-xl pt-4 md:pt-12">
                                    <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-6 leading-[1.1] tracking-tight">
                                        {slide.title}
                                    </h3>
                                    <p className="text-lg md:text-xl text-foreground/70 leading-relaxed mb-8 font-light">
                                        {slide.text}
                                    </p>
                                    <a href="#" className="inline-flex items-center text-orange-600 font-medium text-lg hover:text-orange-700 transition-colors group">
                                        {t('landing.process.learn_more')} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>

                                {/* Right: Visual Card */}
                                <div className={`w-full aspect-square md:aspect-[4/3] ${slide.bgColor} rounded-[2.5rem] p-8 md:p-12 relative flex items-center justify-center shadow-sm border ${slide.borderColor || 'border-transparent'} overflow-hidden`}>
                                    {/* Render the specific demo component */}
                                    {slide.component}
                                </div>

                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
};
