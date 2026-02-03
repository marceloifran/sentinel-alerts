import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Bell, Users, CheckCircle, Calendar, Check, Sparkles, XCircle, TrendingUp, Clock, Award } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedCounter from "@/components/AnimatedCounter";
import Footer from "@/components/Footer";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const openCalendly = () => {
    window.open('https://calendly.com/ifsintech', '_blank');
  };

  const pricingPlans = [
    {
      name: t('pricing.starter.name'),
      price: "Gratis",
      description: t('pricing.starter.description'),
      features: [
        t('pricing.starter.feature1'),
        t('pricing.starter.feature2'),
        t('pricing.starter.feature3'),
        t('pricing.starter.feature4'),
        t('pricing.starter.feature5'),
      ],
      cta: t('pricing.starter.cta'),
      highlighted: false,
      action: () => navigate('/auth')
    },
    {
      name: t('pricing.professional.name'),
      price: "$30.000",
      priceNote: "/mes",
      description: t('pricing.professional.description'),
      features: [
        t('pricing.professional.feature1'),
        t('pricing.professional.feature2'),
        t('pricing.professional.feature3'),
        t('pricing.professional.feature4'),
        t('pricing.professional.feature5'),
        t('pricing.professional.feature6'),
        t('pricing.professional.feature7'),
        t('pricing.professional.feature8'),
      ],
      cta: t('pricing.professional.cta'),
      highlighted: true,
      action: () => navigate('/auth')
    },
    {
      name: t('pricing.enterprise.name'),
      price: "$55.000",
      priceNote: "/mes",
      description: t('pricing.enterprise.description'),
      features: [
        t('pricing.enterprise.feature1'),
        t('pricing.enterprise.feature2'),
        t('pricing.enterprise.feature3'),
        t('pricing.enterprise.feature4'),
        t('pricing.enterprise.feature5'),
        t('pricing.enterprise.feature6'),
        t('pricing.enterprise.feature7'),
      ],
      cta: t('pricing.enterprise.cta'),
      highlighted: false,
      action: () => navigate('/auth')
    }
  ];

  const stats = [
    { value: 500, suffix: "+", label: t('stats.obligations'), icon: CheckCircle },
    { value: 99, suffix: "%", label: t('stats.compliance'), icon: TrendingUp },
    { value: 24, suffix: "/7", label: t('stats.monitoring'), icon: Clock },
    { value: 100, suffix: "%", label: t('stats.satisfaction'), icon: Award },
  ];

  const traditionalItems = [
    t('why.traditional1'),
    t('why.traditional2'),
    t('why.traditional3'),
    t('why.traditional4'),
    t('why.traditional5'),
    t('why.traditional6'),
  ];

  const ifsinremItems = [
    t('why.ifsinrem1'),
    t('why.ifsinrem2'),
    t('why.ifsinrem3'),
    t('why.ifsinrem4'),
    t('why.ifsinrem5'),
    t('why.ifsinrem6'),
  ];

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
            <LanguageSelector />
            <Button onClick={openCalendly} variant="ghost" className="hidden sm:flex gap-2">
              <Calendar className="w-4 h-4" />
              {t('header.scheduleDemo')}
            </Button>
            <Button onClick={() => navigate('/auth')} variant="outline">
              {t('header.login')}
            </Button>
          </div>
        </nav>
      </motion.header>

      {/* Hero */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-16 sm:py-24 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6"
          >
            <Shield className="w-4 h-4" />
            {t('hero.badge')}
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            {t('hero.title')}{" "}
            <span
              className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% 200%",
                animation: "gradientShift 3s ease infinite"
              }}
            >
              {t('hero.titleHighlight')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto gap-2 h-12 px-8 text-base group"
              >
                {t('hero.startFree')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                onClick={openCalendly}
                className="w-full sm:w-auto h-12 px-8 text-base gap-2"
              >
                <Calendar className="w-4 h-4" />
                {t('hero.scheduleDemo')}
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <AnimatedSection className="py-16 border-y border-border/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Por qué IfsinRem - Ventajas */}
        <section className="py-16 sm:py-24 border-b border-border/40">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('why.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('why.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Método tradicional */}
            <AnimatedSection direction="left">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="card-elevated p-6 sm:p-8 border-status-danger/30 bg-status-danger-bg/30 h-full"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-status-danger/20 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-status-danger" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t('why.traditional')}</h3>
                </div>
                <ul className="space-y-3">
                  {traditionalItems.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <XCircle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatedSection>

            {/* Con IfsinRem */}
            <AnimatedSection direction="right" delay={0.2}>
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="card-elevated p-6 sm:p-8 border-status-success/30 bg-status-success-bg/30 h-full"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-status-success" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t('why.withIfsinRem')}</h3>
                </div>
                <ul className="space-y-3">
                  {ifsinremItems.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ x: 20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.4} className="text-center mt-10">
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {t('why.description')}
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={openCalendly}
                className="h-12 px-8 text-base gap-2"
              >
                <Calendar className="w-4 h-4" />
                {t('why.seeHow')}
              </Button>
            </motion.div>
          </AnimatedSection>
        </section>

        {/* Features */}
        <section id="features" className="py-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: CheckCircle,
                title: t('features.visual.title'),
                description: t('features.visual.description'),
                color: "status-success",
                delay: 0
              },
              {
                icon: Bell,
                title: t('features.reminders.title'),
                description: t('features.reminders.description'),
                color: "status-warning",
                delay: 0.1
              },
              {
                icon: Users,
                title: t('features.assignment.title'),
                description: t('features.assignment.description'),
                color: "accent",
                delay: 0.2
              }
            ].map((feature, index) => (
              <AnimatedSection key={feature.title} delay={feature.delay}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="card-elevated p-6 sm:p-8 h-full"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    className={`w-12 h-12 rounded-xl bg-${feature.color}-bg flex items-center justify-center mb-5`}
                  >
                    <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                  </motion.div>
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

        {/* Pricing */}
        <section id="pricing" className="py-16 sm:py-24">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              {t('pricing.badge')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <AnimatedSection key={plan.name} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`card-elevated p-6 sm:p-8 h-full ${plan.highlighted
                    ? 'border-2 border-primary shadow-xl shadow-primary/20 relative'
                    : ''
                    }`}
                >
                  {plan.highlighted && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full"
                    >
                      {t('pricing.popular')}
                    </motion.div>
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
                      <motion.li
                        key={i}
                        initial={{ x: -10, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={plan.action}
                      className="w-full gap-2 group"
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 text-center">
          <AnimatedSection>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="card-elevated p-8 sm:p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 max-w-3xl mx-auto"
              style={{
                backgroundSize: "200% 200%",
                animation: "gradientShift 5s ease infinite"
              }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {t('cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="gap-2 h-12 px-8 text-base group"
                  >
                    {t('cta.startNow')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={openCalendly}
                    className="gap-2 h-12 px-8 text-base"
                  >
                    <Calendar className="w-4 h-4" />
                    {t('cta.talkSales')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatedSection>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
