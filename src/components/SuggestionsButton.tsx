import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X } from 'lucide-react';
import { useTemplateSuggestions, useSuggestionCount } from '@/hooks/useTemplateSuggestions';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface SuggestionsButtonProps {
    onClick: () => void;
    className?: string;
}

export function SuggestionsButton({ onClick, className }: SuggestionsButtonProps) {
    const { data: count = 0 } = useSuggestionCount();
    const [isPulsing, setIsPulsing] = useState(true);

    // Stop pulsing after user sees it
    const handleClick = () => {
        setIsPulsing(false);
        onClick();
    };

    if (count === 0) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className={cn('relative', className)}
                    >
                        <Button
                            onClick={handleClick}
                            variant="default"
                            size="lg"
                            className={cn(
                                'gap-2 shadow-lg',
                                isPulsing && 'animate-pulse'
                            )}
                        >
                            <Lightbulb className="w-5 h-5" />
                            <span className="hidden sm:inline">Sugerencias</span>
                            <Badge
                                variant="secondary"
                                className="ml-1 bg-white text-primary font-bold"
                            >
                                {count}
                            </Badge>
                        </Button>

                        {/* Animated ring */}
                        {isPulsing && (
                            <motion.div
                                className="absolute inset-0 rounded-lg border-2 border-primary"
                                initial={{ scale: 1, opacity: 1 }}
                                animate={{ scale: 1.2, opacity: 0 }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeOut',
                                }}
                            />
                        )}
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Tienes {count} sugerencias de obligaciones para tu sector</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
