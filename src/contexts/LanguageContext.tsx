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

        // Hero
        'hero.badge': 'Protege tu Empresa con Inteligencia de Cumplimiento Predictiva',
        'hero.title': 'Cumplimiento Empresarial Inteligente:',
        'hero.titleHighlight': 'Anticipa Riesgos, Evita Multas',
        'hero.subtitle': 'La primera plataforma que combina IA, automatización y análisis predictivo para eliminar multas y sanciones regulatorias.',
        'hero.startFree': 'Reducir mi Riesgo Ahora',
        'hero.scheduleDemo': 'Ver Demo',

        // Stats
        'stats.obligations': 'Obligaciones gestionadas',
        'stats.compliance': 'Reducción de riesgo',
        'stats.monitoring': 'Monitoreo con IA',
        'stats.satisfaction': 'Satisfacción del cliente',

        // Why IfsinRem
        'why.title': '¿Por qué IfsinRem?',
        'why.subtitle': 'La diferencia entre herramientas tradicionales y una plataforma de cumplimiento inteligente',
        'why.traditional': 'Herramientas Tradicionales',
        'why.withIfsinRem': 'IfsinRem',
        'why.traditional1': 'Calendario de recordatorios',
        'why.traditional2': 'Alertas genéricas',
        'why.traditional3': 'Listas estáticas',
        'why.traditional4': 'Gestión manual',
        'why.traditional5': 'Sin documentación',
        'why.traditional6': 'Reacción a vencimientos',
        'why.ifsinrem1': 'IA Predictiva de Cumplimiento',
        'why.ifsinrem2': 'Alertas Contextuales Priorizadas',
        'why.ifsinrem3': 'Score de Riesgo en Tiempo Real',
        'why.ifsinrem4': 'Asistente IA 24/7',
        'why.ifsinrem5': 'Reportes Ejecutivos Automáticos',
        'why.ifsinrem6': 'Prevención Inteligente',
        'why.description': 'No es un gestor de tareas. Es tu departamento de compliance aumentado con inteligencia artificial.',
        'why.seeHow': 'Ver cómo funciona',

        // Features
        'features.visual.title': 'Score de Riesgo en Tiempo Real',
        'features.visual.description': 'Evaluación automática de tu nivel de cumplimiento con análisis predictivo y alertas críticas priorizadas por IA.',
        'features.reminders.title': 'Prevención Inteligente de Multas',
        'features.reminders.description': 'Sistema de alertas multinivel que anticipa problemas antes de que se conviertan en sanciones. Cada multa evitada paga la plataforma por años.',
        'features.assignment.title': 'Asistente de Compliance IA',
        'features.assignment.description': 'Respuestas instantáneas a consultas normativas, recomendaciones automáticas y generación de reportes ejecutivos listos para auditoría.',

        // Pricing
        'pricing.badge': 'Planes y precios',
        'pricing.title': 'Elige el plan perfecto para ti',
        'pricing.subtitle': 'Desde startups hasta grandes empresas, tenemos la solución ideal para tu negocio',
        'pricing.popular': 'Más popular',

        'pricing.professional.name': 'Professional',
        'pricing.professional.description': 'Para equipos en crecimiento',
        'pricing.professional.feature1': 'Hasta 25 obligaciones',
        'pricing.professional.feature2': 'Hasta 10 usuarios',
        'pricing.professional.feature3': 'Score de Cumplimiento con IA',
        'pricing.professional.feature4': 'Alertas inteligentes priorizadas',
        'pricing.professional.feature5': 'Reportes PDF automáticos',
        'pricing.professional.feature6': 'Asistente IA de Compliance',
        'pricing.professional.feature7': 'Soporte prioritario',
        'pricing.professional.feature8': 'Análisis de riesgo predictivo',
        'pricing.professional.cta': 'Suscribirse',
        'pricing.enterprise.name': 'Enterprise',
        'pricing.enterprise.description': 'Solución a medida',
        'pricing.enterprise.feature1': 'Todo en Professional',
        'pricing.enterprise.feature2': 'Usuarios ilimitados',
        'pricing.enterprise.feature3': 'Integración con sistemas',
        'pricing.enterprise.feature4': 'Onboarding personalizado',
        'pricing.enterprise.feature5': 'Soporte 24/7',
        'pricing.enterprise.feature6': 'SLA garantizado',
        'pricing.enterprise.feature7': 'Consultoría de compliance incluida',
        'pricing.enterprise.cta': 'Suscribirse',

        // CTA
        'cta.title': 'Protege tu rentabilidad. Elimina el riesgo de sanciones.',
        'cta.subtitle': 'Cada multa evitada es EBITDA protegido. Duerme tranquilo sabiendo que tu compliance está bajo control.',
        'cta.startNow': 'Reducir mi Riesgo',
        'cta.talkSales': 'Hablar con un experto',

        // Footer
        'footer.description': 'Plataforma de Cumplimiento Inteligente con IA. Protege tu empresa de multas y sanciones regulatorias.',
        'footer.quickLinks': 'Enlaces rápidos',
        'footer.home': 'Inicio',
        'footer.features': 'Características',
        'footer.pricing': 'Precios',
        'footer.connect': 'Conecta con nosotros',
        'footer.copyright': 'Todos los derechos reservados.',
    },
    en: {
        // Header
        'header.scheduleDemo': 'Schedule demo',
        'header.login': 'Log in',

        // Hero
        'hero.badge': 'Protect Your Business with Predictive Compliance Intelligence',
        'hero.title': 'Intelligent Business Compliance:',
        'hero.titleHighlight': 'Anticipate Risks, Avoid Fines',
        'hero.subtitle': 'The first platform combining AI, automation, and predictive analytics to eliminate regulatory fines and sanctions.',
        'hero.startFree': 'Reduce My Risk Now',
        'hero.scheduleDemo': 'See Demo',

        // Stats
        'stats.obligations': 'Managed obligations',
        'stats.compliance': 'Risk reduction',
        'stats.monitoring': 'AI monitoring',
        'stats.satisfaction': 'Customer satisfaction',

        // Why IfsinRem
        'why.title': 'Why IfsinRem?',
        'why.subtitle': 'The difference between traditional tools and an intelligent compliance platform',
        'why.traditional': 'Traditional Tools',
        'why.withIfsinRem': 'IfsinRem',
        'why.traditional1': 'Reminder calendar',
        'why.traditional2': 'Generic alerts',
        'why.traditional3': 'Static lists',
        'why.traditional4': 'Manual management',
        'why.traditional5': 'No documentation',
        'why.traditional6': 'Reactive to deadlines',
        'why.ifsinrem1': 'Predictive Compliance AI',
        'why.ifsinrem2': 'Prioritized Contextual Alerts',
        'why.ifsinrem3': 'Real-Time Risk Score',
        'why.ifsinrem4': '24/7 AI Assistant',
        'why.ifsinrem5': 'Automatic Executive Reports',
        'why.ifsinrem6': 'Intelligent Prevention',
        'why.description': 'Not a task manager. It\'s your compliance department augmented with artificial intelligence.',
        'why.seeHow': 'See how it works',

        // Features
        'features.visual.title': 'Real-Time Risk Score',
        'features.visual.description': 'Automatic evaluation of your compliance level with predictive analytics and AI-prioritized critical alerts.',
        'features.reminders.title': 'Intelligent Fine Prevention',
        'features.reminders.description': 'Multi-level alert system that anticipates problems before they become sanctions. Each avoided fine pays for the platform for years.',
        'features.assignment.title': 'Compliance AI Assistant',
        'features.assignment.description': 'Instant answers to regulatory queries, automatic recommendations, and audit-ready executive report generation.',

        // Pricing
        'pricing.badge': 'Plans and pricing',
        'pricing.title': 'Choose the perfect plan for you',
        'pricing.subtitle': 'From startups to large enterprises, we have the ideal solution for your business',
        'pricing.popular': 'Most popular',
        'pricing.professional.name': 'Professional',
        'pricing.professional.description': 'For growing teams',
        'pricing.professional.feature1': 'Up to 25 obligations',
        'pricing.professional.feature2': 'Up to 10 users',
        'pricing.professional.feature3': 'AI Compliance Score',
        'pricing.professional.feature4': 'Prioritized smart alerts',
        'pricing.professional.feature5': 'Automatic PDF reports',
        'pricing.professional.feature6': 'Compliance AI Assistant',
        'pricing.professional.feature7': 'Priority support',
        'pricing.professional.feature8': 'Predictive risk analysis',
        'pricing.professional.cta': 'Subscribe',
        'pricing.enterprise.name': 'Enterprise',
        'pricing.enterprise.description': 'Custom solution',
        'pricing.enterprise.feature1': 'Everything in Professional',
        'pricing.enterprise.feature2': 'Unlimited users',
        'pricing.enterprise.feature3': 'System integration',
        'pricing.enterprise.feature4': 'Personalized onboarding',
        'pricing.enterprise.feature5': '24/7 support',
        'pricing.enterprise.feature6': 'Guaranteed SLA',
        'pricing.enterprise.feature7': 'Compliance consulting included',
        'pricing.enterprise.cta': 'Subscribe',

        // CTA
        'cta.title': 'Protect your profitability. Eliminate the risk of sanctions.',
        'cta.subtitle': 'Every avoided fine is protected EBITDA. Sleep soundly knowing your compliance is under control.',
        'cta.startNow': 'Reduce My Risk',
        'cta.talkSales': 'Talk to an expert',

        // Footer
        'footer.description': 'Intelligent Compliance Platform with AI. Protect your business from regulatory fines and sanctions.',
        'footer.quickLinks': 'Quick links',
        'footer.home': 'Home',
        'footer.features': 'Features',
        'footer.pricing': 'Pricing',
        'footer.connect': 'Connect with us',
        'footer.copyright': 'All rights reserved.',
    }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        // Get from localStorage or default to Spanish
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
