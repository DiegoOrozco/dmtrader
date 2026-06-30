"use client";

import { X, Play, FileText, Calendar, Layout, Award, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Day {
    id: string;
    title: string;
    order: number;
}

interface Week {
    id: string;
    title: string;
    days: Day[];
}

interface CoursePreviewModalProps {
    course: {
        id: string;
        title: string;
        description: string | null;
        thumbnail: string | null;
        weeks?: Week[];
    };
    onClose: () => void;
    student: any;
}

export default function CoursePreviewModal({ course, onClose, student }: CoursePreviewModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Fully prevent scroll
        document.body.style.overflow = "hidden";
        document.body.style.height = "100vh";
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        
        return () => {
            document.body.style.overflow = "auto";
            document.body.style.height = "auto";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [onClose]);

    if (!course || !mounted) return null;

    const modalContent = (
        <div 
            className="fixed inset-0 flex items-center justify-center p-4 md:p-8"
            style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* Backdrop with elegant premium blur */}
            <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Main Modal Container */}
            <div 
                className="relative w-full max-w-[1150px] h-full max-h-[90vh] bg-slate-900 dark:bg-slate-950 border border-slate-200/20 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row animate-in zoom-in-95 duration-300"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
                {/* Close Button UI */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[100] w-10 h-10 flex items-center justify-center bg-slate-850 dark:bg-slate-900 hover:bg-sky-500 border border-slate-700/50 rounded-full transition-all group shadow-md"
                >
                    <X size={18} className="text-white group-hover:text-white" />
                </button>

                {/* LEFT SIDE: Identity & Features */}
                <div className="w-full lg:w-[42%] flex flex-col border-r border-slate-200/10 dark:border-slate-800/80 h-full bg-slate-950 overflow-y-auto">
                    {/* Course Visual */}
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:h-[300px] overflow-hidden group">
                        {course.thumbnail ? (
                            <Image 
                                src={course.thumbnail} 
                                alt={course.title} 
                                fill 
                                className="object-cover opacity-80"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <span className="text-[100px] font-extrabold text-white/5 select-none">{course.title.charAt(0)}</span>
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />

                        {/* Floating Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
                                <Play size={24} className="ml-1 text-white fill-white" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 sm:p-10 space-y-8 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-md">
                                <Star size={11} className="text-sky-400 fill-sky-400" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400">Trading Academy Premium</span>
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
                                {course.title}
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-400">
                                {course.description || "Iníciate en los mercados financieros globales con Dayan Moraga. Clases estructuradas de alto impacto."}
                            </p>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-200/10 dark:border-slate-800/80">
                            {[
                                { icon: Layout, text: "Acceso ilimitado" },
                                { icon: Calendar, text: "Flexibilidad horaria" },
                                { icon: Award, text: "Especialización" },
                                { icon: Play, text: "Material Digital" }
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <f.icon size={15} className="text-sky-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Link
                                href={student ? `/course/${course.id}/unlock` : `/register?courseId=${course.id}`}
                                className="raw-btn-primary w-full py-4 text-xs font-bold text-center justify-center rounded-xl transition-all"
                            >
                                {student ? "ADQUIRIR ACCESO AL CURSO →" : "REGISTRARME E INSCRIBIRME →"}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Syllabus/Timeline Timeline */}
                <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
                    <div className="p-8 sm:p-10 border-b border-slate-200/10 dark:border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                                <FileText size={20} className="text-sky-400" />
                            </div>
                            <div>
                                <span className="text-[9px] font-bold tracking-widest text-sky-400 uppercase mb-0.5 block">Syllabus Académico</span>
                                <h3 className="text-base font-bold tracking-tight text-white uppercase">Estructura Curricular</h3>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar">
                        <div className="space-y-12">
                            {course.weeks && course.weeks.length > 0 ? (
                                course.weeks.map((week, idx) => (
                                    <div key={week.id} className="relative pl-8">
                                        {/* Vertical Timeline Connection Line */}
                                        <div className="absolute left-3.5 top-8 bottom-[-32px] w-0.5 bg-gradient-to-b from-sky-500/30 to-transparent last:hidden" />
                                        
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-xs font-bold text-sky-400 border border-sky-500/20 shadow-md">
                                                {idx + 1}
                                            </div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                                {week.title}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 pl-2">
                                            {week.days.map((day) => (
                                                <div 
                                                    key={day.id} 
                                                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-950/20 hover:bg-slate-950/55 hover:border-sky-500/20 transition-all cursor-default"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-800">
                                                        {day.order}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-slate-300">
                                                            {day.title}
                                                        </p>
                                                        <span className="text-[8px] uppercase tracking-wider text-sky-400/80 font-bold block mt-0.5">Módulo de Especialización</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center opacity-30 text-center">
                                    <Layout size={60} strokeWidth={1} className="mb-4 text-slate-400" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Programa sin módulos publicados</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
