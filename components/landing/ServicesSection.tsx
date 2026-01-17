'use client';

import React from 'react';
import { AsciiArt } from './AsciiArt';
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
    art: string;
    delay?: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, art, delay = 0 }) => (
    <Reveal delay={delay} variant="fade-up" className="h-full">
        <div className="bg-gray-100/50 rounded-xl p-8 md:p-10 flex flex-col justify-between min-h-[320px] h-full transition-all duration-300 hover:bg-gray-100 group">
            <div className="flex-1 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity mb-8">
                <AsciiArt art={art} className="bg-transparent border-none text-foreground font-bold scale-150" />
            </div>
            <div>
                <h3 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground tracking-tight">{title}</h3>
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
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-4 h-[1px] bg-gray-300"></div>
                            <span className="text-xs font-mono uppercase tracking-widest text-gray-500">/ OUR SERVICES</span>
                        </div>
                    </Reveal>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                        <div className="flex-1">
                            <Reveal delay={0.2}>
                                <h2 className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-foreground leading-[0.9]">
                                    Taskos <br className="hidden md:block" /> solutions
                                </h2>
                            </Reveal>
                        </div>
                        <div className="flex-1">
                            <Reveal delay={0.3}>
                                <p className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-xl lg:ml-auto">
                                    Our rhythm-driven automation eliminates busywork, streamlines your operations, and helps your business grow, without extra effort.
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
                            title="Daily Planning"
                            description="Get a clear roadmap of how daily tasks drive growth and efficiency for your business."
                            art={ISO_BLOCKS}
                            delay={0.1}
                        />
                        <ServiceCard
                            title="Time Awareness"
                            description="Visualize execution speed and maintain rhythm without intrusive tracking."
                            art={ISO_PLAY}
                            delay={0.2}
                        />
                    </div>

                    {/* Bottom Row: 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ServiceCard
                            title="Workload Monitor"
                            description="Design and deploy visibility agents built specifically to solve your unique capacity challenges."
                            art={ISO_FACE}
                            delay={0.3}
                        />
                        <ServiceCard
                            title="Availability"
                            description="Automate status checks and follow-ups to keep relationships strong and organized."
                            art={ISO_GEARS}
                            delay={0.4}
                        />
                        <ServiceCard
                            title="Process Analytics"
                            description="Transform repetitive workflows into smooth, automated systems that save time."
                            art={ISO_CYCLE}
                            delay={0.5}
                        />
                    </div>

                </div>
            </div>
        </section>
    );
};
