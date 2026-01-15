import prisma from "../src/lib/prisma";

async function clearDatabase() {
    try {
        console.log("🗑️  Starting database cleanup...");

        // Delete in order to respect foreign key constraints
        console.log("Deleting interviews...");
        const interviews = await prisma.interview.deleteMany({});
        console.log(`✅ Deleted ${interviews.count} interviews`);

        console.log("Deleting analyses...");
        const analyses = await prisma.analysis.deleteMany({});
        console.log(`✅ Deleted ${analyses.count} analyses`);

        console.log("Deleting users...");
        const users = await prisma.user.deleteMany({});
        console.log(`✅ Deleted ${users.count} users`);

        console.log("\n✨ Database cleared successfully!");
        console.log("You can now sign up with a fresh account.");

    } catch (error) {
        console.error("❌ Error clearing database:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
