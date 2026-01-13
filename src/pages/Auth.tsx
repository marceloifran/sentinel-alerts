import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && !name)) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
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
        const { error } = await signUp(email, password, name);
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">I</span>
            </div>
            <span className="text-2xl font-bold text-primary-foreground">IfsinRem</span>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4 leading-tight">
            Nunca más olvides un vencimiento importante
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Centraliza tus obligaciones, recibe recordatorios automáticos y mantén a tu empresa siempre al día.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary-foreground/80">
            <span className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm">✓</span>
            <span>Recordatorios automáticos antes del vencimiento</span>
          </div>
          <div className="flex items-center gap-3 text-primary-foreground/80">
            <span className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm">✓</span>
            <span>Vista clara del estado de cumplimiento</span>
          </div>
          <div className="flex items-center gap-3 text-primary-foreground/80">
            <span className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm">✓</span>
            <span>Asignación de responsables por obligación</span>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">I</span>
            </div>
            <span className="text-2xl font-bold text-foreground">IfsinRem</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Ingresa tus credenciales para continuar"
                : "Completa tus datos para empezar"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 pr-10"
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
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base gap-2"
              disabled={isLoading}
            >
              {isLoading ? "Cargando..." : (isLogin ? "Ingresar" : "Crear cuenta")}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"
              }
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            El primer usuario que se registre será administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
