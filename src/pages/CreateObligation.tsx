import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";
import { categoryLabels, ObligationCategory } from "@/services/obligationService";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useCreateObligation } from "@/hooks/useObligations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CreateObligation = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ObligationCategory | "">("");
  const [dueDate, setDueDate] = useState<Date>();
  const [recurrence, setRecurrence] = useState<'none' | 'monthly' | 'annual'>('none');

  // React Query mutation
  const createMutation = useCreateObligation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && user && !isAdmin) {
      toast.error("Solo los administradores pueden crear obligaciones");
      navigate('/dashboard');
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !category || !dueDate) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    try {
      await createMutation.mutateAsync({
        obligation: {
          name,
          category: category as ObligationCategory,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          responsible_id: user.id,
          recurrence
        } as any,
        userId: user.id
      });

      navigate('/dashboard');
    } catch (error) {
      // Error already handled by mutation
      console.error('Error creating obligation:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName={profile?.name || user.email || 'Usuario'}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userPlan={profile?.plan}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </button>

        <div className="card-elevated p-6 sm:p-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-6">Nueva obligación</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la obligación</Label>
              <Input
                id="name"
                placeholder="Ej: Habilitación comercial municipal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(value: ObligationCategory) => setCategory(value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabels) as ObligationCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat} />
                        <span>{categoryLabels[cat]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label>Recurrencia</Label>
              <Select value={recurrence} onValueChange={(value: 'none' | 'monthly' | 'annual') => setRecurrence(value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecciona recurrencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span>🔹</span>
                      <span>Sin recurrencia</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <span>🔄</span>
                      <span>Mensual</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="annual">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Anual</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Las obligaciones recurrentes pueden renovarse automáticamente
              </p>
            </div>

            {/* Responsible - Auto-assigned */}
            <div className="space-y-2">
              <Label>Responsable</Label>
              <div className="h-12 px-3 py-2 bg-secondary/50 rounded-md border border-input flex items-center">
                <span className="text-sm text-foreground">
                  {profile?.name || user.email} (tú)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Las obligaciones se asignan automáticamente a ti
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Crear obligación"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateObligation;
