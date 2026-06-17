import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COURSES = [
    {
        id: "01",
        title: "01 - Introducción al Trading y Mercados Financieros",
        description: "Aprende los conceptos básicos de los mercados financieros, tipos de activos y cómo empezar a operar.",
        thumbnail: "/thumbnails/01.png",
        status: "published",
        password: "dmtraderpass",
        weeks: [
            {
                id: "w1_01",
                title: "Semana 1: Conceptos Fundamentales",
                order: 1,
                days: [
                    {
                        id: "d1_01",
                        title: "Día 1: ¿Qué es el trading y cómo funciona?",
                        order: 1,
                        videoId: "dQw4w9WgXcQ",
                        materialUrl: "https://github.com/DiegoOrozco",
                    }
                ]
            }
        ]
    },
    {
        id: "02",
        title: "02 - Análisis Técnico Avanzado",
        description: "Domina la lectura de gráficos, soportes, resistencias, canales y los mejores indicadores técnicos.",
        thumbnail: "/thumbnails/02.png",
        status: "published",
        password: "dmtraderpass",
        weeks: []
    },
    {
        id: "03",
        title: "03 - Gestión del Riesgo y Psicología del Trader",
        description: "El pilar más importante del trading: cómo proteger tu capital y controlar las emociones al operar.",
        thumbnail: "/thumbnails/03.png",
        status: "published",
        password: "dmtraderpass",
        weeks: []
    }
];

async function main() {
    console.log("Start seeding database...");

    // Clean existing user/social DB info to reset
    await prisma.reply.deleteMany();
    await prisma.post.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.user.deleteMany();

    console.log("Cleaned old user data.");

    // Seed dummy Users
    const admin = await prisma.user.create({
        data: {
            id: "admin_01",
            name: "Profesor Diego",
            email: "admin@dmtrader.com",
            password: "hashedpassword",
            role: "ADMIN"
        }
    });

    const student1 = await prisma.user.create({
        data: {
            id: "student_01",
            name: "Estudiante Uno",
            email: "uno@example.com",
            password: "hashedpassword",
            role: "STUDENT"
        }
    });

    const student2 = await prisma.user.create({
        data: {
            id: "student_02",
            name: "Estudiante Dos",
            email: "dos@example.com",
            password: "hashedpassword",
            role: "STUDENT"
        }
    });

    console.log("Created dummy students.");

    for (const c of COURSES) {
        const course = await prisma.course.upsert({
            where: { id: c.id },
            update: {
                title: c.title,
                description: c.description,
                thumbnail: c.thumbnail,
                status: c.status,
                password: c.password,
                category: "Trading"
            },
            create: {
                id: c.id,
                title: c.title,
                description: c.description,
                thumbnail: c.thumbnail,
                status: c.status,
                password: c.password,
                category: "Trading",
                weeks: {
                    create: c.weeks.map((week) => ({
                        id: week.id,
                        title: week.title,
                        order: week.order,
                        days: {
                            create: week.days.map((day) => ({
                                id: day.id,
                                title: day.title,
                                order: day.order,
                                videoId: day.videoId,
                                materialUrl: day.materialUrl,
                            }))
                        }
                    }))
                }
            },
        });
        console.log(`Created/Upserted course: ${course.title}`);
    }

    // Seed Enrollments for testing
    await prisma.enrollment.createMany({
        data: [
            { userId: student1.id, courseId: "01" },
            { userId: student2.id, courseId: "01" }
        ]
    });

    // Seed Comments on Day 1 (d1_01)
    const post1 = await prisma.post.create({
        data: {
            id: "p1",
            content: "¡Excelente video! Me quedó clarísimo cómo funciona el trading.",
            userId: student1.id,
            dayId: "d1_01"
        }
    });

    await prisma.reply.create({
        data: {
            id: "r1",
            content: "Muchas gracias, me alegro que te sirviera.",
            userId: admin.id,
            postId: post1.id
        }
    });

    await prisma.post.create({
        data: {
            id: "p2",
            content: "Tengo una duda con la parte de los paradigmas.",
            userId: student2.id,
            dayId: "d1_01"
        }
    });

    console.log("Seeded enrollments and comments on course 01, day 1.");

    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
