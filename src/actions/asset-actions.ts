'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

const createAssetSchema = z.object({
    assetName: z.string().min(1, '자산명을 입력해주세요.'),
    ownerId: z.string().min(1, '소유자 사번을 입력해주세요.'),
    ownerName: z.string().min(1, '소유자 성명을 입력해주세요.'),
    managerId: z.string().min(1, '관리자 사번을 입력해주세요.'),
    managerName: z.string().min(1, '관리자 성명을 입력해주세요.'),
    description: z.string().optional(),
    qrUrl: z.string().optional(),
    status: z.string().default('ACTIVE'),
});

export async function createAsset(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
    }

    const rawData = {
        assetName: formData.get('assetName'),
        ownerId: formData.get('ownerId'),
        ownerName: formData.get('ownerName'),
        managerId: formData.get('managerId'),
        managerName: formData.get('managerName'),
        description: formData.get('description'),
        qrUrl: formData.get('qrUrl'),
        status: formData.get('status') || 'ACTIVE',
    };

    const validatedFields = createAssetSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { assetName, ownerId, ownerName, managerId, managerName, description, qrUrl, status } = validatedFields.data;

    try {
        const asset = await prisma.$transaction(async (tx: any) => {
            const today = new Date();
            const dateStr = [
                today.getFullYear().toString().slice(2),
                (today.getMonth() + 1).toString().padStart(2, '0'),
                today.getDate().toString().padStart(2, '0'),
            ].join('');

            const sequence = await tx.assetSequence.upsert({
                where: { date: dateStr },
                update: { currentCount: { increment: 1 } },
                create: { date: dateStr, currentCount: 1 },
            });

            const sequenceNum = sequence.currentCount.toString().padStart(5, '0');
            const assetCode = `A${dateStr}${sequenceNum}`;

            // Find department by name (approximate match for legacy string-based user.department)
            let deptId = null;
            if (user.department) {
                const dept = await tx.department.findFirst({
                    where: { name: user.department }
                });
                deptId = dept?.id;
            }

            return await tx.asset.create({
                data: {
                    assetCode,
                    assetName,
                    ownerId,
                    ownerName,
                    managerId,
                    managerName,
                    description,
                    qrUrl,
                    status,
                    departmentId: deptId,
                },
            });
        });

        revalidatePath('/');
        return { success: true, data: asset };
    } catch (error) {
        console.error('Failed to create asset:', error);
        return { success: false, error: '자산 등록 실패: ' + (error instanceof Error ? error.message : String(error)) };
    }
}


export async function getAssets() {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
    }

    try {
        let where: any = { deletedAt: null };
        if (user.role !== 'ADMIN') {
            where = {
                ...where,
                department: { name: user.department }
            };
        }

        console.log('getAssets user:', user.employeeId, user.role, user.department);
        // console.log('getAssets where:', JSON.stringify(where));

        const assets = await prisma.asset.findMany({
            where,
            include: { department: true },
            orderBy: { createdAt: 'desc' },
        });
        console.log('getAssets count:', assets.length);
        return { success: true, data: assets };
    } catch (error) {
        console.error('Failed to fetch assets:', error);
        return { success: false, error: 'Failed to fetch assets' };
    }
}

export async function getAssetByCode(assetCode: string) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { assetCode },
            include: { department: true },
        });
        if (!asset || asset.deletedAt) return { success: false, error: 'Asset not found' };
        return { success: true, data: asset };
    } catch (error) {
        console.error('Failed to fetch asset:', error);
        return { success: false, error: 'Failed to fetch asset' };
    }
}

export async function updateAsset(assetCode: string, formData: FormData) {
    const rawData = {
        ownerId: formData.get('ownerId'),
        ownerName: formData.get('ownerName'),
        managerId: formData.get('managerId'),
        managerName: formData.get('managerName'),
        description: formData.get('description'),
        status: formData.get('status'),
    };

    const validatedFields = createAssetSchema.partial().safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const asset = await prisma.asset.update({
            where: { assetCode },
            data: validatedFields.data,
        });
        revalidatePath('/');
        revalidatePath(`/assets/${assetCode}`);
        return { success: true, data: asset };
    } catch (error) {
        console.error('Failed to update asset:', error);
        return { success: false, error: 'Failed to update asset' };
    }
}

export async function deleteAsset(assetCode: string) {
    try {
        await prisma.asset.update({
            where: { assetCode },
            data: { deletedAt: new Date() },
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete asset:', error);
        return { success: false, error: 'Failed to delete asset' };
    }
}

export async function deleteAssetById(id: number) {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
    }

    if (user.role !== 'ADMIN') {
        return { success: false, error: '삭제 권한이 없습니다.' };
    }

    try {
        await prisma.asset.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete asset:', error);
        return { success: false, error: 'Failed to delete asset' };
    }
}

export async function getDashboardStats() {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
    }

    try {
        let where: any = { deletedAt: null };
        if (user.role !== 'ADMIN') {
            where = {
                ...where,
                department: { name: user.department }
            };
        }

        console.log('getDashboardStats user:', user.employeeId, user.role, user.department);
        console.log('getDashboardStats where:', JSON.stringify(where));

        const [totalCount, statusCounts, recentAssets, assetsByManager] = await Promise.all([
            // 1. Total Count
            prisma.asset.count({ where }),

            // 2. Status Counts
            prisma.asset.groupBy({
                by: ['status'],
                _count: { status: true },
                where,
            }),

            // 3. Recent Assets (Top 5)
            prisma.asset.findMany({
                where,
                take: 5,
                orderBy: { createdAt: 'desc' },
            }),

            // 4. Assets by Manager (Top 5)
            prisma.asset.groupBy({
                by: ['managerName'],
                _count: { _all: true },
                where,
                orderBy: { _count: { managerName: 'desc' } },
                take: 5,
            }),
        ]);

        console.log('getDashboardStats totalCount:', totalCount);
        // console.log('getDashboardStats statusCounts:', statusCounts);

        return {
            success: true,
            data: {
                totalCount,
                statusCounts: statusCounts.map((item: any) => ({
                    status: item.status,
                    count: Number(item._count?.status ?? 0)
                })),
                recentAssets,
                assetsByManager: assetsByManager.map((item: any) => ({
                    name: item.managerName,
                    count: Number(item._count?._all ?? 0)
                })),
            },
        };
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' };
    }
}