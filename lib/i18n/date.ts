import { ja, enUS } from 'date-fns/locale';
import { Language } from './types';

export const dateLocales: Record<Language, any> = {
    en: enUS,
    ja: ja,
};
