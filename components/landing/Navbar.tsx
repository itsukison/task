'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NavItem } from './types';

const navItems: NavItem[] = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#process' },
    { label: 'Testimonials', href: '#testimonials' },
];

export const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isScrolled ? 'pt-6' : 'pt-0'}`}>
            <nav
                className={`
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex justify-between items-center
          ${isScrolled
                        ? 'w-[95%] max-w-[1440px] px-8 py-4 rounded-full bg-white/90 backdrop-blur-xl border border-black/5 shadow-sm'
                        : 'w-full max-w-[1600px] px-8 md:px-16 py-8 bg-transparent border-b border-transparent'
                    }
        `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="bg-foreground text-background w-8 h-8 rounded-lg flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 40 40" fill="currentColor">
                            <path d="M20 5L35 30H5L20 5Z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-foreground">Taskos</span>
                </div>

                {/* Links */}
                <div className={`hidden lg:flex items-center gap-10 ${isScrolled ? 'text-sm' : 'text-base'}`}>
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className="font-medium text-foreground/70 hover:text-foreground transition-colors uppercase tracking-wide text-[13px]"
                        >
                            {item.label}
                        </a>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className={`hidden md:block text-foreground/80 hover:text-foreground font-medium transition-all ${isScrolled ? 'text-sm' : 'text-base'}`}
                    >
                        Log in
                    </Link>
                    <Link
                        href="/signup"
                        className={`bg-foreground text-background hover:bg-foreground/90 font-medium transition-all ${isScrolled ? 'text-sm px-5 py-2.5 rounded-full' : 'text-base px-8 py-3 rounded-lg'}`}
                    >
                        Get Started
                    </Link>
                </div>
            </nav>
        </div>
    );
};
