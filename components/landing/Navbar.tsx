'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/hooks';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export function Navbar() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { label: t('landing.nav.features'), href: '/#features' },
        { label: t('landing.nav.how_it_works'), href: '/#process' },
        { label: t('landing.nav.testimonials'), href: '/#testimonials' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || mobileMenuOpen
                ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 py-3'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-0.5">
                            <Image src="/logo.png" alt="Chrono Logo" width={32} height={32} />
                            <span className="text-xl font-semibold tracking-tight">Chrono</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSelector isScrolled={isScrolled} />
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-black">
                                {t('landing.nav.login')}
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button size="sm" className="bg-black text-white hover:bg-black/90 rounded-full px-5">
                                {t('landing.nav.get_started')}
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        <LanguageSelector isScrolled={isScrolled} />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 shadow-lg animate-in slide-in-from-top-5">
                    <div className="flex flex-col gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-base font-medium text-gray-600 hover:text-black py-2 border-b border-gray-50"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-3 mt-2">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="outline" className="w-full justify-center rounded-full">
                                    {t('landing.nav.login')}
                                </Button>
                            </Link>
                            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full justify-center bg-black text-white hover:bg-black/90 rounded-full">
                                    {t('landing.nav.get_started')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
