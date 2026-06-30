"use client";

import { useState, useTransition, useEffect } from "react";
import { X, UploadCloud, FileText, Loader2, Sparkles, Download, FileDown, FileType } from "lucide-react";
import { createPortal } from "react-dom";
import { customAIGradeAction } from "@/actions/admin-grading";
import { generateDocx, generatePdf, GradingResult } from "@/lib/doc-generators";

interface AIGradingUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName?: string;
    studentId?: string;
    dayId?: string;
}

export default function AIGradingUploadModal({ isOpen, onClose, studentName, studentId, dayId }: AIGradingUploadModalProps) {
    const [mounted, setMounted] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [severity, setSeverity] = useState("1");
    const [prompt, setPrompt] = useState("");
    const [isPending, startTransition] = useTransition();
    const [lastResult, setLastResult] = useState<GradingResult | null>(null);
    const [inputStudentName, setInputStudentName] = useState(studentName || "");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setInputStudentName(studentName || "");
            setLastResult(null);
            setFile(null);
        }
    }, [isOpen, studentName]);

    if (!isOpen || !mounted) return null;

    const handleUpload = () => {
        if (!file) return alert("Selecciona un archivo primero.");
        
        startTransition(async () => {
            const formData = new FormData();
            formData.append("file", file!);
            formData.append("severity", severity);
            formData.append("prompt", prompt);
            if (studentId) formData.append("studentId", studentId);
            if (dayId) formData.append("dayId", dayId);

            const res = await customAIGradeAction(formData);
            if (res.success && res.result) {
                setLastResult(res.result as GradingResult);
                alert("Análisis completado de forma exitosa.");
            } else {
                alert("Error: " + res.error);
            }
        });
    };

    const handleDocx = async () => {
        if (lastResult) {
            await generateDocx(lastResult, inputStudentName);
        }
    };

    const handlePdf = () => {
        if (lastResult) {
            generatePdf(lastResult, inputStudentName);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative w-full max-w-lg bg-[#0a0e1a] rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="text-sky-400" size={16} />
                            Evaluación IA Personalizada
                        </h3>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-wider mt-1">Genera retroalimentación automática.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre del Estudiante</label>
                        <input
                            type="text"
                            value={inputStudentName}
                            onChange={(e) => setInputStudentName(e.target.value)}
                            placeholder="Nombre completo"
                            className="w-full bg-[#05070f] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 transition-all font-semibold"
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Archivo de Entrega</label>
                        <div
                            className="relative group p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-sky-500/50 bg-black/25 text-center transition-all cursor-pointer"
                        >
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-2 text-sky-400">
                                    <FileText size={24} />
                                    <p className="text-xs font-black truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Haga clic para cambiar</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-600 group-hover:text-sky-400 transition-colors">
                                    <UploadCloud size={24} />
                                    <p className="text-xs font-black uppercase tracking-wider">Selecciona el archivo</p>
                                    <p className="text-[9px] text-slate-700 uppercase tracking-widest font-black">O arrastra y suelta aquí</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Instrucciones Especiales</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Añade el enunciado o detalles específicos a revisar..."
                            className="w-full bg-[#05070f] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 transition-all min-h-[100px] resize-y font-semibold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Exigencia</label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="w-full bg-[#05070f] border border-slate-800 rounded-xl p-3 text-slate-400 text-xs focus:outline-none focus:border-sky-500 transition-all cursor-pointer font-black uppercase tracking-wider"
                            >
                                <option value="0">Nv 0: Consejos</option>
                                <option value="1">Nv 1: Sintaxis</option>
                                <option value="2">Nv 2: Funcional</option>
                                <option value="3">Nv 3: Académico</option>
                                <option value="4">Nv 4: Profesional</option>
                                <option value="5">Nv 5: Élite</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Acción</label>
                            <button
                                onClick={handleUpload}
                                disabled={isPending || !file}
                                className="flex-grow flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] uppercase tracking-wider transition-all"
                            >
                                {isPending ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                {isPending ? "Analizando..." : "Analizar con IA"}
                            </button>
                        </div>
                    </div>

                    {lastResult && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in zoom-in-95">
                            <p className="text-center text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">¡Análisis Listo! Descargar en:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleDocx}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[9px] uppercase tracking-widest transition-all"
                                >
                                    <FileType size={14} /> Word (.docx)
                                </button>
                                <button
                                    onClick={handlePdf}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest transition-all"
                                >
                                    <FileDown size={14} /> PDF (.pdf)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-black/20 border-t border-slate-800 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white/5 border border-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-all text-[10px] uppercase tracking-wider">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
