"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Settings, List, Plus, Trash2, GripVertical, Video, Link2, Loader2, FileText, FileCheck, Upload, ChevronDown, ChevronRight, Tags, Calendar, Code, Clock, Lock, ShieldAlert, Copy, Eye, EyeOff, BarChart3, Download, ExternalLink, Move, X } from "lucide-react";
import { saveCourseData, moveAssignment } from "@/actions/admin-course";
import { deleteAllCourseFiles } from "@/actions/admin-grades";
import { useRouter } from "next/navigation";
import GroupManagement from "@/components/admin/GroupManagement";
import { Users } from "lucide-react";

// Converts a UTC date string from DB to a local time string for datetime-local input
// e.g. "2026-03-11T17:00:00.000Z" (UTC) → "2026-03-11T11:00" (Costa Rica UTC-6)
function toLocalDatetimeInput(utcDateString: string): string {
    const date = new Date(utcDateString);
    const offsetMs = date.getTimezoneOffset() * 60000; // getTimezoneOffset() returns minutes
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
}

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Wrapper Components ---

// --- Sortable Wrapper Components ---
import { createContext, useContext } from "react";

const SortableItemContext = createContext<{
    attributes: Record<string, any>;
    listeners: Record<string, any> | undefined;
    ref: (node: HTMLElement | null) => void;
}>({
    attributes: {},
    listeners: undefined,
    ref: () => { }
});

function SortableItem({ id, children, className, containerId }: { id: string, children: React.ReactNode, className?: string, containerId?: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setNodeRef }}>
            <div ref={setNodeRef} style={style} className={className} id={containerId}>
                {children}
            </div>
        </SortableItemContext.Provider>
    );
}

