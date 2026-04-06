import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
  Building2,
  XCircle,
  PhoneCall,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Footer from "@/components/Footer";

// ─── helpers ─────────────────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  y = 16,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── mock panel preview ───────────────────────────────────────────────────────

const mockClients = [
  { name: "Constructora Norte S.A.", ob: "AFIP F931", days: 0, status: "red" },
  { name: "Comercial del Sur SRL", ob: "IIBB Córdoba", days: 2, status: "red" },
  { name: "Distribuidora Ramos", ob: "Ganancias", days: 5, status: "yellow" },
  { name: "Estudio García & Asoc.", ob: "Monotributo", days: 18, status: "green" },
  { name: "Transportes Rápido SA", ob: "ART", days: 30, status: "green" },
];

function MockPanel() {
  const dotCls = { red: "bg-rose-500", yellow: "bg-amber-400", green: "bg-emerald-400" };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden select-none">
      {/* browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="w-3 h-3 rounded-full bg-rose-400" />
        <span className="w-3 h-3 rounded-full bg-amber-300" />
        <span className="w-3 h-3 rounded-full bg-emerald-300" />
        <span className="ml-3 text-xs text-slate-400 font-mono">app.ifsinrem.com/dashboard</span>
      </div>

      <div className="p-5 bg-white">
        {/* stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "En riesgo", value: "2", cls: "bg-rose-600 text-white shadow-lg shadow-rose-600/20" },
            { label: "Vencen pronto", value: "1", cls: "bg-amber-500 text-white shadow-lg shadow-amber-500/20" },
            { label: "Al día", value: "2", cls: "bg-slate-50 text-emerald-600 border border-emerald-100" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
              <p className="text-2xl font-black leading-none">{s.value}</p>
              <p className="text-[10px] mt-1 opacity-80 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* alert bar */}
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={14} className="text-rose-500 shrink-0" />
          <p className="text-xs text-rose-700 font-bold">🚨 AFIP F931 vence HOY — Constructora Norte S.A.</p>
        </div>

        {/* client list */}
        <div className="space-y-2">
          {mockClients.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm"
            >
              <span
                className={`w-2.5 h-2.5 shrink-0 rounded-full ${dotCls[c.status as keyof typeof dotCls]}`}
                style={
                  c.status === "red"
                    ? { boxShadow: "0 0 6px 2px rgba(239,68,68,0.2)" }
                    : c.status === "yellow"
                    ? { boxShadow: "0 0 6px 2px rgba(251,191,36,0.1)" }
                    : {}
                }
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                <p className="text-[10px] text-slate-400">{c.ob}</p>
              </div>
              <span
                className={`text-[10px] font-bold shrink-0 ${
                  c.days === 0
                    ? "text-rose-600"
                    : c.days <= 5
                    ? "text-amber-600"
                    : "text-slate-300"
                }`}
              >
                {c.days === 0 ? "¡HOY!" : c.days <= 5 ? `${c.days}d` : "Al día"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* ── NAV */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl"
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="IfsinRem" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-lg font-bold text-slate-900">IfsinRem</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Iniciar sesión
            </button>
            <Button
              onClick={() => navigate("/auth")}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white h-9 px-5 text-sm font-bold rounded-xl border-0 shadow-lg shadow-rose-600/20"
            >
              Empezar gratis <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* ── HERO */}
      <section className="relative px-4 py-20 sm:py-32 sm:px-8 text-center overflow-hidden">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-rose-600/[0.03] rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-amber-500/[0.02] rounded-full blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-600 mb-8 uppercase tracking-widest"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Sistema anti-multas para contadores argentinos
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6 text-slate-900"
          >
            Nunca más pierdas
            <br />
            <span className="text-rose-600">plata con AFIP</span>
            <br />
            por un olvido.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-lg sm:text-xl text-slate-500 mb-10 max-w-2xl mx-auto"
          >
            IfsinRem controla todos los vencimientos de todos tus clientes.
            Te alerta antes de que sea tarde. Evitás la multa antes de que exista.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="group flex items-center gap-2 rounded-2xl bg-rose-600 px-8 h-14 text-base font-black text-white hover:bg-rose-700 transition-colors shadow-2xl shadow-rose-600/30"
            >
              Probarlo gratis 30 días
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 h-14 text-base font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all"
            >
              Ver cómo funciona
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-slate-400"
          >
            Sin tarjeta. Sin compromiso. Cancelás cuando querés.
          </motion.p>
        </div>
      </section>

      {/* ── PAIN STAT BAR */}
      <section className="border-y border-slate-200 bg-white px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { num: "$500.000+", text: "multa mínima de AFIP por declaración tardía" },
              { num: "1 olvido", text: "alcanza para perder la confianza de un cliente" },
              { num: "30 días", text: "gratis para que veas lo que te estabas perdiendo" },
            ].map((s) => (
              <div key={s.text}>
                <p className="text-3xl font-black text-rose-600 mb-1">{s.num}</p>
                <p className="text-sm text-slate-500 font-medium">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PANEL PREVIEW */}
      <section className="px-4 py-20 sm:py-28 sm:px-8" id="como-funciona">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn delay={0}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                <Zap size={12} className="text-amber-500" />
                Panel de riesgo en tiempo real
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight text-slate-900">
                Abrís una pantalla.
                <br />
                <span className="text-slate-400">Ves todo. Actuás.</span>
              </h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Rojo, amarillo, verde. Sin buscar, sin abrir carpetas. En 3 segundos sabés qué cliente necesita atención ahora mismo.
              </p>
              <ul className="space-y-3">
                {[
                  "🔴 Clientes en riesgo — arriba de todo, siempre",
                  "🟡 Vencen en menos de 7 días — te avisamos antes",
                  "🟢 Todo ok — tranquilidad total",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={0.15}>
              <MockPanel />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS */}
      <section className="px-4 py-20 sm:py-28 sm:px-8 bg-white">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900">
              Así te salvamos de la multa
            </h2>
            <p className="text-slate-500 text-lg">El sistema trabaja mientras vos trabajás</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock size={24} className="text-amber-600" />,
                step: "01",
                title: "Te alerta 7 días antes",
                desc: "Email automático. Nada que recordar, nada que configurar. Un sistema que trabaja solo.",
                bg: "border-amber-100 bg-amber-50",
              },
              {
                icon: <AlertTriangle size={24} className="text-rose-600" />,
                step: "02",
                title: "Modo emergencia el día D",
                desc: "Si vence hoy, aparece primero. Rojo intenso. Imposible de ignorar. Imposible de olvidar.",
                bg: "border-rose-100 bg-rose-50",
              },
              {
                icon: <Shield size={24} className="text-emerald-600" />,
                step: "03",
                title: "Cero multas. Cero excusas.",
                desc: "Una multa evitada paga IfsinRem por más de un año. El ROI se justifica solo.",
                bg: "border-emerald-100 bg-emerald-50",
              },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.1}>
                <div className={`rounded-2xl border p-6 h-full transition-all hover:shadow-xl hover:shadow-slate-200/50 ${s.bg}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      {s.icon}
                    </div>
                    <span className="text-3xl font-black text-slate-200">{s.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── RISK PANEL FEATURE */}
      <section className="px-4 py-20 sm:py-28 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-2xl shadow-slate-200/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs font-bold text-rose-600 uppercase tracking-widest mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                  </span>
                  Funciona ahora mismo
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-5 leading-tight text-slate-900">
                  Una multa de AFIP paga<br />IfsinRem por{" "}
                  <span className="text-rose-600">más de un año.</span>
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  El plan más barato cuesta menos de lo que cuesta una sola multa mínima de AFIP. La cuenta es simple: si evitás una sola multa, ya lo pagaste. Todo lo demás es ganancia.
                </p>
                <Button
                  onClick={() => navigate("/auth")}
                  className="gap-2 bg-rose-600 hover:bg-rose-700 text-white h-12 px-7 font-bold rounded-xl border-0 shadow-lg shadow-rose-600/20"
                >
                  Activar protección gratis <ArrowRight size={16} />
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  { icon: <Bell size={16} className="text-amber-600" />, text: "Alertas automáticas por email 7 días antes" },
                  { icon: <Building2 size={16} className="text-sky-600" />, text: "Panel multicliente — todos en una pantalla" },
                  { icon: <PhoneCall size={16} className="text-emerald-600" />, text: "Alertas por WhatsApp (plan Pro en adelante)" },
                  { icon: <Shield size={16} className="text-violet-600" />, text: "Historial de cumplimiento para cada cliente" },
                  { icon: <CheckCircle2 size={16} className="text-rose-600" />, text: "Modo emergencia: vence hoy → aparece primero" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      {f.icon}
                    </div>
                    <p className="text-sm font-medium text-slate-700">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING */}
      <section id="precios" className="px-4 py-20 sm:py-28 sm:px-8 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900">Precios directos, sin letra chica</h2>
            <p className="text-slate-500 text-lg">
              Primer mes gratis. Cancelás cuando querés.{" "}
              <span className="text-slate-700 font-semibold">Pagás en pesos con Mercado Pago.</span>
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                desc: "Ideal para monotributistas",
                ars: "$14.900",
                sub: "30 DÍAS GRATIS",
                features: ["Hasta 3 recordatorios", "1 usuario", "Alertas por email", "Panel de riesgo/vencimientos"],
                highlight: false,
                cta: "Empezar 30 días gratis",
              },
              {
                name: "Pro",
                desc: "Contador independiente",
                ars: "$34.900",
                sub: "Plan profesional",
                features: ["De 3 a 10 recordatorios", "5 usuarios", "Todo Starter +", "Alertas WhatsApp", "Panel multicliente"],
                highlight: true,
                cta: "Probar Gratis",
              },
              {
                name: "Estudio",
                desc: "Estudios Contables",
                ars: "$69.900",
                sub: "Gestión total",
                features: ["Recordatorios ilimitados", "Usuarios ilimitados", "Todo Pro +", "Soporte prioritario", "Panel de control avanzado"],
                highlight: false,
                cta: "Probar Gratis",
              },
            ].map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.1}>
                <div
                  className={`relative rounded-2xl border h-full flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 ${
                    p.highlight
                      ? "border-rose-200 bg-white shadow-2xl shadow-rose-200/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-rose-600/30">
                        Más elegido
                      </span>
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{p.desc}</p>
                  </div>
                  <div className="mb-1">
                    <span className="text-4xl font-black text-slate-900">{p.ars}</span>
                    <span className="text-slate-400 text-sm font-bold">/mes</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-6 font-medium uppercase tracking-wider">{p.sub}</p>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => navigate(`/auth?plan=${p.name.toLowerCase()}`)}
                    className={`w-full font-bold h-11 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg ${
                      p.highlight
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-slate-200/20"
                    }`}
                  >
                    {p.cta}
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* multa argument */}
          <FadeIn className="mt-10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <p className="text-slate-700 font-bold text-sm">
                <span className="text-amber-600">Una multa de AFIP evitada</span> ya paga IfsinRem por más de un año.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA */}
      <section className="px-4 py-20 sm:py-28 sm:px-8 text-center relative overflow-hidden">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/[0.04] rounded-full blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <FadeIn>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight text-slate-900">
              Empezá hoy.
              <br />
              <span className="text-slate-400">La próxima multa no espera.</span>
            </h2>
            <p className="text-slate-500 text-lg mb-10 font-medium">
              30 días gratis. Sin tarjeta. En 5 minutos tenés todos tus clientes cargados y el sistema trabajando.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/auth")}
                className="group flex items-center gap-2 rounded-2xl bg-rose-600 px-10 h-14 text-lg font-black text-white hover:bg-rose-700 transition-colors shadow-2xl shadow-rose-600/30"
              >
                Activar protección gratis
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                onClick={() => window.open("https://calendly.com/ifsintech", "_blank")}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 h-14 text-base font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm"
              >
                <Calendar size={16} />
                Agendar una demo
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
