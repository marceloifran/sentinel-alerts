import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  CalendarIcon,
  Trash2,
  Edit,
  FileText,
  Upload,
  X,
  FileIcon,
  Mic,
  Music,
} from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { categoryLabels, ObligationCategory } from "@/services/obligationService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AudioRecorder } from "./AudioRecorder";
import { useAuth } from "@/contexts/AuthContext";

interface UploadedFile {
  file: File;
  preview?: string;
  base64?: string;
}

interface ParsedObligation {
  name: string;
  category: ObligationCategory;
  due_date: string;
  recurrence: "none" | "monthly" | "annual";
  responsible_hint?: string;
  confidence: number;
  warnings: string[];
  selected: boolean;
}

interface SmartObligationLoaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onObligationsCreated: () => void;
  existingObligations: { name: string }[];
  userId: string;
}

export function SmartObligationLoader({
  open,
  onOpenChange,
  onObligationsCreated,
  existingObligations,
  userId,
}: SmartObligationLoaderProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<"input" | "preview" | "creating">("input");
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedObligations, setParsedObligations] = useState<ParsedObligation[]>([]);
  const [summary, setSummary] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_FILE_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "audio/webm",
    "audio/ogg",
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/m4a",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(`Tipo de archivo no soportado: ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Archivo muy grande (máx 10MB): ${file.name}`);
        continue;
      }

      const base64 = await fileToBase64(file);
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      setUploadedFiles(prev => [...prev, { file, preview, base64 }]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAudioRecorded = async (file: File) => {
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    setUploadedFiles(prev => [...prev, { file, preview, base64 }]);
    toast.success("Audio grabado correctamente");
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) {
      toast.error("Ingresa texto o sube archivos para analizar");
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data: session } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-obligations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: inputText,
            existingObligations,
            files: uploadedFiles.map(f => ({
              name: f.file.name,
              type: f.file.type,
              base64: f.base64,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al analizar");
      }

      const data = await response.json();

      if (data.obligations.length === 0) {
        toast.info("No se detectaron obligaciones en el texto");
        return;
      }

      setParsedObligations(
        data.obligations.map((o: ParsedObligation) => ({
          ...o,
          selected: true,
        }))
      );
      setSummary(data.summary);
      setStep("preview");
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error(error instanceof Error ? error.message : "Error al analizar el texto");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateObligations = async () => {
    const selectedObligations = parsedObligations.filter((o) => o.selected);

    if (selectedObligations.length === 0) {
      toast.error("Selecciona al menos una obligación");
      return;
    }

    setStep("creating");

    try {
      for (const obl of selectedObligations) {
        const { error } = await supabase.from("obligations").insert({
          name: obl.name,
          category: obl.category,
          due_date: obl.due_date,
          recurrence: obl.recurrence,
          responsible_id: userId,
          created_by: userId,
          company_id: profile?.company_id,
          status: calculateStatus(obl.due_date),
        });

        if (error) {
          // Extract user-friendly error message from PostgreSQL
          let errorMessage = "Error al crear las obligaciones";

          if (error.message) {
            const message = error.message;

            // If it's a plan limit error, extract the clean message
            if (message.includes('Has alcanzado el límite')) {
              const match = message.match(/(Has alcanzado el límite de \d+ obligaciones de tu plan \w+\. Actualiza tu plan para crear más obligaciones\.)/);
              errorMessage = match ? match[1] : message;
            } else {
              errorMessage = message;
            }
          }

          throw new Error(errorMessage);
        }
      }

      toast.success(`${selectedObligations.length} obligación(es) creada(s)`);
      onObligationsCreated();
      handleClose();
    } catch (error) {
      console.error("Error creating obligations:", error);

      // Show the specific error message
      const errorMessage = error instanceof Error ? error.message : "Error al crear las obligaciones";
      toast.error(errorMessage, {
        duration: 6000, // Show for 6 seconds
      });

      setStep("preview");
    }
  };

  const calculateStatus = (dueDate: string): "al_dia" | "por_vencer" | "vencida" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "vencida";
    if (diffDays <= 30) return "por_vencer";
    return "al_dia";
  };

  const handleClose = () => {
    setStep("input");
    setInputText("");
    setParsedObligations([]);
    setSummary("");
    setEditingIndex(null);
    // Clean up file previews
    uploadedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setUploadedFiles([]);
    onOpenChange(false);
  };

  const updateObligation = (index: number, updates: Partial<ParsedObligation>) => {
    setParsedObligations((prev) =>
      prev.map((o, i) => (i === index ? { ...o, ...updates } : o))
    );
  };

  const removeObligation = (index: number) => {
    setParsedObligations((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAll = (selected: boolean) => {
    setParsedObligations((prev) => prev.map((o) => ({ ...o, selected })));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Carga inteligente de obligaciones
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Pega texto, emails o descripciones y el asistente detectará las obligaciones automáticamente."}
            {step === "preview" && "Revisa y edita las obligaciones detectadas antes de crearlas."}
            {step === "creating" && "Creando obligaciones..."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">Texto</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="files">Archivos</TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <div className="space-y-2">
                  <Label htmlFor="input-text">Texto a analizar</Label>
                  <Textarea
                    id="input-text"
                    placeholder={`Ejemplos:\n• Seguro vence 15/03, habilitación municipal 01/04\n• Renovar matafuegos cada 12 meses\n• Vence el contrato de alquiler el 1 de junio de 2025`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="audio">
                <div className="space-y-2">
                  <Label>Grabar audio</Label>
                  <p className="text-xs text-muted-foreground">
                    Describe tus obligaciones hablando, como cuando envías un audio de WhatsApp.
                  </p>
                  <AudioRecorder onAudioRecorded={handleAudioRecorded} isProcessing={isAnalyzing} />
                  {uploadedFiles.filter(f => f.file.type.startsWith("audio/")).length > 0 && (
                    <div className="space-y-2 pt-2">
                      {uploadedFiles.filter(f => f.file.type.startsWith("audio/")).map((uploadedFile, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                            <Mic className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(uploadedFiles.indexOf(uploadedFile));
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="files">
                <div className="space-y-3">
                  <Label>Subir archivos (PDF, imágenes)</Label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clic para subir o arrastra archivos aquí
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, PNG, JPG, WEBP (máx. 10MB)
                    </p>
                  </div>

                  {/* Uploaded files preview */}
                  {uploadedFiles.filter(f => !f.file.type.startsWith("audio/")).length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.filter(f => !f.file.type.startsWith("audio/")).map((uploadedFile, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                        >
                          {uploadedFile.preview && uploadedFile.file.type.startsWith("image/") ? (
                            <img
                              src={uploadedFile.preview}
                              alt={uploadedFile.file.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : uploadedFile.file.type === "application/pdf" ? (
                            <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                              <FileText className="w-5 h-5 text-destructive" />
                            </div>
                          ) : uploadedFile.file.type.startsWith("audio/") ? (
                            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                              <Mic className="w-5 h-5 text-primary" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <FileIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(uploadedFiles.indexOf(uploadedFile));
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background pt-3">
              <span className="text-xs text-muted-foreground">
                Analizaremos el texto, audios y archivos que cargues.
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!inputText.trim() && uploadedFiles.length === 0)}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {summary && (
              <div className="p-3 bg-primary/10 rounded-lg text-sm">
                <strong>Resumen:</strong> {summary}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {parsedObligations.filter((o) => o.selected).length} de {parsedObligations.length} seleccionadas
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                  Seleccionar todas
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                  Deseleccionar
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {parsedObligations.map((obl, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 border rounded-lg transition-opacity",
                    !obl.selected && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={obl.selected}
                      onCheckedChange={(checked) =>
                        updateObligation(index, { selected: !!checked })
                      }
                      className="mt-1"
                    />

                    <div className="flex-1 space-y-3">
                      {editingIndex === index ? (
                        <ObligationEditor
                          obligation={obl}
                          onUpdate={(updates) => updateObligation(index, updates)}
                          onClose={() => setEditingIndex(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryIcon category={obl.category} />
                              <span className="font-medium">{obl.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingIndex(index)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeObligation(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {format(new Date(obl.due_date), "PPP", { locale: es })}
                            </span>
                            <span>•</span>
                            <span>{categoryLabels[obl.category]}</span>
                            {obl.recurrence !== "none" && (
                              <>
                                <span>•</span>
                                <span>{obl.recurrence === "monthly" ? "Mensual" : "Anual"}</span>
                              </>
                            )}
                          </div>



                          {obl.warnings.length > 0 && (
                            <div className="space-y-1">
                              {obl.warnings.map((warning, wIndex) => (
                                <div
                                  key={wIndex}
                                  className="flex items-center gap-2 text-sm text-amber-600"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {warning}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Confianza:</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  obl.confidence >= 0.8
                                    ? "bg-status-success"
                                    : obl.confidence >= 0.5
                                      ? "bg-status-warning"
                                      : "bg-status-danger"
                                )}
                                style={{ width: `${obl.confidence * 100}%` }}
                              />
                            </div>
                            <span>{Math.round(obl.confidence * 100)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep("input")}>
                Volver
              </Button>
              <Button
                onClick={handleCreateObligations}
                disabled={parsedObligations.filter((o) => o.selected).length === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Crear {parsedObligations.filter((o) => o.selected).length} obligación(es)
              </Button>
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p>Creando obligaciones...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ObligationEditorProps {
  obligation: ParsedObligation;
  onUpdate: (updates: Partial<ParsedObligation>) => void;
  onClose: () => void;
}

function ObligationEditor({ obligation, onUpdate, onClose }: ObligationEditorProps) {
  const [name, setName] = useState(obligation.name);
  const [category, setCategory] = useState(obligation.category);
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(obligation.due_date));
  const [recurrence, setRecurrence] = useState(obligation.recurrence);

  const handleSave = () => {
    onUpdate({
      name,
      category,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : obligation.due_date,
      recurrence,
    });
    onClose();
  };

  return (
    <div className="space-y-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la obligación"
      />

      <div className="grid grid-cols-2 gap-2">
        <Select value={category} onValueChange={(v) => setCategory(v as ObligationCategory)}>
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(categoryLabels) as ObligationCategory[]).map((cat) => (
              <SelectItem key={cat} value={cat}>
                <div className="flex items-center gap-2">
                  <CategoryIcon category={cat} />
                  {categoryLabels[cat]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={recurrence} onValueChange={(v) => setRecurrence(v as "none" | "monthly" | "annual")}>
          <SelectTrigger>
            <SelectValue placeholder="Recurrencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin recurrencia</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="annual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dueDate ? format(dueDate, "PPP", { locale: es }) : "Seleccionar fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
        </PopoverContent>
      </Popover>



      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
