import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { loginAdmin } from "../../../actions/auth";
import { verifySession } from "@/lib/session";

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const cookieStore = await cookies();
    const isAdmin = verifySession(cookieStore.get("admin_session")?.value) === "valid";

    if (isAdmin) {
        redirect("/admin");
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-red-500/10 blur-[150px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors mb-6 text-sm font-bold uppercase tracking-wider"
                >
                    <ArrowLeft size={16} /> Volver al inicio
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/20 shadow-lg mb-4">
                        <Shield className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">Acceso Administrativo</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Portal de administración académica exclusivo de DM Trader.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    {error === "incorrect" && (
                        <div className="mb-4 bg-red-500/10 text-red-500 text-xs py-3 px-4 rounded-xl border border-red-500/20 text-center font-bold uppercase tracking-wide">
                            Contraseña maestra incorrecta. Acceso denegado.
                        </div>
                    )}

                    <form action={loginAdmin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                Contraseña Maestra
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all font-medium text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-[0_4px_15px_rgba(239,68,68,0.2)] mt-4 flex items-center justify-center gap-2"
                        >
                            <Shield size={16} />
                            Iniciar Sesión Segura
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
