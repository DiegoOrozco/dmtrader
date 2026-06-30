"use client";

import { X, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    dayTitle: string;
    feedback: any;
    grade: number | null | undefined;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    studentName,
    dayTitle,
    feedback,
    grade
}: FeedbackModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const isObject = typeof feedback === 'object' && feedback !== null;
    
    // Normalizar comentario general
    const comment = isObject ? (feedback.comentario || feedback.text || "") : (typeof feedback === 'string' ? feedback : "");

    // Normalizar puntos positivos
    let positives: string[] = [];
    if (isObject && feedback.feedback_positivo) {
        if (Array.isArray(feedback.feedback_positivo)) positives = feedback.feedback_positivo;
        else if (typeof feedback.feedback_positivo === 'string') positives = [feedback.feedback_positivo];
    }

    // Normalizar mejoras
    let improvements: string[] = [];
    if (isObject && feedback.mejoras) {
        if (Array.isArray(feedback.mejoras)) improvements = feedback.mejoras;
        else if (typeof feedback.mejoras === 'string') improvements = [feedback.mejoras];
    }

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-2xl bg-[#0a0e1a] rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-black/20">
                    <div>
                        <h3 className="text-md font-black text-white uppercase tracking-wider">{studentName}</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{dayTitle}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right bg-[#05070f] border border-slate-800 px-4 py-2 rounded-xl">
                             <div className={`text-xl font-black ${(grade ?? 0) >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {grade !== null && grade !== undefined ? `${grade}/100` : "-/100"}
                            </div>
                            <div className="text-[8px] text-slate-500 font-black uppercase tracking-wider mt-0.5">Nota Final</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-xl border border-slate-800"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 custom-scrollbar">
                    {comment && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sky-400">
                                <MessageSquare size={16} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Comentario General</h4>
                            </div>
                            <div className="p-5 bg-sky-500/[0.02] rounded-2xl border border-slate-800 text-slate-300 text-xs leading-relaxed italic font-semibold">
                                "{comment}"
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Positives */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 size={16} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Aspectos Positivos</h4>
                            </div>
                            <div className="space-y-3">
                                {positives.length > 0 ? positives.map((p: string, i: number) => (
                                    <div key={i} className="flex gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-100/90 text-xs font-semibold">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        {p}
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-wider italic">No se registraron aspectos positivos.</p>
                                )}
                            </div>
                        </div>

                        {/* Improvements */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertCircle size={16} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Oportunidades de Mejora</h4>
                            </div>
                            <div className="space-y-3">
                                {improvements.length > 0 ? improvements.map((p: string, i: number) => (
                                    <div key={i} className="flex gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-amber-100/90 text-xs font-semibold">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                        {p}
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-wider italic">No se detectaron mejoras.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isObject && feedback.resumen_codigo && (
                        <div className="space-y-2 pt-4 border-t border-slate-800">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Firma Técnica del Código</h4>
                            <p className="text-[10px] text-slate-400 font-mono bg-[#05070f] p-3 rounded-lg border border-slate-850 uppercase tracking-tighter">
                                {feedback.resumen_codigo}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/20 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all border border-slate-800 active:scale-95"
                    >
                        Cerrar Vista
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
