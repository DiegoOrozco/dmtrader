"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BookOpen,
    User as UserIcon,
    LogOut,
    Menu,
    X,
    Info,
    Shield,
    GraduationCap,
    ArrowRight,
    Calendar,
    TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

import { logoutStudent, logoutAdmin } from "@/actions/auth";

interface NavbarProps {
    user: any;
}

export default function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        if (user?.role === "ADMIN") {
            await logoutAdmin();
        } else {
            await logoutStudent();
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (pathname.startsWith("/course/") || pathname.startsWith("/admin")) {
        return null;
    }

    const navLinks = [
        { name: "Inicio", href: "/", icon: <Home size={18} /> },
        { name: "Cursos", href: "/courses", icon: <BookOpen size={18} /> },
    ];

    if (user) {
        navLinks.push({ name: "Mentorías", href: "/mentorias", icon: <Calendar size={18} /> });
    } else {
        navLinks.push({ name: "Sobre Mí", href: "/about", icon: <Info size={18} /> });
    }

    if (user?.role === "STUDENT") {
        navLinks.splice(1, 0, { name: "Mis Cursos", href: "/#my-courses", icon: <BookOpen size={18} /> });
        navLinks.splice(2, 0, { name: "Calificaciones", href: "/grades", icon: <GraduationCap size={18} /> });
    } else if (user?.role === "ADMIN") {
        navLinks.push({ name: "Panel Admin", href: "/admin", icon: <Shield size={18} /> });
    }

    return (
        <>
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md"
            style={{
                background: isScrolled ? 'var(--nav-bg)' : 'transparent',
                borderBottom: isScrolled ? '1px solid var(--border-color)' : '1px solid transparent',
                fontFamily: "'Space Grotesk', sans-serif",
                paddingTop: 'var(--safe-top)'
            }}
        >
            {user?.role === "ADMIN" && (
                <div
                    className="text-[10px] font-bold uppercase tracking-[0.2em] py-1.5 px-4 flex items-center justify-center gap-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white"
                >
                    <Shield size={11} />
                    Modo Admin
                    <span style={{ opacity: 0.4 }}>·</span>
                    <Link href="/admin" className="underline flex items-center gap-1 font-extrabold hover:text-sky-100 transition-colors">
                        Ir al Panel <ArrowRight size={10} />
                    </Link>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex justify-between items-center h-16 md:h-20">
                {/* Logo */}
                <Link href="/" className="group flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                        <TrendingUp size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span
                            className="font-black text-lg md:text-xl tracking-tight leading-none text-slate-900 dark:text-white"
                        >
                            DM <span className="text-sky-500 dark:text-sky-400">TRADER</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-[12px] font-bold uppercase tracking-widest px-4 py-2 transition-all hover:text-sky-500 dark:hover:text-sky-400"
                                    style={{
                                        color: isActive ? 'var(--raw-accent)' : 'var(--raw-slate)',
                                    }}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <ThemeToggle />

                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[12px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100">
                                    {user.name.split(" ")[0]}
                                </span>
                                <span className="text-[9px] uppercase tracking-widest font-extrabold text-sky-500 dark:text-sky-400">
                                    {user.role === "ADMIN" ? "ADMINISTRADOR" : "ESTUDIANTE"}
                                </span>
                            </div>
                            <div className="relative group">
                                <div
                                    className="w-10 h-10 flex items-center justify-center text-sm font-bold cursor-pointer rounded-full overflow-hidden shadow-md shadow-sky-500/10 transition-transform hover:scale-105"
                                    style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--raw-accent)',
                                        color: 'var(--raw-accent)',
                                    }}
                                >
                                    {user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                                </div>
                                <div
                                    className="absolute right-0 top-full mt-2 w-48 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl"
                                >
                                    <Link
                                        href="/profile"
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/55 transition-colors"
                                    >
                                        <UserIcon size={14} /> Mi Perfil
                                    </Link>
                                    <button
                                        onClick={() => handleLogout()}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut size={14} /> Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-5">
                            <Link
                                href="/login"
                                className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/register"
                                className="raw-btn-primary text-[11px] py-2.5 px-6 rounded-full"
                            >
                                Registrarse →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile toggle & theme button */}
                <div className="md:hidden flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        className="flex items-center gap-2 text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 relative z-[110] text-slate-800 dark:text-slate-100"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? "CERRAR" : "MENÚ"}
                        {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                    </button>
                </div>
            </div>
        </nav>

        {/* Mobile menu */}
        <div
            className={`fixed inset-0 md:hidden transition-all duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
            style={{ 
                background: 'var(--background)', 
                zIndex: 100, 
                top: 0 
            }}
        >
            <div className="flex flex-col h-full">
                {/* Mobile menu header */}
                <div className="flex justify-between items-center h-16 px-6 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                            <TrendingUp size={14} className="text-white" />
                        </div>
                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                            DM <span className="text-sky-500">TRADER</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-slate-500 dark:text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 flex flex-col gap-2 overflow-y-auto">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 py-4 text-base font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300"
                            style={{
                                color: pathname === link.href ? 'var(--raw-accent)' : undefined,
                                borderBottom: '1px solid var(--raw-outline-dim)',
                            }}
                        >
                            {link.name}
                        </Link>
                    ))}
                    
                    <div className="mt-10 flex flex-col gap-4">
                        {user ? (
                            <button
                                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                className="flex items-center justify-center gap-2 p-4 text-sm font-bold uppercase tracking-widest w-full rounded-full border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut size={16} /> Cerrar Sesión
                            </button>
                        ) : (
                            <>
                                <Link 
                                    href="/login" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center p-4 text-sm font-bold uppercase tracking-widest w-full rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >Iniciar Sesión</Link>
                                <Link 
                                    href="/register" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="raw-btn-primary flex items-center justify-center p-4 text-sm w-full rounded-full"
                                >Registrarse →</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
