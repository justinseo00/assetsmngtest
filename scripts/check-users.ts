import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => {
        console.log(`- ${u.employeeId} (${u.role}, ${u.department})`);
    });

    const assets = await prisma.asset.findMany();
    console.log('\nTotal assets:', assets.length);
    assets.forEach(a => {
        console.log(`- ${a.assetCode} (Dept: ${a.department}, Status: ${a.status}, DeletedAt: ${a.deletedAt})`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
