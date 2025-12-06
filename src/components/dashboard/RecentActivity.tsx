'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset } from '@prisma/client';
import Link from 'next/link';

interface RecentActivityProps {
    recentAssets: Asset[];
}

export function RecentActivity({ recentAssets }: RecentActivityProps) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
            <CardHeader>
                <CardTitle>최근 등록 자산</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentAssets.map((asset) => (
                        <div
                            key={asset.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                            <div className="space-y-1">
                                <Link
                                    href={`/assets/${asset.assetCode}`}
                                    className="font-medium hover:underline text-blue-600"
                                >
                                    {asset.assetCode}
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                    {asset.description || '설명 없음'}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium">{asset.ownerName}</div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(asset.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
