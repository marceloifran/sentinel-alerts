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
        'hero.badge': 'Tu aliado contra los vencimientos olvidados',
        'hero.title': 'Nunca más olvides una',
        'hero.titleHighlight': 'obligación importante',
        'hero.subtitle': 'Centraliza tus documentos, habilitaciones y trámites con vencimiento. Recibe recordatorios automáticos y mantén a tu empresa siempre al día.',
        'hero.startFree': 'Comenzar gratis',
        'hero.scheduleDemo': 'Agendar demo',

        // Stats
        'stats.obligations': 'Obligaciones gestionadas',
        'stats.compliance': 'Tasa de cumplimiento',
        'stats.monitoring': 'Monitoreo continuo',
        'stats.satisfaction': 'Satisfacción del cliente',

        // Why IfsinRem
        'why.title': '¿Por qué usar IfsinRem?',
        'why.subtitle': 'La diferencia entre "acordarse" y tener un sistema que te cuida',
        'why.traditional': 'Método tradicional',
        'why.withIfsinRem': 'Con IfsinRem',
        'why.traditional1': 'Depender de la memoria o un recordatorio manual',
        'why.traditional2': 'Excel o planillas que nadie actualiza',
        'why.traditional3': 'Mails que se pierden o se olvidan',
        'why.traditional4': 'Estrés constante por no saber qué se vence',
        'why.traditional5': 'Multas y problemas cuando algo se pasa',
        'why.traditional6': 'Responsabilidades difusas entre el equipo',
        'why.ifsinrem1': 'Sistema automático que avisa antes de cada vencimiento',
        'why.ifsinrem2': 'Todo centralizado en un solo lugar visible',
        'why.ifsinrem3': 'Recordatorios automáticos por email que no fallan',
        'why.ifsinrem4': 'Tranquilidad de saber exactamente qué está al día',
        'why.ifsinrem5': 'Prevención en lugar de reacción tardía',
        'why.ifsinrem6': 'Cada obligación tiene un responsable claro',
        'why.description': 'No es un gestor de tareas ni un calendario más. Es un sistema de prevención operativa.',
        'why.seeHow': 'Ver cómo funciona',

        // Features
        'features.visual.title': 'Estado visual claro',
        'features.visual.description': 'Ve de un vistazo qué está al día, qué está por vencer y qué necesita atención urgente.',
        'features.reminders.title': 'Recordatorios automáticos',
        'features.reminders.description': 'El sistema te avisa 30 días, 7 días y el mismo día del vencimiento. No dependes de la memoria.',
        'features.assignment.title': 'Asignación de responsables',
        'features.assignment.description': 'Cada obligación tiene un dueño. Los recordatorios llegan directamente a quien debe actuar.',

        // Pricing
        'pricing.badge': 'Planes y precios',
        'pricing.title': 'Elige el plan perfecto para ti',
        'pricing.subtitle': 'Desde startups hasta grandes empresas, tenemos la solución ideal para tu negocio',
        'pricing.popular': 'Más popular',
        'pricing.starter.name': 'Starter',
        'pricing.starter.description': 'Perfecto para empezar',
        'pricing.starter.feature1': 'Hasta 5 obligaciones',
        'pricing.starter.feature2': '1 usuario',
        'pricing.starter.feature3': 'Recordatorios por email',
        'pricing.starter.feature4': 'Vista de calendario',
        'pricing.starter.feature5': 'Soporte por email',
        'pricing.starter.cta': 'Comenzar gratis',
        'pricing.professional.name': 'Professional',
        'pricing.professional.description': 'Para equipos en crecimiento',
        'pricing.professional.feature1': 'Hasta 25 obligaciones',
        'pricing.professional.feature2': 'Hasta 10 usuarios',
        'pricing.professional.feature3': 'Recordatorios por email y WhatsApp',
        'pricing.professional.feature4': 'Notificaciones personalizadas',
        'pricing.professional.feature5': 'Gestión de archivos',
        'pricing.professional.feature6': 'Roles y permisos',
        'pricing.professional.feature7': 'Soporte prioritario',
        'pricing.professional.feature8': 'Reportes y analytics',
        'pricing.professional.cta': 'Suscribirse',
        'pricing.enterprise.name': 'Enterprise',
        'pricing.enterprise.description': 'Solución a medida',
        'pricing.enterprise.feature1': 'Todo en Professional',
        'pricing.enterprise.feature2': 'Usuarios ilimitados',
        'pricing.enterprise.feature3': 'Integración con sistemas',
        'pricing.enterprise.feature4': 'Onboarding personalizado',
        'pricing.enterprise.feature5': 'Soporte 24/7',
        'pricing.enterprise.feature6': 'SLA garantizado',
        'pricing.enterprise.feature7': 'Consultoría incluida',
        'pricing.enterprise.cta': 'Suscribirse',

        // CTA
        'cta.title': '"Esto me cuida. Si pasa algo, me avisan."',
        'cta.subtitle': 'No depende de la memoria de nadie. Siempre sabes dónde estás parado.',
        'cta.startNow': 'Empezar ahora',
        'cta.talkSales': 'Hablar con ventas',

        // Footer
        'footer.description': 'Tu aliado contra los vencimientos olvidados. Mantén tu empresa siempre al día.',
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
        'hero.badge': 'Your ally against forgotten deadlines',
        'hero.title': 'Never forget an',
        'hero.titleHighlight': 'important obligation',
        'hero.subtitle': 'Centralize your documents, licenses, and expiring procedures. Receive automatic reminders and keep your company always up to date.',
        'hero.startFree': 'Start free',
        'hero.scheduleDemo': 'Schedule demo',

        // Stats
        'stats.obligations': 'Managed obligations',
        'stats.compliance': 'Compliance rate',
        'stats.monitoring': 'Continuous monitoring',
        'stats.satisfaction': 'Customer satisfaction',

        // Why IfsinRem
        'why.title': 'Why use IfsinRem?',
        'why.subtitle': 'The difference between "remembering" and having a system that takes care of you',
        'why.traditional': 'Traditional method',
        'why.withIfsinRem': 'With IfsinRem',
        'why.traditional1': 'Relying on memory or manual reminders',
        'why.traditional2': 'Excel or spreadsheets that nobody updates',
        'why.traditional3': 'Emails that get lost or forgotten',
        'why.traditional4': 'Constant stress about not knowing what expires',
        'why.traditional5': 'Fines and problems when something is missed',
        'why.traditional6': 'Unclear responsibilities among the team',
        'why.ifsinrem1': 'Automatic system that alerts before each deadline',
        'why.ifsinrem2': 'Everything centralized in one visible place',
        'why.ifsinrem3': 'Email and WhatsApp reminders that never fail',
        'why.ifsinrem4': 'Peace of mind knowing exactly what\'s up to date',
        'why.ifsinrem5': 'Prevention instead of late reaction',
        'why.ifsinrem6': 'Each obligation has a clear owner',
        'why.description': 'It\'s not just another task manager or calendar. It\'s an operational prevention system.',
        'why.seeHow': 'See how it works',

        // Features
        'features.visual.title': 'Clear visual status',
        'features.visual.description': 'See at a glance what\'s up to date, what\'s about to expire, and what needs urgent attention.',
        'features.reminders.title': 'Automatic reminders',
        'features.reminders.description': 'The system alerts you 30 days, 7 days, and on the day of expiration. You don\'t depend on memory.',
        'features.assignment.title': 'Assign responsibilities',
        'features.assignment.description': 'Each obligation has an owner. Reminders go directly to who needs to act.',

        // Pricing
        'pricing.badge': 'Plans and pricing',
        'pricing.title': 'Choose the perfect plan for you',
        'pricing.subtitle': 'From startups to large enterprises, we have the ideal solution for your business',
        'pricing.popular': 'Most popular',
        'pricing.starter.name': 'Starter',
        'pricing.starter.description': 'Perfect to get started',
        'pricing.starter.feature1': 'Up to 5 obligations',
        'pricing.starter.feature2': '1 user',
        'pricing.starter.feature3': 'Email reminders',
        'pricing.starter.feature4': 'Calendar view',
        'pricing.starter.feature5': 'Email support',
        'pricing.starter.cta': 'Start free',
        'pricing.professional.name': 'Professional',
        'pricing.professional.description': 'For growing teams',
        'pricing.professional.feature1': 'Up to 25 obligations',
        'pricing.professional.feature2': 'Up to 10 users',
        'pricing.professional.feature3': 'Email and WhatsApp reminders',
        'pricing.professional.feature4': 'Custom notifications',
        'pricing.professional.feature5': 'File management',
        'pricing.professional.feature6': 'Roles and permissions',
        'pricing.professional.feature7': 'Priority support',
        'pricing.professional.feature8': 'Reports and analytics',
        'pricing.professional.cta': 'Subscribe',
        'pricing.enterprise.name': 'Enterprise',
        'pricing.enterprise.description': 'Custom solution',
        'pricing.enterprise.feature1': 'Everything in Professional',
        'pricing.enterprise.feature2': 'Unlimited users',
        'pricing.enterprise.feature3': 'System integration',
        'pricing.enterprise.feature4': 'Personalized onboarding',
        'pricing.enterprise.feature5': '24/7 support',
        'pricing.enterprise.feature6': 'Guaranteed SLA',
        'pricing.enterprise.feature7': 'Consulting included',
        'pricing.enterprise.cta': 'Subscribe',

        // CTA
        'cta.title': '"This takes care of me. If something happens, they let me know."',
        'cta.subtitle': 'It doesn\'t depend on anyone\'s memory. You always know where you stand.',
        'cta.startNow': 'Start now',
        'cta.talkSales': 'Talk to sales',

        // Footer
        'footer.description': 'Your ally against forgotten deadlines. Keep your company always up to date.',
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
