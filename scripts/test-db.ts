import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Attempting to connect to database...");
        await prisma.$connect();
        console.log("Successfully connected to database!");
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);
        await prisma.$disconnect();
    } catch (e) {
        console.error("Failed to connect to database:", e);
        process.exit(1);
    }
}

main();
