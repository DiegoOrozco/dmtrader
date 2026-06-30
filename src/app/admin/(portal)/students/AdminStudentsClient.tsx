"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { User, Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";

type StudentData = {
    id: string;
    name: string;
    email: string;
    enrollments: { course: { id: string; title: string; status: string } }[];
    posts: { id: string }[];
    replies: { id: string }[];
};

export default function AdminStudentsClient({ initialStudents }: { initialStudents: StudentData[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredStudents = useMemo(() => {
        let result = initialStudents;
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (s) => s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)
            );
        }

        if (sortConfig !== null) {
            result.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case "name":
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                        break;
                    case "email":
                        aValue = a.email.toLowerCase();
                        bValue = b.email.toLowerCase();
                        break;
                    case "courses":
                        aValue = a.enrollments.length;
                        bValue = b.enrollments.length;
                        break;
                    case "activity":
                        aValue = a.posts.length + a.replies.length;
                        bValue = b.posts.length + b.replies.length;
                        break;
                    default:
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === "asc" ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === "asc" ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [initialStudents, searchQuery, sortConfig]);

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (!sortConfig || sortConfig.key !== columnKey) {
            return <ArrowUpDown size={12} className="opacity-45" />;
        }
        return sortConfig.direction === "asc" ? <ChevronUp size={12} className="text-sky-400" /> : <ChevronDown size={12} className="text-sky-400" />;
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-2">Estudiantes</h1>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Listado de estudiantes registrados y su actividad.</p>
                </div>
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#05070f] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-sky-500 transition-all font-semibold placeholder:text-slate-700"
                    />
                </div>
            </div>

            <div className="bg-[#0a0e1a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs min-w-[700px]">
                        <thead className="bg-black/20 text-slate-500 border-b border-slate-800">
                            <tr>
                                <th
                                    className="text-left font-black uppercase tracking-wider px-4 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none group"
                                    onClick={() => handleSort("name")}
                                >
                                    <div className="flex items-center gap-2">
                                        Nombre <SortIcon columnKey="name" />
                                    </div>
                                </th>
                                <th
                                    className="text-left font-black uppercase tracking-wider px-4 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none group"
                                    onClick={() => handleSort("email")}
                                >
                                    <div className="flex items-center gap-2">
                                        Email <SortIcon columnKey="email" />
                                    </div>
                                </th>
                                <th
                                    className="text-left font-black uppercase tracking-wider px-4 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none group"
                                    onClick={() => handleSort("courses")}
                                >
                                    <div className="flex items-center gap-2">
                                        Cursos <SortIcon columnKey="courses" />
                                    </div>
                                </th>
                                <th
                                    className="text-center font-black uppercase tracking-wider px-4 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none group"
                                    onClick={() => handleSort("activity")}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Posts/Resp <SortIcon columnKey="activity" />
                                    </div>
                                </th>
                                <th className="text-right font-black uppercase tracking-wider px-4 py-4">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                            {sortedAndFilteredStudents.map((s) => (
                                <tr key={s.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-4 py-3 text-white font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-[10px] font-black shadow-sm group-hover:bg-sky-600 group-hover:text-white transition-all uppercase">
                                            {s.name.charAt(0)}
                                        </div>
                                        {s.name}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-semibold">
                                        <span className="text-[11px] font-mono">{s.email}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="min-w-6 h-6 px-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 shadow-md flex items-center justify-center text-[9px] text-sky-400 font-black">
                                                {s.enrollments.length}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 hidden md:inline-block">Inscrito(s)</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs text-center font-mono font-bold">
                                        {s.posts.length} / {s.replies.length}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/admin/students/${s.id}`} className="text-[10px] font-black uppercase tracking-wider text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-600 px-3 py-1.5 rounded-lg transition-all border border-sky-500/20 inline-block">
                                            Administrar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedAndFilteredStudents.length === 0 && (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-900 flex flex-col items-center justify-center border border-slate-800">
                            <User size={24} className="opacity-40" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-600">{searchQuery ? "No se encontraron estudiantes para esa búsqueda." : "No hay estudiantes registrados aún."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
