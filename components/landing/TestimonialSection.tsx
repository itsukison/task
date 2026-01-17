'use client';

import React from 'react';
import { AsciiArt } from './AsciiArt';
import { Reveal } from './Reveal';

const MAN_PORTRAIT = `
    .---.
   /     \\
  |  o o  |
   \\  =  /
   /|   |\\
  | |   | |
`;

const WOMAN_PORTRAIT = `
     .--.
    /   .\\
   |  o_o |
    \\  - /
    /|  |\\
`;

const MEETING_ART = `
   _   _   _
  (o) (o) (o)
  /|\\ /|\\ /|\\
`;

export const TestimonialSection: React.FC = () => {
    return (
        <section id="testimonials" className="w-full min-h-screen bg-background py-24 flex flex-col items-center justify-center border-b border-gray-100">
            <div className="max-w-[1280px] w-full px-6">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <Reveal delay={0.1}>
                        <span className="font-serif italic text-gray-400 text-xl mb-4 block">Customer Stories</span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-foreground mb-6 leading-[1.05]">
                            Trusted by Early Adopters. <br />
                            Backed by Top Investors.
                        </h2>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <p className="text-lg text-foreground/70 leading-relaxed max-w-2xl mx-auto">
                            From fast-growing startups to established SaaS leaders, teams are using Taskos to eliminate busywork and unlock efficiency across their revenue org.
                        </p>
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">

                    {/* Row 1 - Card 1: Stat (Accent Gradient) */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.3} className="h-full">
                            <div className="bg-gradient-to-br from-accent-light to-accent rounded-[2rem] p-10 flex flex-col justify-between min-h-[400px] h-full relative overflow-hidden group shadow-lg shadow-accent/10">
                                {/* Abstract decorative bg */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:bg-white/30 transition-colors"></div>

                                <div className="relative z-10 flex items-center gap-2 text-white mb-8">
                                    <div className="bg-white/20 backdrop-blur-md w-8 h-8 rounded flex items-center justify-center">
                                        <svg width="14" height="14" viewBox="0 0 40 40" fill="currentColor">
                                            <path d="M20 5L35 30H5L20 5Z" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold tracking-tight">Taskos</span>
                                </div>

                                <div className="relative z-10 mt-auto">
                                    <h3 className="text-6xl font-semibold text-white tracking-tighter mb-2">$120K+</h3>
                                    <p className="text-white/80 font-medium text-lg">In new pipeline value</p>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 1 - Card 2: Testimonial (Light) */}
                    <div className="lg:col-span-2">
                        <Reveal delay={0.4} className="h-full">
                            <div className="bg-gray-100 rounded-[2rem] p-10 md:p-14 flex flex-col md:flex-row items-center gap-12 min-h-[400px] h-full relative overflow-hidden">

                                {/* Portrait */}
                                <div className="w-full md:w-5/12 flex justify-center md:justify-start relative z-10">
                                    <div className="w-full aspect-[4/5] bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden">
                                        <AsciiArt art={MAN_PORTRAIT} className="bg-transparent border-none text-foreground scale-[2] font-black opacity-80" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-100/50 to-transparent"></div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="w-full md:w-7/12 relative z-10 flex flex-col justify-center h-full">
                                    <div className="flex items-center gap-2 text-foreground mb-6">
                                        <div className="bg-foreground text-background w-6 h-6 rounded flex items-center justify-center">
                                            <svg width="10" height="10" viewBox="0 0 40 40" fill="currentColor">
                                                <path d="M20 5L35 30H5L20 5Z" />
                                            </svg>
                                        </div>
                                        <span className="font-bold tracking-tight">Taskos</span>
                                    </div>

                                    <h3 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight leading-snug mb-8">
                                        &ldquo;We went from spending 15 hours a week on spreadsheets to under 2. That alone <span className="font-bold">saved us nearly $3,000/month</span> in team time.&rdquo;
                                    </h3>

                                    <div>
                                        <h4 className="font-bold text-foreground">Christanto Budiman</h4>
                                        <p className="text-gray-500 text-sm">Founder, Sadewa</p>
                                    </div>

                                    <div className="flex items-center gap-2 mt-8">
                                        <div className="w-8 h-1.5 bg-foreground rounded-full"></div>
                                        <div className="w-2 h-1.5 bg-gray-300 rounded-full"></div>
                                        <div className="w-2 h-1.5 bg-gray-300 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 2 - Card 3: Light Gradient Shader */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.5} className="h-full">
                            <div className="bg-white rounded-[2rem] p-10 flex flex-col justify-between min-h-[350px] h-full relative overflow-hidden group border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                {/* Shader Gradient Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-accent/10 z-0"></div>
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-accent/20 rounded-full blur-[60px]"></div>

                                {/* Background Image Placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] group-hover:scale-105 transition-transform duration-700 z-0">
                                    <AsciiArt art={WOMAN_PORTRAIT} className="bg-transparent border-none text-foreground scale-[2.5] font-black" />
                                </div>

                                <div className="relative z-10 flex items-center gap-2 text-foreground font-semibold tracking-tight">
                                    <span className="opacity-80 text-xl font-serif">bima</span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-5xl font-semibold text-foreground tracking-tighter mb-2">40%</h3>
                                    <p className="text-gray-500 font-medium">Faster deal cycle</p>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 2 - Card 4: Soft Accent Shader */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.6} className="h-full">
                            <div className="bg-white rounded-[2rem] p-10 flex flex-col justify-between min-h-[350px] h-full relative overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                {/* Shader Gradient Background */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-accent/20 via-white to-white"></div>

                                <div className="relative z-10 flex items-center gap-2 text-foreground font-semibold tracking-tight">
                                    <span className="text-accent text-2xl">✻</span>
                                    <span className="text-xl">Mandala</span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-5xl font-semibold text-foreground tracking-tighter mb-2">65%</h3>
                                    <p className="text-gray-500 font-medium leading-tight">Revenue forecasting accuracy</p>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Row 2 - Card 5: Soft Gray Shader */}
                    <div className="lg:col-span-1">
                        <Reveal delay={0.7} className="h-full">
                            <div className="bg-gray-50/50 rounded-[2rem] p-10 flex flex-col justify-between min-h-[350px] h-full relative overflow-hidden group border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                {/* Shader Gradient Background */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 via-white to-white"></div>

                                {/* Background Image Placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] group-hover:scale-105 transition-transform duration-700">
                                    <AsciiArt art={MEETING_ART} className="bg-transparent border-none text-foreground scale-[2.5] font-black" />
                                </div>

                                <div className="relative z-10 flex items-center gap-2 text-foreground font-semibold tracking-tight">
                                    <span className="text-xl font-serif italic">Pandawa<span className="text-[10px] align-top not-italic font-sans ml-0.5 opacity-60">TM</span></span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-5xl font-semibold text-foreground tracking-tighter mb-2">35%</h3>
                                    <p className="text-gray-500 font-medium">Productivity increase</p>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                </div>
            </div>
        </section>
    );
};
