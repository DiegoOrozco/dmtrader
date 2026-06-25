"use client";

import React, { useState } from "react";
import { Video, MapPin, Link2, Info } from "lucide-react";

export default function MentoriaClient() {
    const [meetingType, setMeetingType] = useState<"virtual" | "presencial" | null>(null);

    const zoomLink = "https://udecr.zoom.us/j/89237900586";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Instructions and Selector */}
            <div className="lg:col-span-5 space-y-6">
                <div className="raw-card p-6 rounded-xl">
                    <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-[var(--raw-accent)]" />
                        Paso 1: Selecciona la modalidad
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
                        Antes de agendar en el calendario, elige si prefieres que la sesión de mentoría sea en formato virtual o presencial.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setMeetingType("virtual")}
                            className={`p-4 flex flex-col items-center justify-center gap-3 rounded-lg border text-center transition-all cursor-pointer ${
                                meetingType === "virtual"
                                    ? "border-[var(--raw-accent)] bg-[var(--raw-accent)]/10 text-[var(--text-primary)]"
                                    : "border-[var(--border-color)] hover:border-[var(--raw-accent)] bg-[var(--card-bg)] text-[var(--text-secondary)]"
                            }`}
                        >
                            <Video className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-wider">Virtual (Zoom)</span>
                        </button>

                        <button
                            onClick={() => setMeetingType("presencial")}
                            className={`p-4 flex flex-col items-center justify-center gap-3 rounded-lg border text-center transition-all cursor-pointer ${
                                meetingType === "presencial"
                                    ? "border-[var(--raw-accent)] bg-[var(--raw-accent)]/10 text-[var(--text-primary)]"
                                    : "border-[var(--border-color)] hover:border-[var(--raw-accent)] bg-[var(--card-bg)] text-[var(--text-secondary)]"
                            }`}
                        >
                            <MapPin className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-wider">Presencial</span>
                        </button>
                    </div>
                </div>

                {/* Detail display based on selection */}
                {meetingType === "virtual" && (
                    <div className="raw-card p-6 border-l-4 border-l-[var(--raw-accent)] rounded-r-xl animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded bg-[var(--raw-accent)]/10 text-[var(--raw-accent)]">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-2">Conexión Virtual</h3>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                                    La sesión se realizará de manera remota. Puedes unirte de forma directa utilizando el siguiente enlace de Zoom:
                                </p>
                                <a
                                    href={zoomLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-black text-[var(--raw-accent)] hover:underline uppercase tracking-wider break-all"
                                >
                                    {zoomLink}
                                </a>
                                <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-2">
                                    * Guarda este enlace en tu agenda. También lo recibirás por correo.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {meetingType === "presencial" && (
                    <div className="raw-card p-6 border-l-4 border-l-[var(--raw-accent)] rounded-r-xl animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded bg-[var(--raw-accent)]/10 text-[var(--raw-accent)]">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-2">Coordinación Presencial</h3>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    Una vez agendada la mentoría en el calendario de la derecha, nos pondremos en contacto contigo para coordinar el lugar físico del encuentro.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {meetingType === null && (
                    <div className="p-6 border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-center">
                        <p className="text-xs text-[var(--text-secondary)] italic">
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
                    <div className="bg-[var(--card-bg)] p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                            Paso 2: Reserva tu día y hora
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--raw-accent)] animate-pulse" />
                            <span className="text-[9px] font-bold text-[var(--text-secondary)]">CALENDARIO ACTIVO</span>
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
    );
}
