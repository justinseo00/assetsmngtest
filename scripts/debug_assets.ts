
import dotenv from 'dotenv';
import path from 'path';

// 1. Load env vars BEFORE any other imports that might use them
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
    console.log('--- DEBUG START ---');

    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');

    // 2. Import the shared prisma instance AFTER env is loaded
    const { prisma } = require('../src/lib/prisma');

    // 1. Check Users
    const users = await prisma.user.findMany();
    console.log('\n[Users]');
    if (users.length === 0) {
        console.log('No users found.');
    } else {
        users.forEach((u: any) => {
            console.log(`- ID: ${u.id}, EmpID: ${u.employeeId}, Role: ${u.role}, Dept: "${u.department}"`);
        });
    }

    // 2. Check Assets
    const assets = await prisma.asset.findMany();
    console.log('\n[Assets]');
    if (assets.length === 0) {
        console.log('No assets found.');
    } else {
        assets.forEach((a: any) => {
            console.log(`- Code: ${a.assetCode}, Owner: ${a.ownerName}, Dept: "${a.department}", Status: ${a.status}, Deleted: ${a.deletedAt}`);
        });
    }

    // 3. Simulate getAttributes / getDashboardStats logic for a specific user
    if (users.length > 0) {
        const testUser = users[0];
        console.log(`\n[Simulation] Checking visibility for user: ${testUser.employeeId} (${testUser.role}, Dept: "${testUser.department}")`);

        let where: any = { deletedAt: null };
        if (testUser.role !== 'ADMIN') {
            where = { ...where, department: testUser.department };
        }

        console.log('Generated WHERE clause:', JSON.stringify(where));

        try {
            // 3a. Test findMany
            const visibleAssets = await prisma.asset.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });
            console.log(`Visible Assets Count (findMany): ${visibleAssets.length}`);

            // 3b. Test getDashboardStats parts
            console.log('Testing getDashboardStats queries...');

            const totalCount = await prisma.asset.count({ where });
            console.log('- count() success:', totalCount);

            const statusCounts = await prisma.asset.groupBy({
                by: ['status'],
                _count: { status: true },
                where,
            });
            console.log('- groupBy(status) success:', statusCounts);

            const assetsByManager = await prisma.asset.groupBy({
                by: ['managerName'],
                _count: { _all: true },
                where,
                orderBy: { _count: { managerName: 'desc' } },
                take: 5,
            });
            console.log('- groupBy(managerName) success:', assetsByManager);

        } catch (error) {
            console.error('>>> QUERY FAILED:', error);
        }
    }

    console.log('--- DEBUG END ---');
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('Error:', e);
});
