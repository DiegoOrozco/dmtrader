"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit3, Eye, EyeOff, Search, Plus, Loader2, Trash2 } from "lucide-react";
import { createEmptyCourse, deleteCourseAction } from "@/actions/admin-course";

export default function AdminCoursesClient({ initialCourses }: { initialCourses: any[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreating, setIsCreating] = useState(false);

    const filteredCourses = initialCourses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateCourse = async () => {
        setIsCreating(true);
        try {
            const res = await createEmptyCourse();
            if (res.success && res.courseId) {
                router.push(`/admin/courses/${res.courseId}`);
            } else {
                alert("Error al crear curso: " + res.error);
                setIsCreating(false);
            }
        } catch (e) {
            alert("Error de conexión");
            setIsCreating(false);
        }
    };

    const handleDeleteCourse = async (courseId: string, title: string) => {
        if (!confirm(`¿Estás completamente seguro de eliminar el curso "${title}"? Esta acción eliminará permanentemente todos los estudiantes inscritos, lecciones, entregas y configuraciones. Esta acción NO se puede deshacer.`)) {
            return;
        }

        try {
            const res = await deleteCourseAction(courseId);
            if (res.success) {
                router.refresh();
            } else {
                alert("Error al eliminar curso: " + res.error);
            }
        } catch (e) {
            alert("Error de conexión");
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Mis Cursos</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Gestiona el contenido, lecciones y visibilidad de tus cursos.</p>
                </div>
                <button
                    onClick={handleCreateCourse}
                    disabled={isCreating}
                    className={`${isCreating ? "opacity-70 cursor-not-allowed" : ""} bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.25)]`}
                >
                    {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {isCreating ? "Creando..." : "Nuevo Curso"}
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-[#0a0e1a] p-4 rounded-xl flex flex-col sm:flex-row gap-4 border border-slate-200 dark:border-slate-800 shadow-lg">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar cursos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-sky-500 transition-all font-semibold"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-[#05070f] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 focus:outline-none focus:border-sky-500 transition-all cursor-pointer"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="published">Publicados</option>
                        <option value="draft">Borradores</option>
                    </select>
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden group flex flex-col shadow-xl">

                        <div className="h-40 relative overflow-hidden bg-slate-900">
                            <img
                                src={course.thumbnail || "/thumbnails/01.png"}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                                {course.status === "published" ? (
                                    <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1">
                                        <Eye size={12} /> Publicado
                                    </span>
                                ) : (
                                    <span className="bg-slate-800/90 backdrop-blur-sm text-slate-300 text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-700">
                                        <EyeOff size={12} /> Oculto
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-transparent to-black/5 dark:to-black/30">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 leading-tight line-clamp-2">{course.title}</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-4">{course.enrollments.length} estudiantes inscritos</p>

                            <div className="mt-auto flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                                <Link
                                    href={`/admin/courses/${course.id}`}
                                    className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800"
                                >
                                    <Edit3 size={14} />
                                    Editar
                                </Link>
                                <button
                                    onClick={() => handleDeleteCourse(course.id, course.title)}
                                    className="px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 rounded-xl transition-all flex items-center justify-center"
                                    title="Eliminar Curso"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
}
