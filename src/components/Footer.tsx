import { Linkedin, Mail, Calendar, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      {/* top CTA strip */}
      <div className="border-b border-slate-200 py-10 bg-white">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Shield size={18} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Protegé tu estudio ahora</p>
              <p className="text-xs text-slate-500 font-medium">30 días gratis. Sin tarjeta.</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-rose-600/20"
          >
            Empezar gratis <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>

      {/* main footer content */}
      <div className="container mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="IfsinRem" className="w-9 h-9 rounded-xl object-contain" />
              <span className="text-base font-bold text-slate-900">IfsinRem</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs font-medium">
              El sistema anti-multas que protege a contadores y estudios contables argentinos de vencimientos olvidados.
            </p>
          </div>

          {/* links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Navegación
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Inicio', href: '#' },
                { label: 'Cómo funciona', href: '#como-funciona' },
                { label: 'Precios', href: '#precios' },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-slate-500 hover:text-rose-600 transition-colors font-medium"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Contacto
            </h3>
            <div className="flex gap-3">
              {[
                { icon: Linkedin, href: 'https://www.linkedin.com/company/ifsintech/', label: 'LinkedIn' },
                { icon: Mail, href: 'mailto:contacto@ifsinrem.com', label: 'Email' },
                { icon: Calendar, href: 'https://calendly.com/ifsintech', label: 'Demo' },
              ].map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm"
                >
                  <s.icon size={16} />
                </motion.a>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400 font-medium">contacto@ifsinrem.com</p>
          </div>
        </div>

        {/* bottom bar */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 font-medium">
            © {year} IfsinRem by{' '}
            <a
              href="https://www.linkedin.com/company/ifsintech/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-rose-600 transition-colors"
            >
              IfsinTech
            </a>
            . Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-300 font-medium">Hecho en Salta, Argentina 🇦🇷</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
