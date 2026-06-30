"use client";

import { useState } from "react";
import { ShieldAlert, Users, Code, ArrowRight, AlertTriangle, CheckCircle, Download, Gavel, Loader2, Info, Sparkles, Cpu } from "lucide-react";
import Link from "next/link";
import { updateManualGrade } from "@/actions/admin-grades";
import { useRouter } from "next/navigation";
import { getAiPlagiarismAnalysis } from "@/actions/plagiarism";

export default function PlagiarismReportClient({
    dayId,
    courseId,
    dayTitle,
    initialReports = [],
    initialError = null
}: {
    dayId: string,
    courseId: string,
    dayTitle: string,
    initialReports?: any[],
    initialError?: string | null
}) {
    const [reports, setReports] = useState<any[]>(initialReports);
    const [error] = useState<string | null>(initialError);
    const [isLoading] = useState(false);
    const [isGrading, setIsGrading] = useState<string | null>(null);
    const [analyzingFor, setAnalyzingFor] = useState<string | null>(null);
    const router = useRouter();

    const handleDownload = (name: string, code: string) => {
        const blob = new Blob([code], { type: "text/x-python" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Format: NombreEstudiante_entrega.py (removing spaces)
        const formattedName = name.replace(/\s+/g, "");
        a.download = `${formattedName}_entrega.py`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleQuickGrade = async (userId: string, studentName: string) => {
        if (!confirm(`¿Estás seguro de asignar 0 a ${studentName}? Esta acción notificará al estudiante.`)) return;
        
        setIsGrading(userId);
        try {
            const res = await updateManualGrade(userId, dayId, 0);
            if (res.success) {
                alert(`Calificación 0 asignada con éxito a ${studentName}.`);
                router.refresh();
            } else {
                alert("Error: " + res.error);
            }
        } catch (err) {
            alert("Error de conexión.");
        } finally {
            setIsGrading(null);
        }
    };

    const handleAiAnalysis = async (idx: number, report: any) => {
        setAnalyzingFor(`${report.studentAId}-${report.studentBId}`);
        try {
            const res = await getAiPlagiarismAnalysis(report.codeA, report.codeB, report.studentA, report.studentB);
            if (res.success) {
                const newReports = [...reports];
                newReports[idx] = { ...newReports[idx], aiAnalysis: res.analysis };
                setReports(newReports);
            } else {
                alert("Error de IA: " + res.error);
            }
        } catch(error) {
            alert("Error generando análisis.");
        } finally {
            setAnalyzingFor(null);
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-500 uppercase tracking-widest font-bold">Analizando similitudes...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShieldAlert size={32} className="text-rose-500" />
                        Reporte de Plagio
                    </h1>
                    <div className="flex items-center gap-3">
                        <p className="text-slate-400 mt-2 font-medium">Análisis de originalidad para: <span className="text-emerald-400">{dayTitle}</span></p>
                        <Link 
                            href={`/admin/courses/${courseId}?day=${dayId}`}
                            className="mt-2 text-[10px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1 rounded border border-white/10 transition-all flex items-center gap-1.5 font-bold uppercase tracking-widest"
                        >
                            Ir a la sección
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700/50">
                    <div className="text-center border-r border-slate-700 px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Alertas</p>
                        <p className="text-xl font-black text-rose-500">{reports.filter(r => r.similarity > 80).length}</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Total Cruces</p>
                        <p className="text-xl font-black text-white">{reports.length}</p>
                    </div>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="p-20 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-3xl text-center">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No se detectó plagio</h3>
                    <p className="text-slate-400 mt-2">Todos los alumnos han entregado códigos con baja similitud entre sí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reports.map((report, idx) => (
                        <div key={idx} className={`glass-effect rounded-2xl border transition-all overflow-hidden ${report.similarity > 85 ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-700/50 bg-white/5'
                            }`}>
                            <div className="p-6 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-slate-500" />
                                        <span className="font-bold text-white">{report.studentA}</span>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-600" />
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-slate-500" />
                                        <span className="font-bold text-white">{report.studentB}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${report.similarity > 85 ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-amber-500/20 text-amber-500'
                                        }`}>
                                        {report.similarity}% Similitud
                                    </div>
                                    {report.similarity > 85 && <AlertTriangle size={20} className="text-rose-500 animate-pulse" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 h-64 border-t border-slate-700/50">
                                <div className="p-4 bg-black/40 overflow-auto border-r border-slate-700/50 font-mono text-[11px] text-slate-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            <Code size={12} /> Código de {report.studentA}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleDownload(report.studentA, report.codeA)}
                                                className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors"
                                                title="Descargar Código"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleQuickGrade(report.studentAId, report.studentA)}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                                disabled={!!isGrading}
                                            >
                                                {isGrading === report.studentAId ? <Loader2 size={12} className="animate-spin" /> : <Gavel size={12} />}
                                                Reprobar (0)
                                            </button>
                                        </div>
                                    </div>
                                    <pre className="mt-2">{report.codeA}</pre>
                                </div>
                                <div className="p-4 bg-black/40 overflow-auto font-mono text-[11px] text-slate-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            <Code size={12} /> Código de {report.studentB}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleDownload(report.studentB, report.codeB)}
                                                className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors"
                                                title="Descargar Código"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleQuickGrade(report.studentBId, report.studentB)}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                                disabled={!!isGrading}
                                            >
                                                {isGrading === report.studentBId ? <Loader2 size={12} className="animate-spin" /> : <Gavel size={12} />}
                                                Reprobar (0)
                                            </button>
                                        </div>
                                    </div>
                                    <pre className="mt-2">{report.codeB}</pre>
                                </div>
                            </div>

                            {/* AI Analysis Section */}
                            {report.aiAnalysis ? (
                                <div className="p-6 bg-[var(--color-primary)]/5 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                                            <Sparkles size={14} />
                                        </div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-sky-400">Análisis Técnico IA</h4>
                                    </div>
                                    <div className="text-slate-300 text-sm leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 whitespace-pre-wrap italic">
                                        "{report.aiAnalysis}"
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-black/40 border-t border-slate-700/50 flex justify-end">
                                    <button 
                                        onClick={() => handleAiAnalysis(idx, report)}
                                        disabled={analyzingFor === `${report.studentAId}-${report.studentBId}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {analyzingFor === `${report.studentAId}-${report.studentBId}` ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Cpu size={16} />
                                        )}
                                        Generar Análisis IA
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
