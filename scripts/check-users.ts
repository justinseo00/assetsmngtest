import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local manually for localhost connection
try {
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
        console.log('Loaded .env.local');
    } else {
        console.log('.env.local not found');
        dotenv.config();
    }
} catch (e) {
    console.error('Error loading env:', e);
}

const connectionString = process.env.DATABASE_URL;
console.log('Using DATABASE_URL:', connectionString);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to database');

        const admin = await prisma.user.findUnique({
            where: { employeeId: 'admin' },
        });

        if (admin) {
            console.log('Admin user found:', admin.employeeId);
        } else {
            console.log('Admin user NOT found');
        }
    } catch (e) {
        console.error('Database connection failed:', e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
