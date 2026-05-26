import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  CheckCircle2,
  Zap,
  Calendar,
  Mic,
  FileSignature,
  Users,
  Boxes,
  FileSpreadsheet,
  Smartphone,
  Sparkles,
  Mail,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { openCalendly } from "@/utils/calendly";

// ─── helpers ─────────────────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  y = 20,
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
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating particles for futuristic theme
function FloatingParticles() {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);
  
  useEffect(() => {
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-500/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          animate={{
            y: ["0px", "-150px", "0px"],
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── mock panel preview ───────────────────────────────────────────────────────

const mockEPPDeliveries = [
  { worker: "Marcelo Ifran", item: "Casco de seguridad Amarillo + Guantes", status: "Firmado", date: "Hoy", type: "success" },
  { worker: "Carlos Gómez", item: "Calzado de seguridad Dieléctrico", status: "Pendiente Firma", date: "Hoy", type: "warning" },
  { worker: "Sofía Rodríguez", item: "Anteojos de seguridad + Protector Auditivo", status: "Firmado", date: "Ayer", type: "success" },
  { worker: "Néstor Juárez", item: "Arnés de seguridad de 3 puntos", status: "Vencido (Cambio)", date: "Hace 2d", type: "danger" },
];

function MockPanel() {
  const badgeCls = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl shadow-2xl shadow-emerald-500/5 overflow-hidden select-none relative group hover:border-emerald-500/20 transition-all duration-500">
      {/* Neon glow effect on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#05070d] border-b border-slate-900">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-3 text-[10px] text-slate-500 font-mono">app.ifsinrem.com/dashboard</span>
      </div>

      <div className="p-5 relative z-10">
        {/* stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Pendientes Firma", value: "3", cls: "bg-amber-500/10 border border-amber-500/10 text-amber-400" },
            { label: "Cumplimiento", value: "96.4%", cls: "bg-emerald-500/10 border border-emerald-500/10 text-emerald-400" },
            { label: "Operarios Activos", value: "48", cls: "bg-slate-900/60 border border-slate-800/40 text-white" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.cls}`}>
              <p className="text-xl sm:text-2xl font-black leading-none">{s.value}</p>
              <p className="text-[8px] sm:text-[9px] mt-1 opacity-80 font-bold uppercase tracking-wider truncate">{s.label}</p>
            </div>
          ))}
        </div>

        {/* voice trigger preview */}
        <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl px-3 py-2.5 mb-4">
          <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
            <Mic size={12} className="text-emerald-400" />
          </div>
          <p className="text-[11px] text-emerald-300 font-medium">
            <span className="text-slate-400 font-bold">Voz IA:</span> "Casco amarillo y guantes de vaqueta para Marcelo Ifran hoy."
          </p>
        </div>

        {/* deliveries list */}
        <div className="space-y-2">
          {mockEPPDeliveries.map((c, i) => (
            <motion.div
              key={c.worker}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center justify-between rounded-xl border border-slate-900 bg-[#0a0f1d]/50 px-3.5 py-2.5 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{c.worker}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.item}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-slate-500">{c.date}</span>
                <span className={`text-[9px] font-bold border rounded-full px-2 py-0.5 ${badgeCls[c.type as keyof typeof badgeCls]}`}>
                  {c.status}
                </span>
              </div>
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
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: "1. Carga Inteligente por Voz",
      subtitle: "Dictado en campo sin tipear",
      desc: "El supervisor presiona un botón y habla de forma natural. Nuestra IA interpreta nombres, talles y elementos de protección en tiempo real.",
      icon: <Mic className="text-emerald-400" size={20} />,
      bubbleText: "Casco de seguridad talle M para Carlos Gómez hoy",
      simulationType: "voice"
    },
    {
      id: 1,
      title: "2. Firma Digital Inmediata",
      subtitle: "Validez legal con firma manuscrita digital",
      desc: "El operario dibuja su firma con el dedo directamente en la pantalla de la tablet o celular. Blindado legalmente y sin necesidad de imprimir.",
      icon: <FileSignature className="text-teal-400" size={20} />,
      bubbleText: "Operario Carlos Gómez firmando...",
      simulationType: "signature"
    },
    {
      id: 2,
      title: "3. Planilla 299/11 Oficial",
      subtitle: "Cumplimiento legal automático",
      desc: "El sistema genera al instante el PDF oficial con el formato exacto exigido por la Superintendencia de Riesgos del Trabajo (SRT) listo para descargar.",
      icon: <Boxes className="text-indigo-400" size={20} />,
      bubbleText: "Descargar Formulario 299/11 SRT Oficial",
      simulationType: "pdf"
    }
  ];

  const renderSimulator = () => {
    switch (activeStep) {
      case 0:
        return (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
            className="h-full flex flex-col justify-between p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase">IA Activa — Dictando</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">PLANTA SUR</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center gap-6 my-4">
              {/* sound wave bars */}
              <div className="flex items-center justify-center gap-1.5 h-16">
                {[8, 12, 4, 14, 16, 10, 6, 12].map((height, idx) => (
                  <motion.div
                    key={idx}
                    className="w-1.5 bg-emerald-500 rounded-full"
                    initial={{ height: height * 4 }}
                    animate={{
                      height: [height * 2, height * 4.5, height * 1.5, height * 4],
                    }}
                    transition={{
                      duration: 0.8 + idx * 0.15,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              
              <motion.div 
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="bg-[#05070c] border border-slate-900 rounded-2xl p-4 w-full text-center relative overflow-hidden"
              >
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 font-mono">Texto Procesado</p>
                <p className="text-sm font-semibold text-emerald-300">
                  "Entrega de casco amarillo y protector auditivo para el operario Carlos Gómez"
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              </motion.div>
            </div>

            <div className="rounded-xl bg-[#090d16]/50 border border-slate-900/60 p-3 text-center font-sans">
              <p className="text-[11px] text-slate-400 font-medium">
                👉 <span className="font-bold text-slate-300">Autocompletado:</span> El sistema detecta el operario Carlos Gómez y asocia los elementos Casco y Auditivos de forma automática.
              </p>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
            className="h-full flex flex-col justify-between p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4">
              <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase">Panel de Firma</span>
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">Firma Táctil</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center my-2">
              <p className="text-xs text-slate-400 mb-2 font-medium">Dibuja la firma sobre la línea</p>
              <div className="w-full h-32 rounded-xl border border-slate-900 bg-[#05070c] flex items-center justify-center relative overflow-hidden">
                {/* signature line */}
                <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-800/80" />
                
                {/* animated SVG signature */}
                <svg className="w-48 h-24 relative z-10" viewBox="0 0 200 100">
                  <motion.path 
                    d="M20,50 Q40,20 60,70 T100,30 T140,80 T180,40" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 2.2,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                </svg>

                <div className="absolute top-2 right-2 rounded bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400 font-mono uppercase">
                  Encriptado
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#090d16]/50 border border-slate-900/60 p-3 text-center font-sans">
              <p className="text-[11px] text-slate-400 font-medium">
                🔒 <span className="font-bold text-slate-300">Resguardo Legal:</span> La firma táctil registra dirección IP, geolocalización y marca de tiempo (timestamp) para total validez jurídica.
              </p>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
            className="h-full flex flex-col justify-between p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4">
              <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase">Formulario 299/11 PDF</span>
              <span className="text-[10px] text-slate-500 font-mono">Certificado</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center my-3">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="w-44 h-28 bg-[#090d16] border border-slate-800/80 rounded-xl p-3 relative overflow-hidden shadow-lg shadow-emerald-950/5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="h-2 w-12 bg-slate-800 rounded" />
                  <div className="h-1.5 w-24 bg-slate-900 rounded" />
                  <div className="h-1.5 w-20 bg-slate-900 rounded" />
                  <div className="h-1.5 w-28 bg-slate-900 rounded" />
                </div>
                <div className="flex items-center justify-between border-t border-slate-900 pt-2">
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 rounded bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                    </div>
                    <span className="text-[7px] text-emerald-400 font-bold uppercase font-mono">100% Válido</span>
                  </div>
                  <div className="h-3 w-10 bg-[#34d399]/20 rounded border border-[#34d399]/30" />
                </div>
              </motion.div>

              <div className="mt-4 flex gap-2">
                <motion.button 
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 shadow border-0 transition-colors"
                >
                  Descargar Planilla Legal
                </motion.button>
              </div>
            </div>

            <div className="rounded-xl bg-[#090d16]/50 border border-slate-900/60 p-3 text-center font-sans">
              <p className="text-[11px] text-slate-400 font-medium">
                📄 <span className="font-bold text-slate-300">Listo para Auditorías:</span> Planilla digital homologada idéntica a la exigida por el Ministerio de Trabajo y la SRT.
              </p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#04060a] text-slate-100 overflow-x-hidden relative">
      {/* Stars / Particles */}
      <FloatingParticles />

      {/* Cyberpunk Grid Background */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03] z-0" 
        style={{
          backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── NAV */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-slate-950 bg-[#04060a]/80 backdrop-blur-xl animate-fade-in"
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="text-emerald-400 h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">ifsin<span className="text-emerald-400">rem</span></span>
          </div>
          <div className="flex items-center gap-4 font-sans font-semibold">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── HERO */}
      <section className="relative px-4 py-20 sm:py-32 sm:px-8 text-center overflow-hidden z-10">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.08] rounded-full blur-[130px]" />
          <div className="absolute top-40 left-1/4 w-[350px] h-[350px] bg-teal-500/[0.04] rounded-full blur-[90px]" />
        </div>

        <div className="relative mx-auto max-w-4xl z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-4 py-1.5 text-xs font-bold text-emerald-400 mb-8 uppercase tracking-widest"
          >
            <Sparkles size={12} className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            ¡OFICIAL & LEGAL! — Registro y Firma Digital de EPP 100% Homologados
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 text-white"
          >
            Digitalizá la Entrega de EPP.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
              Firma Digital en Campo
            </span>
            <br />
            y Planilla 299/11 Automática.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-base sm:text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-sans font-medium"
          >
            El único sistema móvil que te permite registrar entregas de seguridad por voz en el campo, hacer que el operario firme con el dedo en tu celular y exportar la Planilla SRT 299/11 oficial en PDF en un clic. Cumplimiento legal asegurado, sin papeles.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 h-14 text-base font-bold text-white hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-950/20"
            >
              Comenzar ahora
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.a
              href="https://calendly.com/ifsinrem"
              target="_blank"
              rel="noopener noreferrer"
              onClick={openCalendly}
              whileHover={{ scale: 1.02 }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#090d16]/80 px-8 h-14 text-base font-bold text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer font-sans"
            >
              Agendar Demo en Vivo
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#090d16]/80 border border-slate-900 px-4 py-2.5 text-xs text-slate-300 font-semibold font-sans"
          >
            <span className="text-emerald-400">⚖️ Validez Jurídica:</span> Conforme a Resolución SRT 299/11 y validez de firmas electrónicas/manuscritas según el Código Civil y Comercial.
          </motion.div>
        </div>
      </section>

      {/* ── PAIN STAT BAR */}
      <section className="border-y border-slate-900/60 bg-[#05070d] px-4 py-8 sm:px-8 relative z-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { num: "F. 299/11", text: "generación automática en PDF firmada al instante" },
              { num: "3 clics", text: "desde cualquier celular para registrar una entrega" },
              { num: "0 papeles", text: "trazabilidad legal completa y blindada ante auditorías" },
            ].map((s, idx) => (
              <FadeIn key={s.text} delay={idx * 0.12} y={15} className="py-2">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">{s.num}</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium px-4 font-sans">{s.text}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PANEL PREVIEW */}
      <section className="px-4 py-20 sm:py-28 sm:px-8 relative z-10" id="como-funciona-panel">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn delay={0}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Zap size={12} className="text-emerald-400" />
                Control Operativo de EPP
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight text-white">
                Firma manuscrita digital.
                <br />
                <span className="text-slate-500">Trazabilidad inmediata.</span>
              </h2>
              <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed font-sans">
                Olvidate de imprimir planillas, buscar al operario para que firme, y archivar biblioratos. El supervisor entrega la protección y el operario firma con el dedo en el celular del supervisor. Todo queda guardado.
              </p>
              <ul className="space-y-4 font-sans">
                {[
                  { title: "Alta Express", desc: "Cargá operarios por DNI o CUIL desde el campo en 10 segundos." },
                  { title: "Historial por Trabajador", desc: "Sabé exactamente qué elementos se le entregaron a cada persona y cuándo vencen." },
                  { title: "Búsqueda por Voz", desc: "Consultá entregas anteriores diciendo el nombre del trabajador." },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                    </div>
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

      {/* ── INTERACTIVE WORKFLOW (REPLACING TYPICAL CARDS) */}
      <section className="px-4 py-20 sm:py-28 sm:px-8 bg-[#05070d] border-y border-slate-900/60 relative z-10" id="como-funciona">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Interactúa con el sistema
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">
              ¿Cómo funciona ifsinrem?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-sans">
              Diseñado específicamente para el trabajo de campo. Mirá cómo reemplazamos las planillas de papel en 3 simples pasos interactivos.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Step Selection Column */}
            <div className="lg:col-span-7 flex flex-col justify-center gap-4">
              {steps.map((step, idx) => {
                const isActive = activeStep === step.id;
                return (
                  <FadeIn key={step.id} delay={idx * 0.1} y={10}>
                    <button
                      onClick={() => setActiveStep(step.id)}
                      className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                        isActive 
                          ? "bg-[#090d16] border-emerald-500/40 shadow-lg shadow-emerald-500/5" 
                          : "bg-[#06080e]/40 border-slate-900 hover:border-slate-800 hover:bg-[#06080e]/80"
                      }`}
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-slate-900 border border-slate-800"
                      }`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 font-sans">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                          {step.subtitle}
                        </p>
                        <h3 className="text-base font-bold text-white mt-1 font-sans">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed font-medium">
                          {step.desc}
                        </p>
                      </div>
                    </button>
                  </FadeIn>
                );
              })}
            </div>

            {/* Interactive Simulation Pane */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="h-full rounded-2xl border border-slate-800 bg-[#070b14]/90 backdrop-blur-xl shadow-2xl overflow-hidden relative flex flex-col">
                {/* Browser Chrome Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#05070d] border-b border-slate-900/60 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-[9px] text-slate-600 font-mono">simulador_ifsinrem.exe</span>
                </div>

                {/* Simulated Content */}
                <div className="flex-1 bg-[#04060b] relative min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {renderSimulator()}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEGAL AUDIT FEATURE */}
      <section className="px-4 py-20 sm:py-28 sm:px-8 relative z-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-900 bg-[#06080e] p-8 sm:p-12 shadow-2xl shadow-emerald-500/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6 font-sans">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  RESOLUCIÓN SRT 299/11
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-5 leading-tight text-white">
                  ¿Es legal el registro<br />digital de EPP?
                </h2>
                <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed font-sans font-medium">
                  Sí, la Superintendencia de Riesgos del Trabajo (SRT) y el Código Civil y Comercial de la Nación habilitan y validan legalmente el formato digital y la firma electrónica para la entrega de elementos de protección. <strong className="text-emerald-400 font-semibold">ifsinrem</strong> genera la Planilla 299 oficial firmada digitalmente, lista ante inspecciones del Ministerio de Trabajo o demandas de ART.
                </p>
                <Button
                  onClick={() => navigate("/auth")}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white h-12 px-7 font-bold rounded-xl border-0 shadow-lg shadow-emerald-500/10 font-sans"
                >
                  Digitalizar mi gestión <ArrowRight size={16} />
                </Button>
              </div>

              <div className="space-y-3 font-sans">
                {[
                  { icon: <Smartphone size={16} className="text-emerald-400" />, text: "App móvil optimizada para zonas con poca señal" },
                  { icon: <FileSpreadsheet size={16} className="text-teal-400" />, text: "Generación automática del PDF de Planilla 299" },
                  { icon: <Users size={16} className="text-indigo-400" />, text: "Roles para Empresa, Supervisor y Operario" },
                  { icon: <Boxes size={16} className="text-amber-400" />, text: "Catálogo de EPP organizado por categorías" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 rounded-xl border border-slate-900 bg-[#080b12] px-4 py-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shadow-sm">
                      {f.icon}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-300">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA / DEMO BOOKING */}
      <section id="demo" className="px-4 py-20 sm:py-28 sm:px-8 relative overflow-hidden z-10">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.06] rounded-full blur-[110px]" />
        </div>

        <div className="relative mx-auto max-w-5xl z-10">
          <FadeIn>
            <div className="relative rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0a0f1a] via-[#0c1220] to-[#080b14] p-8 sm:p-12 overflow-hidden">
              {/* subtle grid */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
              <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                <div className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 mb-4">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">Demo 1:1 · Sin cargo</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black leading-tight text-white mb-4">
                      Hablemos de tu empresa.
                      <br />
                      <span className="text-slate-500">Diseñemos tu plan.</span>
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed font-sans">
                      Coordinamos una llamada corta de 15 a 20 minutos para revisar tu operativa actual de entrega de EPP y configurar tu entorno de pruebas.
                    </p>
                  </div>

                  <div className="space-y-3 font-sans">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">¿Qué resolvemos en la reunión?</h3>
                    <ul className="space-y-2.5">
                      {[
                        "Demostración interactiva en vivo adaptada a tu sector.",
                        "Consultoría exprés sobre el cumplimiento de la Resol. SRT 299/11.",
                        "Análisis de viabilidad para integración con tu ERP actual.",
                        "Habilitación de tu cuenta Sandbox para testeo."
                      ].map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-medium">
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:mt-12">
                  <div className="mb-2 bg-slate-950/80 border border-slate-900 rounded-2xl p-4 w-full text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Siguiente Paso</p>
                    <p className="text-sm font-bold text-white mt-1">Calendly Reservado</p>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Disponibilidad esta semana</p>
                  </div>

                  <motion.a
                    href="https://calendly.com/ifsinrem"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={openCalendly}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center justify-between gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 h-14 text-base font-bold text-white shadow-xl shadow-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <Calendar size={18} />
                      Agendar demo en Calendly
                    </span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </motion.a>

                  <a
                    href="mailto:contacto@ifsinrem.com"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#090d16]/60 hover:border-slate-700 hover:text-white px-6 h-14 text-sm font-semibold text-slate-300 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <Mail size={16} className="text-emerald-400" />
                      contacto@ifsinrem.com
                    </span>
                    <ArrowRight size={16} className="opacity-50" />
                  </a>

                  <p className="text-[11px] text-slate-500 font-medium px-1 text-center md:text-left">
                    Sin compromiso · Respuesta en menos de 24h hábiles
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
