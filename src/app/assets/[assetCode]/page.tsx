'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getAssetByCode, updateAsset, deleteAsset } from '@/actions/asset-actions';
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
import { AssetQrCode } from '@/components/AssetQrCode';
import { AssetLabel } from '@/components/AssetLabel';
import { Printer, Edit, Trash2, ArrowLeft, Save, X } from 'lucide-react';

export default function AssetDetailPage({ params }: { params: Promise<{ assetCode: string }> }) {
    const { assetCode } = use(params);
    const router = useRouter();
    const [asset, setAsset] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // QR Code URL (points to this page)
    const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/${assetCode}` : '';

    useEffect(() => {
        async function init() {
            const [assetResult, currentUser] = await Promise.all([
                getAssetByCode(assetCode),
                getUserSession()
            ]);

            if (assetResult.success) {
                setAsset(assetResult.data);
            } else {
                setError('자산을 찾을 수 없습니다.');
            }
            setUser(currentUser);
            setIsLoading(false);
        }
        init();
    }, [assetCode]);

    async function handleUpdate(formData: FormData) {
        const result = await updateAsset(assetCode, formData);
        if (result.success) {
            setAsset(result.data);
            setIsEditing(false);
        } else {
            setError('수정에 실패했습니다.');
            console.error(result.error);
        }
    }

    async function handleDelete() {
        if (!confirm('정말로 이 자산을 삭제하시겠습니까?')) return;
        const result = await deleteAsset(assetCode);
        if (result.success) {
            router.push('/');
        } else {
            alert('삭제에 실패했습니다.');
        }
    }

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!asset) return null;

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            {/* Print Label (Hidden on screen, visible on print) */}
            <AssetLabel assetCode={asset.assetCode} ownerName={asset.ownerName} qrValue={qrUrl} />

            <div className="print:hidden">
                <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로 돌아가기
                </Button>

                <Card>
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-2xl">
                            {isEditing ? '자산 정보 수정' : `자산 상세: ${asset.assetCode}`}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                            {!isEditing && (
                                <>
                                    <Button variant="outline" onClick={handlePrint}>
                                        <Printer className="mr-2 h-4 w-4" /> 라벨 인쇄
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                                        <Edit className="mr-2 h-4 w-4" /> 수정
                                    </Button>
                                    {user?.role === 'ADMIN' && (
                                        <Button variant="destructive" onClick={handleDelete}>
                                            <Trash2 className="mr-2 h-4 w-4" /> 삭제
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* QR Code Section */}
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                                <AssetQrCode value={qrUrl} size={200} />
                                <p className="mt-2 text-sm text-gray-500">스캔하여 관리 페이지로 이동</p>
                            </div>

                            {/* Form / Details Section */}
                            <div className="flex-1">
                                {isEditing ? (
                                    <form action={handleUpdate} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ownerId">소유자 사번</Label>
                                                <Input id="ownerId" name="ownerId" defaultValue={asset.ownerId} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ownerName">소유자 성명</Label>
                                                <Input id="ownerName" name="ownerName" defaultValue={asset.ownerName} required />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="managerId">관리자 사번</Label>
                                                <Input id="managerId" name="managerId" defaultValue={asset.managerId} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="managerName">관리자 성명</Label>
                                                <Input id="managerName" name="managerName" defaultValue={asset.managerName} required />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">비고</Label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                defaultValue={asset.description || ''}
                                                className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">상태</Label>
                                            <Select name="status" defaultValue={asset.status}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">사용중</SelectItem>
                                                    <SelectItem value="INACTIVE">미사용</SelectItem>
                                                    <SelectItem value="REPAIR">수리중</SelectItem>
                                                    <SelectItem value="DISCARDED">폐기</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex justify-end gap-2 mt-6">
                                            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                                                <X className="mr-2 h-4 w-4" /> 취소
                                            </Button>
                                            <Button type="submit">
                                                <Save className="mr-2 h-4 w-4" /> 저장
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-gray-500">소유자</Label>
                                                <p className="font-medium">{asset.ownerName} ({asset.ownerId})</p>
                                            </div>
                                            <div>
                                                <Label className="text-gray-500">관리자</Label>
                                                <p className="font-medium">{asset.managerName} ({asset.managerId})</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">소속</Label>
                                            <p className="font-medium">{asset.department?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">상태</Label>
                                            <p className="font-medium">{asset.status}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">비고</Label>
                                            <p className="font-medium whitespace-pre-wrap">{asset.description || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">등록일</Label>
                                            <p className="text-sm text-gray-500">{new Date(asset.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
