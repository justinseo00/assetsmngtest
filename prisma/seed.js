const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Create Departments
        console.log('Seeding Departments...');
        const departments = [
            { name: 'IT Team', path: 'IT Team', depth: 0 },
            { name: 'Sales Team', path: 'Sales Team', depth: 0 }
        ];

        for (const dept of departments) {
            const checkQuery = 'SELECT id FROM "Department" WHERE path = $1';
            const checkRes = await client.query(checkQuery, [dept.path]);

            if (checkRes.rows.length === 0) {
                const insertQuery = `
                    INSERT INTO "Department" ("name", "path", "depth", "updatedAt", "createdAt")
                    VALUES ($1, $2, $3, NOW(), NOW())
                `;
                await client.query(insertQuery, [dept.name, dept.path, dept.depth]);
                console.log(`Created department: ${dept.name}`);
            } else {
                console.log(`Department exists: ${dept.name}`);
            }
        }

        // 2. Create Users
        console.log('Seeding Users...');
        const adminPass = await bcrypt.hash('admin123', 10);
        const empPass = await bcrypt.hash('emp123', 10);

        const users = [
            { id: 'admin', pass: adminPass, dept: 'IT Team', role: 'ADMIN' },
            { id: 'emp01', pass: empPass, dept: 'Sales Team', role: 'EMPLOYEE' }
        ];

        for (const user of users) {
            const checkQuery = 'SELECT id FROM "User" WHERE "employeeId" = $1';
            const checkRes = await client.query(checkQuery, [user.id]);

            if (checkRes.rows.length === 0) {
                const insertQuery = `
                    INSERT INTO "User" ("employeeId", "password", "department", "role", "is2FAEnabled", "updatedAt", "createdAt")
                    VALUES ($1, $2, $3, $4, false, NOW(), NOW())
                 `;
                await client.query(insertQuery, [user.id, user.pass, user.dept, user.role]);
                console.log(`Created user: ${user.id}`);
            } else {
                console.log(`User exists: ${user.id}`);
            }
        }

        console.log('Seeding completed successfully.');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

main();
