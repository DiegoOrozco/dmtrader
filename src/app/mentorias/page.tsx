"use client";

import React, { useState } from "react";
import { Video, MapPin, Calendar, Clock, Link2, Info } from "lucide-react";

export default function MentoriasPage() {
    const [meetingType, setMeetingType] = useState<"virtual" | "presencial" | null>(null);

    const zoomLink = "https://udecr.zoom.us/j/89237900586";

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
                        Agenda tu sesión individual para revisar estrategias, análisis de mercado y optimizar tu operativa de trading junto a nosotros.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Instructions and Selector */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="raw-card p-6 rounded-xl border border-white/5 bg-white/[0.02]">
                            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-[#cde641]" />
                                Paso 1: Selecciona la modalidad
                            </h2>
                            <p className="text-xs text-white/40 mb-6 leading-relaxed">
                                Antes de agendar en el calendario, elige si prefieres que la sesión de mentoría sea en formato virtual o presencial.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMeetingType("virtual")}
                                    className={`p-4 flex flex-col items-center justify-center gap-3 rounded-lg border text-center transition-all cursor-pointer ${
                                        meetingType === "virtual"
                                            ? "border-[#cde641] bg-[#cde641]/10 text-white"
                                            : "border-white/10 hover:border-white/20 bg-white/[0.01] text-white/60"
                                    }`}
                                >
                                    <Video className="w-6 h-6" />
                                    <span className="text-xs font-black uppercase tracking-wider">Virtual (Zoom)</span>
                                </button>

                                <button
                                    onClick={() => setMeetingType("presencial")}
                                    className={`p-4 flex flex-col items-center justify-center gap-3 rounded-lg border text-center transition-all cursor-pointer ${
                                        meetingType === "presencial"
                                            ? "border-[#cde641] bg-[#cde641]/10 text-white"
                                            : "border-white/10 hover:border-white/20 bg-white/[0.01] text-white/60"
                                    }`}
                                >
                                    <MapPin className="w-6 h-6" />
                                    <span className="text-xs font-black uppercase tracking-wider">Presencial</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal/Detail display based on selection */}
                        {meetingType === "virtual" && (
                            <div className="raw-card p-6 border-l-4 border-l-[#cde641] rounded-r-xl bg-white/[0.01] animate-fade-in">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded bg-[#cde641]/10 text-[#cde641]">
                                        <Link2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Conexión Virtual</h3>
                                        <p className="text-xs text-white/50 leading-relaxed mb-4">
                                            La sesión se realizará de manera remota. Puedes unirte de forma directa utilizando el siguiente enlace de Zoom:
                                        </p>
                                        <a
                                            href={zoomLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-black text-[#cde641] hover:underline uppercase tracking-wider break-all"
                                        >
                                            {zoomLink}
                                        </a>
                                        <p className="text-[10px] text-white/30 mt-2">
                                            * Guarda este enlace en tu agenda. También lo recibirás por correo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {meetingType === "presencial" && (
                            <div className="raw-card p-6 border-l-4 border-l-[#cde641] rounded-r-xl bg-white/[0.01] animate-fade-in">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded bg-[#cde641]/10 text-[#cde641]">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Coordinación Presencial</h3>
                                        <p className="text-xs text-white/50 leading-relaxed">
                                            Una vez agendada la mentoría en el calendario de la derecha, nos pondremos en contacto contigo para coordinar el lugar físico del encuentro.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {meetingType === null && (
                            <div className="p-6 border border-white/5 rounded-xl bg-white/[0.005] text-center">
                                <p className="text-xs text-white/30 italic">
                                    Elige virtual o presencial para continuar.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Google Calendar Iframe */}
                    <div className="lg:col-span-7">
                        <div className={`raw-card rounded-xl overflow-hidden transition-all duration-300 ${
                            meetingType ? "opacity-100 scale-100" : "opacity-30 pointer-events-none scale-[0.98]"
                        }`}>
                            <div className="bg-white/[0.03] p-4 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                    Paso 2: Reserva tu día y hora
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#cde641] animate-pulse" />
                                    <span className="text-[9px] font-bold text-white/60">CALENDARIO ACTIVO</span>
                                </div>
                            </div>
                            
                            <div className="bg-white">
                                <iframe
                                    src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2_G1r7Bhrr1waE0Dy1NHWg5c9-3woD2bWjzge--ijxU_25QCPzjIq6ckPrxaX2lBFzuenSfrpA?gv=true"
                                    style={{ border: 0 }}
                                    width="100%"
                                    height="600"
                                    frameBorder="0"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
