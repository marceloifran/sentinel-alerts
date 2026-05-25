import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export function SignaturePad({ onSave, onCancel, title = "Firma manuscrita del operario" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Set canvas resolution/size on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas layout size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineWidth = 3.5; // Slightly thicker brush stroke for signature readability
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      // Brush stroke color must always be black
      ctx.strokeStyle = "#000000";
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      // Touch Event
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      // Mouse Event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    // Convert canvas content to base64 image data URL (will be transparent png)
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col gap-5 p-6 w-full bg-white dark:bg-[#0c101d] transition-colors duration-200">
      <div className="text-center">
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Firme con el dedo o puntero dentro del recuadro
        </p>
      </div>

      <div className="relative border border-slate-250 bg-white rounded-xl overflow-hidden h-44 transition-all duration-200 focus-within:border-slate-400">
        {/* Guide elements behind the transparent canvas */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-3 select-none">
          <div className="w-[85%] mx-auto border-b border-dashed border-slate-200 h-0 mb-4" />
          <div className="text-[9px] text-slate-450 text-center font-mono tracking-widest uppercase">
            Área de firma
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="relative w-full h-full cursor-crosshair touch-none z-10"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="flex-1 gap-1.5 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs h-10 rounded-xl font-semibold transition-all duration-150"
        >
          <RotateCcw size={14} className="text-slate-400" /> Limpiar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!hasDrawn}
          className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:opacity-50 text-white text-xs h-10 rounded-xl font-semibold border-0 transition-all duration-150 shadow-sm"
        >
          <Check size={14} /> Guardar Firma
        </Button>
      </div>
      
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-slate-550 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-350 text-center font-medium mt-1 transition-colors duration-150"
      >
        Cancelar
      </button>
    </div>
  );
}
