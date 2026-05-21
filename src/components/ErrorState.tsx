import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
    error?: Error | null;
    message?: string;
    onRetry?: () => void;
}

export const ErrorState = ({ error, message, onRetry }: ErrorStateProps) => {
    const errorMessage = message || error?.message || 'Ocurrió un error inesperado';

    return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
            <div className="max-w-md w-full card-elevated p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                        Error al cargar los datos
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {errorMessage}
                    </p>
                </div>

                {onRetry && (
                    <Button
                        onClick={onRetry}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                    </Button>
                )}
            </div>
        </div>
    );
};

export const NotFoundState = ({
    title = "No encontrado",
    description = "El recurso que buscas no existe o fue eliminado",
    onGoBack
}: {
    title?: string;
    description?: string;
    onGoBack?: () => void;
}) => {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                        {title}
                    </h2>
                    <p className="text-muted-foreground">
                        {description}
                    </p>
                </div>

                {onGoBack && (
                    <Button onClick={onGoBack} variant="outline">
                        Volver
                    </Button>
                )}
            </div>
        </div>
    );
};
