import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
    es: {
        // Header
        'header.scheduleDemo': 'Agendar demo',
        'header.login': 'Iniciar sesión',

        // Footer
        'footer.description': 'Panel multicliente y alertas automáticas para contadores argentinos. Nunca más una multa evitable.',
        'footer.quickLinks': 'Enlaces rápidos',
        'footer.home': 'Inicio',
        'footer.features': '¿Por qué IfsinRem?',
        'footer.pricing': 'Precios',
        'footer.connect': 'Conecta con nosotros',
        'footer.copyright': 'Todos los derechos reservados.',
    },
    en: {
        // Header
        'header.scheduleDemo': 'Schedule demo',
        'header.login': 'Log in',

        // Footer
        'footer.description': 'Multi-client dashboard and automatic alerts for Argentine accountants. Never miss an avoidable deadline again.',
        'footer.quickLinks': 'Quick links',
        'footer.home': 'Home',
        'footer.features': 'Why IfsinRem?',
        'footer.pricing': 'Pricing',
        'footer.connect': 'Connect with us',
        'footer.copyright': 'All rights reserved.',
    }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved === 'en' || saved === 'es') ? saved : 'es';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key: string): string => {
        return translations[language][key as keyof typeof translations['es']] || key;
    };

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
