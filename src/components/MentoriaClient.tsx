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
                <div className="bg-[#0a0e1a] border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h2 className="text-md font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-sky-400" />
                        Paso 1: Selecciona la modalidad
                    </h2>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Antes de agendar en el calendario, elige si prefieres que la sesión de mentoría sea en formato virtual o presencial.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setMeetingType("virtual")}
                            className={`p-4 flex flex-col items-center justify-center gap-3 rounded-xl border text-center transition-all cursor-pointer ${
                                meetingType === "virtual"
                                    ? "border-sky-500 bg-sky-500/10 text-white shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                                    : "border-slate-800 hover:border-slate-700 bg-black/40 text-slate-400"
                            }`}
                        >
                            <Video className="w-6 h-6 text-sky-400" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Virtual (Zoom)</span>
                        </button>

                        <button
                            onClick={() => setMeetingType("presencial")}
                            className={`p-4 flex flex-col items-center justify-center gap-3 rounded-xl border text-center transition-all cursor-pointer ${
                                meetingType === "presencial"
                                    ? "border-sky-500 bg-sky-500/10 text-white shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                                    : "border-slate-800 hover:border-slate-700 bg-black/40 text-slate-400"
                            }`}
                        >
                            <MapPin className="w-6 h-6 text-sky-400" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Presencial</span>
                        </button>
                    </div>
                </div>

                {/* Detail display based on selection */}
                {meetingType === "virtual" && (
                    <div className="bg-[#0a0e1a] border border-slate-800 p-6 border-l-4 border-l-sky-400 rounded-r-2xl shadow-xl animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded bg-sky-500/10 text-sky-400">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">Conexión Virtual</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                    La sesión se realizará de manera remota. Puedes unirte de forma directa utilizando el siguiente enlace de Zoom:
                                </p>
                                <a
                                    href={zoomLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-black text-sky-400 hover:underline uppercase tracking-wider break-all"
                                >
                                    {zoomLink}
                                </a>
                                <p className="text-[10px] text-slate-500 mt-2">
                                    * Guarda este enlace en tu agenda. También lo recibirás por correo.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {meetingType === "presencial" && (
                    <div className="bg-[#0a0e1a] border border-slate-800 p-6 border-l-4 border-l-sky-400 rounded-r-2xl shadow-xl animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded bg-sky-500/10 text-sky-400">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">Coordinación Presencial</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Una vez agendada la mentoría en el calendario de la derecha, nos pondremos en contacto contigo para coordinar el lugar físico del encuentro.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {meetingType === null && (
                    <div className="p-6 border border-slate-800 rounded-2xl bg-[#0a0e1a]/80 text-center shadow-xl">
                        <p className="text-xs text-slate-505 italic font-medium">
                            Elige virtual o presencial para continuar.
                        </p>
                    </div>
                )}
            </div>

            {/* Right Column: Google Calendar Iframe */}
            <div className="lg:col-span-7">
                <div className={`bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                    meetingType ? "opacity-100 scale-100" : "opacity-30 pointer-events-none scale-[0.98]"
                }`}>
                    <div className="bg-[#0d1322] p-4 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Paso 2: Reserva tu día y hora
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                            <span className="text-[9px] font-bold text-sky-400 tracking-wider">CALENDARIO ACTIVO</span>
                        </div>
                    </div>
                    
                    <div className="bg-white">
                        <iframe
                            src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2_G1r7Bhrr1waE0Dy1NHWg5c9-3woD2bWjzge--ijxU_25QCPzjIq6ckPrxaX2lBFzuenSfrpA?gv=true"
                            style={{ border: 0 }}
                            width="100%"
                            height="600"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
}
