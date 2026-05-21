import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, Phone, Shield, CheckCircle2, Clock, Users, Mic, Sparkles, FileSignature } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  const [isInvitedSignup, setIsInvitedSignup] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedEmail = params.get('invited_email');
    const selectedPlan = params.get('plan') as 'starter' | 'professional' | 'enterprise';
    const mode = params.get('mode');

    if (invitedEmail) {
      setIsLogin(false);
      setIsInvitedSignup(true);
      setEmail(invitedEmail);
    } else if (selectedPlan) {
      setIsLogin(false);
      setPlan(selectedPlan);
    } else if (mode === 'signup') {
      setIsLogin(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (!isLogin) {
      if (isInvitedSignup) {
        if (!name) {
          toast.error("Por favor completa tu nombre");
          return;
        }
      } else {
        if (!name || !phone) {
          toast.error("Por favor completa todos los campos");
          return;
        }
      }
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
    if (!isLogin && !isInvitedSignup && !phoneRegex.test(phone)) {
      toast.error("Por favor ingresa un número de teléfono válido");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error("Credenciales incorrectas");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Bienvenido de vuelta");
        navigate('/dashboard');
      } else {
        const { data, error } = await signUp(email, password, name, phone, plan, undefined);
        if (error) {
          console.error("Signup error returned:", error);
          if (error.message.includes('already registered')) {
            toast.error("Este email ya está registrado");
          } else if (error.message.includes('rate limit')) {
            toast.error("Límite de emails alcanzado. Esperá unos minutos o desactivá la confirmación por email en Supabase.");
          } else {
            toast.error(`Error de registro: ${error.message}`);
          }
          return;
        }
        if (!data?.user || !data.user.identities?.length) {
          toast.error("No se pudo crear la cuenta. Si ya tenés cuenta, iniciá sesión.");
          return;
        }
        if (!data.session) {
          toast.success("Revisá tu correo para confirmar la cuenta y luego iniciá sesión.");
          setIsLogin(true);
          return;
        }
        toast.success("Cuenta creada exitosamente");
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Signup exception caught:", err);
      toast.error(`Error: ${err?.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex relative overflow-hidden">
      
      {/* Cyberpunk Grid Background */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
          backgroundSize: "35px 35px"
        }}
      />

      {/* Left side - Futuristic Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#060914] to-[#04060a] p-12 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        
        {/* Glow rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/[0.04] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="text-emerald-400 h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ifsin<span className="text-emerald-400">rem</span></span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Sparkles size={11} className="text-emerald-400" />
            Control Absoluto en Obra
          </div>
          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
            Digitalizá el control de seguridad laboral.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed font-medium">
            Entregá equipos de protección personal, firmá planillas oficiales 299/11 digitalmente y blindá tu empresa ante contingencias legales.
          </p>
        </div>

        {/* Feature widgets */}
        <div className="relative z-10 space-y-4 max-w-md">
          <div className="flex items-start gap-4 bg-slate-950/45 border border-slate-900 rounded-2xl p-4 hover:border-slate-800/80 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Firma digital manuscrita</h3>
              <p className="text-slate-400 text-xs mt-0.5">El operario firma directo con el dedo desde el celular en obra</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-slate-950/45 border border-slate-900 rounded-2xl p-4 hover:border-slate-800/80 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Asistente por voz con IA</h3>
              <p className="text-slate-400 text-xs mt-0.5">Dictá registros hablando: 'Casco amarillo para Carlos hoy'</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-slate-950/45 border border-slate-900 rounded-2xl p-4 hover:border-slate-800/80 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Planilla 299/11 automática</h3>
              <p className="text-slate-400 text-xs mt-0.5">PDF oficial compilado al instante para auditorías y ART</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md bg-[#070b14]/50 border border-slate-850 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="text-emerald-400 h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">ifsin<span className="text-emerald-400">rem</span></span>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              {isLogin ? "Acceso Seguro" : "Prueba de 15 días gratis"}
            </div>
            <h2 className="text-2xl font-black text-white">
              {isLogin ? "¡Hola de nuevo!" : "Registrar Empresa"}
            </h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              {isLogin
                ? "Ingresá tus credenciales corporativas para continuar"
                : "Creá tu cuenta de supervisor y digitalizá tu stock"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase">Nombre del Responsable *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ej: Ing. Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 pl-9 bg-slate-950/80 border-slate-900 text-white placeholder-slate-600 rounded-xl focus:border-emerald-500 focus:ring-0 text-sm"
                    />
                  </div>
                </div>

                {!isInvitedSignup && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase">Celular / Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Ej: +54 9 387 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-11 pl-9 bg-slate-950/80 border-slate-900 text-white placeholder-slate-600 rounded-xl focus:border-emerald-500 focus:ring-0 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="plan" className="text-xs font-bold text-slate-400 uppercase">Escala de Operarios</Label>
                      <Select value={plan} onValueChange={(val: any) => setPlan(val)}>
                        <SelectTrigger className="h-11 bg-slate-950/80 border-slate-900 text-white focus:ring-0">
                          <SelectValue placeholder="Seleccioná un plan" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="starter">Obra Chica (Hasta 15 operarios)</SelectItem>
                          <SelectItem value="professional">Constructora (Hasta 60 operarios)</SelectItem>
                          <SelectItem value="enterprise">Corporativo (Operarios ilimitados)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-emerald-400/80 font-bold mt-1">Prueba gratis ilimitada durante los primeros 15 días</p>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase">Email Corporativo *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@constructora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-9 bg-slate-950/80 border-slate-900 text-white placeholder-slate-600 rounded-xl focus:border-emerald-500 focus:ring-0 text-sm"
                  readOnly={isInvitedSignup}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase">Contraseña *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-9 pr-10 bg-slate-950/80 border-slate-900 text-white placeholder-slate-600 rounded-xl focus:border-emerald-500 focus:ring-0 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 mt-6 rounded-xl border-0 shadow-lg shadow-emerald-500/15"
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : (isLogin ? "Acceder al Dashboard" : "Registrar Empresa")}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setName("");
                setPhone("");
                setIsInvitedSignup(false);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              {isLogin
                ? "¿No tenés una cuenta? Registrate gratis"
                : "¿Ya tenés una cuenta? Iniciar Sesión"
              }
            </button>
          </div>

          {!isLogin && !isInvitedSignup && (
            <p className="mt-5 text-center text-[10px] text-slate-500 leading-relaxed">
              Al registrarte, confirmás que aceptás nuestros términos de servicio y políticas de seguridad informática de obra.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
