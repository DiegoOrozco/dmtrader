"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureAdmin, ensureStudent } from "@/lib/auth-guards";
import { sendEmail } from "@/lib/email";

export async function createPost(dayId: string, content: string, courseId: string) {
    try {
        const student = await ensureStudent();

        await prisma.post.create({
            data: {
                content,
                dayId,
                userId: student.id
            }
        });

        // Background async notification to admin
        const notifyAdmin = async () => {
            try {
                const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
                if (!adminUser) return;

                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dmtrader.vercel.app";
                const qaLink = `${baseUrl}/admin/qa`;
                const cleanContent = content.length > 300 ? content.slice(0, 300) + '...' : content;

                const htmlContent = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0f172a; color: #f8fafc;">
                        <h2 style="color: #cde641;">Nueva Pregunta de Estudiante</h2>
                        <p>Hola <strong>${adminUser.name}</strong>,</p>
                        <p>El estudiante <strong>${student.name}</strong> ha realizado una nueva pregunta en un curso:</p>
                        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #334155;">
                            <p style="margin: 0; font-style: italic; color: #cbd5e1; white-space: pre-wrap;">"${cleanContent}"</p>
                        </div>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${qaLink}" style="background-color: #cde641; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">
                                Responder en Dashboard →
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
                        <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">DM Trader - Sistema Automatizado</p>
                    </div>
                `;

                await sendEmail({
                    to: adminUser.email,
                    subject: `💡 Nueva consulta de ${student.name}`,
                    html: htmlContent
                });
            } catch (err) {
                console.error("Failed to push email notification for new QA post", err);
            }
        };

        // Fire and forget
        notifyAdmin();

        revalidatePath(`/course/${courseId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Create Post Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createReply(postId: string, content: string) {
    try {
        const cookieStore = await (await import("next/headers")).cookies();
        const adminSession = cookieStore.get("admin_session")?.value;
        const isAdmin = (await import("@/lib/session")).verifySession(adminSession) === "valid";

        let actualUserId: string;

        if (isAdmin) {
            const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (!adminUser) return { success: false, error: "No Admin User found" };
            actualUserId = adminUser.id;
        } else {
            const student = await ensureStudent();
            actualUserId = student.id;
        }

        const reply = await prisma.reply.create({
            data: {
                content,
                postId,
                userId: actualUserId
            },
            include: {
                post: {
                    include: {
                        day: {
                            include: {
                                week: {
                                    select: { courseId: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const courseId = reply.post.day.week.courseId;

        // Background async notification to admin if the reply was from a student
        if (!isAdmin) {
            const notifyAdmin = async () => {
                try {
                    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
                    if (!adminUser) return;

                    // Re-fetch student to get name since actualUserId is just the ID here
                    const studentUser = await prisma.user.findUnique({ where: { id: actualUserId } });
                    if (!studentUser) return;

                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dmtrader.vercel.app";
                    const qaLink = `${baseUrl}/admin/qa`;
                    const cleanContent = content.length > 300 ? content.slice(0, 300) + '...' : content;

                    const htmlContent = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0f172a; color: #f8fafc;">
                            <h2 style="color: #cde641;">Nueva Respuesta de Estudiante</h2>
                            <p>Hola <strong>${adminUser.name}</strong>,</p>
                            <p>El estudiante <strong>${studentUser.name}</strong> ha respondido a un hilo en preguntas y respuestas:</p>
                            <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #334155;">
                                <p style="margin: 0; font-style: italic; color: #cbd5e1; white-space: pre-wrap;">"${cleanContent}"</p>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${qaLink}" style="background-color: #cde641; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">
                                    Ver Hilo en Dashboard →
                                </a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
                            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">DM Trader - Sistema Automatizado</p>
                        </div>
                    `;

                    await sendEmail({
                        to: adminUser.email,
                        subject: `Respuesta de ${studentUser.name} en Q&A`,
                        html: htmlContent
                    });
                } catch (err) {
                    console.error("Failed to push email notification for new QA reply", err);
                }
            };
            // Fire and forget
            notifyAdmin();
        }

        // Revalidate admin and the specific course for the student
        revalidatePath(`/admin/qa`);
        if (courseId) {
            revalidatePath(`/course/${courseId}`);
        }
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Create Reply Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deletePost(postId: string) {
    try {
        await ensureAdmin();
        await prisma.post.delete({
            where: { id: postId }
        });
        revalidatePath("/");
        revalidatePath("/admin/qa");
        return { success: true };
    } catch (error: any) {
        console.error("Delete Post Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteReply(replyId: string) {
    try {
        await ensureAdmin();
        await prisma.reply.delete({
            where: { id: replyId }
        });
        revalidatePath("/");
        revalidatePath("/admin/qa");
        return { success: true };
    } catch (error: any) {
        console.error("Delete Reply Error:", error);
        return { success: false, error: error.message };
    }
}
