import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { employeeId: 'admin' },
        update: {},
        create: {
            employeeId: 'admin',
            password: adminPassword,
            department: 'IT Team',
            role: 'ADMIN',
            is2FAEnabled: false,
        },
    });
    console.log('Created Admin user:', admin.employeeId);

    // 2. Create Employee User
    const empPassword = await bcrypt.hash('emp123', 10);
    const employee = await prisma.user.upsert({
        where: { employeeId: 'emp01' },
        update: {},
        create: {
            employeeId: 'emp01',
            password: empPassword,
            department: 'Sales Team',
            role: 'EMPLOYEE',
            is2FAEnabled: false,
        },
    });
    console.log('Created Employee user:', employee.employeeId);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
