import { Linkedin, Mail, Calendar, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="bg-[#04060a] border-t border-slate-900 text-slate-400">
      {/* top CTA strip */}
      <div className="border-b border-slate-900 py-10 bg-[#06080e]/60">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Protegé tus obras y operarios ahora</p>
              <p className="text-xs text-slate-500 font-medium">Cumplimiento SRT 299/11 inmediato. Digitalización sin papeles.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.a
              href="https://calendly.com/ifsinrem"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-2xl bg-[#0d1222] border border-slate-800 hover:border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-200 transition-colors shadow-sm"
            >
              <Calendar size={14} className="text-emerald-400" /> Agendar Reunión
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-600/20"
            >
              Acceder al sistema <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* main footer content */}
      <div className="container mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="text-emerald-400 h-5 w-5" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">ifsin<span className="text-emerald-400">rem</span></span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs font-medium">
              Gestión Inteligente de EPP y Documentación Laboral con Inteligencia Artificial. Blindá tus obras ante reclamos e inspecciones.
            </p>
          </div>

          {/* links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Navegación
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Inicio', href: '#' },
                { label: 'Cómo funciona', href: '#como-funciona' },
                { label: 'Agendar Demo (Calendly)', href: 'https://calendly.com/ifsinrem', external: true },
              ].map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <a
                      href={l.href}
                      className="text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Contacto y Soporte
            </h3>
            <div className="flex gap-3">
              {[
                { icon: Linkedin, href: 'https://www.linkedin.com/company/ifsinrem/', label: 'LinkedIn' },
                { icon: Mail, href: 'mailto:contacto@ifsinrem.com', label: 'Email' },
                { icon: Calendar, href: 'https://calendly.com/ifsinrem', label: 'Demo' },
              ].map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400 transition-all shadow-sm"
                >
                  <s.icon size={16} />
                </motion.a>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500 font-medium">soporte@ifsinrem.com</p>
          </div>
        </div>

        {/* bottom bar */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            © {year} ifsinrem by{' '}
            <a
              href="https://www.linkedin.com/company/ifsinrem/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              ifsinrem
            </a>
            . Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-600 font-medium">Hecho en Salta, Argentina 🇦🇷</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
