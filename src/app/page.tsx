import { Suspense } from "react";
import { getSiteConfig } from "@/lib/config";
import Link from "next/link";
import { ArrowRight, TrendingUp, Award, Shield, Users, ArrowUpRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { unstable_cache } from "next/cache";
import CourseCatalog from "@/components/CourseCatalog";
import Image from "next/image";

import { HelpCircle } from "lucide-react";

const getStatIcon = (iconName: string) => {
    switch ((iconName || "").toLowerCase()) {
        case "users": return <Users size={16} className="text-sky-500" />;
        case "award": return <Award size={16} className="text-amber-500" />;
        case "shield": return <Shield size={16} className="text-sky-400" />;
        default: return <HelpCircle size={16} className="text-slate-450" />;
    }
};

const getPartnerColorClass = (colorName: string) => {
    switch ((colorName || "").toLowerCase()) {
        case "red": return "bg-red-500";
        case "emerald": return "bg-emerald-500";
        case "cyan": return "bg-[#00e5ff]";
        case "blue": return "bg-[#0284c7]";
        case "sky": return "bg-[#0ea5e9]";
        case "amber": return "bg-[#f59e0b]";
        default: return "bg-slate-500";
    }
};


const getCachedHomeConfig = unstable_cache(
    async () => await getSiteConfig("home"),
    ['home-config'],
    { revalidate: 3600 }
);

export default async function DashboardPage() {
    const student = await getStudent();

    const defaultStats = [
        { label: "ESTUDIANTES ACTIVADOS", n: "1,500+", icon: "users" },
        { label: "MÉTRICA DE APROBACIÓN", n: "94.6%", icon: "award" },
        { label: "SEGURIDAD DE APRENDIZAJE", n: "PRO", icon: "shield" }
    ];

    const defaultPartners = [
        { name: "VEXPROFX", title: "Broker Regulado", desc: "Opera CFDs, divisas y commodities con las mejores condiciones de mercado y spreads competitivos.", url: "https://my.vexprofx.com/register/DM8156", color: "emerald" },
        { name: "BITUNIX", title: "Cripto Exchange", desc: "Compra, vende y opera contratos perpetuos de criptomonedas sin restricciones de liquidez.", url: "https://www.bitunix.com/register?vipCode=fq2H", color: "cyan" },
        { name: "NEXO", title: "Crypto Banking", desc: "Genera intereses pasivos diarios en criptomonedas y stablecoins con la máxima seguridad garantizada.", url: "https://nexo.ibportal.io/auth/register?e=Pv53ERsz4qiVgd2HvuptUkqRsXcK9CnfEJBkTBAjSrw&a=2", color: "blue" },
        { name: "BRIDGE", title: "Multi-Asset Broker", desc: "Accede a mercados globales, forex tradicional y materias primas con ejecución institucional ultra rápida.", url: "https://trading.bridgemarkets.global/register?ref=4920d2e8-f6e2-48&branchUuid=de19e466-a9cd-4493-936b-1", color: "sky" },
        { name: "TARJETA CRIPTO", title: "Crypto Card", desc: "Solicita tu tarjeta de débito cripto para realizar compras y retiros directamente con tus fondos digitales.", url: "https://url.hk/i/es/1zyvf", color: "amber" }
    ];

    const homeConfig = await getCachedHomeConfig() || {
        heroTitle: "Aprende Trading Profesional",
        heroSubtitle: "Domina Forex, Criptomonedas e Índices Sintéticos con metodologías avanzadas de Dayan Moraga.",
        heroButtonText: "Comenzar Ahora",
        heroButtonLink: "/register",
        news: [],
        stats: defaultStats,
        partners: defaultPartners
    };

    const displayStats = homeConfig.stats || defaultStats;
    const displayPartners = homeConfig.partners || defaultPartners;

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
    


    return (
        <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--background)' }}>
            {/* Ambient Background Glows */}
            <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-sky-500/10 dark:bg-sky-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

            <main className="relative z-10 pt-28 md:pt-36 pb-32">
                {/* ── HERO SECTION WITH DAYAN MORAGA ── */}
                <section className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Text and Actions */}
                        <div className="lg:col-span-7 space-y-6">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50/40 dark:bg-sky-500/10 border border-sky-200/50 dark:border-sky-500/20 backdrop-blur-md">
                                <TrendingUp size={14} className="text-sky-500 dark:text-sky-400" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                                    Educación Financiera Premium
                                </span>
                            </div>
                            
                             <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-[#0f172a] dark:text-white relative z-10">
                                {homeConfig.heroTitle}
                            </h1>
                            
                            <p className="text-base sm:text-lg max-w-xl leading-relaxed text-[#475569] dark:text-[#94a3b8]">
                                {homeConfig.heroSubtitle} Aprende estrategias de precisión para el mercado de Forex, Criptomonedas e Índices Sintéticos con Dayan Moraga.
                            </p>

                            <div className="pt-4 flex flex-wrap gap-4 items-center">
                                <Link 
                                    href={homeConfig.heroButtonLink || "/#catalog"} 
                                    className="raw-btn-primary group h-14 px-8 text-sm font-bold flex items-center gap-3 transition-all"
                                >
                                    {homeConfig.heroButtonText || "Explorar Catálogo"}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                
                                <Link 
                                    href="/about" 
                                    className="raw-secondary-btn h-14 px-8 text-sm font-bold flex items-center gap-2"
                                >
                                    Sobre Dayan Moraga
                                </Link>
                            </div>
                        </div>

                        {/* Dayan Moraga Hero Image Frame */}
                        <div className="lg:col-span-5 flex justify-center relative">
                            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
                                {/* Elegant geometric glow behind picture */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-amber-400 rounded-3xl rotate-6 opacity-20 blur-lg" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-sky-500 to-sky-600 rounded-3xl -rotate-3 opacity-15" />
                                
                                <div className="absolute inset-0 rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-2xl">
                                    <Image 
                                        src="/profile-pic.jpg" 
                                        alt="Dayan Moraga - Instructora Líder" 
                                        fill
                                        style={{ objectFit: "cover" }}
                                        priority
                                    />
                                    {/* Glass gradient overlay at bottom of image */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-6 flex flex-col justify-end">
                                        <span className="text-white font-extrabold text-lg">Dayan Moraga</span>
                                        <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Instructora de Trading Principal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Bar */}
                <section className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-28">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 px-6 rounded-2xl bg-white dark:bg-[#0d1326] border border-[#e2e8f0] dark:border-[#1e2e5c] shadow-md">
                        {displayStats.map((stat: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-2 border-b last:border-b-0 md:border-b-0 md:border-r last:border-r-0 border-[#e2e8f0] dark:border-[#1e2e5c]">
                                <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#1e2e5c] flex items-center justify-center">
                                    {getStatIcon(stat.icon)}
                                </div>
                                <div>
                                    <span className="text-2xl font-extrabold text-[#0f172a] dark:text-white block">{stat.n}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8]">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PARTNERS / BROKERS SECTION ── */}
                <section className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-28">
                    <div className="flex items-center gap-4 mb-10">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0ea5e9]">
                            Brokers Premium & Asociaciones Recomendas
                        </span>
                        <div className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#1e2e5c]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {displayPartners.map((partner: any, idx: number) => (
                            <a 
                                key={idx}
                                href={partner.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="raw-card p-6 flex flex-col justify-between min-h-[220px] group border border-[#e2e8f0] dark:border-[#1e2e5c] bg-white dark:bg-[#0d1326]/40"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-5 h-5 rounded ${getPartnerColorClass(partner.color)} flex items-center justify-center`}>
                                            <ArrowUpRight size={12} className="text-white dark:text-slate-900" />
                                        </div>
                                        <span className="font-extrabold text-[#0f172a] dark:text-white text-sm tracking-tight">{partner.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#94a3b8]">{(idx+1).toString().padStart(2, '0')}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#0f172a] dark:text-[#94a3b8] mb-1.5 uppercase tracking-tight">{partner.title}</h3>
                                    <p className="text-xs text-[#64748b] mb-4 leading-relaxed">{partner.desc}</p>
                                </div>
                                <div className="flex items-center gap-2 text-[#0ea5e9] font-bold text-xs uppercase tracking-wider group-hover:text-[#0284c7] transition-colors">
                                    {partner.url.includes("tarjeta") || partner.name.toLowerCase().includes("tarjeta") ? "Obtener Tarjeta" : "Registrarse"}
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                {/* Academic Catalog Divider */}
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center gap-4 mb-10">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0ea5e9]">
                        Catálogo de Especialización Académica
                    </span>
                    <div className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#1e2e5c]" />
                </div>

                {/* Course catalog */}
                <div id="catalog" className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-12">
                    <Suspense fallback={<div className="py-20 text-center font-bold text-slate-400">Cargando catálogo...</div>}>
                        <CourseCatalog
                            allCourses={allCourses.map(c => ({
                                id: c.id,
                                title: c.title,
                                description: c.description,
                                thumbnail: c.thumbnail,
                                status: c.status,
                                category: (c as any).category || "Trading",
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
            <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#0f172a] border-t border-[#1e293b] z-[40] flex items-center overflow-hidden select-none">
                <div className="flex whitespace-nowrap animate-marquee items-center gap-10">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-10">
                            <span className="text-[10px] font-bold text-[#e2e8f0]">DM_TRADER_PREMIUM_PLATFORM</span>
                            <span className="text-[10px] font-bold text-[#0ea5e9]">//</span>
                            <span className="text-[10px] font-bold text-[#e2e8f0]">INTEGRIDAD_EDUCATIVA_Y_FOREX</span>
                            <span className="text-[10px] font-bold text-[#0ea5e9]">//</span>
                            <span className="text-[10px] font-bold text-[#e2e8f0]">DAYAN_MORAGA_DIRECT_MENTORSHIP</span>
                            <span className="text-[10px] font-bold text-[#0ea5e9]">//</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
