'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAsset } from '@/actions/asset-actions';
import { getUserSession } from '@/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function NewAssetPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const user = await getUserSession();
            if (!user) {
                router.push('/login');
            } else {
                setIsLoading(false);
            }
        }
        checkAuth();
    }, [router]);

    if (isLoading) return <div className="p-8">Loading...</div>;

    async function handleSubmit(formData: FormData) {
        const result = await createAsset(formData);
        if (result.success) {
            router.push('/');
        } else {
            const errorMessage = typeof result.error === 'string' ? result.error : '자산 등록에 실패했습니다. 입력 값을 확인해주세요.';
            setError(errorMessage);
            console.error(result.error);
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>자산 등록</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="assetName">자산명</Label>
                            <Input id="assetName" name="assetName" required placeholder="예: 사무용 노트북" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ownerId">소유자 사번</Label>
                                <Input id="ownerId" name="ownerId" required placeholder="예: 12345" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ownerName">소유자 성명</Label>
                                <Input id="ownerName" name="ownerName" required placeholder="예: 홍길동" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="managerId">관리자 사번</Label>
                                <Input id="managerId" name="managerId" required placeholder="예: 98765" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="managerName">관리자 성명</Label>
                                <Input id="managerName" name="managerName" required placeholder="예: 김관리" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">비고</Label>
                            {/* Input 대신 Textarea 사용을 고려해볼 수 있음 */}
                            <textarea
                                id="description"
                                name="description"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]" // TailwindCSS 기본 Input 스타일 복사 후 min-height 추가
                                placeholder="추가 설명"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="qrUrl">QR URL (선택)</Label>
                            <Input id="qrUrl" name="qrUrl" placeholder="https://..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">상태</Label>
                            <Select name="status" defaultValue="ACTIVE">
                                <SelectTrigger>
                                    <SelectValue placeholder="상태 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">사용중</SelectItem>
                                    <SelectItem value="INACTIVE">미사용</SelectItem>
                                    <SelectItem value="REPAIR">수리중</SelectItem>
                                    <SelectItem value="DISCARDED">폐기</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                취소
                            </Button>
                            <Button type="submit">등록</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
