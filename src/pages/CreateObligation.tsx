import { useState } from "react";
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
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { categoryLabels, categoryIcons, ObligationCategory } from "@/types/obligation";
import { mockUsers } from "@/data/mockData";
import { toast } from "sonner";

const CreateObligation = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ObligationCategory | "">("");
  const [dueDate, setDueDate] = useState<Date>();
  const [responsible, setResponsible] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const responsibles = mockUsers.filter(u => u.role === 'responsable');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !dueDate || !responsible) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success("Obligación creada exitosamente");
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName="María García" onLogout={() => navigate('/')} />
      
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
                        <span>{categoryIcons[cat]}</span>
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
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Responsible */}
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={responsible} onValueChange={setResponsible}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Asignar a..." />
                </SelectTrigger>
                <SelectContent>
                  {responsibles.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Crear obligación"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateObligation;
