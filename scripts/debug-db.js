const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Users ---');
    const users = await prisma.user.findMany();
    users.forEach(u => {
        console.log(`- ${u.employeeId} (Role: ${u.role}, Dept: ${u.department})`);
    });

    console.log('\n--- Assets ---');
    const assets = await prisma.asset.findMany();
    console.log(`Total assets: ${assets.length}`);
    assets.forEach(a => {
        console.log(`- ${a.assetCode} (Dept: ${a.department}, Status: ${a.status}, DeletedAt: ${a.deletedAt})`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
