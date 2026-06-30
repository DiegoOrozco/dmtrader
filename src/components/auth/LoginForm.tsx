"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Mail, Key, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { loginStudent } from "@/actions/auth";

interface LoginFormProps {
    returnUrl?: string;
    initialError?: string;
    successMessage?: string;
    googleLinked?: boolean;
}

export default function LoginForm({ returnUrl, initialError, successMessage, googleLinked }: LoginFormProps) {
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

    function validate(email: string, password: string) {
        const newErrors: typeof errors = {};
        if (!email) newErrors.email = "El correo electrónico es requerido.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Ingresa un correo electrónico válido.";
        if (!password) newErrors.password = "La contraseña es requerida.";
        return newErrors;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        const validationErrors = validate(email, password);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        const formData = new FormData(form);
        if (returnUrl) formData.set("returnUrl", returnUrl);

        startTransition(async () => {
            await loginStudent(formData);
        });
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* General errors from server */}
            {(initialError === "incorrect" || initialError === "db") && (
                <div className="bg-red-500/10 text-red-400 text-xs p-4 rounded-xl border border-red-500/20 flex items-start gap-3">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-black uppercase tracking-wider mb-0.5">Credenciales incorrectas</p>
                        <p className="text-[10px] font-bold uppercase opacity-70 tracking-wider">Verifica tu correo y contraseña.</p>
                    </div>
                </div>
            )}

            {googleLinked && (
                <div className="bg-amber-500/10 text-amber-400 text-xs p-4 rounded-xl border border-amber-500/20 flex items-start gap-3">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-black uppercase tracking-wider mb-0.5">Cuenta vinculada a Google</p>
                        <p className="text-[10px] font-bold uppercase opacity-70 tracking-wider">Por seguridad, usa el botón de Google.</p>
                    </div>
                </div>
            )}

            {successMessage === "password_reset" && (
                <div className="bg-emerald-500/10 text-emerald-400 text-xs p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                    <CheckCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-black uppercase tracking-wider mb-0.5">¡Contraseña actualizada!</p>
                        <p className="text-[10px] font-bold uppercase opacity-70 tracking-wider">Ahora puedes ingresar con tu nueva contraseña.</p>
                    </div>
                </div>
            )}

            {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}

            {/* Email Field */}
            <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    Correo Electrónico
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-650" size={16} />
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        className={`w-full bg-[#05070f] border rounded-lg pl-10 pr-4 py-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-sky-500 transition-all font-semibold ${errors.email ? 'border-red-500/60' : 'border-slate-800'}`}
                        placeholder="tunombre@ejemplo.com"
                        onChange={() => errors.email && setErrors(prev => ({ ...prev, email: undefined }))}
                    />
                </div>
                {errors.email && (
                    <p className="text-[9px] text-red-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <AlertCircle size={12} /> {errors.email}
                    </p>
                )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                        Contraseña
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-[10px] text-sky-400 hover:text-white font-black uppercase tracking-wider transition-colors hover:underline"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-650" size={16} />
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        className={`w-full bg-[#05070f] border rounded-lg pl-10 pr-4 py-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-sky-500 transition-all font-semibold ${errors.password ? 'border-red-500/60' : 'border-slate-800'}`}
                        placeholder="••••••••"
                        onChange={() => errors.password && setErrors(prev => ({ ...prev, password: undefined }))}
                    />
                </div>
                {errors.password && (
                    <p className="text-[9px] text-red-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <AlertCircle size={12} /> {errors.password}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.2)] mt-4 flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        Iniciando sesión...
                    </>
                ) : (
                    "Iniciar Sesión"
                )}
            </button>
        </form>
    );
}
