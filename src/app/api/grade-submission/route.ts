import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { gradeSubmission } from "@/lib/gemini";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const dayId = formData.get("dayId") as string;
        const repoUrl = formData.get("repoUrl") as string | null;

        if ((!file && !repoUrl) || !dayId) {
            return NextResponse.json({ error: "Falta el archivo o el enlace al repositorio." }, { status: 400 });
        }

        // Fetch day limits and exceptions
        const day = await prisma.day.findUnique({
            where: { id: dayId },
            include: {
                deadlineExceptions: {
                    where: { userId: user.id }
                }
            }
        });

        if (!day) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
        }

        // AvailableFrom enforcement
        if (day.availableFrom && new Date() < new Date(day.availableFrom)) {
            return NextResponse.json({
                error: "La ventana de entrega aún no ha abierto.",
                code: "NOT_AVAILABLE_YET"
            }, { status: 403 });
        }

        // Deadline enforcement
        if (day.dueDate) {
            const now = new Date();
            let effectiveDueDate = new Date(day.dueDate);

            if (day.deadlineExceptions && day.deadlineExceptions.length > 0) {
                effectiveDueDate = new Date(day.deadlineExceptions[0].newDueDate);
            }

            if (now > effectiveDueDate) {
                return NextResponse.json({
                    error: "El tiempo límite para esta entrega ha expirado.",
                    code: "DEADLINE_PASSED"
                }, { status: 403 });
            }
        }

        let dbContent = "";
        let fileName = "";

        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fileName = file.name;

            // Upload to Vercel Blob
            const blob = await put(`submissions/${user.id}/${dayId}/${fileName}`, buffer, {
                access: "public",
                addRandomSuffix: true,
            });
            dbContent = blob.url;
        } else {
            // Link-only submission
            fileName = "repo-link.txt";
            dbContent = repoUrl || "";
        }

        // Fetch student group for this course
        const studentGroup = await prisma.group.findFirst({
            where: {
                course: { weeks: { some: { days: { some: { id: dayId } } } } },
                members: { some: { id: user.id } }
            },
            select: { id: true }
        });
        const groupId = studentGroup?.id || null;

        // Cleanup: If there's an existing submission (individual or group), delete the old blob
        try {
            const existingSubmission = await prisma.submission.findFirst({
                where: {
                    dayId,
                    OR: [
                        { userId: user.id },
                        groupId ? { groupId } : { id: 'none' }
                    ]
                }
            });

            if (existingSubmission?.content && existingSubmission.content.includes("vercel-storage.com")) {
                const { del } = await import("@vercel/blob");
                await del(existingSubmission.content);
                console.log(`[CLEANUP] Deleted old blob: ${existingSubmission.content}`);
            }

            const submissionData = {
                userId: user.id,
                groupId,
                dayId: dayId,
                content: dbContent,
                fileName: fileName,
                repoUrl: repoUrl,
                status: "PENDING",
                grade: null,
                feedback: {},
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

            // --- ASYNC EMAIL CONFIRMATION ---
            (async () => {
                try {
                    await sendEmail({
                        to: user.email,
                        subject: `Confirmación de Entrega: ${day.title}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h1 style="color: #333;">¡Hola ${user.name}!</h1>
                                <p>Hemos recibido correctamente tu entrega para: <strong>${day.title}</strong>.</p>
                                <p>Este correo sirve como comprobante oficial de que tu entrega ha sido registrada en nuestra plataforma.</p>
                                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                    <p style="margin: 0; font-size: 14px; color: #666;"><strong>Archivo:</strong> ${fileName}</p>
                                    ${repoUrl ? `<p style="margin: 0; font-size: 14px; color: #666;"><strong>Repositorio:</strong> ${repoUrl}</p>` : ''}
                                    <p style="margin: 0; font-size: 14px; color: #666;"><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                                </div>
                                ${file ? '<p style="margin-top: 20px; font-size: 12px; color: #999;">Adjunto encontrarás una copia del archivo que enviaste.</p>' : ''}
                            </div>
                        `,
                        attachments: file ? [
                            {
                                filename: fileName,
                                content: Buffer.from(await file.arrayBuffer())
                            }
                        ] : []
                    });
                } catch (err) {
                    console.error("[EMAIL-ERROR] Error al enviar confirmación de entrega (API):", err);
                }
            })();
            // ---------------------------------

            return NextResponse.json(submission);
        } catch (subError) {
            console.error("[SUBMISSION] Error saving to DB:", subError);
            return NextResponse.json({ error: "Error al guardar la entrega" }, { status: 500 });
        }

    } catch (error) {
        console.error("Submission API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
