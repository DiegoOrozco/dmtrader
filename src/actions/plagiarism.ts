"use server";

import prisma from "@/lib/prisma";
import stringSimilarity from "string-similarity";
import { ensureAdmin } from "@/lib/auth-guards";
import { analyzePlagiarismSimilarity } from "@/lib/gemini";

export async function detectPlagiarism(dayId: string, includeAI = false) {
    try {
        await ensureAdmin();
        const submissions = await prisma.submission.findMany({
            where: { dayId },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        const day = await prisma.day.findUnique({
            where: { id: dayId },
            select: { similarityThreshold: true } as any
        });

        const threshold = (day as any)?.similarityThreshold || 0.6;
        console.log(`[Plagiarism] Analyzing day ${dayId} with threshold ${threshold}`);

        if (submissions.length < 2) return { success: true, similarities: [] };

        const similarities: any[] = [];

        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const codeA = submissions[i].content || "";
                const codeB = submissions[j].content || "";
                
                // Skip tracking if it's too short (like a URL) or empty
                if (codeA.trim().length < 50 || codeB.trim().length < 50) continue;
                if (codeA.startsWith("http") || codeB.startsWith("http")) continue;

                const sim = stringSimilarity.compareTwoStrings(codeA, codeB);

                console.log(`[Plagiarism] Comparing ${submissions[i].user?.email} vs ${submissions[j].user?.email}: similarity ${sim.toFixed(4)}`);

                if (sim >= threshold) {
                    const studentA = submissions[i].user?.name || submissions[i].user?.email || "Estudiante A"
                    const studentB = submissions[j].user?.name || submissions[j].user?.email || "Estudiante B"
                    
                    let aiAnalysis = null;
                    if (includeAI) {
                        aiAnalysis = await analyzePlagiarismSimilarity(codeA, codeB, studentA, studentB);
                    }

                    similarities.push({
                        studentA,
                        studentB,
                        studentAId: submissions[i].userId,
                        studentBId: submissions[j].userId,
                        similarity: Math.round(sim * 100),
                        codeA,
                        codeB,
                        aiAnalysis
                    });
                }
            }
        }

        // Sort by highest similarity
        similarities.sort((a, b) => b.similarity - a.similarity);

        return { success: true, similarities };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAiPlagiarismAnalysis(codeA: string, codeB: string, studentA: string, studentB: string) {
    try {
        await ensureAdmin();
        const analysis = await analyzePlagiarismSimilarity(codeA, codeB, studentA, studentB);
        return { success: true, analysis };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

