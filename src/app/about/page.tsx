import { getSiteConfig } from "@/lib/config";
import Link from "next/link";
import {
    Github,
    Linkedin,
    Twitter,
    Instagram,
    Mail,
    MessageCircle,
    ArrowRight,
    Star,
    Award
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import SocialLink from "@/components/SocialLink";
import { getStudent } from "@/lib/student-auth";
import prisma from "@/lib/prisma";
import Image from "next/image";

export default async function AboutPage() {
    const student = await getStudent();
    const aboutConfig = await getSiteConfig("about") || {
        name: "Dayan Moraga",
        title: "Empresaria & Fundadora de DM Trader",
        bioParagraphs: [
            "Apasionada por los negocios, las finanzas y el trading de precisión. He dedicado los últimos años a construir plataformas y proyectos educativos de alto nivel para facilitar la toma de control de tu futuro financiero.",
            "En DM Trader, mi misión es entregarte metodologías de trading robustas con el respaldo de herramientas institucionales reales, eliminando las falsas expectativas y formándote como operador rentable a largo plazo."
        ],
        stats: [
            { label: "Años Exp.", value: "5+" },
            { label: "Programas", value: "3" },
            { label: "Alumnos", value: "1,500+" },
            { label: "Métrica Éxito", value: "94%" }
        ],
        socialLinks: [
            { platform: "Instagram", url: "#" },
            { platform: "LinkedIn", url: "#" }
        ],
        contactEmail: "dayan@dmtrader.com",
        contactWhatsapp: "#"
    };

    return (
        <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Ambient Background Accents */}
            <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-sky-500/10 dark:bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6 pt-32 pb-24 relative z-10">
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row items-center gap-12 mb-16 animate-in fade-in duration-700">
                    <div className="relative group flex-shrink-0">
                        {/* Frame Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-amber-400 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity" />
                        <div className="w-52 h-52 md:w-64 md:h-64 rounded-full border-2 border-sky-500/30 p-2 relative z-10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                            <Image
                                src="/profile-pic.jpg"
                                alt="Dayan Moraga"
                                fill
                                style={{ objectFit: "cover" }}
                                className="rounded-full transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-md">
                            <Award size={12} className="text-sky-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Fundadora & Mentora</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
                            {aboutConfig.name}
                        </h1>
                        
                        <p className="text-lg md:text-xl font-bold text-[#64748b] dark:text-[#94a3b8] leading-tight">
                            {aboutConfig.title}
                        </p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                            {aboutConfig.socialLinks?.map((link: any, i: number) => {
                                let Icon = Github;
                                if (link.platform === "LinkedIn") Icon = Linkedin;
                                if (link.platform === "Twitter") Icon = Twitter;
                                if (link.platform === "Instagram") Icon = Instagram;
                                if (link.platform === "Email") Icon = Mail;

                                return <SocialLink key={i} href={link.url} icon={<Icon size={18} />} label={link.platform} />;
                            })}
                        </div>
                    </div>
                </div>

                {/* Bio & Sidebar Contact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                    <div className="md:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/80 pb-3">Mi Trayectoria Académica</h3>
                        <div className="space-y-4 text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed markdown-content">
                            {aboutConfig.bio ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {aboutConfig.bio}
                                </ReactMarkdown>
                            ) : (
                                aboutConfig.bioParagraphs?.map((p: string, i: number) => (
                                    <p key={i}>{p}</p>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between group overflow-hidden relative h-fit self-start sticky top-32 shadow-md">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-sky-500/20 transition-all" />

                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">¿Tiene dudas sobre mi mentoría?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed font-medium">
                                Si tienes dudas sobre los temarios de especialización o las sesiones de trading en vivo, envíame un mensaje directo.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {aboutConfig.contacts?.length > 0 ? (
                                aboutConfig.contacts.map((contact: any, i: number) => {
                                    let Icon = Mail;
                                    let colorClass = "text-sky-500";
                                    let hoverBorder = "hover:border-sky-500/50";

                                    const type = contact.type?.toLowerCase();
                                    if (type.includes("whatsapp")) {
                                        Icon = MessageCircle;
                                        colorClass = "text-emerald-500";
                                        hoverBorder = "hover:border-emerald-500/50";
                                    } else if (type.includes("telegram")) {
                                        Icon = MessageCircle;
                                        colorClass = "text-sky-400";
                                        hoverBorder = "hover:border-sky-500/50";
                                    } else if (type.includes("email") || type.includes("correo")) {
                                        Icon = Mail;
                                        colorClass = "text-sky-500";
                                        hoverBorder = "hover:border-sky-500/50";
                                    }

                                    const isEmail = type.includes("email") || type.includes("correo") || contact.value?.includes("@");
                                    const href = isEmail && !contact.value?.startsWith("mailto:")
                                        ? `mailto:${contact.value}`
                                        : contact.value;

                                    return (
                                        <a
                                            key={i}
                                            href={href}
                                            target={isEmail ? undefined : "_blank"}
                                            rel={isEmail ? undefined : "noopener noreferrer"}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 ${hoverBorder} hover:bg-sky-500/5 transition-all group/btn`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={16} className={colorClass} />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{contact.type}</span>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-400 group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    );
                                })
                            ) : (
                                <>
                                    <a
                                        href={`mailto:${aboutConfig.contactEmail}`}
                                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all group/btn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-sky-500" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Académico</span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-400 group-hover/btn:translate-x-1 transition-transform" />
                                    </a>
                                    <a
                                        href={aboutConfig.contactWhatsapp}
                                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group/btn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MessageCircle size={16} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp Privado</span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-400 group-hover/btn:translate-x-1 transition-transform" />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Values/Quick Facts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {aboutConfig.stats?.map((stat: any, i: number) => (
                        <div key={i} className="rounded-2xl p-6 text-center bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 hover:border-sky-500/30 transition-colors shadow-sm">
                            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
