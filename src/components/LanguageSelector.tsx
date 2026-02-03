import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LanguageSelector = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === 'es' ? 'ES' : 'EN'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setLanguage('es')}
                    className={language === 'es' ? 'bg-accent' : ''}
                >
                    <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-2 w-full"
                    >
                        <span className="text-lg">🇪🇸</span>
                        <span>Español</span>
                        {language === 'es' && <span className="ml-auto text-primary">✓</span>}
                    </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-accent' : ''}
                >
                    <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-2 w-full"
                    >
                        <span className="text-lg">🇺🇸</span>
                        <span>English</span>
                        {language === 'en' && <span className="ml-auto text-primary">✓</span>}
                    </motion.div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSelector;
