"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import stringSimilarity from "string-similarity";
import { ensureStudent } from "@/lib/auth-guards";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const submissionSchema = z.object({
    dayId: z.string().min(1),
    code: z.string().min(1),
    outputs: z.array(z.string()),
    repoUrl: z.string().optional()
});

export async function submitCodingExercise(rawInput: any) {
    try {
        const { dayId, code, outputs } = submissionSchema.parse(rawInput);
        const student = await ensureStudent();
        const userId = student.id;
        const day = await prisma.day.findUnique({
            where: { id: dayId },
            select: {
                title: true,
                expectedOutput: true,
                testCases: true,
                similarityThreshold: true,
                enablePlagiarism: true,
                exerciseDescription: true,
                gradingSeverity: true,
            } as any,
        }) as any;

        if (!day) throw new Error("Ejercicio no encontrado");

        let grade: number | null = 0;
        let feedbackText = "";
        let isAiGraded = false;

        const testCases: any[] = Array.isArray(day.testCases) && day.testCases.length > 0
            ? day.testCases
            : (day.expectedOutput ? [{ output: day.expectedOutput }] : []);

        // DECISION: If there are test cases and we have outputs, use similarity.
        // OTHERWISE: Use AI Grading.
        if (testCases.length > 0 && outputs && outputs.length > 0) {
            let totalSimilarity = 0;
            let details = [];

            for (let i = 0; i < testCases.length; i++) {
                const tc = testCases[i];
                const cleanExpected = (tc.output || "").trim().toLowerCase();
                const cleanActual = (outputs[i] || "").trim().toLowerCase();

                let sim = 0;
                if (!cleanExpected && !cleanActual) {
                    sim = 1; // Both empty
                } else if (!cleanExpected || !cleanActual) {
                    sim = 0; // One is empty
                } else {
                    sim = stringSimilarity.compareTwoStrings(cleanExpected, cleanActual);
                }

                totalSimilarity += sim;
                details.push({ caso: i + 1, similitud: Math.round(sim * 100) });
            }

            const avgSimilarity = totalSimilarity / Math.max(testCases.length, 1);
            grade = Math.round(avgSimilarity * 100);
            const threshold = day.similarityThreshold || 0.9;

            if (avgSimilarity >= threshold) {
                feedbackText = `¡Excelente! Tu código superó las pruebas con un promedio de ${grade}% de precisión.\nCasos: ` + details.map(d => `C${d.caso}(${d.similitud}%)`).join(", ");
            } else {
                feedbackText = `Tu precisión promedio fue de ${grade}%. Se requiere al menos un ${Math.round(threshold * 100)}% para aprobar.\nCasos: ` + details.map(d => `C${d.caso}(${d.similitud}%)`).join(", ");
            }
        } else {
            // AI GRADING PATH - DELAYED (QUEUE)
            // We no longer call gradeSubmission here to avoid overloading on batch submissions.
            // The background cron job will pick this up.
            grade = null;
            feedbackText = "Tu entrega ha sido recibida y está en cola para ser calificada por la IA. Recibirás un correo cuando esté lista.";
            isAiGraded = true;
        }

        // Find the student's group for the course this day belongs to
        const studentGroup = await prisma.group.findFirst({
            where: {
                course: { weeks: { some: { days: { some: { id: dayId } } } } },
                members: { some: { id: userId } }
            },
            select: { id: true }
        });

        const groupId = studentGroup?.id || null;

        // Use a more flexible where clause for the upsert since we changed the unique constraint
        const existingSubmission = await prisma.submission.findFirst({
            where: {
                dayId,
                OR: [
                    { userId },
                    groupId ? { groupId } : { id: 'none' }
                ]
            }
        });

        const submissionData = {
            userId,
            groupId,
            dayId,
            content: code,
            status: isAiGraded ? "PENDING" : "GRADED",
            grade: grade,
            feedback: { 
                text: feedbackText,
                isAiGraded,
                ...(isAiGraded ? {} : { outputs })
            } as any,
            fileName: "solution.py",
        };

        let submission;
        if (existingSubmission) {
            submission = await prisma.submission.update({
                where: { id: existingSubmission.id },
                data: submissionData
            });
        } else {
            submission = await prisma.submission.create({
                data: submissionData
            });
        }

        console.log(`[Submission] Saved for user ${userId} on day ${dayId}. Status: ${submission.status}`);
        
        // --- ASYNC EMAIL CONFIRMATION ---
        (async () => {
            try {
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
                if (user?.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `Confirmación de Entrega: ${day.title}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h1 style="color: #333;">¡Hola ${user.name}!</h1>
                                <p>Hemos recibido correctamente tu entrega para el ejercicio: <strong>${day.title}</strong>.</p>
                                <p>Este correo sirve como comprobante oficial de que tu código ha sido registrado en nuestra plataforma.</p>
                                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                    <p style="margin: 0; font-size: 14px; color: #666;"><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                                    <p style="margin: 0; font-size: 14px; color: #666;"><strong>Estado:</strong> ${submission.status}</p>
                                </div>
                                <p style="margin-top: 20px; font-size: 12px; color: #999;">Adjunto encontrarás una copia del código que enviaste.</p>
                            </div>
                        `,
                        attachments: [
                            {
                                filename: `${day.title.replace(/\s+/g, "_")}.py`,
                                content: code
                            }
                        ]
                    });
                }
            } catch (err) {
                console.error("[EMAIL-ERROR] Error al enviar confirmación de entrega:", err);
            }
        })();
        // ---------------------------------

        revalidatePath(`/courses`, "layout");

        return { success: true, submission, similarity: grade };
    } catch (error: any) {
        console.error("Submission error:", error);
        return { success: false, error: error.message };
    }
}
export async function deleteSubmission(dayId: string) {
    try {
        const student = await ensureStudent();
        const userId = student.id;

        // Fetch day and submission
        const day = await prisma.day.findUnique({
            where: { id: dayId },
            include: {
                deadlineExceptions: {
                    where: { userId }
                }
            }
        });

        if (!day) throw new Error("Día no encontrado");

        // Deadline check
        if (day.dueDate) {
            let effectiveDueDate = new Date(day.dueDate);
            if (day.deadlineExceptions && day.deadlineExceptions.length > 0) {
                effectiveDueDate = new Date(day.deadlineExceptions[0].newDueDate);
            }
            if (new Date() > effectiveDueDate) {
                throw new Error("No puedes eliminar una entrega después de la fecha límite.");
            }
        }

        // Find submission
        // Need to check group too
        const studentGroup = await prisma.group.findFirst({
            where: {
                course: { weeks: { some: { days: { some: { id: dayId } } } } },
                members: { some: { id: userId } }
            },
            select: { id: true }
        });
        const groupId = studentGroup?.id || null;

        const submission = await prisma.submission.findFirst({
            where: {
                dayId,
                OR: [
                    { userId },
                    groupId ? { groupId } : { id: 'none' }
                ]
            }
        });

        if (!submission) return { success: true, message: "No había entrega que eliminar." };

        // 1. Cleanup Blob if exists
        if (submission.content && (submission.content.includes("vercel-storage.com") || submission.content.includes("public.blob.vercel-storage.com"))) {
            try {
                const { del } = await import("@vercel/blob");
                await del(submission.content);
                console.log(`[CLEANUP] Deleted blob: ${submission.content}`);
            } catch (blobErr) {
                console.warn("[CLEANUP] Failed to delete blob, proceeding with DB deletion:", blobErr);
            }
        }

        // 2. Delete from DB
        await prisma.submission.delete({
            where: { id: submission.id }
        });

        revalidatePath(`/courses`, "layout");
        return { success: true, message: "Entrega eliminada correctamente." };
    } catch (error: any) {
        console.error("Delete submission error:", error);
        return { success: false, error: error.message };
    }
}

export async function startTestSession(dayId: string) {
    try {
        const student = await ensureStudent();
        const userId = student.id;

        const session = await prisma.testSession.upsert({
            where: {
                userId_dayId: { userId, dayId }
            },
            update: {}, // Don't change startedAt if already exists
            create: {
                userId,
                dayId,
                startedAt: new Date()
            }
        });

        return { success: true, startedAt: session.startedAt };
    } catch (error: any) {
        console.error("Start test session error:", error);
        return { success: false, error: error.message };
    }
}

export async function getTestSession(dayId: string) {
    try {
        const student = await ensureStudent();
        const userId = student.id;

        const session = await prisma.testSession.findUnique({
            where: {
                userId_dayId: { userId, dayId }
            }
        });

        return { success: true, startedAt: session?.startedAt || null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
