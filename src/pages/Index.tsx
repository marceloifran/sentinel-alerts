import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Bell, Users, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold text-foreground">IfsinRem</span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Iniciar sesión
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-16 sm:py-24 text-center max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Tu aliado contra los vencimientos olvidados
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Nunca más olvides una{" "}
            <span className="text-primary">obligación importante</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Centraliza tus documentos, habilitaciones y trámites con vencimiento. 
            Recibe recordatorios automáticos y mantén a tu empresa siempre al día.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto gap-2 h-12 px-8 text-base"
            >
              Comenzar gratis
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto h-12 px-8 text-base"
            >
              Ver demo
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="card-elevated p-6 sm:p-8 animate-slide-up" style={{ animationDelay: '0ms' }}>
              <div className="w-12 h-12 rounded-xl bg-status-success-bg flex items-center justify-center mb-5">
                <CheckCircle className="w-6 h-6 text-status-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Estado visual claro
              </h3>
              <p className="text-muted-foreground">
                Ve de un vistazo qué está al día, qué está por vencer y qué necesita atención urgente.
              </p>
            </div>

            <div className="card-elevated p-6 sm:p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="w-12 h-12 rounded-xl bg-status-warning-bg flex items-center justify-center mb-5">
                <Bell className="w-6 h-6 text-status-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Recordatorios automáticos
              </h3>
              <p className="text-muted-foreground">
                El sistema te avisa 30 días, 7 días y el mismo día del vencimiento. No dependes de la memoria.
              </p>
            </div>

            <div className="card-elevated p-6 sm:p-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Asignación de responsables
              </h3>
              <p className="text-muted-foreground">
                Cada obligación tiene un dueño. Los recordatorios llegan directamente a quien debe actuar.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 text-center">
          <div className="card-elevated p-8 sm:p-12 bg-primary/5 border-primary/20 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              "Esto me cuida. Si pasa algo, me avisan."
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              No depende de la memoria de nadie. Siempre sabes dónde estás parado.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gap-2 h-12 px-8 text-base"
            >
              Empezar ahora
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2026 IfsinRem. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
