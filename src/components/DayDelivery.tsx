"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download, Code, Clock, Lock, Play } from "lucide-react";
import StudentCodeEditor from "./StudentCodeEditor";
import { submitCodingExercise, startTestSession, getTestSession } from "@/actions/submissions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DayDeliveryProps {
    day: any;
    studentId: string;
    initialSubmission?: any;
    userRole?: string;
    enableCopyPaste?: boolean;
}

export default function DayDelivery({ day, studentId, initialSubmission, userRole, enableCopyPaste }: DayDeliveryProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [submission, setSubmission] = useState<any>(initialSubmission);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [testStartedAt, setTestStartedAt] = useState<Date | null>(null);
    const [isStartingTest, setIsStartingTest] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    const [repoUrl, setRepoUrl] = useState(submission?.repoUrl || "");

    useEffect(() => {
        setSubmission(initialSubmission);
        setRepoUrl(initialSubmission?.repoUrl || "");
        setFile(null);
        setError(null);
        setTestStartedAt(null);
    }, [day.id, initialSubmission]);

    useEffect(() => {
        if (day.timeLimit && isMounted && !submission) {
            getTestSession(day.id).then(res => {
                if (res.success && res.startedAt) {
                    setTestStartedAt(new Date(res.startedAt));
                }
            });
        }
    }, [day.id, day.timeLimit, isMounted, submission]);

    const handleStartTest = async () => {
        setIsStartingTest(true);
        try {
            const res = await startTestSession(day.id);
            if (res.success && res.startedAt) {
                setTestStartedAt(new Date(res.startedAt));
            } else {
                setError(res.error || "Error al iniciar la prueba");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setIsStartingTest(false);
        }
    };

    const isDeliveryDay = !!day.isDeliveryDay;

    // These are date-dependent — only compute after mounting to avoid SSR/client hydration mismatch
    let isLate = false;
    let isNotAvailableYet = false;
    if (isMounted) {
        if (day.availableFrom && new Date() < new Date(day.availableFrom) && userRole !== "ADMIN") {
            isNotAvailableYet = true;
        }
        if (day.dueDate) {
            let effectiveDate = new Date(day.dueDate);
            if (day.deadlineExceptions && day.deadlineExceptions.length > 0) {
                effectiveDate = new Date(day.deadlineExceptions[0].newDueDate);
            }
            if (new Date() > effectiveDate && userRole !== "ADMIN") {
                isLate = true;
            }
        }
    }

    // Helper: format a UTC date string in the browser's local timezone
    const formatLocalDate = (utcString: string) => {
        return new Date(utcString).toLocaleString("es-CR", {
            weekday: "long",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    if (!isDeliveryDay) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleSubmit = async () => {
        if (!file && !repoUrl) {
            setError("Debes subir un archivo o proporcionar un enlace al repositorio.");
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        if (file) formData.append("file", file);
        formData.append("dayId", day.id);
        if (repoUrl) formData.append("repoUrl", repoUrl);

        try {
            const response = await fetch("/api/grade-submission", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSubmission(data);
            } else {
                setError(data.error || "Error al subir la tarea");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 mt-8 p-6 glass-effect rounded-2xl border border-[var(--color-glass-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <FileText size={20} className="text-[var(--color-primary)]" />
                        Entrega solución
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {day.isCodingExercise
                            ? "Escribe tu solución en el editor, prueba el código y envía cuando estés listo."
                            : "Sube tu solución para ser calificada por el Profesor Virtual."}
                    </p>
                </div>

                {!day.isCodingExercise && !isNotAvailableYet && (
                    <a
                        href={day.assignmentUrl ? `${day.assignmentUrl}${day.assignmentUrl.includes('vercel-storage.com') ? '?download=1' : ''}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all text-sm font-semibold group ${!day.assignmentUrl ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Download size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        Descargar Enunciado
                    </a>
                )}
            </div>

            {/* Deadline and availability info bar */}
            <div className="flex flex-wrap items-center gap-3">
                {day.dueDate && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${isLate
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                        <Clock size={12} />
                        <span>
                            {isLate ? "Entrega cerrada" : "Entrega hasta"}: {isMounted ? formatLocalDate(
                                day.deadlineExceptions?.[0]?.newDueDate || day.dueDate
                            ) : "..."}
                        </span>
                    </div>
                )}
                {isNotAvailableYet && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-500/10 border-slate-500/30 text-slate-400">
                        <Lock size={12} />
                        <span>Disponible desde: {isMounted ? formatLocalDate(day.availableFrom) : "..."}</span>
                    </div>
                )}
                {day.timeLimit > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-blue-500/10 border-blue-500/30 text-blue-400">
                        <Clock size={12} />
                        <span>Tiempo Límite: {day.timeLimit} minutos</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {day.exerciseDescription && !isNotAvailableYet && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 px-1">
                            <FileText size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enunciado (Instrucciones)</span>
                        </div>
                        <div 
                            className="p-6 bg-[#14181E] border border-slate-700/50 rounded-2xl mb-4 text-[14px] text-slate-300 leading-relaxed font-medium max-h-[300px] overflow-y-auto custom-scrollbar [&>p]:mb-3 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-emerald-400 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:mb-3 [&>code]:bg-slate-800 [&>code]:text-emerald-300 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-slate-900 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:mb-4 [&>pre>code]:bg-transparent [&>pre>code]:text-blue-300 [&>pre>code]:p-0 [&>strong]:text-white [&>a]:text-blue-400 [&>a]:underline select-none"
                            onContextMenu={(e) => e.preventDefault()}
                            onCopy={(e) => {
                                e.preventDefault();
                                alert("El copiado está deshabilitado para el enunciado.");
                            }}
                            onCut={(e) => e.preventDefault()}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {day.exerciseDescription}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {day.isCodingExercise && !submission ? (
                    day.timeLimit > 0 && !testStartedAt ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                                <Clock size={32} className="text-blue-400" />
                            </div>
                            <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Prueba con Tiempo Limitado</h4>
                            <p className="text-slate-400 text-sm max-w-md mb-8">
                                Esta actividad tiene un límite de <span className="text-blue-400 font-bold">{day.timeLimit} minutos</span>. Una vez que inicies, el contador no se detendrá y tu código se enviará automáticamente al finalizar el tiempo.
                            </p>
                            <button
                                onClick={handleStartTest}
                                disabled={isStartingTest || isLate || !!isNotAvailableYet}
                                className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-95 disabled:opacity-50"
                            >
                                {isStartingTest ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                                INICIAR PRUEBA AHORA
                            </button>
                            {isLate && <p className="text-rose-400 text-xs font-bold mt-4 uppercase">La fecha límite ha pasado</p>}
                        </div>
                    ) : (
                        <StudentCodeEditor
                            dayId={day.id}
                            userId={studentId}
                            initialCode={day.codeTemplate || ""}
                            testCases={day.testCases || []}
                            similarityThreshold={day.similarityThreshold || 0.9}
                            enablePlagiarism={day.enablePlagiarism}
                            enableCopyPaste={enableCopyPaste}
                            isLate={isLate}
                            timeLimit={day.timeLimit}
                            testStartedAt={testStartedAt}
                            onSuccess={async (grade) => {
                                window.location.reload();
                            }}
                        />
                    )
                ) : !submission ? (
                    <div className="flex flex-col gap-6">
                        {/* Repository URL Input - HIGH PROMINENCE VERSION */}
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <Code size={18} className="text-blue-400" />
                                    </div>
                                    <label className="text-sm font-black text-white uppercase tracking-tighter">
                                        Link del Repositorio Público
                                    </label>
                                </div>
                                {day.assignmentType === "PROJECT" && (
                                    <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded uppercase">Obligatorio para Proyecto</span>
                                )}
                            </div>
                            
                            <div className="relative">
                                <input
                                    type="url"
                                    placeholder="https://github.com/tu-usuario/nombre-del-repo"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    onPaste={(e) => e.stopPropagation()}
                                    disabled={isUploading || isLate || !!isNotAvailableYet}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">
                                <span className="bg-[#0A0D10] px-4">Opcional: Adjuntar Archivo</span>
                            </div>
                        </div>

                        <div
                            className={`relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all ${isDragging
                                ? "border-sky-500 bg-sky-500/10 scale-[1.02]"
                                : (isLate || isNotAvailableYet)
                                    ? "border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed pointer-events-none"
                                    : "border-slate-700 hover:border-slate-500 bg-black/20 cursor-pointer"
                                }`}
                            onDrop={(isLate || isNotAvailableYet) ? undefined : handleDrop}
                            onDragOver={(isLate || isNotAvailableYet) ? undefined : handleDragOver}
                            onDragLeave={(isLate || isNotAvailableYet) ? undefined : handleDragLeave}
                        >
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                accept=".py,.sql,.pdf,.zip"
                                onChange={handleFileChange}
                                disabled={isLate || isNotAvailableYet}
                            />
                            {file ? (
                                <>
                                    <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-4 text-sky-400 group-hover:scale-110 transition-transform">
                                        <FileText size={32} />
                                    </div>
                                    <p className="text-white font-bold mb-1">{file.name}</p>
                                    <p className="text-slate-400 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB • Haz clic para cambiar</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500 group-hover:text-sky-400 group-hover:bg-sky-500/10 transition-all group-hover:scale-110">
                                        <Upload size={32} />
                                    </div>
                                    <p className="text-slate-300 font-medium mb-1">
                                        {(isLate || isNotAvailableYet) ? "Entrega no disponible" : "Seleccionar archivo"}
                                    </p>
                                    <p className="text-slate-500 text-sm">Arrastra tu archivo aquí o haz clic</p>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isUploading || isLate || !!isNotAvailableYet || (!file && !repoUrl)}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${isLate || isNotAvailableYet
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-[var(--color-primary, #0066FF)] hover:brightness-110 text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]"
                                }`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Enviando solución...
                                </>
                            ) : isNotAvailableYet ? (
                                <>
                                    <Lock size={18} />
                                    Aún no disponible
                                </>
                            ) : isLate ? (
                                <>
                                    <AlertCircle size={18} />
                                    Entrega Expirada
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Confirmar Entrega Final
                                </>
                            )}
                        </button>
                    </div>
                ) : submission.status === "PENDING" ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center animate-in fade-in duration-500">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-emerald-400 mb-2">Entregado Exitosamente</h4>
                        <p className="text-slate-400 text-sm max-w-md mx-auto">
                            Tu entrega ha sido guardada en el sistema de manera segura. Recibirás un correo electrónico cuando la calificación esté lista.
                        </p>
                    </div>
                ) : (
                    <div className={`border rounded-xl p-6 ${submission.status === "FAILED" ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${submission.status === "FAILED" ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"}`}>
                                    {submission.status === "FAILED" ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${submission.status === "FAILED" ? "text-red-400" : "text-[var(--text-primary)]"}`}>
                                        {submission.status === "FAILED" ? "Error en la Calificación" : "¡Tarea Calificada!"}
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        {submission.status === "FAILED"
                                            ? "Hubo un problema procesando tu entrega. Intenta nuevamente o usa otro formato."
                                            : `Entregado el ${isMounted ? new Date(submission.createdAt).toLocaleDateString() : "..."}`}
                                    </p>
                                </div>
                            </div>
                            {submission.status === "GRADED" && (
                                <div className="text-center">
                                    <span className="text-2xl font-black text-[var(--text-primary)]">{submission.grade || "0"}</span>
                                    <span className="text-xs text-[var(--text-secondary)] block uppercase font-bold tracking-tighter">Nota Final</span>
                                </div>
                            )}
                        </div>

                        {submission.status === "GRADED" ? (
                            <div className="space-y-4 mt-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Comentario del Profesor</p>
                                    <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                                        "{day.isCodingExercise ? submission.feedback?.text : submission.feedback?.comentario || "Sin comentarios."}"
                                    </p>
                                </div>

                                {!day.isCodingExercise && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-4 rounded-lg">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Puntos Positivos</p>
                                            <ul className="text-xs text-slate-400 space-y-1">
                                                {submission.feedback?.feedback_positivo?.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-emerald-500 mt-0.5">•</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-lg">
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Oportunidades de Mejora</p>
                                            <ul className="text-xs text-slate-400 space-y-1">
                                                {submission.feedback?.mejoras?.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-amber-500 mt-0.5">•</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => setSubmission(null)}
                                    className="text-xs text-slate-400 hover:text-white underline transition-colors"
                                >
                                    Intentar subir de nuevo
                                </button>
                            </div>
                        )}

                        {!isLate && (
                            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-amber-400/70">
                                    <AlertCircle size={14} />
                                    <p className="text-[10px] font-medium uppercase tracking-wider">
                                        Puedes eliminar o modificar tu entrega antes de la fecha límite.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={async () => {
                                            if (confirm("¿Estás seguro de que deseas ELIMINAR permanentemente tu entrega? Esta acción borrará el archivo, el link y tu calificación actual. No se puede deshacer.")) {
                                                setIsUploading(true);
                                                try {
                                                    const { deleteSubmission } = await import("@/actions/submissions");
                                                    const res = await deleteSubmission(day.id);
                                                    if (res.success) {
                                                        setSubmission(null);
                                                        setRepoUrl("");
                                                        setFile(null);
                                                    } else {
                                                        alert(res.error || "Error al eliminar la entrega");
                                                    }
                                                } catch (err) {
                                                    alert("Error de conexión");
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }
                                        }}
                                        disabled={isUploading}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all text-xs font-bold group disabled:opacity-50"
                                    >
                                        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                                        Eliminar Entrega definitivamente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {day.isCodingExercise && submission && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <Code size={16} className="text-blue-400" />
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código Entregado (Solo Lectura)</h3>
                        </div>
                        <StudentCodeEditor
                            dayId={day.id}
                            userId={studentId}
                            initialCode={submission.content || day.codeTemplate || ""}
                            testCases={[]}
                            similarityThreshold={0}
                            enablePlagiarism={false}
                            enableCopyPaste={true}
                            isLate={isLate}
                            isReadOnly={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
