'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations';
import { Language, TranslationDictionary } from './types';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Default to 'en' initially to avoid hydration mismatch if possible, 
    // but better to check localStorage in useEffect
    const [language, setLanguageState] = useState<Language>('en');
    const [isInitialized, setIsInitialized] = useState(false);

    const { profile, updateProfile } = useUserPreferences();

    // 1. Load from localStorage on mount (for immediate UI consistency)
    useEffect(() => {
        const savedLang = localStorage.getItem('taskos-language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'ja')) {
            setLanguageState(savedLang);
        }
        setIsInitialized(true);
    }, []);

    // 2. Sync from Supabase profile when loaded
    useEffect(() => {
        if (profile?.language) {
            const profileLang = profile.language as Language;
            if (profileLang && (profileLang === 'en' || profileLang === 'ja')) {
                setLanguageState(profileLang);
                // Sync localStorage just in case
                localStorage.setItem('taskos-language', profileLang);
            }
        }
    }, [profile]);

    const setLanguage = useCallback(async (lang: Language) => {
        // Optimistic update
        setLanguageState(lang);
        localStorage.setItem('taskos-language', lang);

        // Update DB
        if (profile) {
            await updateProfile({ language: lang });
        }
    }, [profile, updateProfile]);

    const t = useCallback((path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in language: ${language}`);
                // Fallback to English if missing
                let fallback: any = translations['en'];
                for (const k of keys) {
                    if (fallback[k] === undefined) return path;
                    fallback = fallback[k];
                }
                current = fallback;
                break;
            } else {
                current = current[key];
            }
        }

        let value = current as string;

        // Perform interpolation if params are provided
        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                value = value.replace(new RegExp(`{${key}}`, 'g'), String(val));
            });
        }

        return value;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
