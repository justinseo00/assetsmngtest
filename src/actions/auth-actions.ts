'use server';

import { prisma } from '@/lib/prisma';
import { comparePassword, createSession, getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const employeeId = formData.get('employeeId') as string;
    const password = formData.get('password') as string;

    if (!employeeId || !password) {
        return { success: false, error: '사번과 비밀번호를 입력해주세요.' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { employeeId },
        });

        if (!user) {
            return { success: false, error: '존재하지 않는 사용자입니다.' };
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return { success: false, error: '비밀번호가 일치하지 않습니다.' };
        }

        await createSession(user);
        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    revalidatePath('/');
    redirect('/login');
}

export async function getUserSession() {
    const user = await getCurrentUser();
    if (!user) return null;
    // Return only necessary fields to the client
    return {
        id: user.id,
        employeeId: user.employeeId,
        role: user.role,
        department: user.department,
    };
}
