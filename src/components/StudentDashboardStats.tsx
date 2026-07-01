import prisma from "@/lib/prisma";
import Link from "next/link";
import { Clock, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getUpcomingDeadlines } from "@/lib/grades-utils";

interface StudentDashboardProps {
    studentId: string;
}

export default async function StudentDashboardStats({ studentId }: StudentDashboardProps) {
    if (!studentId) return null;

    const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            enrollments: {
                where: { status: "ACTIVE" },
                include: {
                    course: {
                        include: {
                            weeks: {
                                where: { isVisible: true },
                                include: {
                                    days: {
                                        where: { isVisible: true },
                                        include: {
                                            submissions: { where: { userId: studentId } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            deadlineExceptions: true
        }
    });

    if (!student || student.enrollments.length === 0) return null;

    const upcomingDeadlines = getUpcomingDeadlines(student, new Date());

    return (
        <div className="glass-effect rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full bg-white/90 dark:bg-[#0a0e1a]/90 backdrop-blur-3xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                        <Clock size={20} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-[0.1em]">Próximas Entregas</h3>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">Calendario Semanal</p>
                    </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 text-[10px] font-black border border-sky-500/30">
                    {upcomingDeadlines.length}
                </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {upcomingDeadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 border border-dashed border-slate-200 dark:border-white/10 opacity-40">
                            <CheckCircle size={32} className="text-emerald-500/40 dark:text-emerald-400/40" />
                        </div>
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">Sin tareas pendientes</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold mt-2 italic">¡Disfruta tu tiempo libre!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {upcomingDeadlines.map((deadline, idx) => (
                            <Link
                                key={`${deadline.id}-${idx}`}
                                href={`/course/${deadline.courseId}?dayId=${deadline.id}`}
                                className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-800 relative overflow-hidden bg-slate-50 dark:bg-black/40 cursor-pointer"
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-xl group-hover:border-sky-500/30 transition-all">
                                        <span className="text-[9px] text-sky-600 dark:text-sky-400/70 font-black uppercase tracking-tighter">{format(deadline.dueDate, "MMM", { locale: es })}</span>
                                        <span className="text-xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{format(deadline.dueDate, "d", { locale: es })}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-900 dark:text-white text-sm leading-tight group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors truncate pr-2 tracking-tight">
                                            {deadline.title}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate mt-1">{deadline.courseName}</p>
                                    </div>
                                </div>
                                <div className="shrink-0 relative z-10">
                                    {deadline.isSubmitted ? (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <CheckCircle size={12} className="text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">
                                            <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Pendiente</span>
                                        </div>
                                    )}
                                </div>
                                {/* Progress background decoration */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-sky-500/40 transition-all duration-300" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 bg-white/[0.01] border-t border-slate-800">
                <Link href="/grades" className="w-full py-3.5 rounded-xl bg-white/5 border border-slate-800 hover:bg-white/[0.08] text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group">
                    Ver Registro de Notas
                    <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
            </div>
        </div>
    );
}
