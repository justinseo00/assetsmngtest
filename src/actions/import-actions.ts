'use server';

import { prisma } from '@/lib/prisma';
import { Department } from '@prisma/client';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

interface ExcelRow {
    '자산번호': string | number;
    '자산명'?: string;
    '소속'?: string;
    '소유자사번'?: string | number;
    '소유자명'?: string;
    '관리자사번'?: string | number;
    '관리자명'?: string;
    '설명'?: string;
    'QR'?: string;
    '상태'?: string;
    // Allow other columns
    [key: string]: any;
}

export async function importAssetsFromExcel(formData: FormData) {
    try {
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return { success: false, error: '파일이 없습니다.' };
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        if (workbook.SheetNames.length === 0) {
            return { success: false, error: '엑셀 파일에 시트가 없습니다.' };
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

        if (!rows || rows.length === 0) {
            return { success: false, error: '데이터가 없습니다.' };
        }

        let processedAssets = 0;
        let createdDepts = 0;

        // Cache for ensuring we don't query same dept repeatedly in loop
        // Key: path, Value: id
        // Note: For full correctness across requests, we should trust DB, but here we can cache locally for speed within batch.
        // We will query DB if not in cache, then add to cache.
        const deptCache = new Map<string, number>();

        for (const row of rows) {
            const assetCode = row['자산번호'] ? String(row['자산번호']) : null;
            if (!assetCode) continue;

            const assetName = row['자산명'] || '무명자산';
            const deptString = row['소속'] ? String(row['소속']) : '';
            const ownerId = row['소유자사번'] ? String(row['소유자사번']) : 'UNKNOWN';
            const ownerName = row['소유자명'] || '미확인';
            const managerId = row['관리자사번'] ? String(row['관리자사번']) : 'UNKNOWN';
            const managerName = row['관리자명'] || '미확인';
            const description = row['설명'] || '';
            const qrUrl = row['QR'] || '';
            const status = row['상태'] || 'ACTIVE';

            let finalDepartmentId: number | null = null;

            if (deptString) {
                // Split by spaces. E.g "본사 경영지원본부 인사팀"
                const parts = deptString.trim().split(/\s+/);
                let currentPath = '';
                let parentId: number | null = null;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    const depth = i;

                    if (deptCache.has(currentPath)) {
                        parentId = deptCache.get(currentPath)!;
                    } else {
                        // Check DB
                        const existingDept = await prisma.department.findUnique({
                            where: { path: currentPath }
                        });

                        if (existingDept) {
                            parentId = existingDept.id;
                            deptCache.set(currentPath, existingDept.id);
                        } else {
                            // Create
                            const newDept: Department = await prisma.department.create({
                                data: {
                                    name: part,
                                    path: currentPath,
                                    depth: depth,
                                    parentId: parentId
                                }
                            });
                            parentId = newDept.id;
                            deptCache.set(currentPath, newDept.id);
                            createdDepts++;
                        }
                    }
                }
                finalDepartmentId = parentId;
            }

            // Upsert Asset
            await prisma.asset.upsert({
                where: { assetCode },
                update: {
                    assetName,
                    departmentId: finalDepartmentId,
                    ownerId,
                    ownerName,
                    managerId,
                    managerName,
                    description,
                    qrUrl,
                    status,
                    updatedAt: new Date(),
                },
                create: {
                    assetCode,
                    assetName,
                    departmentId: finalDepartmentId,
                    ownerId,
                    ownerName,
                    managerId,
                    managerName,
                    description,
                    qrUrl,
                    status,
                }
            });
            processedAssets++;
        }

        revalidatePath('/assets');

        return {
            success: true,
            message: `${processedAssets}개의 자산과 ${createdDepts}개의 신규 부서가 처리되었습니다.`
        };

    } catch (error) {
        console.error('Import error:', error);
        return { success: false, error: '업로드 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)) };
    }
}
