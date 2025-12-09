console.log('Full PC test start');
try {
    const { PrismaClient } = require('@prisma/client');
    console.log('Imported');
    const prisma = new PrismaClient();
    console.log('Instantiated');
    prisma.$connect().then(() => {
        console.log('Connected');
        return prisma.$disconnect();
    }).catch(e => {
        console.error('Connection failed:', e);
        process.exit(1);
    });
} catch (e) {
    console.error('Crash:', e);
    process.exit(1);
}
