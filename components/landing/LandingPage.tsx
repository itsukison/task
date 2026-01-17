'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { ProductSection } from './ProductSection';
import { ServicesSection } from './ServicesSection';
import { ProcessSection } from './ProcessSection';
import { AutomationSection } from './AutomationSection';
import { TestimonialSection } from './TestimonialSection';
import { FooterSection } from './FooterSection';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen text-foreground/70 relative selection:bg-accent selection:text-white">
            <Navbar />
            <HeroSection />
            <ProductSection />
            <ServicesSection />
            <ProcessSection />
            <TestimonialSection />
            <AutomationSection />
            <FooterSection />
        </div>
    );
};
