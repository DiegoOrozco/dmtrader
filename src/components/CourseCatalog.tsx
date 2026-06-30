"use client";

import { useState, useMemo } from "react";
import { Search, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import CoursePreviewModal from "./CoursePreviewModal";

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

interface Course {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    status: string;
    category: string;
    progressPct?: number;
    weeks?: Week[];
}

interface CourseCatalogProps {
    allCourses: Course[];
    enrolledCourseIds: string[];
    student: any;
}

export default function CourseCatalog({ allCourses, enrolledCourseIds, student }: CourseCatalogProps) {
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
    const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

    // Sync search with URL param on mount
    useEffect(() => {
        const querySearch = searchParams.get("search");
        if (querySearch) {
            setSearch(querySearch);
            const catalog = document.getElementById("catalog");
            if (catalog) {
                catalog.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [searchParams]);

    const categories = useMemo(() => {
        const cats = new Set(allCourses.map(c => c.category));
        return ["Todas", ...Array.from(cats)].sort();
    }, [allCourses]);

    const filteredCourses = useMemo(() => {
        return allCourses.filter(course => {
            const matchesSearch =
                course.title.toLowerCase().includes(search.toLowerCase()) ||
                (course.description?.toLowerCase().includes(search.toLowerCase()) || false);
            const matchesCategory = selectedCategory === "Todas" || course.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allCourses, search, selectedCategory]);

    const myCourses = filteredCourses.filter(c => enrolledCourseIds.includes(c.id));
    const availableCourses = filteredCourses.filter(c => !enrolledCourseIds.includes(c.id));

    return (
        <div className="space-y-10">

            {/* ── SEARCH + FILTER BAR ── */}
            <div
                className="sticky top-20 z-30 flex flex-col gap-4 py-6 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-10 lg:px-10 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/40 dark:border-slate-850/50 shadow-sm"
            >
                {/* Search */}
                <div className="relative w-full">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Buscar programas formativos por nombre o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full text-sm outline-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 dark:focus:border-sky-500 transition-colors font-medium"
                    />
                </div>

                {/* Category buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0 hidden md:block mr-2">Filtros:</span>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="flex-shrink-0 text-xs font-semibold tracking-wider px-4 py-2 rounded-full border transition-all"
                            style={{
                                background: selectedCategory === cat ? 'var(--raw-accent)' : 'transparent',
                                color: selectedCategory === cat ? '#ffffff' : 'var(--raw-slate)',
                                borderColor: selectedCategory === cat ? 'var(--raw-accent)' : 'var(--border-color)',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/80" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    {filteredCourses.length} programa{filteredCourses.length !== 1 ? 's' : ''} formativo{filteredCourses.length !== 1 ? 's' : ''} disponible{filteredCourses.length !== 1 ? 's' : ''}
                </p>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/80" />
            </div>

            {/* ── MY COURSES ── */}
            {student && myCourses.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-500">// Mis Cursos en Progreso</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/80" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {myCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/course/${course.id}`}
                                className="group raw-card flex flex-col overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-sky-500/30 transition-all duration-300"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full h-44 overflow-hidden bg-slate-100 dark:bg-slate-950">
                                    {course.thumbnail ? (
                                        <img
                                            src={`${course.thumbnail}?v=1.0.1`}
                                            alt={course.title}
                                            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-extrabold text-3xl text-slate-300 dark:text-slate-800">
                                                {course.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    {/* Category pill overlay */}
                                    <div className="absolute top-4 left-4">
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-sky-500 text-white shadow-sm"
                                        >
                                            {course.category}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-900/60 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight
                                            size={14}
                                            className="text-white"
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <h3
                                        className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors"
                                    >
                                        {course.title}
                                    </h3>
                                    <p
                                        className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1"
                                    >
                                        {course.description}
                                    </p>

                                    {/* Progress */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between mb-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progreso del Alumno</span>
                                            <span className="text-[10px] font-extrabold text-sky-500">
                                                {Math.round(course.progressPct || 0)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-sky-500"
                                                style={{ width: `${course.progressPct || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── AVAILABLE COURSES ── */}
            <section className="space-y-6">
                {student && myCourses.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">// Más Programas Disponibles</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/80" />
                    </div>
                )}

                {availableCourses.length === 0 ? (
                    <div className="py-20 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No se encontraron cursos en esta categoría</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCourses.map((course) => (
                            <div
                                key={course.id}
                                className="group raw-card flex flex-col overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-sky-500/30 transition-all duration-300 cursor-pointer rounded-2xl"
                                onClick={() => setPreviewCourse(course)}
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-950">
                                    {course.thumbnail ? (
                                        <img src={`${course.thumbnail}?v=1.0.1`} alt={course.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-90 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-extrabold text-3xl text-slate-300 dark:text-slate-800">
                                                {course.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-md border border-white/10 text-sky-400 shadow-sm">
                                            {course.category}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 
                                        className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors line-clamp-2"
                                    >
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 flex-1 leading-relaxed">
                                        {course.description || "Iníciate en los mercados financieros y el trading profesional paso a paso."}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={13} className="text-amber-500 fill-amber-500" />
                                            ))}
                                            <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 ml-1.5">5.0</span>
                                        </div>
                                        <button 
                                            className="text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 group-hover:bg-gradient-to-r group-hover:from-sky-500 group-hover:to-sky-600 group-hover:text-white group-hover:border-sky-500 px-4 py-2 rounded-lg transition-all text-slate-700 dark:text-slate-300"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewCourse(course);
                                            }}
                                        >
                                            Ver Programa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Preview Modal */}
            {previewCourse && (
                <CoursePreviewModal 
                    course={previewCourse} 
                    onClose={() => setPreviewCourse(null)} 
                    student={student}
                />
            )}
        </div>
    );
}
