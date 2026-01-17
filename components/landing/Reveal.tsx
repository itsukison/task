'use client';

import React, { useEffect, useRef, useState } from 'react';

type RevealVariant = 'fade-up' | 'fade-in' | 'scale-up' | 'slide-in-right' | 'slide-in-left';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    variant?: RevealVariant;
    threshold?: number;
    fullWidth?: boolean;
    priority?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
    children,
    className = '',
    delay = 0,
    duration = 1,
    variant = 'fade-up',
    threshold = 0.1,
    priority = false
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (priority) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold, priority]);

    const getStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            transitionProperty: 'all',
            transitionDuration: `${duration}s`,
            transitionDelay: `${delay}s`,
            transitionTimingFunction: 'cubic-bezier(0.2, 0.65, 0.3, 0.9)',
        };

        if (!isVisible) {
            switch (variant) {
                case 'fade-up':
                    return { ...base, opacity: 0, transform: 'translateY(40px)' };
                case 'fade-in':
                    return { ...base, opacity: 0 };
                case 'scale-up':
                    return { ...base, opacity: 0, transform: 'scale(0.95)' };
                case 'slide-in-right':
                    return { ...base, opacity: 0, transform: 'translateX(40px)' };
                case 'slide-in-left':
                    return { ...base, opacity: 0, transform: 'translateX(-40px)' };
                default:
                    return base;
            }
        }

        return {
            ...base,
            opacity: 1,
            transform: variant.includes('scale') ? 'scale(1)' : 'translate(0)',
        };
    };

    return (
        <div ref={ref} className={className} style={getStyles()}>
            {children}
        </div>
    );
};
