"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface NewsItem {
    title: string;
    summary: string;
    date: string;
    image_keyword?: string;
    search_url?: string;
    source?: string;
    grad?: string;
}

export default function NewsSlider({ news }: { news: NewsItem[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
    }, [news.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
    };

    useEffect(() => {
        if (!isHovered) {
            const interval = setInterval(nextSlide, 6000);
            return () => clearInterval(interval);
        }
    }, [nextSlide, isHovered]);

    if (!news || news.length === 0) return null;

    const current = news[currentIndex];

    return (
        <div 
            className="group relative w-full aspect-[21/9] min-h-[400px] rounded-3xl overflow-hidden shadow-xl border border-slate-200/10 transition-all duration-750"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image with Reveal Animation */}
            {news.map((item, i) => (
                <div 
                    key={i}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        i === currentIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                    }`}
                >
                    <Image 
                        src={`https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1600&sig=${encodeURIComponent(item.image_keyword || item.title || i)}`}
                        alt={item.title}
                        fill
                        className="object-cover"
                        priority={i === 0}
                    />
                    <div className="absolute inset-0 bg-slate-950/70" />
                    <div className={`absolute inset-0 bg-gradient-to-tr ${item.grad || 'from-sky-600/30 to-transparent'} opacity-40`} />
                </div>
            ))}

            {/* Content Box (Premium trading/forex broker aesthetic) */}
            <div className="relative h-full flex items-center px-6 sm:px-16 z-10">
                <div 
                    className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-2xl max-w-[550px] shadow-2xl transform transition-all duration-500 translate-y-0 group-hover:-translate-y-1 animate-in fade-in slide-in-from-left-6"
                    key={`content-${currentIndex}`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-sky-500/20">
                            {current.source || 'Análisis de Mercado'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{current.date}</span>
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug mb-4 tracking-tight">
                        {current.title}
                    </h2>
                    
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        {current.summary}
                    </p>

                    <Link 
                        href={current.search_url?.startsWith('http') ? current.search_url : `https://www.google.com/search?q=${encodeURIComponent(current.title)}+noticias+trading&tbm=nws`}
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:from-sky-400 hover:to-sky-500 hover:shadow-lg hover:shadow-sky-500/20 transition-all group/btn"
                    >
                        Buscar Noticia
                        <Search className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button 
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-sky-500 active:scale-95 z-20 border border-white/5"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-sky-500 active:scale-95 z-20 border border-white/5"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                {news.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1 transition-all duration-500 rounded-full ${
                            i === currentIndex ? "w-8 bg-sky-500" : "w-3 bg-white/20 hover:bg-white/40"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
