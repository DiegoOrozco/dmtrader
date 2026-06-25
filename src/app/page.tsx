import { Suspense } from "react";
import { getSiteConfig } from "@/lib/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { unstable_cache } from "next/cache";
import { calculateCourseGrade } from "@/lib/grades-utils";
import CourseCatalog from "@/components/CourseCatalog";

const getCachedHomeConfig = unstable_cache(
    async () => await getSiteConfig("home"),
    ['home-config'],
    { revalidate: 3600 }
);

export default async function DashboardPage() {
    const student = await getStudent();

    const homeConfig = await getCachedHomeConfig() || {
        heroTitle: "Aprende Trading con DM Trader",
        heroSubtitle: "Accede a videos exclusivos de trading, análisis técnico y estrategias de mercado.",
        heroButtonText: "Empezar Ahora",
        heroButtonLink: "/register",
        news: []
    };

    const allCourses = await prisma.course.findMany({
        where: { status: "published" },
        orderBy: { id: 'asc' },
        include: {
            weeks: {
                where: { isVisible: true },
                include: {
                    days: {
                        where: { isVisible: true },
                        include: {
                            submissions: { where: { userId: student?.id || "" } },
                            videoProgresses: { where: { userId: student?.id || "" } }
                        }
                    }
                }
            }
        }
    });

    const enrolledCourseIds = student?.enrollments.map((e: any) => e.courseId) || [];
    
    const stats = [
        { label: "ENFOQUE", n: "100%", sub: "CÓDIGO Y PROYECTOS" },
        { label: "NIVEL", n: "TECH", sub: "HERRAMIENTAS MODERNAS" },
        { label: "OBJETIVO", n: "PRO", sub: "IMPULSA TU CARRERA" }
    ];

    return (
        <div className="min-h-screen relative" style={{ background: 'var(--background)' }}>
            {/* Background Watermarks */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" style={{ opacity: 0.1 }}>
                <span className="raw-watermark top-[10%] left-[5%]">APRENDE</span>
                <span className="raw-watermark top-[40%] right-[10%]">PROGRAMA</span>
                <span className="raw-watermark bottom-[10%] left-[15%]">INNOVA</span>
            </div>

            <main className="relative z-10 pt-32 pb-40">
                {/* ── HERO SECTION ── */}
                <section className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-24 group">
                    <div className="space-y-6">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-[0.9] tracking-tighter mb-8">
                            {homeConfig.heroTitle.toUpperCase()}
                        </h1>
                        <p className="text-lg sm:text-xl font-bold text-[var(--text-secondary)] max-w-xl leading-tight uppercase tracking-tight italic">
                            {homeConfig.heroSubtitle}
                        </p>
                    </div>

                    <div className="mt-16 flex flex-wrap gap-8 items-center">
                        <Link 
                            href={homeConfig.heroButtonLink || "/#catalog"} 
                            className="raw-btn bg-[#cde641] text-black h-20 px-12 text-lg font-black uppercase italic tracking-tighter flex items-center gap-4 hover:bg-white hover:text-black transition-all group shadow-[0_0_50px_rgba(205,230,65,0.2)]"
                        >
                            {homeConfig.heroButtonText || "Explorar Catálogo"}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </Link>
                        
                        <div className="flex gap-16 ml-auto hidden lg:flex">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-right group cursor-crosshair">
                                    <div className="flex items-center justify-end gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#cde641] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50">{stat.label}</span>
                                    </div>
                                    <span className="text-6xl font-black text-[var(--text-primary)] tracking-tighter block mb-2">{stat.n}</span>
                                    <p className="text-xs font-bold text-[var(--text-secondary)] opacity-30 uppercase tracking-widest">{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── PARTNERS / COMMUNITY SECTION ── */}
                <section className="max-w-[1400px] mx-auto px-6 lg:px-10 mt-16 mb-24">
                    <div className="flex items-center gap-4 mb-12">
                        <span className="raw-label" style={{ color: 'var(--raw-outline)', whiteSpace: 'nowrap' }}>+ COMUNIDAD_Y_TRADING</span>
                        <div className="h-px flex-1" style={{ background: 'var(--raw-outline-dim)' }} />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-4">
                            ¡Hagamos Trading Juntos!
                        </h2>
                        <p className="text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                            Regístrate en nuestros brokers y plataformas recomendadas para unirte a nuestras sesiones en vivo, canal de alertas de mercado y operar con las mejores condiciones.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Deriv */}
                        {/* Deriv */}
                        <a 
                            href="https://deriv.partners/rx?sidc=55B279DC-01C5-41F3-8331-2B291B5DD053&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU50197" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="raw-card p-6 flex flex-col justify-between min-h-[220px] group transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
                                <span className="text-xs font-mono text-[var(--raw-accent)]">01</span>
                            </div>
                            <div>
                                <div className="mb-6 flex items-center">
                                    <svg viewBox="0 0 100 30" className="h-6 w-auto" fill="currentColor">
                                        <path d="M5 22 L18 8 L31 22 Z" fill="#ff444f"/>
                                        <path d="M18 22 L31 8 L44 22 Z" fill="#ff444f" opacity="0.8"/>
                                        <text x="52" y="20" fontFamily="Space Grotesk, sans-serif" fontWeight="900" fontSize="13" fill="currentColor" className="text-[var(--text-primary)]">DERIV</text>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">Índices Sintéticos</h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-4">Opera CFDs, forex y mercados sintéticos con spreads competitivos y apalancamiento.</p>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--raw-accent)] font-black text-xs uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors mt-auto">
                                Registrarse
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        {/* Bitunix */}
                        <a 
                            href="https://www.bitunix.com/register?vipCode=fq2H" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="raw-card p-6 flex flex-col justify-between min-h-[220px] group transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
                                <span className="text-xs font-mono text-[var(--raw-accent)]">02</span>
                            </div>
                            <div>
                                <div className="mb-6 flex items-center">
                                    <svg viewBox="0 0 120 30" className="h-6 w-auto" fill="currentColor">
                                        <rect x="5" y="4" width="20" height="20" rx="3" fill="#00e5ff"/>
                                        <path d="M10 8 h10 v3 h-10 z M10 14 h10 v3 h-10 z" fill="#000000"/>
                                        <text x="35" y="20" fontFamily="Space Grotesk, sans-serif" fontWeight="900" fontSize="13" fill="currentColor" className="text-[var(--text-primary)]">BITUNIX</text>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">Cripto Exchange</h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-4">Compra, vende y opera contratos perpetuos de criptomonedas sin restricciones y alta liquidez.</p>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--raw-accent)] font-black text-xs uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors mt-auto">
                                Registrarse
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        {/* Nexo */}
                        <a 
                            href="https://nexo.ibportal.io/auth/register?e=Pv53ERsz4qiVgd2HvuptUkqRsXcK9CnfEJBkTBAjSrw&a=2" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="raw-card p-6 flex flex-col justify-between min-h-[220px] group transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
                                <span className="text-xs font-mono text-[var(--raw-accent)]">03</span>
                            </div>
                            <div>
                                <div className="mb-6 flex items-center">
                                    <svg viewBox="0 0 100 30" className="h-6 w-auto" fill="currentColor">
                                        <polygon points="5,4 14,4 23,16 23,4 30,4 30,22 21,22 12,10 12,22 5,22" fill="#3b82f6"/>
                                        <text x="38" y="20" fontFamily="Space Grotesk, sans-serif" fontWeight="900" fontSize="13" fill="currentColor" className="text-[var(--text-primary)]">NEXO</text>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">Crypto Banking</h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-4">Genera intereses pasivos diarios en cripto y stablecoins con máxima seguridad garantizada.</p>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--raw-accent)] font-black text-xs uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors mt-auto">
                                Registrarse
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        {/* Bridge Markets */}
                        <a 
                            href="https://trading.bridgemarkets.global/register?ref=4920d2e8-f6e2-48&branchUuid=de19e466-a9cd-4493-936b-1" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="raw-card p-6 flex flex-col justify-between min-h-[220px] group transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
                                <span className="text-xs font-mono text-[var(--raw-accent)]">04</span>
                            </div>
                            <div>
                                <div className="mb-6 flex items-center">
                                    <svg viewBox="0 0 140 30" className="h-6 w-auto" fill="currentColor">
                                        <path d="M5 22 L15 4 L25 22 Z" fill="var(--raw-accent)"/>
                                        <path d="M18 4 L28 22 L38 4 Z" fill="currentColor" className="text-[var(--text-primary)]" opacity="0.7"/>
                                        <text x="46" y="20" fontFamily="Space Grotesk, sans-serif" fontWeight="900" fontSize="13" fill="currentColor" className="text-[var(--text-primary)]">BRIDGE</text>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">Multi-Asset Broker</h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-4">Accede a mercados globales, forex tradicional y materias primas con ejecución institucional ultra rápida.</p>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--raw-accent)] font-black text-xs uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors mt-auto">
                                Registrarse
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>
                    </div>
                </section>

                {/* Technical divider */}
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center gap-4 mt-32 mb-12">
                    <span className="raw-label" style={{ color: 'var(--raw-outline)', whiteSpace: 'nowrap' }}>+ CATÁLOGO_ACADÉMICO</span>
                    <div className="h-px flex-1" style={{ background: 'var(--raw-outline-dim)' }} />
                </div>

                {/* Course catalog */}
                <div id="catalog" className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-32">
                    <Suspense fallback={<div className="py-20 text-center font-display text-[var(--text-secondary)]">Cargando catálogo...</div>}>
                        <CourseCatalog
                            allCourses={allCourses.map(c => ({
                                id: c.id,
                                title: c.title,
                                description: c.description,
                                thumbnail: c.thumbnail,
                                status: c.status,
                                category: (c as any).category || "Programación",
                                progressPct: 0,
                                weeks: c.weeks
                            }))}
                            enrolledCourseIds={enrolledCourseIds}
                            student={student}
                        />
                    </Suspense>
                </div>
            </main>

            {/* Bottom ticker banner strip */}
            <div className="fixed bottom-0 left-0 right-0 h-10 bg-[var(--raw-accent)] z-[40] flex items-center overflow-hidden select-none border-t border-black/10">
                <div className="flex whitespace-nowrap animate-marquee items-center gap-10">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-10">
                            <span className="text-[10px] font-black text-black">DM_TRADER_PLATFORM_V1.0</span>
                            <span className="text-[10px] font-black text-black opacity-30">//</span>
                            <span className="text-[10px] font-black text-black">APRENDIZAJE_ALTO_RENDIMIENTO</span>
                            <span className="text-[10px] font-black text-black opacity-30">//</span>
                            <span className="text-[10px] font-black text-black">IA_DRIVEN_CONTENT</span>
                            <span className="text-[10px] font-black text-black opacity-30">//</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
