"use client";

import { X, CheckCircle2, AlertCircle, MessageSquare, Loader2, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { updateDetailedManualGrade } from "@/actions/admin-grades";

interface ManualGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    dayId: string;
    dayTitle: string;
    initialFeedback: any;
    initialGrade: number | null | undefined;
}

export default function ManualGradingModal({
    isOpen,
    onClose,
    studentId,
    studentName,
    dayId,
    dayTitle,
    initialFeedback,
    initialGrade
}: ManualGradingModalProps) {
    const [mounted, setMounted] = useState(false);
    const [grade, setGrade] = useState(initialGrade !== null && initialGrade !== undefined ? String(initialGrade) : "");
    const [comment, setComment] = useState("");
    const [positives, setPositives] = useState<string[]>([]);
    const [improvements, setImprovements] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const isObject = typeof initialFeedback === 'object' && initialFeedback !== null;
            setGrade(initialGrade !== null && initialGrade !== undefined ? String(initialGrade) : "");
            
            const initialComment = isObject ? (initialFeedback.comentario || initialFeedback.text || "") : (typeof initialFeedback === 'string' ? initialFeedback : "");
            setComment(initialComment);

            let initialPositives: string[] = [];
            if (isObject && initialFeedback.feedback_positivo) {
                if (Array.isArray(initialFeedback.feedback_positivo)) initialPositives = initialFeedback.feedback_positivo;
                else if (typeof initialFeedback.feedback_positivo === 'string') initialPositives = [initialFeedback.feedback_positivo];
            }
            setPositives(initialPositives.length > 0 ? initialPositives : [""]);

            let initialImprovements: string[] = [];
            if (isObject && initialFeedback.mejoras) {
                if (Array.isArray(initialFeedback.mejoras)) initialImprovements = initialFeedback.mejoras;
                else if (typeof initialFeedback.mejoras === 'string') initialImprovements = [initialFeedback.mejoras];
            }
            setImprovements(initialImprovements.length > 0 ? initialImprovements : [""]);
        }
    }, [isOpen, initialFeedback, initialGrade]);

    const handleSave = () => {
        const numGrade = Number(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
            alert("La nota debe estar entre 0 y 100");
            return;
        }

        startTransition(async () => {
            const feedback = {
                text: comment,
                feedback_positivo: positives.filter(p => p.trim() !== ""),
                mejoras: improvements.filter(p => p.trim() !== "")
            };

            const res = await updateDetailedManualGrade(studentId, dayId, numGrade, feedback);
            if (res.success) {
                onClose();
            } else {
                alert("Error al guardar: " + res.error);
            }
        });
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative w-full max-w-2xl bg-[#0a0e1a] rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
                    <div>
                        <h3 className="text-md font-black text-white uppercase tracking-wider">Revisión Manual: {studentName}</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{dayTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-xl border border-slate-800"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[75vh] overflow-y-auto space-y-10 custom-scrollbar">
                    {/* Grade Input Section */}
                    <div className="relative group/grade">
                        <div className="relative flex flex-col md:flex-row items-center gap-8 p-6 bg-white/[0.01] rounded-2xl border border-slate-800 shadow-2xl">
                            <div className="flex-1 w-full">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Nota Definida</h4>
                                <input
                                    type="number"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full bg-[#05070f] border border-slate-800 rounded-xl px-4 py-4 text-xl font-black text-white focus:outline-none focus:border-sky-500 transition-all placeholder:text-white/10"
                                    placeholder="85"
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-slate-850 min-w-[140px]">
                                <div className={`text-4xl font-black ${Number(grade) >= 70 ? 'text-emerald-400' : Number(grade) > 0 ? 'text-rose-400' : 'text-slate-600'} transition-colors duration-500`}>
                                    {grade || "0"}
                                </div>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">/100 Ptos</div>
                            </div>
                        </div>
                    </div>

                    {/* General Comment */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                                <MessageSquare size={16} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/90">Resumen de la Calificación</h4>
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full h-32 bg-[#05070f] rounded-2xl border border-slate-800 p-6 text-slate-300 text-xs leading-relaxed italic focus:outline-none focus:border-sky-500 transition-all font-semibold"
                            placeholder="Describe el desempeño general del estudiante..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800">
                        {/* Positives */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <CheckCircle2 size={16} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Puntos Fuertes</h4>
                            </div>
                            <div className="space-y-4">
                                {positives.map((p, i) => (
                                    <div key={i} className="flex gap-2 group/field">
                                        <textarea
                                            value={p}
                                            onChange={(e) => {
                                                const newP = [...positives];
                                                newP[i] = e.target.value;
                                                setPositives(newP);
                                            }}
                                            rows={2}
                                            className="flex-1 bg-[#05070f] rounded-xl border border-slate-800 p-4 text-emerald-100/90 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all resize-none"
                                            placeholder="Logró implementar..."
                                        />
                                        {positives.length > 1 && (
                                            <button 
                                                onClick={() => setPositives(positives.filter((_, idx) => idx !== i))}
                                                className="p-2 text-rose-500/30 hover:text-rose-500 transition-colors opacity-0 group-hover/field:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => setPositives([...positives, ""])}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest transition-all w-fit"
                                >
                                    + Añadir Fortaleza
                                </button>
                            </div>
                        </div>

                        {/* Improvements */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-amber-400">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <AlertCircle size={16} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Para Mejorar</h4>
                            </div>
                            <div className="space-y-4">
                                {improvements.map((p, i) => (
                                    <div key={i} className="flex gap-2 group/field">
                                        <textarea
                                            value={p}
                                            onChange={(e) => {
                                                const newI = [...improvements];
                                                newI[i] = e.target.value;
                                                setImprovements(newI);
                                            }}
                                            rows={2}
                                            className="flex-1 bg-[#05070f] rounded-xl border border-slate-800 p-4 text-amber-100/90 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-all resize-none"
                                            placeholder="Faltó validar..."
                                        />
                                        {improvements.length > 1 && (
                                            <button 
                                                onClick={() => setImprovements(improvements.filter((_, idx) => idx !== i))}
                                                className="p-2 text-rose-500/30 hover:text-rose-500 transition-colors opacity-0 group-hover/field:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => setImprovements([...improvements, ""])}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest transition-all w-fit"
                                >
                                    + Añadir Mejora
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-black/20 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-[280px]">
                        Revisa los campos antes de confirmar. Esta acción actualizará la nota y enviará el feedback al estudiante.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-xl font-black text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="flex items-center gap-3 px-10 py-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                        >
                            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Confirmar Nota
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
