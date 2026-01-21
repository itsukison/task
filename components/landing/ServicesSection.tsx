'use client';

import React from 'react';
import Image from 'next/image';

import { Reveal } from './Reveal';

const ISO_BLOCKS = `
      +------+
    /      / |
   +------+  |
   |      |  +
   |      | /
   +------+
`;

const ISO_PLAY = `
      /\\
     /  \\
    /    \\
   /______\\
   |      |
   |      |
   +------+
`;

const ISO_FACE = `
    /-------\\
   /  o   o  \\
  |     _     |
  |    (_)    |
   \\_________/
`;

const ISO_GEARS = `
     O_
    /  \\
    \\__/  _O
      \\  /  \\
       O \\__/
`;

const ISO_CYCLE = `
    -->  +--+
   /     |  |
  +--+   +--+
  |  |     |
  +--+  <--
`;

interface ServiceCardProps {
    title: string;
    description: string;
    art?: string;
    image?: string;
    delay?: number;
    imageClassName?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, art, image, delay = 0, imageClassName }) => (
    <Reveal delay={delay} variant="fade-up" className="h-full">
        <div className="bg-gray-100/50 rounded-xl p-8 md:p-10 flex flex-col justify-between h-[320px] transition-all duration-300 hover:bg-gray-100 group overflow-hidden relative">
            <div className="flex-1 flex items-center justify-center mb-8">
                <div className={`relative w-32 h-32 transition-all duration-500 ${imageClassName || "scale-[1.8] translate-x-20 opacity-80 group-hover:opacity-100 group-hover:scale-[1.9]"}`}>
                    <Image src={image || ''} alt={title} width={128} height={128} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
            </div>
            <div>
                <h3 className="text-2xl md:text-3xl font-medium mb-3 text-foreground tracking-tight">{title}</h3>
                <p className="text-gray-500 text-base leading-relaxed max-w-sm">{description}</p>
            </div>
        </div>
    </Reveal>
);

export const ServicesSection: React.FC = () => {
    return (
        <section className="w-full min-h-screen bg-background py-24 border-b border-gray-100 flex flex-col justify-center">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full">

                {/* Header Section */}
                <div className="mb-20">
                    <Reveal delay={0.1}>
                        <span className="font-serif italic text-orange-500 text-xl mb-4 block">Our Services</span>
                    </Reveal>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                        <div className="flex-1">
                            <Reveal delay={0.2}>
                                <h2 className="text-6xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-foreground leading-[0.9]">
                                    Built for <br className="hidden md:block" /> Daily Execution
                                </h2>
                            </Reveal>
                        </div>
                        <div className="flex-1">
                            <Reveal delay={0.3}>
                                <p className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-xl lg:ml-auto">
                                    Chrono's time-first approach eliminates the gap between planning and doing. Execute with clarity and build sustainable daily rhythms.
                                </p>
                            </Reveal>
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="flex flex-col gap-6">

                    {/* Top Row: 2 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ServiceCard
                            title="Visual Time Blocking"
                            description="See your day as a timeline, not a to-do list. Every task has a place in time."
                            image="/clock.png"
                            delay={0.1}
                            imageClassName="scale-[2.5] translate-x-32 group-hover:scale-[2.7] opacity-80 group-hover:opacity-100"
                        />
                        <ServiceCard
                            title="Drag-and-Drop Flow"
                            description="Schedule tasks by dragging them directly into your calendar. Planning takes seconds."
                            image="/cursor.png"
                            delay={0.2}
                            imageClassName="scale-[2.5] translate-x-32 group-hover:scale-[2.7] opacity-80 group-hover:opacity-100"
                        />
                    </div>

                    {/* Bottom Row: 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ServiceCard
                            title="Time Awareness"
                            description="Track expected vs. actual time to build execution rhythm and learn your true pace."
                            image="/team.png"
                            delay={0.3}
                        />
                        <ServiceCard
                            title="Workload Monitor"
                            description="Leaders get transparent visibility into team capacity without micromanagement."
                            image="/workload.png"
                            delay={0.4}
                        />
                        <ServiceCard
                            title="Daily Patterns"
                            description="Build sustainable work rhythms that compound over time. Execution wisdom grows daily."
                            image="/patterns.png"
                            delay={0.5}
                        />
                    </div>

                </div>
            </div>
        </section>
    );
};