function DragHandle({ className, children }: { className?: string, children: React.ReactNode }) {
    const { attributes, listeners } = useContext(SortableItemContext);
    return (
        <div {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing ${className || ""}`}>
            {children}
        </div>
    );
}

export default function AdminCourseEditorClient({ initialCourse }: { initialCourse: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"settings" | "curriculum" | "groups">("curriculum");
    const [isSaving, setIsSaving] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<string[]>(initialCourse.weeks?.map((w: any) => w.id) || []);
    const [expandedDays, setExpandedDays] = useState<string[]>([]);

    const toggleWeek = (weekId: string) => {
        setExpandedWeeks((prev) =>
            prev.includes(weekId) ? prev.filter((id) => id !== weekId) : [...prev, weekId]
        );
    };

    const toggleDay = (dayId: string) => {
        setExpandedDays((prev) =>
            prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
        );
    };

    const expandAll = () => {
        const allWeekIds = course.weeks.map((w: any) => w.id);
        const allDayIds = course.weeks.flatMap((w: any) => w.days.map((d: any) => d.id));
        setExpandedWeeks(allWeekIds);
        setExpandedDays(allDayIds);
    };

    const collapseAll = () => {
        setExpandedWeeks([]);
        setExpandedDays([]);
    };

    const expandAllWeekDays = (weekId: string) => {
        const week = course.weeks.find((w: any) => w.id === weekId);
        if (!week) return;
        const weekDayIds = week.days.map((d: any) => d.id);
        setExpandedDays(prev => Array.from(new Set([...prev, ...weekDayIds])));
        if (!expandedWeeks.includes(weekId)) {
            setExpandedWeeks(prev => [...prev, weekId]);
        }
    };

    const collapseAllWeekDays = (weekId: string) => {
        const week = course.weeks.find((w: any) => w.id === weekId);
        if (!week) return;
        const weekDayIds = week.days.map((d: any) => d.id);
        setExpandedDays(prev => prev.filter(id => !weekDayIds.includes(id)));
    };

    // Initial state setup mapping Prisma format to Component format if necessary
    const buildCourseState = (ic: any) => ({
        id: ic.id,
        title: ic.title,
        description: ic.description || "",
        status: ic.status || "published",
        password: ic.password || "dmtrader",
        thumbnail: ic.thumbnail || "",
        category: ic.category || "Programación",
        enableCopyPaste: !!ic.enableCopyPaste,
        weightQuiz: ic.weightQuiz ?? 20,
        weightLab: ic.weightLab ?? 30,
        weightForum: ic.weightForum ?? 10,
        weightProject: ic.weightProject ?? 40,
        weightExam: ic.weightExam ?? 0,
        weeks: ic.weeks?.length > 0 ? ic.weeks.map((w: any) => ({
            ...w,
            days: w.days?.length > 0 ? w.days.map((d: any) => {
                let assignments = d.assignments || [];
                // Migration: If day has legacy assignment fields but no assignments array, create one
                if (assignments.length === 0 && d.isDeliveryDay) {
                    assignments = [{
                        id: `legacy-${d.id}`,
                        title: "Entrega Principal",
                        assignmentUrl: d.assignmentUrl,
                        assignmentType: d.assignmentType || "LAB",
                        dueDate: d.dueDate,
                        availableFrom: d.availableFrom,
                        gradingSeverity: d.gradingSeverity || 1,
                        isCodingExercise: !!d.isCodingExercise,
                        exerciseDescription: d.exerciseDescription || "",
                        testCases: d.testCases || [],
                        expectedOutput: d.expectedOutput || "",
                        similarityThreshold: d.similarityThreshold ?? 0.9,
                        enablePlagiarism: !!d.enablePlagiarism,
                        codeTemplate: d.codeTemplate || "",
                        timeLimit: d.timeLimit || null,
                        order: 0
                    }];
                }
                return { ...d, thumbnail: d.thumbnail || "", assignments, resources: d.resources || [] };
            }) : []
        })) : []
    });

    const [course, setCourse] = useState(() => buildCourseState(initialCourse));
    const [movingAssignment, setMovingAssignment] = useState<any>(null);

    // Re-sync state when server refreshes props (e.g. after save + router.refresh())
    useEffect(() => {
        setCourse(buildCourseState(initialCourse));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCourse.id]);

    // Handle deep linking to sections from Q&A or other parts
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const dayId = params.get("day");

            if (dayId && course.weeks) {
                // Find which week this day belongs to
                const weekForDay = course.weeks.find((w: any) =>
                    w.days.some((d: any) => d.id === dayId)
                );

                if (weekForDay) {
                    // Expand week if not expanded
                    if (!expandedWeeks.includes(weekForDay.id)) {
                        setExpandedWeeks(prev => Array.from(new Set([...prev, weekForDay.id])));
                    }
                    // Expand day if not expanded
                    if (!expandedDays.includes(dayId)) {
                        setExpandedDays(prev => Array.from(new Set([...prev, dayId])));
                    }

                    // Scroll to the element after a short delay for rendering
                    setTimeout(() => {
                        const element = document.getElementById(`day-container-${dayId}`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 800);
                }
            }
        }
        // Only run once on mount or when course data arrives
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [course.id]);

    // --- Curriculum State Handlers ---
    const handleAddWeek = () => {
        const newId = `new-week-${Date.now()}`;
        const newWeek = {
            id: newId,
            title: `Semana ${course.weeks.length + 1}: Nueva Semana`,
            days: []
        };
        setCourse({ ...course, weeks: [...course.weeks, newWeek] });
        setExpandedWeeks(prev => [...prev, newId]);
    };

    const handleUpdateWeek = (weekId: string, newTitle: string) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => w.id === weekId ? { ...w, title: newTitle } : w)
        });
    };

    const handleToggleWeekVisibility = (weekId: string, currentVisibility: boolean) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => w.id === weekId ? { ...w, isVisible: !currentVisibility } : w)
        });
    };

    const handleDeleteWeek = (weekId: string) => {
        if (confirm("¿Estás seguro de eliminar toda esta semana? Se borrarán todos sus días.")) {
            setCourse({
                ...course,
                weeks: course.weeks.filter((w: any) => w.id !== weekId)
            });
        }
    };

    const handleDuplicateWeek = (week: any) => {
        const timestamp = Date.now();
        const newWeek = {
            ...week,
            id: `new-week-${timestamp}`,
            title: `${week.title} (Copia)`,
            days: week.days.map((day: any, index: number) => ({
                ...day,
                id: `new-day-${timestamp}-${index}`,
            }))
        };
        setCourse({ ...course, weeks: [...course.weeks, newWeek] });
        setExpandedWeeks(prev => [...prev, newWeek.id]);
    };

    const handleAddDay = (weekId: string) => {
        const newDayId = `new-day-${Date.now()}`;
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    const newDay = {
                        id: newDayId,
                        title: `Nueva Sección`,
                        videoId: "",
                        materialUrl: "",
                        isDeliveryDay: false,
                        assignmentUrl: ""
                    };
                    return { ...w, days: [...w.days, newDay] };
                }
                return w;
            })
        });
        setExpandedDays(prev => [...prev, newDayId]);
    };

    const handleUpdateDay = (weekId: string, dayId: string, field: string, value: any) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => d.id === dayId ? { ...d, [field]: value } : d)
                    };
                }
                return w;
            })
        });
    };

    const handleDeleteDay = (weekId: string, dayId: string) => {
        if (!confirm("¿Eliminar este día?")) return;
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return { ...w, days: w.days.filter((d: any) => d.id !== dayId) };
                }
                return w;
            })
        });
    };

    const handleAddAssignment = (weekId: string, dayId: string) => {
        const newAssignmentId = `new-assignment-${Date.now()}`;
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => {
                            if (d.id === dayId) {
                                const newAssignment = {
                                    id: newAssignmentId,
                                    title: `Nueva Evaluación ${(d.assignments?.length || 0) + 1}`,
                                    assignmentType: "LAB",
                                    gradingSeverity: 1,
                                    isCodingExercise: false,
                                    assignmentUrl: "",
                                    dueDate: null,
                                    availableFrom: null,
                                    exerciseDescription: "",
                                    testCases: [],
                                    expectedOutput: "",
                                    similarityThreshold: 0.9,
                                    enablePlagiarism: false,
                                    codeTemplate: "",
                                    timeLimit: null
                                };
                                return { ...d, assignments: [...(d.assignments || []), newAssignment], isDeliveryDay: true };
                            }
                            return d;
                        })
                    };
                }
                return w;
            })
        });
    };

    const handleUpdateAssignment = (weekId: string, dayId: string, assignmentId: string, field: string, value: any) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => {
                            if (d.id === dayId) {
                                return {
                                    ...d,
                                    assignments: d.assignments.map((a: any) =>
                                        a.id === assignmentId ? { ...a, [field]: value } : a
                                    )
                                };
                            }
                            return d;
                        })
                    };
                }
                return w;
            })
        });
    };

    const handleDeleteAssignment = (weekId: string, dayId: string, assignmentId: string) => {
        if (!confirm("¿Eliminar esta evaluación?")) return;
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => {
                            if (d.id === dayId) {
                                return {
                                    ...d,
                                    assignments: d.assignments.filter((a: any) => a.id !== assignmentId)
                                };
                            }
                            return d;
                        })
                    };
                }
                return w;
            })
        });
    };

    const handleAddResource = (weekId: string, dayId: string) => {
        const newResId = `new-res-${Date.now()}`;
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => {
                            if (d.id === dayId) {
                                const newRes = {
                                    id: newResId,
                                    title: "Nuevo Material",
                                    url: "",
                                    type: "link"
                                };
                                return { ...d, resources: [...(d.resources || []), newRes] };
                            }
                            return d;
                        })
                    };
                }
                return w;
            })
        });
    };

    const onMoveAssignment = async (newDayId: string) => {
        if (!movingAssignment) return;
        
        if (confirm(`¿Estás seguro de que quieres mover esta evaluación? Se moverán también todas las entregas y notas asociadas.`)) {
            setIsSaving(true);
            try {
                const res = await moveAssignment(movingAssignment.id, newDayId);
                if (res.success) {
                    window.location.reload();
                } else {
                    alert("Error al mover: " + res.error);
                }
            } catch (err) {
                console.error(err);
                alert("Error de conexión");
            } finally {
                setIsSaving(false);
                setMovingAssignment(null);
            }
        }
    };

    const handleUpdateResource = (weekId: string, dayId: string, resId: string, field: string, value: any) => {
        setCourse((prev: any) => ({
            ...prev,
            weeks: prev.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => {
                            if (d.id === dayId) {
                                return {
                                    ...d,
                                    resources: d.resources.map((r: any) =>
                                        r.id === resId ? { ...r, [field]: value } : r
                                    )
                                };
                            }
                            return d;
                        })
                    };
                }
                return w;
            })
        }));
    };

    const handleDeleteResource = (weekId: string, dayId: string, resId: string) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => {
                            if (d.id === dayId) {
                                return {
                                    ...d,
                                    resources: d.resources.filter((r: any) => r.id !== resId)
                                };
                            }
                            return d;
                        })
                    };
                }
                return w;
            })
        });
    };

    const [isUploadingFile, setIsUploadingFile] = useState<string | null>(null);

    const handleFileUpload = async (weekId: string, dayId: string, file: File, field: string) => {
        setIsUploadingFile(`${dayId}-${field}`);
        try {
            const response = await fetch(`/api/admin/upload-file?filename=${encodeURIComponent(file.name)}`, {
                method: "POST",
                body: file,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al subir archivo");
            }

            const blob = await response.json();
            handleUpdateDay(weekId, dayId, field, blob.url);
        } catch (error: any) {
            alert("Error: " + error.message);
            console.error(error);
        } finally {
            setIsUploadingFile(null);
        }
    };

    const handleAssignmentFileUpload = async (weekId: string, dayId: string, assignmentId: string, file: File, field: string) => {
        setIsUploadingFile(`${assignmentId}-${field}`);
        try {
            const response = await fetch(`/api/admin/upload-file?filename=${encodeURIComponent(file.name)}`, {
                method: "POST",
                body: file,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al subir archivo");
            }

            const blob = await response.json();
            handleUpdateAssignment(weekId, dayId, assignmentId, field, blob.url);
        } catch (error: any) {
            alert("Error: " + error.message);
            console.error(error);
        } finally {
            setIsUploadingFile(null);
        }
    };

    const handleResourceFileUpload = async (weekId: string, dayId: string, resId: string, file: File) => {
        setIsUploadingFile(`${resId}-url`);
        try {
            const response = await fetch(`/api/admin/upload-file?filename=${encodeURIComponent(file.name)}`, {
                method: "POST",
                body: file,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al subir archivo");
            }

            const blob = await response.json();
            
            // Batch update all fields at once
            setCourse((prev: any) => ({
                ...prev,
                weeks: prev.weeks.map((w: any) => {
                    if (w.id === weekId) {
                        return {
                            ...w,
                            days: w.days.map((d: any) => {
                                if (d.id === dayId) {
                                    return {
                                        ...d,
                                        resources: d.resources.map((r: any) =>
                                            r.id === resId ? { 
                                                ...r, 
                                                url: blob.url, 
                                                title: r.title && !r.id.startsWith('new-res-') ? r.title : file.name,
                                                type: file.type.includes("pdf") ? "pdf" : "file" 
                                            } : r
                                        )
                                    };
                                }
                                return d;
                            })
                        };
                    }
                    return w;
                })
            }));
        } catch (error: any) {
            alert("Error: " + error.message);
            console.error(error);
        } finally {
            setIsUploadingFile(null);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        // Determine if we are dragging a week or a day
        const isActiveWeek = activeId.startsWith("w") || course.weeks.some((w: any) => w.id === activeId);
        const isOverWeek = overId.startsWith("w") || course.weeks.some((w: any) => w.id === overId);

        if (isActiveWeek) {
            // Reordering weeks
            const oldIndex = course.weeks.findIndex((w: any) => w.id === activeId);
            const newIndex = course.weeks.findIndex((w: any) => w.id === overId);

            if (oldIndex !== -1 && newIndex !== -1) {
                setCourse({
                    ...course,
                    weeks: arrayMove(course.weeks, oldIndex, newIndex)
                });
            }
        } else {
            // Reordering days
            let activeWeekId = "";
            let activeDayIndex = -1;
            let overWeekId = "";
            let overDayIndex = -1;

            course.weeks.forEach((w: any) => {
                const dIdx = w.days.findIndex((d: any) => d.id === activeId);
                if (dIdx !== -1) {
                    activeWeekId = w.id;
                    activeDayIndex = dIdx;
                }

                const oIdx = w.days.findIndex((d: any) => d.id === overId);
                if (oIdx !== -1) {
                    overWeekId = w.id;
                    overDayIndex = oIdx;
                }
            });

            // If we are dropping over a week directly (empty area of a week)
            if (isOverWeek && !overWeekId) {
                overWeekId = overId;
                overDayIndex = course.weeks.find((w: any) => w.id === overId)?.days.length || 0;
            }

            if (activeWeekId && overWeekId) {
                const newWeeks = [...course.weeks];
                const activeWeekIdx = newWeeks.findIndex(w => w.id === activeWeekId);
                const overWeekIdx = newWeeks.findIndex(w => w.id === overWeekId);

                const [movedDay] = newWeeks[activeWeekIdx].days.splice(activeDayIndex, 1);
                newWeeks[overWeekIdx].days.splice(overDayIndex === -1 ? newWeeks[overWeekIdx].days.length : overDayIndex, 0, movedDay);

                setCourse({
                    ...course,
                    weeks: newWeeks
                });
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await saveCourseData(course.id, course);
            if (res.success && res.course) {
                setCourse(buildCourseState(res.course));
                alert("Cambios guardados correctamente!");
            } else {
                alert("Error al guardar: " + res.error);
            }
        } catch (error) {
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    const [isDeletingFiles, setIsDeletingFiles] = useState(false);
    const handleDeleteFiles = async () => {
        if (!confirm("⚠️ ATENCIÓN: Estás a punto de borrar TODOS los archivos de entrega de este curso permanentemente (para liberar espacio en la nube). \n\nLas NOTAS y los COMENTARIOS se mantendrán intactos. ¿Deseas continuar?")) {
            return;
        }

        setIsDeletingFiles(true);
        try {
            const res = await deleteAllCourseFiles(course.id);
            if (res.success) {
                alert(`¡Éxito! Se han procesado ${res.deletedCount || 0} archivos.`);
            } else {
                alert("Error: " + res.error);
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setIsDeletingFiles(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 lg:h-[calc(100vh-80px)] overflow-visible lg:overflow-hidden">
            {/* Editor Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-glass-border)] pb-6">
                <div className="w-full sm:w-auto">
                    <Link
                        href="/admin/courses"
                        className="inline-flex items-center gap-2 text-[10px] md:text-xs text-[var(--color-primary)] hover:text-white transition-colors mb-2 font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft size={14} /> Volver a cursos
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3 truncate">
                        {course.title}
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Link
                        href={`/admin/courses/${course.id}/analytics`}
                        className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2"
                    >
                        <BarChart3 size={18} className="text-[var(--color-primary)]" />
                        <span className="text-sm">Ver Análisis</span>
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`${isSaving ? "opacity-70 cursor-not-allowed" : ""} bg-[var(--color-primary)] hover:bg-sky-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 glow-accent flex items-center justify-center gap-2`}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span className="text-sm">{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>
            </div>

            {/* Editor Main Area Layout */}
            <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-visible lg:overflow-hidden">

                {/* Left Sidebar Tabs */}
                <div className="w-full lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible custom-scrollbar pb-2 lg:pb-0">
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap ${activeTab === "settings"
                            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                            }`}
                    >
                        <Settings size={18} />
                        <div className="flex flex-col items-start">
                            <span>Ajustes del Curso</span>
                            <span className="text-[9px] text-slate-500 font-normal">Porcentajes de Evaluación</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab("curriculum")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap ${activeTab === "curriculum"
                            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                            }`}
                    >
                        <List size={18} />
                        Currículo / Temario
                    </button>

                    <button
                        onClick={() => setActiveTab("groups")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap ${activeTab === "groups"
                            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                            }`}
                    >
                        <Users size={18} />
                        Grupos de Estudiantes
                    </button>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 glass-effect rounded-2xl border border-[var(--color-glass-border)] overflow-visible lg:overflow-y-auto lg:custom-scrollbar p-4 sm:p-6">

                    {/* TAB 1: SETTINGS */}
                    {activeTab === "settings" && (
                        <div className="max-w-2xl space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Ajustes Generales</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Título del Curso</label>
                                <input
                                    type="text"
                                    value={course.title}
                                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                    className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Descripción (Visible en Dashboard)</label>
                                <textarea
                                    value={course.description}
                                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                    className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Estado de Publicación</label>
                                    <select
                                        value={course.status}
                                        onChange={(e) => setCourse({ ...course, status: e.target.value })}
                                        className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                    >
                                        <option value="draft">Borrador (Oculto)</option>
                                        <option value="published">Publicado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña de Acceso</label>
                                    <input
                                        type="text"
                                        value={course.password}
                                        onChange={(e) => setCourse({ ...course, password: e.target.value })}
                                        className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Los alumnos necesitan esto para entrar al curso.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">URL de Miniatura (Thumbnail)</label>
                                <input
                                    type="text"
                                    value={course.thumbnail}
                                    onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                                    className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Categoría del Curso</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {["Programación", "Bases de Datos", "Desarrollo Web", "Cloud", "Sistemas Operativos", "IA", "Scripting", "Seguridad"].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCourse({ ...course, category: cat })}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                course.category === cat 
                                                ? "bg-[var(--color-primary)] text-white" 
                                                : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={course.category}
                                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                                    placeholder="O escribe una categoría personalizada..."
                                    className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Seguridad del Código</h3>
                                        <p className="text-[10px] text-slate-500 mt-1">Habilita o deshabilita la protección contra copia en el editor.</p>
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={!!course.enableCopyPaste}
                                                onChange={(e) => setCourse({ ...course, enableCopyPaste: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest group-hover/toggle:text-white transition-colors">
                                            {course.enableCopyPaste ? "Copiado Permitido" : "Copiado Desactivado"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Porcentajes de Evaluación</h3>
                                <p className="text-sm text-slate-400 mb-6">Configura el peso de cada rubro. El total debe sumar 100%.</p>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Quices (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightQuiz}
                                            onChange={(e) => setCourse({ ...course, weightQuiz: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Laboratorios (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightLab}
                                            onChange={(e) => setCourse({ ...course, weightLab: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Foros (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightForum}
                                            onChange={(e) => setCourse({ ...course, weightForum: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Proyectos (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightProject}
                                            onChange={(e) => setCourse({ ...course, weightProject: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Exámenes (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightExam}
                                            onChange={(e) => setCourse({ ...course, weightExam: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white dark:bg-[rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <span className="text-slate-400">Total:</span>
                                    <span className={`font-bold ${(course.weightQuiz + course.weightLab + course.weightForum + course.weightProject + course.weightExam) === 100 ? "text-emerald-400" : "text-red-400"}`}>
                                        {course.weightQuiz + course.weightLab + course.weightForum + course.weightProject + course.weightExam}%
                                    </span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-rose-500/20 bg-rose-500/5 p-6 rounded-2xl">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert size={16} /> Zona de Mantenimiento
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed max-w-md">
                                            Elimina los archivos físicos (blobs) de las entregas de este curso para liberar espacio. Las notas se conservarán.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDeleteFiles}
                                        disabled={isDeletingFiles}
                                        className="w-full md:w-auto px-6 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        {isDeletingFiles ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        {isDeletingFiles ? "Borrando..." : "Limpiar Archivos de Curso"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: CURRICULUM BUILDER */}
                    {activeTab === "curriculum" && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Editor de Temario</h2>
                                    <p className="text-sm text-slate-400">Agrega semanas y secciones. Luego haz click en "Guardar Cambios".</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                    <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden self-start">
                                        <button
                                            onClick={expandAll}
                                            className="px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-all uppercase tracking-wider border-r border-slate-200 dark:border-white/10"
                                            title="Expandir todas las semanas y secciones"
                                        >
                                            Expandir Todo
                                        </button>
                                        <button
                                            onClick={collapseAll}
                                            className="px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-all uppercase tracking-wider"
                                            title="Contraer todas las semanas y secciones"
                                        >
                                            Contraer Todo
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddWeek}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-semibold flex-shrink-0 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-200 dark:border-white/10"
                                    >
                                        <Plus size={16} />
                                        Añadir Semana
                                    </button>
                                </div>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={course.weeks.map((w: any) => w.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4">
                                        {course.weeks.map((week: any, wIndex: number) => (
                                            <SortableItem key={week.id} id={week.id} className={`glass-effect border border-[var(--color-glass-border)] rounded-2xl overflow-visible shadow-lg flex flex-col w-full ${week.isVisible === false ? "opacity-60 bg-black/50" : ""}`}>
                                                {/* Week Header */}
                                                <div className="bg-slate-900/50 p-4 border-b border-[var(--color-glass-border)] flex items-center justify-between gap-4 w-full">
                                                    <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
                                                        <button
                                                            onClick={() => toggleWeek(week.id)}
                                                            className="text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            {expandedWeeks.includes(week.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                        </button>
                                                        <DragHandle>
                                                            <GripVertical className="text-slate-600 hover:text-slate-400 transition-colors" size={18} />
                                                        </DragHandle>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <input
                                                            type="text"
                                                            value={week.title}
                                                            onChange={(e) => handleUpdateWeek(week.id, e.target.value)}
                                                            className="bg-transparent border-none text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded px-2 w-full max-w-sm transition-all"
                                                            placeholder="Ej. Semana 1: Introducción"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-black/30 border border-white/5 rounded-lg mr-2 overflow-hidden">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); expandAllWeekDays(week.id); }}
                                                                className="px-2 py-1.5 text-[9px] font-black text-slate-500 hover:text-emerald-400 hover:bg-white/5 transition-all uppercase tracking-tighter border-r border-white/5"
                                                                title="Expandir todas las secciones de esta semana"
                                                            >
                                                                Secciones <ChevronDown size={10} className="inline ml-1" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); collapseAllWeekDays(week.id); }}
                                                                className="px-2 py-1.5 text-[9px] font-black text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-all uppercase tracking-tighter"
                                                                title="Contraer todas las secciones de esta semana"
                                                            >
                                                                <ChevronRight size={10} className="inline mr-1" /> Secciones
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => handleToggleWeekVisibility(week.id, week.isVisible !== false)}
                                                            className={`text-slate-500 hover:text-white transition-colors p-2 rounded-lg ${week.isVisible === false ? "text-slate-600 bg-slate-800/50 hover:bg-slate-700/50" : "hover:bg-slate-800/80"}`}
                                                            title={week.isVisible === false ? "Mostrar Semana a los Alumnos" : "Ocultar Semana a los Alumnos"}
                                                        >
                                                            {week.isVisible === false ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDuplicateWeek(week)}
                                                            className="text-slate-500 hover:text-emerald-400 transition-colors p-2 rounded-lg hover:bg-emerald-500/10"
                                                            title="Duplicar Semana"
                                                        >
                                                            <Copy size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteWeek(week.id)}
                                                            className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                            title="Eliminar Semana"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Days List (Collapsible) */}
                                                {expandedWeeks.includes(week.id) && (
                                                    <div className="p-4 space-y-4">
                                                        <SortableContext
                                                            items={week.days.map((d: any) => d.id)}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            {week.days.map((day: any, dIndex: number) => (
                                                                <SortableItem key={day.id} id={day.id} containerId={`day-container-${day.id}`} className={`bg-white dark:bg-black/30 border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col gap-4 relative group ${day.isVisible === false ? "opacity-60 bg-black/60 border-dashed" : ""}`}>

                                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                                                        <button
                                                                            onClick={() => handleUpdateDay(week.id, day.id, "isVisible", day.isVisible === false ? true : false)}
                                                                            className="text-slate-500 hover:text-white transition-colors"
                                                                            title={day.isVisible === false ? "Mostrar Sección a los Alumnos" : "Ocultar Sección a los Alumnos"}
                                                                        >
                                                                            {day.isVisible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteDay(week.id, day.id)}
                                                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex items-center gap-3 w-full pr-8">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={() => toggleDay(day.id)}
                                                                                className="text-slate-400 hover:text-white transition-colors p-1"
                                                                            >
                                                                                {expandedDays.includes(day.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                            </button>
                                                                            <DragHandle>
                                                                                <GripVertical className="text-slate-600 hover:text-slate-400 transition-colors" size={16} />
                                                                            </DragHandle>
                                                                            <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Sección {dIndex + 1}</span>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={day.title}
                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "title", e.target.value)}
                                                                            className="bg-transparent border-b border-transparent text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-[var(--color-primary)] px-1 w-full transition-all"
                                                                            placeholder="Título de la sección"
                                                                        />
                                                                    </div>


                                                                    {expandedDays.includes(day.id) && (
                                                                        <>
                                                                            <div className="flex flex-col gap-4 mt-2">
                                                                                <div className="space-y-1">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                                            <Upload size={12} /> Imagen de Portada (Sección)
                                                                                        </label>
                                                                                        <div className="flex items-center gap-2">
                                                                                                <div className="relative">
                                                                                                    <input
                                                                                                        type="file"
                                                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                                        accept="image/*"
                                                                                                        onChange={(e) => {
                                                                                                            const f = e.target.files?.[0];
                                                                                                            if (f) handleFileUpload(week.id, day.id, f, "thumbnail");
                                                                                                        }}
                                                                                                        disabled={isUploadingFile === `${day.id}-thumbnail`}
                                                                                                    />
                                                                                                    <div
                                                                                                        className={`${isUploadingFile === `${day.id}-thumbnail` ? "opacity-70" : ""} flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-[var(--color-primary)]/10 px-2 py-1 rounded border border-[var(--color-primary)]/20`}
                                                                                                    >
                                                                                                        {isUploadingFile === `${day.id}-thumbnail` ? (
                                                                                                            <Loader2 size={12} className="animate-spin" />
                                                                                                        ) : (
                                                                                                            <Plus size={12} />
                                                                                                        )}
                                                                                                        {isUploadingFile === `${day.id}-thumbnail` ? "Subiendo..." : "Subir Portada"}
                                                                                                    </div>
                                                                                                </div>
                                                                                                {day.thumbnail && (
                                                                                                    <a
                                                                                                        href={day.thumbnail}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        download
                                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10"
                                                                                                    >
                                                                                                        <ExternalLink size={12} /> Ver
                                                                                                    </a>
                                                                                                )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex gap-4 items-center">
                                                                                        {day.thumbnail && (
                                                                                            <div className="w-20 h-12 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                                                                                                <img src={day.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                                                                            </div>
                                                                                        )}
                                                                                        <input
                                                                                            type="text"
                                                                                            value={day.thumbnail || ""}
                                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "thumbnail", e.target.value)}
                                                                                            className="w-full bg-white dark:bg-[rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/30 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                                            placeholder="URL de imagen o subir archivo..."
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                                        <Video size={12} /> ID de YouTube
                                                                                    </label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={day.videoId || ""}
                                                                                        onChange={(e) => handleUpdateDay(week.id, day.id, "videoId", e.target.value)}
                                                                                        className="w-full bg-white dark:bg-[rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/30 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                                        placeholder="Ej. dQw4w9WgXcQ"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                                            <Link2 size={12} /> Material Adicional (Ej. GitHub, PDF)
                                                                                        </label>
                                                                                        <div className="flex items-center gap-2">
                                                                                                <div className="relative">
                                                                                                    <input
                                                                                                        type="file"
                                                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                                        accept=".pdf,.doc,.docx,.zip,.rar,.md"
                                                                                                        onChange={(e) => {
                                                                                                            const f = e.target.files?.[0];
                                                                                                            if (f) handleFileUpload(week.id, day.id, f, "materialUrl");
                                                                                                        }}
                                                                                                        disabled={isUploadingFile === `${day.id}-materialUrl`}
                                                                                                    />
                                                                                                    <div
                                                                                                        className={`${isUploadingFile === `${day.id}-materialUrl` ? "opacity-70" : ""} flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20`}
                                                                                                    >
                                                                                                        {isUploadingFile === `${day.id}-materialUrl` ? (
                                                                                                            <Loader2 size={12} className="animate-spin" />
                                                                                                        ) : (
                                                                                                            <Plus size={12} />
                                                                                                        )}
                                                                                                        {isUploadingFile === `${day.id}-materialUrl` ? "Subiendo..." : "Subir Archivo"}
                                                                                                    </div>
                                                                                                </div>
                                                                                                {day.materialUrl && (
                                                                                                    <a
                                                                                                        href={day.materialUrl}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-white transition-colors uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                                                                                                    >
                                                                                                        <Download size={12} /> Descargar
                                                                                                    </a>
                                                                                                )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={day.materialUrl || ""}
                                                                                        onChange={(e) => handleUpdateDay(week.id, day.id, "materialUrl", e.target.value)}
                                                                                        className="w-full bg-white dark:bg-[rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/30 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                                        placeholder="https://github.com/... o subir archivo"
                                                                                    />
                                                                                </div>

                                                                                <div className="space-y-1">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                                            <FileText size={12} className="text-[var(--color-primary)]" /> Resumen de la Clase (PDF)
                                                                                        </label>
                                                                                        <div className="flex items-center gap-2">
                                                                                                <div className="relative">
                                                                                                    <input
                                                                                                        type="file"
                                                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                                        accept=".pdf"
                                                                                                        onChange={(e) => {
                                                                                                            const f = e.target.files?.[0];
                                                                                                            if (f) handleFileUpload(week.id, day.id, f, "summaryUrl");
                                                                                                        }}
                                                                                                        disabled={isUploadingFile === `${day.id}-summaryUrl`}
                                                                                                    />
                                                                                                    <div
                                                                                                        className={`${isUploadingFile === `${day.id}-summaryUrl` ? "opacity-70" : ""} flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20`}
                                                                                                    >
                                                                                                        {isUploadingFile === `${day.id}-summaryUrl` ? (
                                                                                                            <Loader2 size={12} className="animate-spin" />
                                                                                                        ) : (
                                                                                                            <Upload size={12} />
                                                                                                        )}
                                                                                                        {isUploadingFile === `${day.id}-summaryUrl` ? "Subiendo..." : "Subir Resumen"}
                                                                                                    </div>
                                                                                                </div>
                                                                                                {day.summaryUrl && (
                                                                                                    <a
                                                                                                        href={day.summaryUrl}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        download
                                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 hover:text-white transition-colors uppercase tracking-widest bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20"
                                                                                                    >
                                                                                                        <Download size={12} /> Descargar
                                                                                                    </a>
                                                                                                )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={day.summaryUrl || ""}
                                                                                        onChange={(e) => handleUpdateDay(week.id, day.id, "summaryUrl", e.target.value)}
                                                                                        className="w-full bg-white dark:bg-[rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/30 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                                        placeholder="URL del PDF de resumen o subir archivo"
                                                                                    />
                                                                                                                       {/* Multi-Resource Section */}
                                                                                <div 
                                                                                    className="pt-6 border-t border-slate-800/50 space-y-4"
                                                                                    onDragOver={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                    }}
                                                                                    onDrop={async (e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        const files = Array.from(e.dataTransfer.files);
                                                                                        for (const file of files) {
                                                                                            // Create a new resource first
                                                                                            const newResId = `new-res-${Date.now()}-${Math.random()}`;
                                                                                            const newRes = {
                                                                                                id: newResId,
                                                                                                title: file.name,
                                                                                                url: "",
                                                                                                type: file.type.includes("pdf") ? "pdf" : "file",
                                                                                                isVisible: true
                                                                                            };
                                                                                            
                                                                                            // Add to state
                                                                                            setCourse((prevCourse: any) => ({
                                                                                                ...prevCourse,
                                                                                                weeks: prevCourse.weeks.map((w: any) => {
                                                                                                    if (w.id === week.id) {
                                                                                                        return {
                                                                                                            ...w,
                                                                                                            days: w.days.map((d: any) => {
                                                                                                                if (d.id === day.id) {
                                                                                                                    return { ...d, resources: [...(d.resources || []), newRes] };
                                                                                                                }
                                                                                                                return d;
                                                                                                            })
                                                                                                        };
                                                                                                    }
                                                                                                    return w;
                                                                                                })
                                                                                            }));

                                                                                            // Upload
                                                                                            handleResourceFileUpload(week.id, day.id, newResId, file);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Tags size={16} className="text-[var(--color-primary)]" />
                                                                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Materiales de la Clase (Arrastra archivos aquí)</h4>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => handleAddResource(week.id, day.id)}
                                                                                            className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-[var(--color-primary)]/10 px-2 py-1 rounded border border-[var(--color-primary)]/20"
                                                                                        >
                                                                                            <Plus size={12} /> Añadir Material
                                                                                        </button>
                                                                                    </div>

                                                                                    <div className="flex flex-col gap-2">
                                                                                        {day.resources?.map((res: any) => (
                                                                                            <div key={res.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-4 group/res hover:bg-white/[0.04] transition-all">
                                                                                                <div className="flex-shrink-0">
                                                                                                    {res.url ? (
                                                                                                        <a 
                                                                                                            href={res.url} 
                                                                                                            target="_blank" 
                                                                                                            rel="noopener noreferrer"
                                                                                                            className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/20 hover:scale-105 transition-all"
                                                                                                            title="Ver o Descargar"
                                                                                                        >
                                                                                                            {res.type === "pdf" ? <FileText size={20} /> : <Download size={20} />}
                                                                                                        </a>
                                                                                                    ) : (
                                                                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-700">
                                                                                                            {res.type === "pdf" ? <FileText size={20} /> : <Download size={20} />}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>

                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        placeholder="Título del material..."
                                                                                                        value={res.title || ""}
                                                                                                        onChange={(e) => handleUpdateResource(week.id, day.id, res.id, "title", e.target.value)}
                                                                                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-white focus:outline-none focus:ring-0 placeholder:text-slate-600"
                                                                                                    />
                                                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="URL o enlace..."
                                                                                                            value={res.url || ""}
                                                                                                            onChange={(e) => handleUpdateResource(week.id, day.id, res.id, "url", e.target.value)}
                                                                                                            className="flex-1 bg-transparent border-none p-0 text-[10px] text-slate-500 font-medium focus:outline-none focus:ring-0 placeholder:text-slate-700 truncate"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="flex items-center gap-1.5 pr-1">
                                                                                                    <button
                                                                                                        onClick={() => handleUpdateResource(week.id, day.id, res.id, "isVisible", !res.isVisible)}
                                                                                                        className={`p-2 rounded-lg transition-all border ${res.isVisible ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-500/10 border-slate-500/10"}`}
                                                                                                        title={res.isVisible ? "Visible para estudiantes" : "Oculto para estudiantes"}
                                                                                                    >
                                                                                                        {res.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                                                                    </button>

                                                                                                    <div className="relative">
                                                                                                        <input
                                                                                                            type="file"
                                                                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                                            onChange={(e) => {
                                                                                                                const f = e.target.files?.[0];
                                                                                                                if (f) handleResourceFileUpload(week.id, day.id, res.id, f);
                                                                                                            }}
                                                                                                        />
                                                                                                        <div className="p-2 text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-lg transition-all cursor-pointer hover:bg-[var(--color-primary)]/20">
                                                                                                            {isUploadingFile === `${res.id}-url` ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    <button
                                                                                                        onClick={() => handleDeleteResource(week.id, day.id, res.id)}
                                                                                                        className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                                                                        title="Eliminar"
                                                                                                    >
                                                                                                        <Trash2 size={16} />
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                    
                                                                                    {(!day.resources || day.resources.length === 0) && (
                                                                                        <div className="text-center py-8 border-2 border-dashed border-slate-800/50 rounded-2xl bg-black/10 hover:border-slate-700 transition-colors">
                                                                                            <div className="flex flex-col items-center gap-2">
                                                                                                <Upload size={24} className="text-slate-700" />
                                                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suelta tus archivos aquí para subirlos automáticamente</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                             </div>
                                                   </div>

                                                                                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4">
                                                                                    <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                                                        <div className="relative inline-flex items-center">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="sr-only peer"
                                                                                                checked={!!day.isDeliveryDay}
                                                                                                onChange={(e) => {
                                                                                                    const checked = e.target.checked;
                                                                                                    handleUpdateDay(week.id, day.id, "isDeliveryDay", checked);
                                                                                                    if (checked && (!day.assignments || day.assignments.length === 0)) {
                                                                                                        handleAddAssignment(week.id, day.id);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                                                                                        </div>
                                                                                        <span className="text-xs font-bold text-white uppercase tracking-widest group-hover/toggle:text-[var(--color-primary)] transition-colors">Sección con Evaluación</span>
                                                                                    </label>

                                                                                    {day.isDeliveryDay && (
                                                                                        <button
                                                                                            onClick={() => handleAddAssignment(week.id, day.id)}
                                                                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--color-primary)] hover:text-white transition-colors bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/50"
                                                                                        >
                                                                                            <Plus size={14} />
                                                                                            Añadir Evaluación
                                                                                        </button>
                                                                                    )}

                                                                                    {day.isDeliveryDay && !day.id.startsWith("new-") && (
                                                                                        <Link
                                                                                            href={`/admin/courses/${course.id}/submissions/${day.id}`}
                                                                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-400 hover:text-white transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/50"
                                                                                        >
                                                                                            <Eye size={14} />
                                                                                            Ver Entregas
                                                                                        </Link>
                                                                                    )}
                                                                                </div>

                                                                                {day.isDeliveryDay && day.assignments && day.assignments.length > 0 && (
                                                                                    <div className="space-y-6 pt-4 border-t border-slate-800/50">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <FileCheck size={16} className="text-[var(--color-primary)]" />
                                                                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lista de Evaluaciones</h4>
                                                                                        </div>
                                                                                        
                                                                                        {day.assignments.map((assignment: any) => (
                                                                                            <div key={assignment.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                                                <div className="flex items-center justify-between gap-4">
                                                                                                    <div className="flex items-center gap-3 flex-1">
                                                                                                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-xs">
                                                                                                            {assignment.assignmentType?.charAt(0) || "L"}
                                                                                                        </div>
                                                                                                        <input 
                                                                                                            type="text"
                                                                                                            value={assignment.title || ""}
                                                                                                            onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "title", e.target.value)}
                                                                                                            placeholder="Ej: Laboratorio A, Quiz 1..."
                                                                                                            className="bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0 placeholder:text-slate-600 flex-1"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <button 
                                                                                                            onClick={() => setMovingAssignment(assignment)}
                                                                                                            className="text-sky-400/50 hover:text-sky-400 transition-colors p-2 hover:bg-sky-500/10 rounded-lg"
                                                                                                            title="Mover a otra sección"
                                                                                                        >
                                                                                                            <Move size={18} />
                                                                                                        </button>
                                                                                                        <button 
                                                                                                            onClick={() => handleDeleteAssignment(week.id, day.id, assignment.id)}
                                                                                                            className="text-rose-500/30 hover:text-rose-500 transition-colors p-2 hover:bg-rose-500/10 rounded-lg"
                                                                                                            title="Eliminar esta evaluación"
                                                                                                        >
                                                                                                            <Trash2 size={18} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                                                                    <div className="space-y-2">
                                                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tipo</label>
                                                                                                        <select
                                                                                                            value={assignment.assignmentType || "LAB"}
                                                                                                            onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "assignmentType", e.target.value)}
                                                                                                            className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-all"
                                                                                                        >
                                                                                                            <option value="QUIZ">Quiz / Prueba</option>
                                                                                                            <option value="LAB">Laboratorio</option>
                                                                                                            <option value="PROJECT">Proyecto</option>
                                                                                                            <option value="EXAM">Examen</option>
                                                                                                            <option value="FORUM">Foro</option>
                                                                                                        </select>
                                                                                                    </div>

                                                                                                    <div className="space-y-2">
                                                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Disponible</label>
                                                                                                        <input
                                                                                                            type="datetime-local"
                                                                                                            value={assignment.availableFrom ? toLocalDatetimeInput(assignment.availableFrom) : ""}
                                                                                                            onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "availableFrom", e.target.value ? new Date(e.target.value).toISOString() : null)}
                                                                                                            className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                                                                                        />
                                                                                                    </div>

                                                                                                    <div className="space-y-2">
                                                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Límite</label>
                                                                                                        <input
                                                                                                            type="datetime-local"
                                                                                                            value={assignment.dueDate ? toLocalDatetimeInput(assignment.dueDate) : ""}
                                                                                                            onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
                                                                                                            className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                                                                                                        />
                                                                                                    </div>

                                                                                                    <div className="space-y-2">
                                                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tiempo (Min)</label>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            value={assignment.timeLimit || ""}
                                                                                                            onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "timeLimit", parseInt(e.target.value) || null)}
                                                                                                            className="w-full bg-black/40 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                                                                                                            placeholder="Ilimitado"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="space-y-3">
                                                                                                    <div className="flex items-center justify-between">
                                                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción / Enunciado (Markdown)</label>
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <div className="relative">
                                                                                                                <input
                                                                                                                    type="file"
                                                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                                                    accept=".pdf,.doc,.docx,.zip"
                                                                                                                    onChange={(e) => {
                                                                                                                        const f = e.target.files?.[0];
                                                                                                                        if (f) handleAssignmentFileUpload(week.id, day.id, assignment.id, f, "assignmentUrl");
                                                                                                                    }}
                                                                                                                />
                                                                                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">
                                                                                                                    {isUploadingFile === `${assignment.id}-assignmentUrl` ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                                                                                                                    Subir PDF
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            {assignment.assignmentUrl && (
                                                                                                                <a href={assignment.assignmentUrl} target="_blank" className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Ver Material</a>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <textarea
                                                                                                        value={assignment.exerciseDescription || ""}
                                                                                                        onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "exerciseDescription", e.target.value)}
                                                                                                        placeholder="Escribe el problema o instrucciones aquí..."
                                                                                                        className="w-full h-24 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500 transition-all resize-y"
                                                                                                    />
                                                                                                </div>

                                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                                                                                    <div className="space-y-4">
                                                                                                        <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                                                                            <div className="relative inline-flex items-center">
                                                                                                                <input
                                                                                                                    type="checkbox"
                                                                                                                    className="sr-only peer"
                                                                                                                    checked={!!assignment.enablePlagiarism}
                                                                                                                    onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "enablePlagiarism", e.target.checked)}
                                                                                                                />
                                                                                                                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                                                                                            </div>
                                                                                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Detección de Plagio</span>
                                                                                                        </label>

                                                                                                        <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                                                                            <div className="relative inline-flex items-center">
                                                                                                                <input
                                                                                                                    type="checkbox"
                                                                                                                    className="sr-only peer"
                                                                                                                    checked={!!assignment.isCodingExercise}
                                                                                                                    onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "isCodingExercise", e.target.checked)}
                                                                                                                />
                                                                                                                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                                                            </div>
                                                                                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Ejercicio de Código</span>
                                                                                                        </label>
                                                                                                    </div>

                                                                                                    <div className="space-y-3">
                                                                                                        <div className="flex items-center justify-between">
                                                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Severidad Calificación IA</label>
                                                                                                            <span className="text-xs font-bold text-[var(--color-primary)]">Nivel {assignment.gradingSeverity || 1}</span>
                                                                                                        </div>
                                                                                                        <input
                                                                                                            type="range"
                                                                                                            min="1"
                                                                                                            max="5"
                                                                                                            step="1"
                                                                                                            value={assignment.gradingSeverity || 1}
                                                                                                            onChange={(e) => handleUpdateAssignment(week.id, day.id, assignment.id, "gradingSeverity", parseInt(e.target.value))}
                                                                                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                                                                                                        />
                                                                                                        <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase">
                                                                                                            <span>Flexible</span>
                                                                                                            <span>Balanceada</span>
                                                                                                            <span>Estricta</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {assignment.isCodingExercise && (
                                                                                                    <div className="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                                                        <div className="flex items-center justify-between">
                                                                                                            <h5 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Casos de Prueba (IDE)</h5>
                                                                                                            <button
                                                                                                                onClick={() => {
                                                                                                                    const currentTestCases = Array.isArray(assignment.testCases) ? [...assignment.testCases] : [];
                                                                                                                    handleUpdateAssignment(week.id, day.id, assignment.id, "testCases", [...currentTestCases, { input: "", output: "" }]);
                                                                                                                }}
                                                                                                                className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                                                                                                            >
                                                                                                                <Plus size={12} /> Añadir Caso
                                                                                                            </button>
                                                                                                        </div>
                                                                                                        <div className="grid grid-cols-1 gap-3">
                                                                                                            {Array.isArray(assignment.testCases) && assignment.testCases.map((tc: any, tcIdx: number) => (
                                                                                                                <div key={tcIdx} className="flex gap-2 items-start bg-black/40 p-3 rounded-xl border border-white/5">
                                                                                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                                                                                        <textarea
                                                                                                                            value={tc.input}
                                                                                                                            onChange={(e) => {
                                                                                                                                const newTc = [...assignment.testCases];
                                                                                                                                newTc[tcIdx].input = e.target.value;
                                                                                                                                handleUpdateAssignment(week.id, day.id, assignment.id, "testCases", newTc);
                                                                                                                            }}
                                                                                                                            placeholder="Input..."
                                                                                                                            className="w-full h-16 bg-black/20 border border-slate-800 rounded p-2 text-xs text-sky-300 font-mono focus:outline-none"
                                                                                                                        />
                                                                                                                        <textarea
                                                                                                                            value={tc.output}
                                                                                                                            onChange={(e) => {
                                                                                                                                const newTc = [...assignment.testCases];
                                                                                                                                newTc[tcIdx].output = e.target.value;
                                                                                                                                handleUpdateAssignment(week.id, day.id, assignment.id, "testCases", newTc);
                                                                                                                            }}
                                                                                                                            placeholder="Output..."
                                                                                                                            className="w-full h-16 bg-black/20 border border-slate-800 rounded p-2 text-xs text-emerald-400 font-mono focus:outline-none"
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                    <button
                                                                                                                        onClick={() => {
                                                                                                                            const newTc = assignment.testCases.filter((_: any, i: number) => i !== tcIdx);
                                                                                                                            handleUpdateAssignment(week.id, day.id, assignment.id, "testCases", newTc);
                                                                                                                        }}
                                                                                                                        className="text-rose-500/50 hover:text-rose-500 p-2"
                                                                                                                    >
                                                                                                                        <Trash2 size={14} />
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                        </>
                                                                    )}
                                                                </SortableItem>
                                                            ))}
                                                            <button
                                                                onClick={() => handleAddDay(week.id)}
                                                                className="w-full border-2 border-dashed border-slate-700 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 text-slate-400 hover:text-[var(--color-primary)] font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                                                            >
                                                                <Plus size={16} /> Agregar Sección a {week.title}
                                                            </button>
                                                        </SortableContext>
                                                    </div>
                                                )}
                                            </SortableItem>
                                        ))}


                                        {course.weeks.length === 0 && (
                                            <div className="p-10 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center">
                                                <List className="w-12 h-12 text-slate-600 mb-4" />
                                                <h3 className="text-lg font-bold text-slate-300 mb-2">Currículo Vacío</h3>
                                                <p className="text-slate-500 max-w-sm mb-6">Comienza construyendo tu temario agregando una nueva semana.</p>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* TAB 3: GROUPS */}
                    {activeTab === "groups" && (
                        <div className="h-full flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-sm md:text-xl font-bold text-white mb-2 italic flex items-center gap-2">
                                    <Users className="text-[var(--color-primary)]" size={24} />
                                    Gestionar Grupos
                                </h2>
                                <p className="text-xs md:text-sm text-slate-400">
                                    Crea grupos para entregas compartidas. Si un integrante del grupo hace una entrega, contará para todos los miembros.
                                </p>
                            </div>
                            <GroupManagement courseId={course.id} />
                        </div>
                    )}
                </div>
            </div>

            {/* Move Assignment Modal */}
            {movingAssignment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h3 className="text-lg font-bold text-white">Mover Evaluación</h3>
                                <p className="text-xs text-slate-400 mt-1">Selecciona el destino para: <span className="text-[var(--color-primary)] font-bold">{movingAssignment.title || "Evaluación sin título"}</span></p>
                            </div>
                            <button onClick={() => setMovingAssignment(null)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                            {course.weeks.map((week: any) => (
                                <div key={week.id} className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="h-px flex-1 bg-slate-800"></div>
                                        {week.title}
                                        <div className="h-px flex-1 bg-slate-800"></div>
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {week.days.map((day: any) => (
                                            <button
                                                key={day.id}
                                                onClick={() => onMoveAssignment(day.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${day.id === movingAssignment.dayId ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/5 hover:border-[var(--color-primary)]/50 hover:bg-white/[0.08]'}`}
                                                disabled={day.id === movingAssignment.dayId}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${day.id === movingAssignment.dayId ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-800 text-slate-400 group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/10'}`}>
                                                        {day.order}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-200 group-hover:text-white">{day.title}</span>
                                                </div>
                                                {day.id === movingAssignment.dayId && (
                                                    <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Origen</span>
                                                )}
                                                {day.id !== movingAssignment.dayId && (
                                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-[var(--color-primary)] transition-transform group-hover:translate-x-1" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
                            <button
                                onClick={() => setMovingAssignment(null)}
                                className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
