import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Bell, Users, CheckCircle, Calendar, Clock, FileText, Building2, AlertTriangle, Check } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sticky top-0 bg-background/80 backdrop-blur-lg z-50 border-b border-border/40"
      >
        <nav className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img src="/logo.png" alt="IfsinRem Logo" className="w-12 h-12 object-contain rounded-xl" />
            <span className="text-xl font-bold text-foreground">IfsinRem</span>
          </motion.div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/auth')} variant="outline">
              Iniciar sesión
            </Button>
            <Button onClick={() => navigate('/auth')} className="gap-2">
              Empezar gratis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </nav>
      </motion.header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="py-16 sm:py-24 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Shield className="w-4 h-4" />
            Para contadores y estudios contables argentinos
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            Todos tus clientes al día, desde una sola pantalla
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto"
          >
            Nunca más un vencimiento perdido. Recibís alertas automáticas antes de cada obligación de cada empresa que gestionás.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto gap-2 h-12 px-8 text-base group"
              >
                Empezar gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToFeatures}
                className="w-full sm:w-auto h-12 px-8 text-base gap-2"
              >
                Ver cómo funciona
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-muted-foreground"
          >
            Primer mes gratis. Sin tarjeta de crédito.
          </motion.p>
        </section>

        {/* ¿Por qué IfsinRem? - 3 value prop cards */}
        <section id="features" className="py-16 sm:py-24">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              ¿Por qué IfsinRem?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              La herramienta que un contador necesita para dormir tranquilo
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Building2,
                title: "Panel multicliente",
                description: "Todos tus clientes en una pantalla. Verde, amarillo, rojo: sabés al instante quién está al día y quién no.",
                delay: 0
              },
              {
                icon: Bell,
                title: "Alertas automáticas",
                description: "Recibís un mail antes de cada vencimiento. Nunca más un olvido que termine en multa.",
                delay: 0.1
              },
              {
                icon: FileText,
                title: "Todo centralizado",
                description: "Archivos, notas, fechas y responsables en un solo lugar. Chau carpetas y planillas separadas.",
                delay: 0.2
              }
            ].map((feature) => (
              <AnimatedSection key={feature.title} delay={feature.delay}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="card-elevated p-6 sm:p-8 h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* El problema que resolvemos */}
        <section className="py-16 sm:py-24">
          <AnimatedSection className="max-w-4xl mx-auto">
            <div className="card-elevated p-8 sm:p-12 bg-gradient-to-br from-status-danger-bg via-background to-background border-status-danger/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-status-danger-bg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-status-danger" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  ¿Cuánto te costó la última multa que podrías haber evitado?
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Un contador con 30 clientes tiene hoy 30 archivos de Excel distintos. Si se le pasa un vencimiento, la multa la paga el cliente — y la confianza la pierde el contador.
              </p>
              <p className="text-lg text-foreground font-medium">
                Con IfsinRem abrís una pantalla y ves de un vistazo qué cliente está al día, cuál vence esta semana y cuál ya se pasó.
              </p>
            </div>
          </AnimatedSection>
        </section>

        {/* Dashboard Preview */}
        <section className="py-16 sm:py-24">
          <AnimatedSection className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Así se ve tu panel de control
              </h2>
              <p className="text-lg text-muted-foreground">
                Una sola vista para todas las empresas que gestionás
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-3xl opacity-50" />

              <div className="relative bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-danger" />
                    <div className="w-3 h-3 rounded-full bg-status-warning" />
                    <div className="w-3 h-3 rounded-full bg-status-success" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground max-w-md">
                      app.ifsinrem.com/dashboard
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-background">
                  {/* Status Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Vencidas', value: '2', color: 'status-danger' },
                      { label: 'Vencen esta semana', value: '5', color: 'status-warning' },
                      { label: 'Al día', value: '23', color: 'status-success' },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="bg-card rounded-lg p-4 border border-border"
                      >
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                        <div className={`text-3xl font-bold text-${stat.color} mt-1`}>{stat.value}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Company list preview */}
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b border-border">
                      <h4 className="text-sm font-semibold text-foreground">Empresas gestionadas</h4>
                    </div>
                    {[
                      { name: 'Constructora Norte S.A.', next: 'AFIP F931 - Vence hoy', status: 'danger' },
                      { name: 'Comercial del Sur SRL', next: 'IIBB - Vence en 3 días', status: 'warning' },
                      { name: 'Estudio García & Asoc.', next: 'Monotributo - Vence en 15 días', status: 'success' },
                      { name: 'Transportes Rápido SA', next: 'ART - Al día', status: 'success' },
                    ].map((company, idx) => (
                      <motion.div
                        key={company.name}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="px-4 py-3 border-b border-border/50 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.next}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full bg-${company.status === 'danger' ? 'status-danger' : company.status === 'warning' ? 'status-warning' : 'status-success'}`} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 sm:py-24">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Planes simples, sin sorpresas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Se cobra en pesos argentinos al tipo de cambio del día. Primer mes gratis en todos los planes. Cancelás cuando quieras.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <AnimatedSection delay={0}>
              <div className="card-elevated p-6 sm:p-8 h-full flex flex-col">
                <h3 className="text-xl font-bold text-foreground mb-1">Starter</h3>
                <p className="text-sm text-muted-foreground mb-4">Contador independiente</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">USD 15</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Hasta 5 empresas gestionadas',
                    '1 usuario',
                    'Alertas por email',
                    'Archivos y notas',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-status-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  Empezar gratis
                </Button>
              </div>
            </AnimatedSection>

            {/* Pro */}
            <AnimatedSection delay={0.1}>
              <div className="card-elevated p-6 sm:p-8 h-full flex flex-col border-primary/50 ring-2 ring-primary/20 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
                <p className="text-sm text-muted-foreground mb-4">Estudio mediano</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">USD 35</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Hasta 20 empresas gestionadas',
                    'Hasta 5 usuarios',
                    'Todo lo de Starter',
                    'Panel multicliente',
                    'Soporte por WhatsApp',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-status-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  Empezar gratis
                </Button>
              </div>
            </AnimatedSection>

            {/* Estudio */}
            <AnimatedSection delay={0.2}>
              <div className="card-elevated p-6 sm:p-8 h-full flex flex-col">
                <h3 className="text-xl font-bold text-foreground mb-1">Estudio</h3>
                <p className="text-sm text-muted-foreground mb-4">Estudio grande</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">USD 70</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Empresas ilimitadas',
                    'Usuarios ilimitados',
                    'Todo lo de Pro',
                    'Onboarding personalizado',
                    'Soporte prioritario',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-status-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  Empezar gratis
                </Button>
              </div>
            </AnimatedSection>
          </div>

          {/* Multa argument */}
          <AnimatedSection className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 bg-status-warning-bg border border-status-warning/30 rounded-xl px-6 py-4">
              <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />
              <p className="text-foreground font-medium">
                Una multa de AFIP evitada paga este plan por más de un año.
              </p>
            </div>
          </AnimatedSection>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 text-center">
          <AnimatedSection>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="card-elevated p-8 sm:p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 max-w-3xl mx-auto"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                ¿Manejás vencimientos de múltiples clientes?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Probá IfsinRem gratis por 30 días. Sin tarjeta, sin compromiso. Si no te sirve, no pagás nada.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="gap-2 h-12 px-8 text-base group"
                  >
                    Empezar gratis
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open('https://calendly.com/ifsintech', '_blank')}
                    className="gap-2 h-12 px-8 text-base"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar una demo
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatedSection>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
