import { Loader2 } from 'lucide-react';

export const PageSkeleton = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
};

export const CardSkeleton = () => {
    return (
        <div className="card-elevated p-6 animate-pulse">
            <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
        </div>
    );
};

export const ObligationCardSkeleton = () => {
    return (
        <div className="card-elevated p-6 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-2/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-20"></div>
                        <div className="h-6 bg-muted rounded w-24"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ObligationListSkeleton = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <ObligationCardSkeleton key={i} />
            ))}
        </div>
    );
};

export const DashboardSkeleton = () => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 animate-pulse">
                <div className="card-elevated p-6">
                    <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-48"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            <ObligationListSkeleton />
        </div>
    );
};
