"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    isLoading = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on escape key
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

    const variantStyles = {
        danger: "bg-red-500 hover:bg-red-600 shadow-[0_4px_15px_rgba(239,68,68,0.2)] text-white",
        warning: "bg-amber-500 hover:bg-amber-600 shadow-[0_4px_15px_rgba(245,158,11,0.2)] text-white",
        info: "bg-sky-500 hover:bg-sky-600 shadow-[0_4px_15px_rgba(14,165,233,0.2)] text-white"
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Container */}
                <div className="p-6 md:p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 transition-colors p-1"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-3.5 rounded-2xl ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : variant === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'}`}>
                            <AlertTriangle size={32} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${variantStyles[variant]}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Procesando...
                            </>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
