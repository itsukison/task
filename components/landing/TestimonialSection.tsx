'use client';

import React from 'react';
import { Reveal } from './Reveal';
import Dither from './ditherbg';

export const TestimonialSection: React.FC = () => {
    return (
        <section id="testimonials" className="w-full min-h-screen bg-background py-24 flex flex-col items-center justify-center border-b border-gray-100">
            <div className="max-w-[1280px] w-full px-6">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <Reveal delay={0.1}>
                        <span className="font-serif italic text-orange-500 text-xl mb-4 block">Community</span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-foreground mb-6 leading-[1.05]">
                            Built for <br />
                            Deep Work
                        </h2>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <p className="text-lg text-foreground/70 leading-relaxed max-w-2xl mx-auto">
                            Join thousands who have traded busywork for execution.
                        </p>
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr mb-8">

                    {/* Row 1 - Card 1: Stat with Dither */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.3} className="h-full">
                            <div className="rounded-[2rem] relative overflow-hidden h-full min-h-[320px] shadow-sm transform transition-all duration-500 hover:scale-[1.02]">
                                <div className="absolute inset-0">
                                    <Dither
                                        waveColor={[0.9, 0.3, 0.1]} // Orange/Red
                                        waveSpeed={0.05}
                                        enableMouseInteraction={true}
                                        colorNum={4}
                                    />
                                </div>

                                <div className="relative z-10 p-8 h-full flex flex-col justify-between pointer-events-none">
                                    <div className="flex items-center gap-2 text-white/90">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                        <span className="text-sm font-medium uppercase tracking-wider">Impact</span>
                                    </div>

                                    <div>
                                        <h3 className="text-6xl font-medium text-white tracking-tighter mb-2">15+</h3>
                                        <p className="text-white/80 font-medium text-xl leading-snug">Hours saved per week<br />on average.</p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 1 - Card 2: Main Testimonial */}
                    <div className="lg:col-span-2">
                        <Reveal delay={0.4} className="h-full">
                            <div className="bg-white rounded-[2rem] p-10 flex flex-col justify-between h-full relative overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>

                                <div className="relative z-10 w-full">
                                    <div className="flex gap-1 mb-6 text-orange-500">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>

                                    <h3 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight leading-snug mb-8">
                                        &ldquo;Chrono is the first tool that actually respects my cognitive load. It doesn't just list tasks; it helps me <span className="text-orange-600 px-1 rounded">carve out time</span> for them.&rdquo;
                                    </h3>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">J</div>
                                        <div>
                                            <h4 className="text-base font-medium text-foreground leading-tight">Jessica Liang</h4>
                                            <p className="text-sm text-gray-400">Product Designer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 2 - Card 3: Review */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.5} className="h-full">
                            <div className="bg-white rounded-[2rem] p-8 flex flex-col justify-between h-full min-h-[280px] relative overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <div className="relative z-10">
                                    <div className="flex gap-1 mb-4 text-orange-500">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                    <p className="text-foreground/80 font-medium text-lg mb-6 leading-relaxed">
                                        "Finally, a calendar that speaks the language of a maker. Essential for my daily workflow."
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-bold">M</div>
                                    <div>
                                        <span className="text-base font-medium text-foreground block leading-tight">Mark T.</span>
                                        <span className="text-sm text-gray-400">Indie Developer</span>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 2 - Card 4: Dither Visual */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.6} className="h-full">
                            <div className="rounded-[2rem] relative overflow-hidden h-full min-h-[280px] shadow-sm group">
                                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                                    <Dither
                                        waveColor={[1.0, 0.6, 0.2]} // Yellow/Orange
                                        waveSpeed={0.03}
                                        enableMouseInteraction={true}
                                        pixelSize={3}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full text-foreground font-semibold tracking-tight shadow-lg">
                                        Focus Mode
                                    </span>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 2 - Card 5: Another Stat */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.7} className="h-full">
                            <div className="bg-white rounded-[2rem] p-8 flex flex-col justify-between h-full min-h-[280px] relative overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <div className="relative z-10">
                                    <div className="flex gap-1 mb-4 text-orange-500">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                    <p className="text-foreground/80 font-medium text-lg mb-6 leading-relaxed">
                                        "We tried everything. Chrono is the only tool that actually changed how we operate. Instant adoption."
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold">D</div>
                                    <div>
                                        <span className="text-sm font-medium text-foreground block leading-tight">David K.</span>
                                        <span className="text-xs text-gray-400">CTO, Nexus</span>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                </div>
            </div>
        </section>
    );
};
