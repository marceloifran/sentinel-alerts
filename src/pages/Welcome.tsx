import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PLAN_INFO: Record<string, { name: string; desc: string; color: string }> = {
  starter: { name: "Starter", desc: "Hasta 5 empresas · 1 usuario", color: "text-sky-400" },
  pro: { name: "Pro", desc: "Hasta 20 empresas · 5 usuarios", color: "text-rose-400" },
  estudio: { name: "Estudio", desc: "Empresas ilimitadas · Soporte prioritario", color: "text-violet-400" },
};

const Welcome = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(8);

  const planKey = params.get("plan") || "pro";
  const plan = PLAN_INFO[planKey] ?? PLAN_INFO.pro;

  // Auto-redirect after 8s
  useEffect(() => {
    if (countdown <= 0) {
      navigate(user ? "/dashboard" : "/auth");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate, user]);

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-md w-full text-center">
        {/* animated check */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30"
        >
          <CheckCircle2 size={48} className="text-emerald-400" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5">
            <Zap size={12} />
            Suscripción confirmada
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            ¡Bienvenido a IfsinRem!
          </h1>

          <p className="text-white/40 mb-6 text-lg">
            Tu plan <span className={`font-bold ${plan.color}`}>{plan.name}</span> está activo.
          </p>

          <div className="rounded-2xl border border-white/8 bg-white/3 px-6 py-4 mb-8 text-left space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Tu plan incluye</p>
            {plan.desc.split(" · ").map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-white/70">{feat}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-8 h-13 py-3.5 text-base font-black text-white transition-colors"
            >
              Ir al dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <p className="text-xs text-white/20">
              Redireccionando automáticamente en {countdown}s...
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-amber-500/15 bg-amber-500/5 px-5 py-3 text-left">
            <p className="text-xs text-amber-400/80">
              <span className="font-bold">¿No ves tu plan activo todavía?</span> Puede demorar hasta 24hs. 
              Escribinos a{" "}
              <a href="mailto:contacto@ifsinrem.com" className="underline hover:text-amber-300">
                contacto@ifsinrem.com
              </a>{" "}
              con el comprobante de pago.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
