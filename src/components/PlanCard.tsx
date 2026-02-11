import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Rocket, Building2, ArrowUpRight } from 'lucide-react';

export type PlanType = 'starter' | 'professional' | 'enterprise';

interface PlanCardProps {
  currentPlan: PlanType;
  maxObligations: number;
  maxUsers: number;
  showUpgrade?: boolean;
}

const planDetails = {
  starter: {
    name: 'Starter',
    description: 'Perfecto para empezar',
    icon: Rocket,
    color: 'bg-muted',
    features: [
      'Hasta 5 obligaciones',
      '1 usuario',
      'Recordatorios por email',
      'Vista de calendario',
      'Soporte por email'
    ]
  },
  professional: {
    name: 'Professional',
    description: 'Para equipos en crecimiento',
    icon: Crown,
    color: 'bg-primary/10',
    features: [
      'Hasta 25 obligaciones',
      'Hasta 10 usuarios',
      'Recordatorios avanzados por email',
      'Notificaciones personalizadas',
      'Gestión de archivos',
      'Roles y permisos',
      'Soporte prioritario',
      'Reportes y analytics'
    ]
  },
  enterprise: {
    name: 'Enterprise',
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
      'Consultoría incluida'
    ]
  }
};

const PlanCard = ({ currentPlan, maxObligations, maxUsers, showUpgrade = true }: PlanCardProps) => {
  const navigate = useNavigate();
  const plan = planDetails[currentPlan];
  const Icon = plan.icon;

  const handleUpgrade = () => {
    navigate('/#pricing');
    // Scroll to pricing section
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full ${plan.color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Tu Plan</h2>
            <Badge variant={currentPlan === 'starter' ? 'secondary' : 'default'}>
              {plan.name}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Obligaciones permitidas</span>
          <span className="font-medium">{maxObligations === -1 ? 'Ilimitadas' : `Hasta ${maxObligations}`}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Usuarios permitidos</span>
          <span className="font-medium">{maxUsers === -1 ? 'Ilimitados' : `Hasta ${maxUsers}`}</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Incluido en tu plan:</h3>
        <ul className="space-y-2">
          {plan.features.slice(0, 5).map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-status-success flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {showUpgrade && currentPlan !== 'enterprise' && (
        <Button
          onClick={handleUpgrade}
          variant="outline"
          className="w-full gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          {currentPlan === 'starter' ? 'Mejorar a Professional' : 'Mejorar a Enterprise'}
        </Button>
      )}
    </Card>
  );
};

export default PlanCard;
