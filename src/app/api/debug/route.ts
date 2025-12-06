import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAssets } from '@/actions/asset-actions';

export async function GET() {
    const localPrisma = new PrismaClient();
    try {
        // 1. Fetch raw with local client
        const rawAssets = await localPrisma.asset.findMany();

        // 2. Fetch with deletedAt: null filter
        const activeAssets = await localPrisma.asset.findMany({
            where: { deletedAt: null }
        });

        // 3. Call actual action
        const actionResult = await getAssets();

        return NextResponse.json({
            rawCount: rawAssets.length,
            activeCount: activeAssets.length,
            actionSuccess: actionResult.success,
            actionDataCount: actionResult.data?.length,
            rawSample: rawAssets.slice(0, 2).map(a => ({ ...a, deletedAt: a.deletedAt })),
            activeSample: activeAssets.slice(0, 2),
            actionError: actionResult.error
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await localPrisma.$disconnect();
    }
}
