import React from "react";
import { getStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import MentoriaClient from "@/components/MentoriaClient";

export default async function MentoriasPage() {
    // 1. Verify student session on the server-side
    const student = await getStudent();
    
    if (!student) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen relative pt-32 pb-40" style={{ background: 'var(--raw-bg)' }}>
            {/* Background decorative elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" style={{ opacity: 0.05 }}>
                <span className="raw-watermark top-[20%] right-[10%]">MENTORÍA</span>
                <span className="raw-watermark bottom-[20%] left-[10%]">RESERVA</span>
            </div>

            <main className="relative z-10 max-w-[1200px] mx-auto px-6">
                {/* ── HEADER ── */}
                <div className="mb-12 text-center md:text-left">
                    <span className="raw-label" style={{ color: 'var(--raw-accent)' }}>// PROGRAMA DE MENTORÍAS EXCLUSIVAS</span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tighter uppercase mt-4 mb-6">
                        RESERVA TU MENTORÍA
                    </h1>
                    <p className="text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed uppercase tracking-tight italic">
                        Hola {student.name.split(" ")[0]}, agenda tu sesión individual para revisar estrategias, análisis de mercado y optimizar tu operativa de trading junto a nosotros.
                    </p>
                </div>

                {/* Render the Client wrapper */}
                <MentoriaClient />
            </main>
        </div>
    );
}
