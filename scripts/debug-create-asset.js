const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        },
    },
});

async function main() {
    console.log('Starting debug-create-asset...');

    const user = {
        employeeId: 'admin',
        department: 'IT Team'
    };

    console.log(`Mock User: ${JSON.stringify(user)}`);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const today = new Date();
            const dateStr = [
                today.getFullYear().toString().slice(2),
                (today.getMonth() + 1).toString().padStart(2, '0'),
                today.getDate().toString().padStart(2, '0'),
            ].join('');

            console.log(`DateStr: ${dateStr}`);

            // 1. Sequence
            const sequence = await tx.assetSequence.upsert({
                where: { date: dateStr },
                update: { currentCount: { increment: 1 } },
                create: { date: dateStr, currentCount: 1 },
            });
            console.log(`Sequence: ${JSON.stringify(sequence)}`);

            const sequenceNum = sequence.currentCount.toString().padStart(5, '0');
            const assetCode = `A${dateStr}${sequenceNum}`;
            console.log(`Generated AssetCode: ${assetCode}`);

            // 2. Department
            const dept = await tx.department.findFirst({
                where: { name: user.department }
            });
            console.log(`Department found: ${JSON.stringify(dept)}`);

            // 3. Create Asset
            const assetData = {
                assetCode,
                ownerId: 'test-owner',
                ownerName: 'Test Owner',
                managerId: 'test-manager',
                managerName: 'Test Manager',
                description: 'Debug asset',
                qrUrl: '',
                status: 'ACTIVE',
                departmentId: dept?.id,
            };

            console.log('Creating asset with data:', JSON.stringify(assetData, null, 2));

            const asset = await tx.asset.create({
                data: assetData,
            });
            return asset;
        });

        console.log('✅ Asset created successfully:', result);

    } catch (error) {
        console.error('❌ Failed to create asset:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
