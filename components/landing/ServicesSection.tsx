import React from 'react';
import Image from 'next/image';
import { Reveal } from './Reveal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ServiceCardProps {
    title: string;
    description: string;
    image?: string;
    delay?: number;
    imageClassName?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, image, delay = 0, imageClassName }) => (
    <Reveal delay={delay} variant="fade-up" className="h-full">
        <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col justify-between h-[320px] transition-all duration-300 hover:shadow-xl border border-gray-100 group overflow-hidden relative">
            <div className="flex-1 flex items-center justify-center -mt-6">
                <div className={`relative w-56 h-56 transition-transform duration-500 ease-out ${imageClassName || "group-hover:scale-110"}`}>
                    {image && (
                        <Image
                            src={image}
                            alt={title}
                            width={224}
                            height={224}
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>
            </div>
            <div className="relative z-10 -mt-10 pointer-events-none">
                <h3 className="text-xl md:text-2xl font-medium mb-2 text-foreground tracking-tight group-hover:text-accent transition-colors">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    </Reveal>
);

export const ServicesSection: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section className="w-full bg-gray-50/50 py-32 border-b border-gray-100 flex flex-col justify-center">
            <div className="max-w-[1280px] mx-auto px-6 w-full">

                {/* Header Section */}
                <div className="mb-24">
                    <Reveal delay={0.1}>
                        <h4 className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-4">
                            {t('landing.services.badge')}
                        </h4>
                    </Reveal>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                        <div className="flex-1">
                            <Reveal delay={0.2}>
                                <h2 className="text-5xl md:text-7xl font-medium tracking-tight text-foreground leading-[1] mb-2">
                                    {t('landing.services.title_prefix')} <br className="hidden md:block" />
                                    <span className="text-accent h-20 inline-block">{t('landing.services.title_suffix')}</span>
                                </h2>
                            </Reveal>
                        </div>
                        <div className="flex-1">
                            <Reveal delay={0.3}>
                                <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl lg:ml-auto font-normal">
                                    {t('landing.services.subtitle')}
                                </p>
                            </Reveal>
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="flex flex-col gap-6 -mt-12">

                    {/* Top Row: 2 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ServiceCard
                            title={t('landing.services.card_1_title')}
                            description={t('landing.services.card_1_desc')}
                            image="/clock.png"
                            delay={0.1}
                            imageClassName="scale-[1.3] translate-x-10 opacity-90 group-hover:scale-[1.4] -mt-6"
                        />
                        <ServiceCard
                            title={t('landing.services.card_2_title')}
                            description={t('landing.services.card_2_desc')}
                            image="/cursor.png"
                            delay={0.2}
                            imageClassName="scale-[1.3] translate-x-10 opacity-90 group-hover:scale-[1.4] -mt-6"
                        />
                    </div>

                    {/* Bottom Row: 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ServiceCard
                            title={t('landing.services.card_3_title')}
                            description={t('landing.services.card_3_desc')}
                            image="/team.png"
                            delay={0.3}

                        />
                        <ServiceCard
                            title={t('landing.services.card_4_title')}
                            description={t('landing.services.card_4_desc')}
                            image="/workload.png"
                            delay={0.4}
                        />
                        <ServiceCard
                            title={t('landing.services.card_5_title')}
                            description={t('landing.services.card_5_desc')}
                            image="/patterns.png"
                            delay={0.5}
                        />
                    </div>

                </div>
            </div>
        </section>
    );
};
