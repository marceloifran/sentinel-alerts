import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="max-w-md w-full card-elevated p-8 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                Algo salió mal
                            </h1>
                            <p className="text-muted-foreground">
                                La aplicación encontró un error inesperado. Por favor, intenta recargar la página.
                            </p>
                        </div>

                        {this.state.error && (
                            <details className="text-left">
                                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                                    Detalles técnicos
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <Button
                            onClick={this.handleReset}
                            className="w-full gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Recargar página
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
