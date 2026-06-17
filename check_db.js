const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const day = await prisma.day.findFirst({
    where: { title: { contains: 'POO', mode: 'insensitive' } } // or anything
  });
  console.log("Day found:", day ? day.title : "none");
  
  const subs = await prisma.submission.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log("Recent subs:", subs.map(s => ({id: s.id, userId: s.userId, groupId: s.groupId, dayId: s.dayId})));
}

main().finally(() => prisma.$disconnect());
