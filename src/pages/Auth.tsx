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

  // Redirect if already logged in - use useEffect instead of render-time navigation
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && (!name || !phone || !sector))) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
    if (!isLogin && !phoneRegex.test(phone)) {
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
        const { error } = await signUp(email, password, name, phone, sector);
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
        {/* Background decoration */}
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
            Gestiona tus obligaciones con confianza
          </h1>
          <p className="text-primary-foreground/90 text-xl leading-relaxed">
            La plataforma integral para empresas que quieren mantener todas sus obligaciones fiscales, legales y laborales bajo control.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Recordatorios Inteligentes</h3>
              <p className="text-primary-foreground/80 text-sm">Notificaciones automáticas por email antes de cada vencimiento</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Dashboard Visual</h3>
              <p className="text-primary-foreground/80 text-sm">Vista clara del estado de cumplimiento de todas tus obligaciones</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Trabajo en Equipo</h3>
              <p className="text-primary-foreground/80 text-sm">Asigna responsables y colabora con tu equipo de trabajo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="IfsinRem Logo" className="w-12 h-12 object-contain rounded-xl shadow-md" />
            <span className="text-2xl font-bold text-foreground">IfsinRem</span>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              {isLogin ? "Acceso seguro" : "Registro gratuito"}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Ingresa tus credenciales para continuar"
                : "Completa tus datos para comenzar"
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
                        <SelectValue placeholder="Selecciona tu sector" />
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
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10 bg-background border-border/60 focus:border-primary"
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
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
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
              {isLoading ? "Procesando..." : (isLogin ? "Iniciar sesión" : "Crear mi cuenta")}
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
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isLogin
                ? "¿No tienes cuenta? Crea una gratis"
                : "¿Ya tienes cuenta? Inicia sesión"
              }
            </button>
          </div>

          {!isLogin && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground/70">
            El primer usuario registrado será designado como administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
