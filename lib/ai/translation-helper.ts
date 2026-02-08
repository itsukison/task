import { translations } from '@/lib/i18n/translations';
import { Language } from '@/lib/i18n/types';

/**
 * Server-side translation function for AI responses
 * @param language User's language preference
 * @param key Translation key in dot notation
 * @param params Optional parameters for interpolation
 */
export function translateAI(
    language: Language,
    key: string,
    params?: Record<string, string | number>
): string {
    const keys = key.split('.');
    let current: any = translations[language];

    for (const k of keys) {
        if (current[k] === undefined) {
            console.warn(`AI translation missing for key: ${key} in language: ${language}`);
            // Fallback to English
            let fallback: any = translations['en'];
            for (const fk of keys) {
                if (fallback[fk] === undefined) return key;
                fallback = fallback[fk];
            }
            current = fallback;
            break;
        }
        current = current[k];
    }

    let value = current as string;

    // Interpolation
    if (params) {
        Object.entries(params).forEach(([key, val]) => {
            value = value.replace(new RegExp(`{${key}}`, 'g'), String(val));
        });
    }

    return value;
}
