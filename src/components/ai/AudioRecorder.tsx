import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
    onAudioRecorded: (file: File) => void;
    isProcessing?: boolean;
}

export function AudioRecorder({ onAudioRecorded, isProcessing }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setAudioBlob(blob);

                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setAudioUrl(null);
            setAudioBlob(null);

            timerRef.current = window.setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleConfirm = () => {
        if (audioBlob) {
            const file = new File([audioBlob], `audio-recording-${Date.now()}.webm`, {
                type: "audio/webm",
            });
            onAudioRecorded(file);
            discardRecording();
        }
    };

    const discardRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-muted/30">
            {!isRecording && !audioUrl && (
                <div className="flex flex-col items-center gap-2">
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-16 w-16 rounded-full border-2 border-primary text-primary hover:bg-primary/10 transition-all duration-300 transform hover:scale-105"
                        onClick={startRecording}
                    >
                        <Mic className="h-8 w-8" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        Graba un audio para cargar obligaciones
                    </span>
                </div>
            )}

            {isRecording && (
                <div className="flex flex-col items-center gap-3 w-full animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xl font-mono font-bold">{formatTime(recordingTime)}</span>
                    </div>
                    <Button
                        size="lg"
                        variant="destructive"
                        className="h-16 w-16 rounded-full animate-pulse shadow-lg"
                        onClick={stopRecording}
                    >
                        <Square className="h-6 w-6" />
                    </Button>
                    <span className="text-sm font-medium text-destructive">Grabando... toca para detener</span>
                </div>
            )}

            {audioUrl && !isRecording && (
                <div className="flex flex-col items-center gap-4 w-full animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3 w-full max-w-xs">
                        <audio src={audioUrl} controls className="w-full h-8" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-full text-destructive hover:bg-destructive/10"
                            onClick={discardRecording}
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="default"
                            size="lg"
                            className="rounded-full px-8 bg-green-600 hover:bg-green-700 text-white shadow-md transform hover:scale-105 transition-all"
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="h-5 w-5 mr-2" />
                                    Usar este audio
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
