import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-me';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPayload {
    id: number;
    employeeId: string;
    role: string;
    department: string;
}

export async function createSession(user: User) {
    const payload: SessionPayload = {
        id: user.id,
        employeeId: user.employeeId,
        role: user.role,
        department: user.department,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + SESSION_DURATION),
        path: '/',
        sameSite: 'lax',
    });
}

export async function verifySession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function getCurrentUser(): Promise<User | null> {
    const session = await verifySession();
    if (!session) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
        });
        return user;
    } catch (error) {
        return null;
    }
}

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
