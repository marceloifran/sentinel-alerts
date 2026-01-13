import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockObligations } from "@/data/mockData";
import { categoryLabels, categoryIcons, statusLabels, ObligationStatus } from "@/types/obligation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, User, Clock, FileUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ObligationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const obligation = mockObligations.find(o => o.id === id);
  
  const [status, setStatus] = useState<ObligationStatus>(obligation?.status || 'al_dia');
  const [note, setNote] = useState("");

  if (!obligation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Obligación no encontrada</h2>
          <Button onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
        </div>
      </div>
    );
  }

  const daysUntilDue = Math.ceil(
    (new Date(obligation.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleStatusChange = (newStatus: ObligationStatus) => {
    setStatus(newStatus);
    toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
  };

  const handleAddNote = () => {
    if (!note.trim()) {
      toast.error("Escribe una nota antes de guardar");
      return;
    }
    toast.success("Nota agregada");
    setNote("");
  };

  const mockHistory = [
    { date: new Date(), user: "María García", from: "por_vencer" as const, to: status },
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), user: "Sistema", from: "al_dia" as const, to: "por_vencer" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userName="María García" onLogout={() => navigate('/')} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </button>

        <div className="space-y-6 animate-fade-in">
          {/* Main Card */}
          <div className="card-elevated p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{categoryIcons[obligation.category]}</span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {categoryLabels[obligation.category]}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">{obligation.name}</h1>
              </div>
              <StatusBadge status={status} size="md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(obligation.dueDate), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <p className={cn(
                    "text-xs",
                    daysUntilDue < 0 && "text-status-danger",
                    daysUntilDue >= 0 && daysUntilDue <= 30 && "text-status-warning",
                    daysUntilDue > 30 && "text-status-success"
                  )}>
                    {daysUntilDue < 0 
                      ? `Vencida hace ${Math.abs(daysUntilDue)} días`
                      : daysUntilDue === 0 
                        ? "Vence hoy"
                        : `${daysUntilDue} días restantes`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Responsable</p>
                  <p className="font-medium text-foreground">{obligation.responsibleName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Change Status */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Cambiar estado</h2>
            <Select value={status} onValueChange={(value: ObligationStatus) => handleStatusChange(value)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="al_dia">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-success" />
                    Al día
                  </div>
                </SelectItem>
                <SelectItem value="por_vencer">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-warning" />
                    Por vencer
                  </div>
                </SelectItem>
                <SelectItem value="vencida">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-danger" />
                    Vencida
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Note */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Agregar nota</h2>
            <div className="space-y-3">
              <Textarea
                placeholder="Escribe una nota sobre esta obligación..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} variant="secondary">
                Guardar nota
              </Button>
            </div>
          </div>

          {/* Upload Evidence */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Subir evidencia</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
              <FileUp className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click para subir archivo</span>
              <input type="file" className="hidden" />
            </label>
          </div>

          {/* History */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Historial de cambios</h2>
            <div className="space-y-4">
              {mockHistory.map((entry, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{entry.user}</span> cambió el estado de{" "}
                      <span className="font-medium">{statusLabels[entry.from]}</span> a{" "}
                      <span className="font-medium">{statusLabels[entry.to]}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(entry.date, "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ObligationDetail;
