import { Linkedin, Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { t } = useLanguage();

    const socialLinks = [
        {
            name: 'LinkedIn',
            url: 'https://www.linkedin.com/company/ifsintech/',
            icon: Linkedin,
            color: 'hover:text-[#0077B5]'
        },
        {
            name: 'Email',
            url: 'mailto:contacto@ifsinrem.com',
            icon: Mail,
            color: 'hover:text-primary'
        },
        {
            name: t('header.scheduleDemo'),
            url: 'https://calendly.com/ifsintech',
            icon: Calendar,
            color: 'hover:text-primary'
        }
    ];

    const quickLinks = [
        { name: t('footer.home'), href: '#' },
        { name: t('footer.features'), href: '#features' },
        { name: t('footer.pricing'), href: '#pricing' },
    ];

    return (
        <footer className="border-t border-border bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Logo y descripción */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="IfsinRem Logo" className="w-10 h-10 object-contain rounded-xl" />
                            <span className="text-xl font-bold text-foreground">IfsinRem</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            {t('footer.description')}
                        </p>
                    </div>

                    {/* Links rápidos */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Redes sociales */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('footer.connect')}</h3>
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground transition-all ${social.color}`}
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={social.name}
                                >
                                    <social.icon className="w-5 h-5" />
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-8 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} IfsinRem by{' '}
                        <a
                            href="https://www.linkedin.com/company/ifsintech/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            IfsinTech
                        </a>
                        . {t('footer.copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
