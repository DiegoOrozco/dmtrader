"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Twitter, Instagram, Sparkles, Mail, TrendingUp } from "lucide-react";

export default function Footer({ user, aboutConfig }: { user?: any, aboutConfig?: any }) {
    const pathname = usePathname();

    if (pathname.startsWith("/admin") || pathname.startsWith("/course/")) {
        return null;
    }

    return (
        <footer className="bg-[#0a0e1a] border-t border-slate-200/10 dark:border-slate-800/80 pt-16 pb-12 relative overflow-hidden">
            {/* Background Gradient Accent */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[700px] h-[350px] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg">
                                <TrendingUp size={16} className="text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors">
                                DM TRADER
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm max-w-sm leading-relaxed font-medium">
                            La plataforma premium de educación en trading y mercados financieros guiada por Dayan Moraga. Aprende análisis técnico real, psicología de mercado y gestión del riesgo.
                        </p>
                        <div className="flex gap-3">
                            {aboutConfig?.socialLinks?.map((link: any, i: number) => {
                                let Icon = Github;
                                if (link.platform === "LinkedIn") Icon = Linkedin;
                                if (link.platform === "Twitter") Icon = Twitter;
                                if (link.platform === "Instagram") Icon = Instagram;
                                if (link.platform === "Email") Icon = Mail;

                                return <SocialIcon key={i} href={link.url} icon={<Icon size={16} />} />;
                            })}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 flex items-center gap-2 text-sm tracking-widest uppercase">
                            <Sparkles size={14} className="text-sky-400" />
                            Plataforma
                        </h4>
                        <ul className="space-y-4">
                            <FooterLink href="/">Catálogo de Cursos</FooterLink>
                            <FooterLink href="/#my-courses">Mis Cursos</FooterLink>
                            <FooterLink href="/about">Sobre Dayan Moraga</FooterLink>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm tracking-widest uppercase">Legal</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#">Términos de Servicio</FooterLink>
                            <FooterLink href="#">Política de Privacidad</FooterLink>
                            <FooterLink href="#">Cookies</FooterLink>
                            {user?.role === "STUDENT" ? null : (
                                <FooterLink href="/admin">Portal Administrativo</FooterLink>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200/10 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs font-semibold">
                        © {new Date().getFullYear()} DM Trader · DO Academy. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span>Aprende</span>
                        <span className="text-sky-500">•</span>
                        <span>Opera</span>
                        <span className="text-sky-500">•</span>
                        <span>Consigue Rentabilidad</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-slate-400 hover:text-sky-400 transition-colors text-sm font-medium">
                {children}
            </Link>
        </li>
    );
}

function SocialIcon({ href, icon }: { href: string, icon: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-slate-800/50 hover:bg-sky-500 hover:text-white flex items-center justify-center text-slate-400 border border-slate-700/50 transition-all duration-300"
        >
            {icon}
        </a>
    );
}
