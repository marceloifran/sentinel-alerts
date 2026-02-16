import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Bell, Users, CheckCircle, Calendar, Sparkles, TrendingUp, Clock, Award } from "lucide-react";
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
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            {t('hero.badge')}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Centraliza obligaciones, recibe alertas automáticas y mantené tu empresa al día.
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

        {/* Removed verbose comparison section for a more direct landing */}

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

        {/* Impact Sections - Cost Savings */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-background">
          <AnimatedSection className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Visual Chart Side */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="card-elevated p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/50">
                  <div className="mb-6">
                    <p className="text-sm font-medium text-blue-600 mb-2">Reducción de riesgo</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-foreground">-85%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-semibold">Menos incumplimientos</span>
                    </div>
                  </div>

                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { label: 'Alertas a tiempo', value: '95%', icon: Bell, color: 'blue' },
                      { label: 'Cumplimiento normativo', value: '88%', icon: Shield, color: 'purple' },
                      { label: 'Tareas completadas', value: '92%', icon: CheckCircle, color: 'green' },
                      { label: 'Precisión', value: '96%', icon: Award, color: 'teal' },
                    ].map((item, idx) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center mb-3`}>
                          <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                        </div>
                        <div className={`text-2xl font-bold text-${item.color}-600 mb-1`}>{item.value}</div>
                        <p className="text-xs text-gray-600 leading-tight">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">10h+</div>
                        <p className="text-xs text-muted-foreground mt-1">Ahorradas/semana</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">24/7</div>
                        <p className="text-xs text-muted-foreground mt-1">Monitoreo activo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Content Side */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                  <Shield className="w-4 h-4" />
                  Prevención y Control
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Reduce <span className="text-blue-600">riesgos</span> y evita sanciones
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Detectamos desviaciones de costos desde el inicio, reduciendo sobrecostos hasta un 40%
                  y mejorando la rentabilidad de cada proyecto.
                </p>
                <ul className="space-y-3">
                  {[
                    'Alertas automáticas antes de cada vencimiento',
                    'Previene multas y sanciones innecesarias',
                    'Centraliza toda la información en un solo lugar',
                    'Ahorra tiempo en gestión administrativa'
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </AnimatedSection>
        </section>

        {/* Productivity Section */}
        <section className="py-16 sm:py-24">
          <AnimatedSection className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content Side */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Organización Inteligente
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Gestiona <span className="text-purple-600">más obligaciones</span> con menos esfuerzo
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Nuestros clientes aumentan su cartera de obligaciones gestionadas en un 300%,
                  manejando más tareas al mismo tiempo con eficiencia, sin perder calidad ni control.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="card-elevated p-4">
                    <div className="text-3xl font-bold text-purple-600 mb-1">+50%</div>
                    <p className="text-sm text-muted-foreground">Más eficiencia</p>
                  </div>
                  <div className="card-elevated p-4">
                    <div className="text-3xl font-bold text-purple-600 mb-1">10h</div>
                    <p className="text-sm text-muted-foreground">Ahorradas/semana</p>
                  </div>
                </div>
              </motion.div>

              {/* Visual Side */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="card-elevated p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Obligaciones activas
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Declaración mensual AFIP', status: 'Al día', progress: 100, color: 'green' },
                      { name: 'Renovación de licencias', status: 'En proceso', progress: 65, color: 'blue' },
                      { name: 'Auditoría trimestral', status: 'Planificada', progress: 30, color: 'purple' },
                    ].map((project, idx) => (
                      <motion.div
                        key={project.name}
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">{project.name}</h4>
                            <p className="text-xs text-muted-foreground">{project.status}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${project.color === 'green' ? 'bg-green-100 text-green-700' :
                            project.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                            {project.progress}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${project.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: idx * 0.15 + 0.3 }}
                            className={`h-full ${project.color === 'green' ? 'bg-green-500' :
                              project.color === 'blue' ? 'bg-blue-500' :
                                'bg-purple-500'
                              }`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </section>

        {/* Security & Compliance Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-background">
          <AnimatedSection className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Tranquilidad Total
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Mantén tu empresa <span className="text-green-600">siempre al día</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Sistema de alertas inteligente que te mantiene informado y previene problemas antes de que ocurran
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Shield, value: '24/7', label: 'Monitoreo continuo', color: 'green' },
                { icon: Bell, value: 'Auto', label: 'Alertas inteligentes', color: 'blue' },
                { icon: Award, value: '100%', label: 'Control total', color: 'purple' },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="card-elevated p-8"
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-${item.color}-100 flex items-center justify-center`}>
                    <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                  </div>
                  <div className={`text-4xl font-bold text-${item.color}-600 mb-2`}>{item.value}</div>
                  <p className="text-muted-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* Pre-Footer Hero Section */}
        <section className="py-24 sm:py-32 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight"
              >
                El futuro de la gestión de obligaciones
                <br />
                <span className="text-primary">ya está acá</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Button
                  size="lg"
                  onClick={openCalendly}
                  className="gap-2 h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Agenda una demo
                </Button>
              </motion.div>
            </div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative max-w-6xl mx-auto"
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl opacity-50" />

              {/* Dashboard mockup */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 max-w-md">
                      app.ifsinrem.com/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="bg-gradient-to-br from-green-50/30 via-white to-white p-6 sm:p-8">
                  {/* PDF Button - Top Right */}
                  <div className="flex justify-end mb-4">
                    <div className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-default">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generar Reporte PDF
                    </div>
                  </div>

                  {/* Compliance Score Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl p-6 mb-6 border border-green-100">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-foreground mb-2">Score de Cumplimiento</h3>
                      <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Cumplimiento Alto
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Circular Progress */}
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="relative w-32 h-32"
                      >
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#e5e7eb"
                            strokeWidth="12"
                            fill="none"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#10b981"
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: 352 }}
                            whileInView={{ strokeDashoffset: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                            style={{
                              strokeDasharray: 352,
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-3xl font-bold text-green-600">100</div>
                          <div className="text-xs text-gray-500">de 100</div>
                        </div>
                      </motion.div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          ¡Excelente! Todas las obligaciones están al día.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Cards - No emoji icons, just circles */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Vencidas', value: '0', bgColor: 'bg-white', textColor: 'text-red-600', circleColor: 'bg-red-100', iconColor: 'text-red-500' },
                      { label: 'Por vencer', value: '3', bgColor: 'bg-white', textColor: 'text-yellow-600', circleColor: 'bg-yellow-100', iconColor: 'text-yellow-500' },
                      { label: 'Al día', value: '1', bgColor: 'bg-white', textColor: 'text-green-600', circleColor: 'bg-green-100', iconColor: 'text-green-500' },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        className={`${stat.bgColor} rounded-lg p-4 shadow-sm border border-gray-200`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">{stat.label}</span>
                          <div className={`w-8 h-8 ${stat.circleColor} rounded-full flex items-center justify-center`}>
                            {idx === 0 && (
                              <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {idx === 1 && (
                              <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            )}
                            {idx === 2 && (
                              <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Obligations List */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h4 className="text-base font-bold text-foreground">Obligaciones críticas</h4>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                          ☰ Lista
                        </button>
                        <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1">
                          📅 Calendario
                        </button>
                      </div>
                    </div>

                    {/* Obligation Item */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.9 }}
                      className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              🛡️ SEGURIDAD
                            </span>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              ⭕ Media
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              🔄 Mensual
                            </span>
                          </div>
                          <h5 className="font-semibold text-foreground mb-1">Revisión de extintores</h5>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              📅 27 de febrero, 2026
                            </span>
                            <span className="flex items-center gap-1">
                              (12 días)
                            </span>
                            <span className="flex items-center gap-1">
                              🏢 Ifsin Tech
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-medium border border-yellow-200">
                            ⚠️ Por vencer
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
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
