import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, Phone, Building2, Shield, CheckCircle2, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECTORS = [
  { value: "construccion", label: "Construcción" },
  { value: "comercio", label: "Comercio" },
  { value: "servicios", label: "Servicios" },
  { value: "industria", label: "Industria" },
  { value: "agro", label: "Agropecuario" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "transporte", label: "Transporte y Logística" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "gastronomia", label: "Gastronomía y Hotelería" },
  { value: "profesional", label: "Servicios Profesionales" },
  { value: "estudio_contable", label: "Estudio Contable" },
  { value: "otro", label: "Otro" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sector, setSector] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<'professional' | 'enterprise'>('professional');
  const [companyName, setCompanyName] = useState("");
  const [isInvitedSignup, setIsInvitedSignup] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedEmail = params.get('invited_email');

    if (invitedEmail) {
      setIsLogin(false);
      setIsInvitedSignup(true);
      setEmail(invitedEmail);
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
        if (!name || !phone || !sector || !companyName) {
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
        const { error } = await signUp(email, password, name, phone, sector, plan, companyName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error("Este email ya está registrado");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Cuenta creada exitosamente");
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/90 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="IfsinRem Logo" className="w-14 h-14 object-contain rounded-xl shadow-lg" />
            <span className="text-3xl font-bold text-primary-foreground">IfsinRem</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold text-primary-foreground leading-tight">
            Todos tus clientes al día, desde una sola pantalla
          </h1>
          <p className="text-primary-foreground/90 text-xl leading-relaxed">
            Nunca más un vencimiento perdido. Alertas automáticas para cada empresa que gestionás.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Alertas automáticas</h3>
              <p className="text-primary-foreground/80 text-sm">Recibís un mail antes de cada vencimiento</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Panel multicliente</h3>
              <p className="text-primary-foreground/80 text-sm">Verde, amarillo, rojo: sabés al instante quién está al día</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Primer mes gratis</h3>
              <p className="text-primary-foreground/80 text-sm">Sin tarjeta de crédito. Cancelás cuando quieras.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="IfsinRem Logo" className="w-12 h-12 object-contain rounded-xl shadow-md" />
            <span className="text-2xl font-bold text-foreground">IfsinRem</span>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              {isLogin ? "Acceso seguro" : (isInvitedSignup ? "Te estás uniendo a tu equipo" : "Primer mes gratis")}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Bienvenido de vuelta" : (isInvitedSignup ? "Crea tu usuario" : "Empezá gratis")}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Ingresá tus credenciales para continuar"
                : (isInvitedSignup ? "Completá tus datos personales para sumarte a tu empresa" : "Completá tus datos para comenzar")
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
                    />
                  </div>
                </div>

                {!isInvitedSignup && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium">Nombre del Estudio / Empresa</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="Ej: Estudio Contable García"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Ej: +54 11 1234-5678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Incluí código de país para recibir notificaciones</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sector" className="text-sm font-medium">Sector o rubro</Label>
                      <Select value={sector} onValueChange={(val) => setSector(val)}>
                        <SelectTrigger className="h-12 bg-background border-border/60 focus:border-primary">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <SelectValue placeholder="Seleccioná tu sector" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          {SECTORS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan" className="text-sm font-medium">¿Cuántas empresas gestionás?</Label>
                      <Select value={plan} onValueChange={(val: any) => setPlan(val)}>
                        <SelectTrigger className="h-12 bg-background border-border/60 focus:border-primary">
                          <SelectValue placeholder="Seleccioná un plan" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="starter">Hasta 5 empresas (Starter - USD 15/mes)</SelectItem>
                          <SelectItem value="professional">Hasta 20 empresas (Pro - USD 35/mes)</SelectItem>
                          <SelectItem value="enterprise">Ilimitadas (Estudio - USD 70/mes)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Primer mes gratis en todos los planes</p>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@estudio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
                  readOnly={isInvitedSignup}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 pr-10 bg-background border-border/60 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base gap-2 mt-6 shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : (isLogin ? "Iniciar sesión" : "Empezar gratis")}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setName("");
                setPhone("");
                setSector("");
                setIsInvitedSignup(false);
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isLogin
                ? "¿No tenés cuenta? Empezá gratis"
                : "¿Ya tenés cuenta? Iniciá sesión"
              }
            </button>
          </div>

          {!isLogin && !isInvitedSignup && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Al registrarte, aceptás nuestros términos de servicio y política de privacidad.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
