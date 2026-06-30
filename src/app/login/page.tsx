import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { getStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default async function StudentLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; returnUrl?: string; success?: string }>;
}) {
    const { error, returnUrl, success } = await searchParams;

    const student = await getStudent();
    if (student) {
        redirect(returnUrl || "/");
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 pt-28 pb-12 relative overflow-hidden">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-sky-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors mb-6 text-sm font-bold uppercase tracking-wider"
                >
                    <ArrowLeft size={16} /> Volver al inicio
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-lg mb-4">
                        <Lock className="w-10 h-10 text-sky-500" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">Ingreso de Alumnos</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Accede a tu panel y cursos premium de trading.</p>
                </div>

                <div className="bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    {/* Google Login */}
                    <a
                        href={`/api/auth/google${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
                        className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center gap-3 mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </a>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                            <span className="bg-white dark:bg-[#0d1326] px-3 text-slate-400 font-bold">o con correo</span>
                        </div>
                    </div>

                    {/* Client-side form with inline validation & loading state */}
                    <LoginForm
                        returnUrl={returnUrl}
                        initialError={error}
                        successMessage={success}
                        googleLinked={error === "google_linked"}
                    />

                    <div className="mt-6 text-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            ¿Aún no tienes cuenta?{" "}
                            <Link href="/register" className="text-sky-500 font-bold hover:underline">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
