"use client";

import React, { useState, useTransition } from "react";
import { GraduationCap, Search, Download, User, ChevronRight, BookOpen, Check, Edit2, FileDown, Loader2, Filter, Sparkles } from "lucide-react";
import JSZip from "jszip";
import { updateManualGrade } from "../../../../actions/admin-grades";
import FeedbackModal from "@/components/FeedbackModal";
import BatchAIGradingModal from "@/components/BatchAIGradingModal";

interface CourseInfo {
    id: string;
    title: string;
    weightQuiz: number;
    weightLab: number;
    weightForum: number;
    weightProject: number;
    weightExam: number;
}

function GradeEditor({ initialGrade, userId, dayId }: { initialGrade: number | null | undefined, userId: string, dayId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [grade, setGrade] = useState(initialGrade !== null && initialGrade !== undefined ? String(initialGrade) : "");
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        const numGrade = Number(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) return;

        startTransition(async () => {
            await updateManualGrade(userId, dayId, numGrade);
            setIsEditing(false);
        });
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0" max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-16 bg-[#05070f] border border-sky-500/50 rounded-lg px-2 py-1 text-xs font-black text-white focus:outline-none"
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Check size={12} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group/edit">
            <span className={`text-xs font-black ${initialGrade != null && initialGrade >= 70 ? 'text-emerald-400' : initialGrade != null ? 'text-rose-400' : 'text-slate-500'}`}>
                {initialGrade != null ? `${initialGrade}/100` : "-/100"}
            </span>
            <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-50 hover:opacity-100"
            >
                <Edit2 size={11} />
            </button>
        </div>
    );
}

