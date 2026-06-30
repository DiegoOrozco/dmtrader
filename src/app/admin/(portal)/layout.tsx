"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, Settings, LogOut, Menu, X, Users, GraduationCap, ShieldAlert, Mail, CheckCircle } from "lucide-react";
import { logoutAdmin } from "../../../actions/auth";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={16} /> },
        { name: "Mis Cursos", href: "/admin/courses", icon: <BookOpen size={16} /> },
        { name: "Libro de Calificaciones", href: "/admin/grades", icon: <GraduationCap size={16} /> },
        { name: "Excepciones de Fecha", href: "/admin/exceptions", icon: <MessageSquare size={16} /> },
        { name: "Estudiantes", href: "/admin/students", icon: <Users size={16} /> },
        { name: "Comunicados", href: "/admin/communications", icon: <Mail size={16} /> },
        { name: "Ajustes del Sitio", href: "/admin/settings", icon: <Settings size={16} /> },
        { name: "Reporte de Plagio", href: "/admin/plagiarism", icon: <ShieldAlert size={16} /> },
        { name: "Q&A Inbox", href: "/admin/qa", icon: <MessageSquare size={16} /> },
        { name: "Pase de Lista", href: "/admin/attendance", icon: <CheckCircle size={16} /> },
        { name: "Ver sitio alumnos", href: "/", icon: <BookOpen size={16} />, special: true },
    ];

    return (
        <div className="flex h-screen bg-[#0a0e1a] text-slate-100 overflow-hidden font-sans">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0e1a] border-b border-slate-800 flex items-center justify-between px-6 z-40 backdrop-blur-md">
                <Link href="/admin" className="flex items-center gap-2 text-white font-black uppercase tracking-wider">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                        <span className="font-black text-xs">DO</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">Admin</span>
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Sidebar Overlay (Backdrop) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Drawer */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0a0e1a] border-r border-slate-800 z-[60] transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                }`}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-black/20">
                    <Link href="/admin" className="hidden lg:flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all group-hover:scale-105">
                            <span className="font-black text-xs">DO</span>
                        </div>
                        <h1 className="text-sm font-black text-white uppercase tracking-widest leading-tight">DM Admin</h1>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 mt-4 lg:mt-0 custom-scrollbar">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${isActive
                                    ? "bg-sky-500/10 text-white border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                                    : "text-slate-400 border-transparent hover:bg-white/[0.02] hover:text-white"
                                    }`}
                            >
                                {link.icon}
                                <span>{link.name}</span>
                                {link.special && (
                                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                        Live
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-black/10">
                    <form action={logoutAdmin}>
                        <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-transparent transition-all text-left">
                            <LogOut size={16} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar pt-16 lg:pt-0 min-h-screen bg-[#0a0e1a]">
                <div className="absolute top-0 right-0 w-[50%] h-[400px] z-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[100%] h-[100%] bg-sky-500 opacity-[0.04] blur-[150px] rounded-full"></div>
                </div>
                <div className="relative z-10 p-4 sm:p-8 max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
