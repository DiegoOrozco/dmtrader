"use client";

import React, { useState } from "react";
import { createPost, createReply, deletePost, deleteReply } from "@/actions/forum";
import { MessageSquare, Send, User, CornerDownRight, HelpCircle, Trash2 } from "lucide-react";

interface VideoQAProps {
    day: any;
    studentId: string;
    courseId: string;
    userRole?: string;
    onPostCreated: () => void;
}

export default function VideoQA({ day, studentId, courseId, userRole, onPostCreated }: VideoQAProps) {
    const isAdmin = userRole === "ADMIN";
    const [newQuestion, setNewQuestion] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => { setIsMounted(true); }, []);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    const posts = day.posts || [];

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || isPosting) return;

        setIsPosting(true);
        try {
            const res = await createPost(day.id, newQuestion, courseId);
            if (res.success) {
                setNewQuestion("");
                onPostCreated();
            } else {
                alert("Error al publicar: " + res.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión");
        } finally {
            setIsPosting(false);
        }
    };

    const handleReply = async (postId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || isReplying) return;

        setIsReplying(true);
        try {
            const res = await createReply(postId, replyText);
            if (res.success) {
                setReplyText("");
                setReplyingTo(null);
                onPostCreated();
            } else {
                alert("Error al enviar respuesta: " + res.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión");
        } finally {
            setIsReplying(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta pregunta y todas sus respuestas?")) return;
        try {
            const res = await deletePost(postId);
            if (res.success) onPostCreated();
            else alert("Error: " + res.error);
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta respuesta?")) return;
        try {
            const res = await deleteReply(replyId);
            if (res.success) onPostCreated();
            else alert("Error: " + res.error);
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const formatDate = (date: any) => {
        if (!isMounted || !date) return "...";
        try {
            return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "...";
        }
    };

    return (
        <div className="flex flex-col gap-4 mt-6 p-6 bg-[#0a0e1a] rounded-2xl border border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <HelpCircle size={18} className="text-sky-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Preguntas y Respuestas</h3>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-auto">{posts.length} {posts.length === 1 ? "pregunta" : "preguntas"}</span>
            </div>

            {/* Input */}
            <form onSubmit={handlePost} className="flex gap-2">
                <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="¿Tienes alguna pregunta sobre esta clase?"
                    className="flex-grow bg-[#05070f] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-sky-500 transition-all font-semibold"
                    required
                />
                <button
                    type="submit"
                    disabled={isPosting || !newQuestion.trim()}
                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all"
                >
                    <Send size={12} />
                    {isPosting ? "..." : "Preguntar"}
                </button>
            </form>

            {/* Q&A Thread */}
            {posts.length > 0 ? (
                <div className="flex flex-col gap-3 mt-1">
                    {posts.map((post: any) => (
                        <div key={post.id} className="flex flex-col gap-2">
                            {/* Question */}
                            <div className="bg-[#05070f]/40 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 hover:border-sky-500/30 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${post.user?.role === "ADMIN" ? "bg-amber-500 text-white" : "bg-sky-500 text-white"}`}>
                                        <User size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-2">
                                            {post.user?.name || "Estudiante"}
                                            {post.user?.role === "ADMIN" && <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 py-[1px] rounded uppercase">Profesor</span>}
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{formatDate(post.createdAt)}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-300 font-semibold leading-relaxed pl-9 whitespace-pre-wrap">{post.content}</p>

                                <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-2 mt-1">
                                    <button
                                        onClick={() => {
                                            setReplyingTo(replyingTo === post.id ? null : post.id);
                                            setReplyText("");
                                        }}
                                        className="text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1"
                                    >
                                        <CornerDownRight size={10} />
                                        Responder
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="text-[9px] font-black uppercase tracking-wider text-rose-500/50 hover:text-rose-500 transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 size={10} />
                                            Eliminar
                                        </button>
                                    )}
                                </div>

                                {replyingTo === post.id && (
                                    <form onSubmit={(e) => handleReply(post.id, e)} className="flex gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Escribe tu respuesta..."
                                            className="flex-grow bg-[#05070f] border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 min-h-[40px] placeholder:text-slate-700 resize-y font-semibold"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isReplying || !replyText.trim()}
                                            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white p-2 rounded-lg flex items-center justify-center h-fit self-end"
                                        >
                                            <Send size={12} />
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Replies */}
                            {(post.replies || []).map((reply: any) => (
                                <div key={reply.id} className="ml-6 sm:ml-10 border-l border-slate-800 pl-3">
                                    <div className="bg-[#05070f]/20 p-3 rounded-xl border border-slate-850 flex flex-col gap-1 hover:border-sky-500/20 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${reply.user?.role === "ADMIN" ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-300"}`}>
                                                <User size={10} />
                                            </div>
                                            <span className="font-black text-white text-[11px] uppercase tracking-wider flex items-center gap-1">
                                                {reply.user?.name || "Estudiante"}
                                                {reply.user?.role === "ADMIN" && <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 rounded uppercase">Prof.</span>}
                                            </span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-slate-300 font-medium leading-relaxed pl-8 whitespace-pre-wrap">{reply.content}</p>

                                        {/* Reply to reply */}
                                        <div className="flex justify-end gap-3 border-t border-slate-850/40 pt-2 mt-1">
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(replyingTo === `r-${reply.id}` ? null : `r-${reply.id}`);
                                                    setReplyText("");
                                                }}
                                                className="text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1"
                                            >
                                                <CornerDownRight size={10} />
                                                Responder
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteReply(reply.id)}
                                                    className="text-[9px] font-black uppercase tracking-wider text-rose-500/50 hover:text-rose-500 transition-colors flex items-center gap-1"
                                                >
                                                    <Trash2 size={10} />
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>

                                        {replyingTo === `r-${reply.id}` && (
                                            <form onSubmit={(e) => handleReply(post.id, e)} className="flex gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder={`Respondiendo a ${reply.user?.name || "Estudiante"}...`}
                                                    className="flex-grow bg-[#05070f] border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 min-h-[30px] placeholder:text-slate-700 resize-y font-semibold"
                                                    required
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isReplying || !replyText.trim()}
                                                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white p-2 rounded-lg flex items-center justify-center h-fit self-end"
                                                >
                                                    <Send size={12} />
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 italic text-center py-3">
                    No hay preguntas aún. ¡Sé el primero en preguntar!
                </p>
            )}
        </div>
    );
}
