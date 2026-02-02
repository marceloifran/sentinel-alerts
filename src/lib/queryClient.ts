import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
            gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en caché (antes cacheTime)
            retry: 2, // Reintentar 2 veces en caso de error
            refetchOnWindowFocus: false, // No recargar al cambiar de ventana
            refetchOnReconnect: true, // Sí recargar al reconectar internet
            refetchOnMount: false, // No recargar si hay datos en caché
        },
        mutations: {
            retry: 1, // Reintentar mutaciones 1 vez
        },
    },
});
