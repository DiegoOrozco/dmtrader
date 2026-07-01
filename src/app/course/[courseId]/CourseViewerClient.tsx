"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, PlayCircle, FileText, Download, MessageSquare, Send, User, Menu, X, BookOpen, ChevronDown, ChevronRight, Lock, Clock, Link2, ExternalLink, Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize } from "lucide-react";
import { createPost } from "@/actions/forum";
import DayForum from "@/components/DayForum";
import VideoQA from "@/components/VideoQA";

export default function CourseViewerClient({ course, studentId, userRole }: { course: any, studentId: string, userRole?: string }) {
    const searchParams = useSearchParams();
    const dayId = searchParams.get("dayId");

    // If course has no weeks, safely fallback so UI doesn't crash
    const initialWeek = course.weeks?.[0] || { id: "0", title: "No content", days: [] };
    const initialDay = initialWeek.days?.[0] || { id: "0", title: "No content", videoId: "", materialUrl: "", posts: [], replies: [] };

    const [activeWeek, setActiveWeek] = useState(initialWeek);
    const [activeDay, setActiveDay] = useState(initialDay);

    // Deep-link effect: if dayId is in URL, find and set it
    useEffect(() => {
        if (dayId && course.weeks) {
            for (const week of course.weeks) {
                const day = week.days.find((d: any) => d.id === dayId);
                if (day) {
                    setActiveWeek(week);
                    setActiveDay(day);
                    break;
                }
            }
        }
    }, [dayId, course.weeks]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Sync active day with fresh server props to update comments automatically
    const dayFromCourse = course.weeks?.find((w: any) => w.id === activeWeek.id)?.days?.find((d: any) => d.id === activeDay.id);
    const activeDayData = dayFromCourse || activeDay;

    // Prevent hydration mismatches with dates and complex UI
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const isNotAvailableYet = isMounted && userRole !== "ADMIN" && activeDay.availableFrom && new Date() < new Date(activeDay.availableFrom);

    const formatDate = (date: any) => {
        if (!isMounted || !date) return "...";
        try {
            return new Date(date).toLocaleDateString();
        } catch {
            return "...";
        }
    };

    const formatFullDate = (utcString: string) => {
        if (!isMounted || !utcString) return "...";
        return new Date(utcString).toLocaleString("es-CR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Accurate video progress via YouTube IFrame API
    const playerRef = useRef<any>(null);
    const playerDivRef = useRef<HTMLDivElement | null>(null);
    const lastSentAtRef = useRef<number>(0);
    const lastSecondsRef = useRef<number>(0);
    const [usePlainIframe, setUsePlainIframe] = useState(false);

    // Custom Player states
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Update time slider while playing
    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                const p = playerRef.current;
                if (p && typeof p.getCurrentTime === "function") {
                    setCurrentTime(p.getCurrentTime());
                    if (p.getDuration) {
                        setDuration(p.getDuration());
                    }
                }
            }, 250);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying]);

    // Handle Esc key or other ways exiting fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === containerRef.current);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const togglePlay = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const p = playerRef.current;
        if (!p) return;
        const state = p.getPlayerState?.();
        const YT = (window as any).YT;
        if (state === YT?.PlayerState.PLAYING) {
            p.pauseVideo();
            setIsPlaying(false);
        } else {
            p.playVideo();
            setIsPlaying(true);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const p = playerRef.current;
        if (!p) return;
        const val = parseFloat(e.target.value);
        p.seekTo(val, true);
        setCurrentTime(val);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const p = playerRef.current;
        if (!p) return;
        const val = parseInt(e.target.value);
        p.setVolume(val);
        setVolume(val);
        if (val > 0) {
            p.unMute();
            setIsMuted(false);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const p = playerRef.current;
        if (!p) return;
        if (p.isMuted()) {
            p.unMute();
            setIsMuted(false);
        } else {
            p.mute();
            setIsMuted(true);
        }
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    const formatTime = (secs: number) => {
        if (isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    // RESTORATION FROM LOCALSTORAGE OR PROPS
    const getLocalProgress = () => {
        try {
            const saved = localStorage.getItem(`video_progress_${activeDay.id}`);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    };

    const saveLocalProgress = (seconds: number, percent: number | null) => {
        try {
            localStorage.setItem(`video_progress_${activeDay.id}`, JSON.stringify({
                seconds,
                percent,
                timestamp: Date.now()
            }));
        } catch { }
    };

    const sendProgress = async (seconds: number, percent: number | null, isUnload = false) => {
        const now = Date.now();
        // ONLY sync to DB on manual Pause, End, or Exit. 
        // No periodic intervals anymore.
        lastSentAtRef.current = now;
        lastSecondsRef.current = seconds;
        saveLocalProgress(seconds, percent);

        try {
            await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dayId: activeDay.id, seconds: Math.floor(seconds), percent: percent ?? undefined }),
                keepalive: isUnload
            });
            console.log("Progress synced to DB:", { seconds, percent });
        } catch { }
    };

    const sendCurrentProgress = (isUnload = false) => {
        const p: any = playerRef.current;
        if (!p || typeof p.getCurrentTime !== "function") return;
        const sec = p.getCurrentTime() || 0;
        const dur = p.getDuration && p.getDuration() ? p.getDuration() : 0;
        const pct = dur > 0 ? Math.min(100, Math.round((sec / dur) * 100)) : null;
        sendProgress(sec, pct, isUnload);
    };

    // LOCAL-ONLY INTERVAL: Save to localStorage every 5s (No DB calls)
    useEffect(() => {
        const interval = setInterval(() => {
            const p: any = playerRef.current;
            if (p && typeof p.getCurrentTime === "function" && p.getPlayerState?.() === 1) { // 1 = PLAYING
                const sec = p.getCurrentTime();
                const dur = p.getDuration();
                const pct = dur > 0 ? Math.min(100, Math.round((sec / dur) * 100)) : null;
                saveLocalProgress(sec, pct);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeDay.id]);

    useEffect(() => {
        const handleBeforeUnload = () => sendCurrentProgress(true);
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [activeDay.id]);

    // Load YT script and instantiate player per active day
    useEffect(() => {
        if (!activeDay.videoId || isNotAvailableYet) return;
        let cancelled = false;

        const ensureYT = () => new Promise<void>((resolve) => {
            const w = window as any;
            if (w.YT && w.YT.Player) {
                resolve();
                return;
            }
            const check = () => {
                if (w.YT && w.YT.Player) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            if (document.getElementById("yt-iframe-api")) {
                check();
                return;
            }
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            tag.id = "yt-iframe-api";
            document.body.appendChild(tag);
            const prev = w.onYouTubeIframeAPIReady;
            w.onYouTubeIframeAPIReady = () => {
                if (prev) prev();
                resolve();
            };
        });

        (async () => {
            try {
                await ensureYT();
                if (cancelled || !playerDivRef.current) return;
                try { playerRef.current?.destroy?.(); } catch { }
                
                // Create a dedicated child element for YT to replace
                // so React's reference to playerDivRef.current remains intact.
                playerDivRef.current.innerHTML = '<div class="w-full h-full"></div>';
                const playerElement = playerDivRef.current.firstChild;

                // Try to resume from local or props
                const local = getLocalProgress();
                const startSeconds = local?.seconds || activeDay.seconds || 0;

                playerRef.current = new (window as any).YT.Player(playerElement, {
                    videoId: activeDay.videoId,
                    playerVars: { 
                        rel: 0, 
                        modestbranding: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        iv_load_policy: 3,
                        showinfo: 0,
                        ecver: 2,
                        start: Math.floor(startSeconds)
                    },
                    events: {
                        onReady: () => {
                            if (playerRef.current) {
                                setDuration(playerRef.current.getDuration() || 0);
                                setVolume(playerRef.current.getVolume() || 100);
                                setIsMuted(playerRef.current.isMuted() || false);
                            }
                        },
                        onStateChange: (e: any) => {
                            const YT = (window as any).YT;
                            const p: any = playerRef.current;
                            const sec = p?.getCurrentTime ? p.getCurrentTime() : 0;
                            const dur = p?.getDuration ? p.getDuration() : 0;
                            const pct = dur > 0 ? Math.min(100, Math.round((sec / dur) * 100)) : null;
                            
                            setIsPlaying(e.data === YT.PlayerState.PLAYING);

                            // SYNC TO DB ONLY ON MANUAL EVENTS
                            if (e.data === YT.PlayerState.PAUSED) { 
                                sendProgress(sec, pct); 
                            }
                            else if (e.data === YT.PlayerState.ENDED) { 
                                sendProgress(dur || sec, 100); 
                            }
                        }
                    }
                });
            } catch (err) {
                setUsePlainIframe(true);
            }
        })();

        return () => {
            cancelled = true;
            sendCurrentProgress(true); // Exit sync
            try { playerRef.current?.destroy?.(); } catch { }
            playerRef.current = null;
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDay.id, activeDay.videoId]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-slate-100 flex flex-col">
            {/* Top Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0a0e1a]/80 backdrop-blur-md px-4 sm:px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <Link
                            href="/"
                            className="text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-2 flex-shrink-0 text-xs font-black uppercase tracking-wider"
                        >
                            <ChevronLeft size={18} />
                            <span className="hidden xs:block">Catálogo</span>
                        </Link>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2 flex-shrink-0"></div>
                        <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">{course.title}</h1>
                    </div>

                    {/* Mobile Toggle Button */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/asistencia"
                            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-wider"
                        >
                            <User size={14} />
                            <span>Asistencia</span>
                        </Link>

                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-3 py-1.5 rounded-lg border border-sky-500/20 transition-all text-[10px] font-black uppercase tracking-wider"
                        >
                            <BookOpen size={14} />
                            <span className="hidden sm:inline">Ver Contenido</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 relative">

                {/* Mobile Sidebar Overlay (Backdrop) */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar (Navigation) - Becomes a Drawer on Mobile */}
                <div className={`fixed inset-y-0 left-0 w-[280px] sm:w-80 bg-white dark:bg-[#0a0e1a] border-r border-slate-200 dark:border-transparent z-[70] lg:relative lg:z-10 lg:w-80 flex-shrink-0 flex flex-col gap-4 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                    }`}>
                    <div className="lg:hidden p-4 border-b border-slate-250 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-black/40">
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Contenido del Curso</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 h-full lg:h-auto flex flex-col bg-white dark:bg-[#0a0e1a]">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                            <h3 className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-[0.2em]">Contenido del Curso</h3>
                        </div>

                        <div className="flex flex-col overflow-y-auto custom-scrollbar flex-grow max-h-[calc(100vh-250px)] lg:max-h-[600px]">
                            {course.weeks?.map((week: any, wIdx: number) => {
                                const isCurrentWeek = activeWeek.id === week.id;
                                return (
                                    <div key={week.id} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
                                        {/* Week Header / Toggle */}
                                        <button
                                            onClick={() => {
                                                setActiveWeek(week);
                                                // If switching to a week that's not current, pick its first day
                                                if (!isCurrentWeek) {
                                                    setActiveDay(week.days?.[0] || initialDay);
                                                }
                                            }}
                                            className={`w-full flex items-center justify-between p-4 text-left transition-all hover:bg-slate-50 dark:hover:bg-white/[0.02] ${isCurrentWeek ? "bg-sky-500/[0.03]" : ""
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${isCurrentWeek ? "text-sky-500 dark:text-sky-400" : "text-slate-500"
                                                    }`}>
                                                    Semana {wIdx + 1}
                                                </span>
                                                <span className={`font-black text-sm leading-tight ${isCurrentWeek ? "text-sky-500 dark:text-sky-400" : "text-slate-800 dark:text-slate-200"
                                                    }`}>
                                                    {week.title}
                                                </span>
                                            </div>
                                            <div className={`${isCurrentWeek ? "text-sky-500 dark:text-sky-400" : "text-slate-500"}`}>
                                                {isCurrentWeek ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </div>
                                        </button>

                                        {/* Days List (Collapsible) */}
                                        {isCurrentWeek && (
                                            <div className="bg-slate-50/50 dark:bg-black/30 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {week.days?.map((day: any, dIdx: number) => {
                                                    const isActive = activeDay.id === day.id;
                                                    return (
                                                        <button
                                                            key={day.id}
                                                            onClick={() => {
                                                                setIsSidebarOpen(false);
                                                                setActiveDay(day);
                                                            }}
                                                            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${isActive
                                                                ? "bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-white shadow-[0_0_15px_rgba(56,189,248,0.1)]"
                                                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.02] hover:text-slate-900 dark:hover:text-white"
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 ${isActive ? "text-sky-400" : "text-slate-600"}`}>
                                                                <PlayCircle size={14} fill={isActive ? "currentColor" : "none"} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide mb-0.5">
                                                                    Sección {dIdx + 1}
                                                                </span>
                                                                <span className="text-xs font-black line-clamp-2 leading-snug">
                                                                    {day.title}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-grow flex flex-col gap-6 lg:min-w-0">

                    {/* Main Content Header */}
                    <div className="mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                            <p className="text-sky-500 dark:text-sky-400 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase">
                                {activeWeek.title}
                            </p>
                            <span className="hidden sm:block text-slate-300 dark:text-slate-800">•</span>
                            <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-wider">Sección {activeWeek.days?.indexOf(activeDay) + 1}</p>
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{activeDay.title}</h2>
                    </div>

                    {/* Section Cover Image */}
                    {activeDay.thumbnail && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-100/50 dark:bg-black/40 aspect-[21/9] sm:aspect-[21/7]">
                            <img 
                                src={activeDay.thumbnail} 
                                alt={activeDay.title} 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.01]"
                            />
                        </div>
                    )}

                    {/* Video Player Embed or AI Placeholder */}
                    <div 
                        ref={containerRef}
                        className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative bg-black group"
                    >
                        {!isMounted ? (
                            <div className="absolute top-0 left-0 w-full h-full bg-black/40 animate-pulse" />
                        ) : isNotAvailableYet ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-pulse-subtle">
                                    <Lock size={32} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Contenido Bloqueado</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed font-medium">
                                    Esta clase todavía no está disponible para estudiantes. Por favor, regresa en la fecha y hora indicada.
                                </p>
                                <div className="mt-6 px-5 py-2.5 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Disponible desde:</p>
                                    <p className="text-xs font-black text-amber-500 dark:text-amber-400 font-mono">{formatFullDate(activeDay.availableFrom)}</p>
                                </div>
                            </div>
                        ) : activeDay.videoId ? (
                            <>
                                {/* YouTube Player container with disabled pointer events */}
                                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none select-none">
                                    {usePlainIframe ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${activeDay.videoId}?rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&ecver=2`}
                                            title="YouTube video player"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            className="w-full h-[116%] absolute -top-[8%] left-0 border-0 pointer-events-none select-none"
                                        />
                                    ) : (
                                        <div ref={playerDivRef} className="w-full h-[116%] absolute -top-[8%] left-0 pointer-events-none select-none" />
                                    )}
                                </div>

                                {!usePlainIframe && (
                                    <>
                                        {/* Click interceptor overlay */}
                                        <div 
                                            onClick={(e) => togglePlay(e)}
                                            onDoubleClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
                                            style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                                        >
                                            {/* Play/Pause center overlay button */}
                                            <div className={`p-4 rounded-full bg-black/60 backdrop-blur-md border border-slate-800 transition-all duration-300 transform ${isPlaying ? "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100" : "opacity-100 scale-100"}`}>
                                                {isPlaying ? (
                                                    <Pause size={24} className="text-white fill-white" />
                                                ) : (
                                                    <Play size={24} className="text-white fill-white ml-0.5" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Custom premium control bar at the bottom */}
                                        <div className={`absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-300 flex flex-col gap-3 ${isPlaying ? "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100" : "translate-y-0 opacity-100"}`}>
                                            {/* Timeline Slider */}
                                            <div className="flex items-center gap-3 w-full">
                                                <span className="text-xs text-white/80 font-mono select-none">{formatTime(currentTime)}</span>
                                                <input 
                                                    type="range"
                                                    min={0}
                                                    max={duration || 100}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    className="flex-grow h-1 rounded-lg appearance-none cursor-pointer bg-white/20 hover:bg-white/30 accent-sky-400 transition-all outline-none"
                                                    style={{
                                                        background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`
                                                    }}
                                                />
                                                <span className="text-xs text-white/80 font-mono select-none">{formatTime(duration)}</span>
                                            </div>

                                            {/* Bottom controls row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {/* Play/Pause button */}
                                                    <button 
                                                        onClick={(e) => togglePlay(e)}
                                                        className="text-white hover:text-sky-400 transition-colors focus:outline-none"
                                                    >
                                                        {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white" />}
                                                    </button>

                                                    {/* Volume Controls */}
                                                    <div className="flex items-center gap-2 group/volume">
                                                        <button 
                                                            onClick={toggleMute}
                                                            className="text-white hover:text-sky-400 transition-colors focus:outline-none"
                                                        >
                                                            {isMuted || volume === 0 ? (
                                                                <VolumeX size={18} />
                                                            ) : volume < 50 ? (
                                                                <Volume1 size={18} />
                                                            ) : (
                                                                <Volume2 size={18} />
                                                            )}
                                                        </button>
                                                        <input 
                                                            type="range"
                                                            min={0}
                                                            max={100}
                                                            value={isMuted ? 0 : volume}
                                                            onChange={handleVolumeChange}
                                                            className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 rounded-lg appearance-none cursor-pointer bg-white/20 accent-sky-400 outline-none"
                                                            style={{
                                                                background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) 100%)`
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Fullscreen Button */}
                                                <button 
                                                    onClick={toggleFullscreen}
                                                    className="text-white hover:text-sky-400 transition-colors focus:outline-none"
                                                >
                                                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center relative overflow-hidden">
                                <img
                                    src="/placeholder-ai.png"
                                    alt="Clase sin video"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-sky-950/50 backdrop-blur-[4px]"></div>
                                <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                                        <PlayCircle size={28} className="text-white opacity-50" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">{activeDay.title}</h3>
                                        <p className="text-xs text-sky-200/60 font-semibold">Esta clase no cuenta con video interactivo aún.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {isNotAvailableYet ? (
                        <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-black/20 flex flex-col items-center gap-4 text-center">
                            <Clock size={40} className="text-slate-400 dark:text-slate-600" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Foro Desactivado</h4>
                                <p className="text-xs text-slate-500 max-w-sm">Los materiales y actividades de esta sección se habilitarán automáticamente en la fecha indicada arriba.</p>
                            </div>
                        </div>
                    ) : activeDayData.assignmentType === "FORUM" ? (
                        <DayForum
                            day={activeDayData}
                            studentId={studentId}
                            courseId={course.id}
                            userRole={userRole}
                            onPostCreated={() => {
                                window.location.reload();
                            }}
                        />
                    ) : (
                        <VideoQA
                            day={activeDayData}
                            studentId={studentId}
                            courseId={course.id}
                            userRole={userRole}
                            onPostCreated={() => {
                                window.location.reload();
                            }}
                        />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Resources Column */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                <FileText size={16} className="text-sky-500 dark:text-sky-400" />
                                Materiales de la Sección
                            </h3>

                            {!isNotAvailableYet && (activeDay.summaryUrl || activeDay.materialUrl || (activeDay.resources && activeDay.resources.length > 0)) ? (
                                <div className="flex flex-col gap-3">
                                    {activeDay.summaryUrl && (
                                        <a
                                            href={`${activeDay.summaryUrl}${activeDay.summaryUrl.includes('vercel-storage.com') ? '?download=1' : ''}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-3 rounded-xl flex items-center justify-between group border border-amber-500/20 hover:border-amber-500 transition-all bg-amber-500/5 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 truncate pr-4">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-500 group-hover:text-amber-400 transition-colors">
                                                    <FileText size={14} />
                                                </div>
                                                <span className="text-xs font-black text-amber-700 dark:text-amber-200 uppercase tracking-wider truncate">Resumen clase (PDF)</span>
                                            </div>
                                            <Download size={14} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                                        </a>
                                    )}

                                    {activeDay.materialUrl && (
                                        <a
                                            href={`${activeDay.materialUrl}${activeDay.materialUrl.includes('vercel-storage.com') ? '?download=1' : ''}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-3 rounded-xl flex items-center justify-between group border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-400 transition-all bg-slate-50 dark:bg-black/40 text-slate-800 dark:text-slate-300 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 truncate pr-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-black/20 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                    <Download size={14} />
                                                </div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">Repositorio / Material</span>
                                            </div>
                                        </a>
                                    )}

                                    {activeDay.resources?.map((res: any) => (
                                        <a
                                            key={res.id}
                                            href={res.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-3 rounded-xl flex items-center justify-between group border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 transition-all bg-slate-50 hover:bg-slate-100 dark:bg-black/20 dark:hover:bg-black/40 text-slate-800 dark:text-slate-350 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 truncate pr-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                    {res.type === "pdf" ? <FileText size={14} /> : res.type === "link" ? <Link2 size={14} /> : <Download size={14} />}
                                                </div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate group-hover:text-sky-600 dark:group-hover:text-white transition-colors">{res.title}</span>
                                            </div>
                                            <ExternalLink size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    {isNotAvailableYet ? "Material restringido." : "No hay recursos."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
