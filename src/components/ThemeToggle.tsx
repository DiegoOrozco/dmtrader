"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"dark" | "light">("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        } else {
            // Default to light
            setTheme("light");
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);

        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 md:p-2.5 rounded-xl bg-white/5 border border-white/10 dark:border-white/10 border-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all flex items-center justify-center group"
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            {theme === "dark" ? (
                <Sun size={18} className="group-hover:rotate-45 transition-transform duration-500 text-yellow-400" />
            ) : (
                <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-500 text-indigo-600" />
            )}
        </button>
    );
}
