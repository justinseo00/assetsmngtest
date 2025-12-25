'use server';

import { prisma } from '@/lib/prisma';
import { Department } from '@prisma/client';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

interface ExcelRow {
    '자산번호': string | number;
    '자산명'?: string;
    '소속'?: string;
    '소유자'?: string; // ownerName
    '사번'?: string | number; // ownerId (User.employeeId)
    // '모델명'?: string; 
    // '운영자사번'?: string | number;
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
        const deptCache = new Map<string, number>();

        for (const row of rows) {
            const assetCode = row['자산번호'] ? String(row['자산번호']) : null;
            if (!assetCode) continue;

            const assetName = row['자산명'] || '무명자산';
            const deptString = row['소속'] ? String(row['소속']) : '';

            // User Mapping
            const employeeId = row['사번'] ? String(row['사번']) : null;
            const ownerName = row['소유자'] || '미확인';
            let ownerId = 'UNKNOWN';

            if (employeeId) {
                // Verify user exists (Optional but recommended)
                // For bulk performance, we might skip this query if we trust the excel, 
                // but strictly we should check or just use the string if the column is simple string.
                // However, Asset.ownerId is String type. If we treat it as FK to User.employeeId, checks are good.
                // But if User table doesn't have it, FK constraint fails? 
                // Wait, Asset.ownerId is just String, not @relation to User in schema (it was loose relation in original schema).
                // Let's check Schema. User has employeeId @unique. 
                // Asset has ownerId String. No explicit @relation in Asset to User.
                // So we can just save it.
                ownerId = employeeId;
            }

            // Department Logic
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
                            const newDept: Department = await prisma.department.upsert({
                                where: { path: currentPath },
                                update: {},
                                create: {
                                    name: part,
                                    path: currentPath,
                                    depth: depth,
                                    parentId: parentId
                                }
                            });
                            parentId = newDept.id;
                            createdDepts++; // Count created
                            deptCache.set(currentPath, newDept.id);
                        }
                    }
                }
                finalDepartmentId = parentId;
            }

            // Model Logic (Skipped as column missing, placeholder)
            let modelId: number | null = null;
            // if (row['모델명']) { ... }

            // Upsert Asset
            await prisma.asset.upsert({
                where: { assetCode },
                update: {
                    assetName,
                    departmentId: finalDepartmentId,
                    ownerId,
                    ownerName,
                    // managerId: ... (skipped)
                    // managerName: ...
                    modelId, // New field
                    updatedAt: new Date(),
                },
                create: {
                    assetCode,
                    assetName,
                    departmentId: finalDepartmentId,
                    ownerId,
                    ownerName,
                    managerId: 'UNKNOWN', // Default
                    managerName: '미확인',
                    modelId,
                    status: 'ACTIVE',
                }
            });
            processedAssets++;
        }

        revalidatePath('/assets');

        return {
            success: true,
            message: `${processedAssets}개의 자산이 처리되었습니다. (신규/갱신 포함)`
        };

    } catch (error) {
        console.error('Import error:', error);
        return { success: false, error: '업로드 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)) };
    }
}
