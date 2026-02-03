import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Bell, Users, CheckCircle, Calendar, Check, Sparkles, XCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const openCalendly = () => {
    window.open('https://calendly.com/ifsintech', '_blank');
  };

  const pricingPlans = [
    {
      name: "Starter",
      price: "Gratis",
      description: "Perfecto para empezar",
      features: [
        "Hasta 10 obligaciones",
        "1 usuario",
        "Recordatorios por email",
        "Vista de calendario",
        "Soporte por email"
      ],
      cta: "Comenzar gratis",
      highlighted: false,
      action: () => navigate('/auth')
    },
    {
      name: "Professional",
      price: "$30.000",
      priceNote: "/mes",
      description: "Para equipos en crecimiento",
      features: [
        "Obligaciones ilimitadas",
        "Hasta 10 usuarios",
        "Notificaciones personalizadas",
        "Gestión de archivos",
        "Roles y permisos",
        "Soporte prioritario",
        "Reportes y analytics"
      ],
      cta: "Suscribirse",
      highlighted: true,
      action: () => navigate('/auth')
    },
    {
      name: "Enterprise",
      price: "$55.000",
      priceNote: "/mes",
      description: "Solución a medida",
      features: [
        "Todo en Professional",
        "Usuarios ilimitados",
        "Integración con sistemas",
        "Onboarding personalizado",
        "Soporte 24/7",
        "SLA garantizado",
        "Consultoría incluida"
      ],
      cta: "Suscribirse",
      highlighted: false,
      action: () => navigate('/auth')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sticky top-0 bg-background/80 backdrop-blur-lg z-50 border-b border-border/40">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <img src="/logo.png" alt="IfsinRem Logo" className="w-12 h-12 object-contain rounded-xl" />
            <span className="text-xl font-bold text-foreground">IfsinRem</span>
          </div>
          <div className="flex items-center gap-3 animate-fade-in">
            <Button onClick={openCalendly} variant="ghost" className="hidden sm:flex gap-2">
              <Calendar className="w-4 h-4" />
              Agendar demo
            </Button>
            <Button onClick={() => navigate('/auth')} variant="outline">
              Iniciar sesión
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-16 sm:py-24 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
            <Shield className="w-4 h-4" />
            Tu aliado contra los vencimientos olvidados
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-slide-up">
            Nunca más olvides una{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-pulse-slow">
              obligación importante
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            Centraliza tus documentos, habilitaciones y trámites con vencimiento.
            Recibe recordatorios automáticos y mantén a tu empresa siempre al día.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto gap-2 h-12 px-8 text-base group hover:scale-105 transition-transform"
            >
              Comenzar gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={openCalendly}
              className="w-full sm:w-auto h-12 px-8 text-base gap-2 hover:scale-105 transition-transform"
            >
              <Calendar className="w-4 h-4" />
              Agendar demo
            </Button>
          </div>
        </section>

        {/* Por qué IfsinRem - Ventajas */}
        <section className="py-16 sm:py-24 border-b border-border/40">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              ¿Por qué usar IfsinRem?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              La diferencia entre "acordarse" y tener un sistema que te cuida
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Método tradicional */}
            <div className="card-elevated p-6 sm:p-8 border-status-danger/30 bg-status-danger-bg/30 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-status-danger/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-status-danger" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Método tradicional</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Depender de la memoria o un recordatorio manual",
                  "Excel o planillas que nadie actualiza",
                  "Mails que se pierden o se olvidan",
                  "Estrés constante por no saber qué se vence",
                  "Multas y problemas cuando algo se pasa",
                  "Responsabilidades difusas entre el equipo"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <XCircle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Con IfsinRem */}
            <div className="card-elevated p-6 sm:p-8 border-status-success/30 bg-status-success-bg/30 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-status-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Con IfsinRem</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Sistema automático que avisa antes de cada vencimiento",
                  "Todo centralizado en un solo lugar visible",
                  "Recordatorios por email y WhatsApp que no fallan",
                  "Tranquilidad de saber exactamente qué está al día",
                  "Prevención en lugar de reacción tardía",
                  "Cada obligación tiene un responsable claro"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center mt-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              No es un gestor de tareas ni un calendario más. Es un sistema de prevención operativa.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={openCalendly}
              className="h-12 px-8 text-base hover:scale-105 transition-transform gap-2"
            >
              <Calendar className="w-4 h-4" />
              Ver cómo funciona
            </Button>
          </div>
        </section>

        {/* Features */}
        <section id="pricing" className="py-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="card-elevated p-6 sm:p-8 animate-slide-up hover:scale-105 transition-all duration-300 hover:shadow-xl" style={{ animationDelay: '0ms' }}>
              <div className="w-12 h-12 rounded-xl bg-status-success-bg flex items-center justify-center mb-5 animate-bounce-slow">
                <CheckCircle className="w-6 h-6 text-status-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Estado visual claro
              </h3>
              <p className="text-muted-foreground">
                Ve de un vistazo qué está al día, qué está por vencer y qué necesita atención urgente.
              </p>
            </div>

            <div className="card-elevated p-6 sm:p-8 animate-slide-up hover:scale-105 transition-all duration-300 hover:shadow-xl" style={{ animationDelay: '100ms' }}>
              <div className="w-12 h-12 rounded-xl bg-status-warning-bg flex items-center justify-center mb-5 animate-bounce-slow" style={{ animationDelay: '200ms' }}>
                <Bell className="w-6 h-6 text-status-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Recordatorios automáticos
              </h3>
              <p className="text-muted-foreground">
                El sistema te avisa 30 días, 7 días y el mismo día del vencimiento. No dependes de la memoria.
              </p>
            </div>

            <div className="card-elevated p-6 sm:p-8 animate-slide-up hover:scale-105 transition-all duration-300 hover:shadow-xl" style={{ animationDelay: '200ms' }}>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5 animate-bounce-slow" style={{ animationDelay: '400ms' }}>
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Asignación de responsables
              </h3>
              <p className="text-muted-foreground">
                Cada obligación tiene un dueño. Los recordatorios llegan directamente a quien debe actuar.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 sm:py-24">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Planes y precios
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Elige el plan perfecto para ti
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desde startups hasta grandes empresas, tenemos la solución ideal para tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`card-elevated p-6 sm:p-8 animate-slide-up hover:scale-105 transition-all duration-300 ${plan.highlighted
                  ? 'border-2 border-primary shadow-xl shadow-primary/20 relative'
                  : 'hover:shadow-xl'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    Más popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="text-4xl font-bold text-foreground mb-1">
                    {plan.price}
                    {'priceNote' in plan && plan.priceNote && (
                      <span className="text-base font-normal text-muted-foreground">{plan.priceNote}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={plan.action}
                  className={`w-full gap-2 group ${plan.highlighted
                    ? ''
                    : 'variant-outline'
                    }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.cta}
                  {plan.cta.includes('demo') || plan.cta.includes('ventas') ? (
                    <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  ) : (
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 text-center">
          <div className="card-elevated p-8 sm:p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 max-w-3xl mx-auto animate-fade-in hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              "Esto me cuida. Si pasa algo, me avisan."
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              No depende de la memoria de nadie. Siempre sabes dónde estás parado.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="gap-2 h-12 px-8 text-base group hover:scale-105 transition-transform"
              >
                Empezar ahora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={openCalendly}
                className="gap-2 h-12 px-8 text-base hover:scale-105 transition-transform"
              >
                <Calendar className="w-4 h-4" />
                Hablar con ventas
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2026 IfsinRem. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
