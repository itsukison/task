import React from 'react';
import { ArrowRight, CheckCircle2, Clock, Shield, Sparkles, Users, Zap } from 'lucide-react';
import { Reveal } from './Reveal';
import Link from 'next/link';

export const ProductSection: React.FC = () => {
    return (
        <section id="features" className="w-full py-24 bg-white relative overflow-hidden flex flex-col gap-32">

            <div className="max-w-[1280px] mx-auto px-6 relative w-full z-10">

                {/* --- Section 1: Intelligent Scheduling (Centered) - MOVED TO TOP --- */}
                <div className="flex flex-col items-center text-center mb-32">
                    <Reveal delay={0.1}>
                        <h4 className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-4">
                            Intelligent Scheduling
                        </h4>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-foreground leading-[1.1] mb-6 max-w-3xl">
                            Sequential data. <br />
                            <span className="text-accent">Intelligence built in.</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={0.3}>
                        <p className="text-lg text-gray-500 font-normal leading-relaxed mb-12 max-w-2xl mx-auto">
                            The first timeline-based workspace designed for how humans and AI truly collaborate. Drag and drop to schedule, and watch your project plan adapt instantly.
                        </p>
                    </Reveal>

                    <Reveal delay={0.4} variant="fade-up" className="w-full max-w-5xl relative">
                        {/* Backdrop Blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-50/50 rounded-full blur-3xl -z-10" />

                        {/* Window Frame (Clean - No Header) */}
                        <div className="relative rounded-xl  p-2">
                            <div className="relative rounded-lg overflow-hidden">
                                <video
                                    src="/videos/drag_to_schedule.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto object-contain"
                                />
                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </Reveal>
                </div>


                {/* --- Section 2: Quick Capture (Video Left / Text Right) - RECOLORED --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center mb-32">

                    {/* Visual Side (Left) */}
                    <Reveal delay={0.2} variant="fade-in" className="relative order-2 lg:order-1">
                        {/* Backdrop Blob - Orange */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-50/50 rounded-full blur-3xl -z-10" />

                        {/* Window Frame (Clean - No Header) */}
                        <div className="relative rounded-xl p-2">
                            <div className="relative rounded-lg overflow-hidden">
                                <video
                                    src="/videos/new-task.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                        </div>
                    </Reveal>

                    {/* Text Side (Right) */}
                    <div className="flex flex-col items-start text-left order-1 lg:order-2">
                        <Reveal delay={0.1}>
                            <h4 className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-4">
                                Quick Capture
                            </h4>
                        </Reveal>
                        <Reveal delay={0.2}>
                            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-6">
                                Capture tasks at <br />
                                <span className="text-accent">the speed of thought.</span>
                            </h2>
                        </Reveal>
                        <Reveal delay={0.3}>
                            <p className="text-lg text-gray-500 font-normal leading-relaxed mb-8 max-w-lg">
                                Don't let ideas slip away. Create tasks instantly with natural language, and let AI handle the categorization and tagging for you.
                            </p>
                        </Reveal>
                        <Reveal delay={0.4}>
                            <div className="flex flex-wrap gap-3">
                                {/* Feature Pills - Orange/Accent */}
                                <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <Zap className="w-4 h-4 text-orange-500" />
                                    <span>Instant Create</span>
                                </div>
                                <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <Sparkles className="w-4 h-4 text-orange-500" />
                                    <span>AI Parsing</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>


                {/* --- Section 3: Collaboration (Video Right / Text Left) - RECOLORED --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Text Side (Left) */}
                    <div className="flex flex-col items-start text-left">
                        <Reveal delay={0.1}>
                            <h4 className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-4">
                                Team Coordination
                            </h4>
                        </Reveal>
                        <Reveal delay={0.2}>
                            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-6">
                                Stay aligned <br />
                                <span className="text-accent">without the noise.</span>
                            </h2>
                        </Reveal>
                        <Reveal delay={0.3}>
                            <p className="text-lg text-gray-500 font-normal leading-relaxed mb-8 max-w-lg">
                                Easily assign members to tasks and keep everyone in the loop. Visual progress tracking ensures your team hits every deadline.
                            </p>
                        </Reveal>
                        <Reveal delay={0.4}>
                            <div className="flex flex-wrap gap-3 mb-10">
                                {/* Feature Pills - Orange/Accent */}
                                <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <Users className="w-4 h-4 text-orange-500" />
                                    <span>Team Assign</span>
                                </div>
                                <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span>Progress Tracking</span>
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delay={0.5}>
                            <Link
                                href="/signup"
                                className="bg-foreground text-background px-8 py-3.5 rounded-full font-medium text-base hover:bg-neutral-800 transition-colors flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight size={16} />
                            </Link>
                        </Reveal>
                    </div>

                    {/* Visual Side (Right) */}
                    <Reveal delay={0.2} variant="fade-in" className="relative">
                        {/* Backdrop Blob - Orange */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-50/50 rounded-full blur-3xl -z-10" />

                        {/* Window Frame (Clean - No Header) */}
                        <div className="relative rounded-xl p-2">
                            <div className="relative rounded-lg overflow-hidden">
                                <video
                                    src="/videos/member-selection.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                        </div>
                    </Reveal>

                </div>
            </div>
        </section>
    );
};
