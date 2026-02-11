import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Check, Crown, Building2, Rocket, Loader2, CreditCard, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Subscription,
  getSubscription,
  createSubscription,
  cancelSubscription,
  syncSubscriptionStatus,
  formatPrice,
  subscriptionStatusLabels,
} from '@/services/subscriptionService';

const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    description: 'Perfecto para empezar',
    icon: Rocket,
    color: 'bg-muted',
    features: [
      'Hasta 5 obligaciones',
      '1 usuario',
      'Recordatorios por email',
      'Vista de calendario',
      'Soporte por email',
    ],
  },
  professional: {
    name: 'Professional',
    price: 30000,
    description: 'Para equipos en crecimiento',
    icon: Crown,
    color: 'bg-primary/10',
    popular: true,
    features: [
      'Hasta 25 obligaciones',
      'Hasta 10 usuarios',
      'Recordatorios avanzados por email',
      'Notificaciones personalizadas',
      'Gestión de archivos',
      'Roles y permisos',
      'Soporte prioritario',
      'Reportes y analytics',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 55000,
    description: 'Solución a medida',
    icon: Building2,
    color: 'bg-accent',
    features: [
      'Todo en Professional',
      'Usuarios ilimitados',
      'Integración con sistemas',
      'Onboarding personalizado',
      'Soporte 24/7',
      'SLA garantizado',
      'Consultoría incluida',
    ],
  },
};

export function SubscriptionCard() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const currentPlan = profile?.plan || 'starter';

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const sub = await getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'professional' | 'enterprise') => {
    if (!user?.email) {
      toast.error('Debes tener un email para suscribirte');
      return;
    }

    try {
      setIsSubscribing(plan);
      const { initPoint } = await createSubscription(plan, user.email);

      // Redirect to Mercado Pago checkout
      window.location.href = initPoint;
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Error al crear la suscripción');
    } finally {
      setIsSubscribing(null);
    }
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelSubscription();
      toast.success('Suscripción cancelada');
      await loadSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Error al cancelar la suscripción');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncSubscriptionStatus();
      await loadSubscription();
      toast.success('Estado sincronizado');
    } catch (error) {
      console.error('Error syncing subscription:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const hasActiveSubscription = subscription &&
    (subscription.status === 'authorized' || subscription.status === 'active');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Tu Suscripción</h2>
            <p className="text-sm text-muted-foreground">Gestiona tu plan y facturación</p>
          </div>
        </div>
        {subscription && (
          <Button variant="ghost" size="icon" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* Current Plan Status */}
      {subscription && subscription.status !== 'cancelled' && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Plan actual</span>
            <Badge variant={hasActiveSubscription ? 'default' : 'secondary'}>
              {PLANS[subscription.plan as keyof typeof PLANS]?.name || subscription.plan}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Estado</span>
            <span className={`text-sm font-medium ${subscriptionStatusLabels[subscription.status]?.color || ''}`}>
              {subscriptionStatusLabels[subscription.status]?.label || subscription.status}
            </span>
          </div>
          {subscription.price_monthly > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Precio mensual</span>
              <span className="text-sm font-medium">{formatPrice(subscription.price_monthly)}</span>
            </div>
          )}
          {subscription.current_period_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Próximo cobro</span>
              <span className="text-sm font-medium">
                {new Date(subscription.current_period_end).toLocaleDateString('es-AR')}
              </span>
            </div>
          )}

          {hasActiveSubscription && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-4 w-full gap-2 text-destructive">
                  <XCircle className="w-4 h-4" />
                  Cancelar suscripción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tu suscripción se cancelará al final del período actual.
                    Volverás al plan Starter con límites de 5 obligaciones y 1 usuario.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mantener suscripción</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Sí, cancelar'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Plan Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          {hasActiveSubscription ? 'Cambiar de plan' : 'Elige tu plan'}
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
            const plan = PLANS[planKey];
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === planKey;
            const canUpgrade = planKey !== 'starter' && !isCurrentPlan &&
              (planKey === 'enterprise' || (planKey === 'professional' && currentPlan !== 'enterprise'));

            return (
              <div
                key={planKey}
                className={`relative p-4 rounded-lg border-2 transition-all ${isCurrentPlan
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                {'popular' in plan && plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full ${plan.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold">{plan.name}</span>
                </div>

                <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>

                <div className="mb-3">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold">Gratis</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </>
                  )}
                </div>

                <ul className="space-y-1 mb-4">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plan actual
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(planKey as 'professional' | 'enterprise')}
                    disabled={isSubscribing === planKey}
                  >
                    {isSubscribing === planKey ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Suscribirse'
                    )}
                  </Button>
                ) : (
                  <Button variant="ghost" className="w-full" disabled>
                    —
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-center text-muted-foreground">
        Pagos seguros procesados por Mercado Pago. Podés cancelar en cualquier momento.
      </p>
    </Card>
  );
}