export default function AdminGradesClient({ initialCourses, tableData, courses, totalStudents, avgScore, passRate }: { initialCourses?: any[], tableData: any[], courses: CourseInfo[], totalStudents: number, courseCount?: number, pendingQuestions?: number, avgScore: number, passRate: number }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [selectedFeedback, setSelectedFeedback] = useState<{ sub: any; name: string } | null>(null);
    const [isZipping, setIsZipping] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    const filteredData = tableData.filter(row => {
        const matchesSearch =
            row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = selectedCourseId === "all" || row.courseId === selectedCourseId;
        return matchesSearch && matchesCourse;
    });

    const handleExportCSV = () => {
        if (filteredData.length === 0) {
            alert("No hay datos para exportar con el filtro actual.");
            return;
        }

        let courseIdToUse = selectedCourseId;
        if (courseIdToUse === "all") {
            const uniqueCourses = [...new Set(filteredData.map(r => r.courseId))];
            if (uniqueCourses.length > 1) {
                alert("Por favor selecciona un curso específico antes de exportar.");
                return;
            }
            courseIdToUse = uniqueCourses[0];
        }

        const courseInfo = courses.find(c => c.id === courseIdToUse);
        if (!courseInfo) {
            alert("Información del curso no encontrada.");
            return;
        }

        const rubrics: string[] = [];
        if (courseInfo.weightQuiz > 0) rubrics.push(`Quiz (${courseInfo.weightQuiz}%)`);
        if (courseInfo.weightLab > 0) rubrics.push(`Lab (${courseInfo.weightLab}%)`);
        if (courseInfo.weightForum > 0) rubrics.push(`Foro (${courseInfo.weightForum}%)`);
        if (courseInfo.weightProject > 0) rubrics.push(`Proyecto (${courseInfo.weightProject}%)`);
        if (courseInfo.weightExam > 0) rubrics.push(`Examen (${courseInfo.weightExam}%)`);

        const header = ["Nombre", "Email", "Curso", ...rubrics, "Nota Final", "Entregas Realizadas"];
        const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

        const lines = [
            header.map(escape).join(","),
            ...filteredData.map(row => {
                const cols = [row.name, row.email, row.courseTitle];
                if (courseInfo.weightQuiz > 0) cols.push(row.gradeData.qAvg ?? 0);
                if (courseInfo.weightLab > 0) cols.push(row.gradeData.lAvg ?? 0);
                if (courseInfo.weightForum > 0) cols.push(row.gradeData.fAvg ?? 0);
                if (courseInfo.weightProject > 0) cols.push(row.gradeData.pAvg ?? 0);
                if (courseInfo.weightExam > 0) cols.push(row.gradeData.eAvg ?? 0);
                cols.push(row.gradeData.total ?? 0, row.gradeData.subsCount ?? 0);
                return cols.map(escape).join(",");
            })
        ];

        const csvContent = "\uFEFF" + lines.join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `calificaciones_${courseInfo.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownload = (content: string, fileName: string) => {
        if (!content) return;
        if (content.startsWith("http")) {
            const downloadUrl = content.includes('vercel-storage.com') ? `${content}?download=1` : content;
            window.open(downloadUrl, "_blank");
        } else {
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName || "download.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const downloadAll = async (submissions: any[], studentName: string) => {
        const validSubs = (submissions || []).filter(s => s.content);
        if (validSubs.length === 0) { alert("No hay archivos para descargar."); return; }
        if (!confirm(`¿Descargar las ${validSubs.length} entregas de ${studentName} en un solo archivo .ZIP?`)) return;

        setIsZipping(true);
        const zip = new JSZip();
        try {
            for (const sub of validSubs) {
                const dayCleanTitle = sub.title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
                const studentCleanName = studentName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
                let extension = "txt";
                if (sub.fileName?.includes(".")) extension = sub.fileName.split(".").pop() || "txt";
                else if (sub.content.startsWith("http") && sub.content.includes(".pdf")) extension = "pdf";
                const fileName = `${studentCleanName}_${dayCleanTitle}.${extension}`;
                if (sub.content.startsWith("http")) {
                    const response = await fetch(sub.content);
                    const blob = await response.blob();
                    zip.file(fileName, blob);
                } else {
                    zip.file(fileName, sub.content);
                }
            }
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `entregas_${studentName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error creating ZIP:", error);
            alert("Error al crear el archivo ZIP.");
        } finally {
            setIsZipping(false);
        }
    };

    const toggleRow = (id: string) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]);
    };

    const filteredAvg = filteredData.length > 0
        ? filteredData.reduce((acc, row) => acc + row.gradeData.total, 0) / filteredData.length
        : 0;
    const filteredPassRate = filteredData.length > 0
        ? (filteredData.filter(row => row.gradeData.total >= 70).length / filteredData.length) * 100
        : 0;

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <BatchAIGradingModal 
                isOpen={isBatchModalOpen} 
                onClose={() => setIsBatchModalOpen(false)} 
            />

            <div className="relative z-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">ADMINISTRACIÓN</span>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">/ CONTROL ACADÉMICO</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-none">
                            CENTRO DE <span className="text-sky-400">NOTAS.</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 bg-[#0a0e1a] border border-slate-800 rounded-2xl p-2 h-fit">
                        <div className="px-6 py-2 border-r border-slate-800">
                            <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Pass Rate</span>
                            <span className="text-xl font-black text-emerald-400">{Math.round(selectedCourseId === "all" ? passRate : filteredPassRate)}%</span>
                        </div>
                        <div className="px-6 py-2">
                            <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Avg Score</span>
                            <span className="text-lg font-black text-white">{Math.round(selectedCourseId === "all" ? avgScore : filteredAvg)}</span>
                        </div>
                    </div>
                </header>

                {/* Search & Actions Strip */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-405 transition-colors">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre de alumno o curso..."
                            className="w-full bg-[#0a0e1a] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-semibold placeholder:text-slate-700 focus:outline-none focus:border-sky-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                                <Filter size={14} />
                            </div>
                            <select
                                className="bg-[#0a0e1a] border border-slate-800 rounded-2xl py-4 pl-10 pr-10 text-white text-[10px] font-black uppercase tracking-wider appearance-none focus:outline-none focus:border-sky-500 cursor-pointer"
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                            >
                                <option value="all">TODOS LOS CURSOS</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.title.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setIsBatchModalOpen(true)}
                            className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all"
                        >
                            <Sparkles size={14} />
                            Calificación IA (Lote)
                        </button>

                        <button
                            onClick={handleExportCSV}
                            className="bg-white/5 hover:bg-white/10 text-white border border-slate-800 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all"
                        >
                            <FileDown size={14} />
                            Exportar CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Rubric legend */}
            {selectedCourse && (
                <div className="bg-[#0a0e1a] rounded-2xl border border-slate-800 p-4 shadow-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Filter size={12} /> Rubros del curso &mdash; {selectedCourse.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedCourse.weightQuiz > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Quiz {selectedCourse.weightQuiz}%
                            </span>
                        )}
                        {selectedCourse.weightLab > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Lab {selectedCourse.weightLab}%
                            </span>
                        )}
                        {selectedCourse.weightForum > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Foro {selectedCourse.weightForum}%
                            </span>
                        )}
                        {selectedCourse.weightProject > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Proyecto {selectedCourse.weightProject}%
                            </span>
                        )}
                        {selectedCourse.weightExam > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Examen {selectedCourse.weightExam}%
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#0a0e1a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 border-b border-slate-800">
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Estudiante</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Curso</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Desglose (Q/L/F/P/E)</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Nota Final</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                            {filteredData.map((row, idx) => {
                                const rowKey = `${row.studentId}-${row.courseId}-${idx}`;
                                const isExpanded = expandedRows.includes(rowKey);

                                return (
                                    <React.Fragment key={rowKey}>
                                        <tr
                                            className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                                            onClick={() => toggleRow(rowKey)}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800 group-hover:border-sky-500/30 transition-all">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase tracking-wider leading-none mb-1">{row.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{row.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <BookOpen size={16} className="text-sky-400" />
                                                    <span className="text-xs font-black uppercase tracking-wider leading-none">{row.courseTitle}</span>
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-1">
                                                    {row.gradeData.subsCount} Entregas Realizadas
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500 font-semibold">
                                                    {row.gradeData.weights.QUIZ > 0 && <span title="Quices" className={row.gradeData.qAvg > 0 ? "text-sky-400" : ""}>{row.gradeData.qAvg}</span>}
                                                    {row.gradeData.weights.QUIZ > 0 && (row.gradeData.weights.LAB > 0 || row.gradeData.weights.FORUM > 0 || row.gradeData.weights.PROJECT > 0 || row.gradeData.weights.EXAM > 0) && "/"}
                                                    {row.gradeData.weights.LAB > 0 && <span title="Labs" className={row.gradeData.lAvg > 0 ? "text-amber-400" : ""}>{row.gradeData.lAvg}</span>}
                                                    {row.gradeData.weights.LAB > 0 && (row.gradeData.weights.FORUM > 0 || row.gradeData.weights.PROJECT > 0 || row.gradeData.weights.EXAM > 0) && "/"}
                                                    {row.gradeData.weights.FORUM > 0 && <span title="Foros" className={row.gradeData.fAvg > 0 ? "text-emerald-400" : ""}>{row.gradeData.fAvg}</span>}
                                                    {row.gradeData.weights.FORUM > 0 && (row.gradeData.weights.PROJECT > 0 || row.gradeData.weights.EXAM > 0) && "/"}
                                                    {row.gradeData.weights.PROJECT > 0 && <span title="Proyectos" className={row.gradeData.pAvg > 0 ? "text-amber-400" : ""}>{row.gradeData.pAvg}</span>}
                                                    {row.gradeData.weights.PROJECT > 0 && row.gradeData.weights.EXAM > 0 && <span>/</span>}
                                                    {row.gradeData.weights?.EXAM > 0 && <span className="text-amber-400">{row.gradeData.eAvg}</span>}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`text-sm font-black ${row.gradeData.total >= 70 ? "text-emerald-400" : "text-rose-400"}`}>{row.gradeData.total}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className={`text-slate-500 hover:text-sky-400 transition-all p-2 rounded-full hover:bg-white/5 ${isExpanded ? "rotate-90 bg-white/5 text-sky-400" : ""}`}>
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-black/30 border-t-0 shadow-inner">
                                                <td colSpan={5} className="px-6 py-6 border-b border-slate-800">
                                                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
                                                            <span>Detalle de Entregas</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); downloadAll(row.submissions, row.name); }}
                                                                disabled={isZipping}
                                                                className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 disabled:opacity-50"
                                                            >
                                                                {isZipping ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                                                                <span className="text-[9px] font-black uppercase tracking-wider">{isZipping ? "Procesando..." : "Descargar Todo (.ZIP)"}</span>
                                                            </button>
                                                        </h4>
                                                        {(row.submissions || []).length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {row.submissions.map((sub: any, i: number) => (
                                                                    <div key={i} className="bg-black/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-sky-500/40 transition-colors">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider
                                                                                ${sub.assignmentType === 'QUIZ' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : ''}
                                                                                ${sub.assignmentType === 'LAB' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                                                                                ${sub.assignmentType === 'FORUM' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                                                                                ${sub.assignmentType === 'PROJECT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                                                                                ${sub.assignmentType === 'PRACTICE' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : ''}
                                                                                ${sub.assignmentType === 'EXAM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                                                                            `}>
                                                                                {sub.assignmentType === 'PRACTICE' ? 'PRÁCTICA' : sub.assignmentType}
                                                                            </span>
                                                                            <GradeEditor
                                                                                initialGrade={sub.grade}
                                                                                userId={row.studentId}
                                                                                dayId={sub.dayId}
                                                                            />
                                                                        </div>
                                                                        <p className="text-xs font-black text-white uppercase tracking-wider line-clamp-1" title={sub.title}>{sub.title}</p>
                                                                        <div className="flex justify-between items-center mt-1">
                                                                            <p className="text-[9px] uppercase font-black text-slate-500">
                                                                                {sub.grade === null ? "Sin Entrega" : "Entregado"}
                                                                            </p>
                                                                            <div className="flex items-center gap-3">
                                                                                {sub.dayId && (
                                                                                    <a
                                                                                        href={`/admin/courses/${row.courseId}/submissions/${sub.dayId}`}
                                                                                        target="_blank"
                                                                                        className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors"
                                                                                    >
                                                                                        <BookOpen size={12} />
                                                                                        Ver Entregas
                                                                                    </a>
                                                                                )}
                                                                                {sub.content && (
                                                                                    <button
                                                                                        onClick={() => handleDownload(sub.content, sub.fileName)}
                                                                                        className="flex items-center gap-1.5 text-[9px] font-black uppercase text-sky-400 hover:text-white transition-colors"
                                                                                    >
                                                                                        <Download size={12} />
                                                                                        Descargar
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div
                                                                            className="text-[10px] text-slate-500 font-semibold mt-1 line-clamp-3 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors group/f"
                                                                            onClick={(e) => { e.stopPropagation(); setSelectedFeedback({ sub, name: row.name }); }}
                                                                            title="Click para ver feedback completo"
                                                                        >
                                                                            {sub.feedback && typeof sub.feedback === 'object' ? (
                                                                                <>
                                                                                    {sub.feedback.text ? sub.feedback.text : (
                                                                                        <>
                                                                                            {sub.feedback.feedback_positivo && <p><span className="text-emerald-400 font-bold">+</span> {Array.isArray(sub.feedback.feedback_positivo) ? sub.feedback.feedback_positivo[0] : sub.feedback.feedback_positivo}</p>}
                                                                                            {sub.feedback.mejoras && <p><span className="text-amber-400 font-bold">-</span> {Array.isArray(sub.feedback.mejoras) ? sub.feedback.mejoras[0] : sub.feedback.mejoras}</p>}
                                                                                        </>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                "Sin comentarios."
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl bg-black/20">
                                                                No hay entregas registradas.
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="p-20 text-center">
                        <GraduationCap size={48} className="text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No se encontraron resultados para tu búsqueda.</p>
                    </div>
                )}
            </div>

            {selectedFeedback && (
                <FeedbackModal
                    isOpen={!!selectedFeedback}
                    onClose={() => setSelectedFeedback(null)}
                    studentName={selectedFeedback.name}
                    dayTitle={selectedFeedback.sub.title}
                    feedback={selectedFeedback.sub.feedback}
                    grade={selectedFeedback.sub.grade}
                />
            )}
        </div>
    );
}
