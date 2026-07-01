import { Users, BookOpen, MessageSquare, TrendingUp } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const [studentCount, courseCount, pendingQuestions] = await Promise.all([
        // Distinct estudiantes con al menos una matrícula
        prisma.enrollment.groupBy({ by: ["userId"] }).then((rows: any[]) => rows.length),
        // Solo cursos publicados
        prisma.course.count({ where: { status: "published" } }),
        // Posts sin respuesta
        prisma.post.count({ where: { replies: { none: {} } } }),
    ]);
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Visión General</h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Bienvenido al panel de control, Diego.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <TrendingUp size={12} />
                            +12%
                        </span>
                    </div>
                    <div>
                        <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Estudiantes Activos</h3>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{studentCount.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Cursos Publicados</h3>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{courseCount.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                            <MessageSquare size={20} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Dudas Pendientes</h3>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingQuestions.toLocaleString()}</p>
                    </div>
                </div>
            </div>



        </div>
    );
}
