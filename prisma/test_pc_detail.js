console.log('Detailed test start');
try {
    const pkg = require('@prisma/client');
    console.log('Pkg keys:', Object.keys(pkg));
    const { PrismaClient } = pkg;
    console.log('PrismaClient type:', typeof PrismaClient);
    try {
        const p = new PrismaClient();
        console.log('Instance created');
    } catch (e) {
        console.error('Instantiation failed:', e);
    }
} catch (e) {
    console.error('Require failed:', e);
}
