'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAssets, getDashboardStats, deleteAssetById } from '@/actions/asset-actions';
import { logout, getUserSession } from '@/actions/auth-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Trash2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const currentUser = await getUserSession();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const [assetsResult, statsResult] = await Promise.all([
        getAssets(),
        getDashboardStats(),
      ]);

      if (assetsResult.success) {
        setAssets(assetsResult.data || []);
      }
      if (statsResult.success) {
        setStats(statsResult.data || null);
      }
      setIsLoading(false);
    }
    init();
  }, [router]);

  async function handleDelete(id: number) {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    const result = await deleteAssetById(id);
    if (result.success) {
      // Refresh data
      const assetsResult = await getAssets();
      if (assetsResult.success) {
        setAssets(assetsResult.data || []);
      }
      const statsResult = await getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data || null);
      }
    } else {
      alert(result.error || '삭제 실패');
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  return (
    <main className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT 자산 관리 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">
            로그인: {user.employeeId} ({user.role})
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/assets/new">자산 등록</Link>
          </Button>
          <Button variant="outline" onClick={() => logout()}>
            로그아웃
          </Button>
        </div>
      </div>

      {stats && (
        <>
          <DashboardMetrics
            totalCount={stats.totalCount}
            statusCounts={stats.statusCounts}
          />
          <DashboardCharts
            statusCounts={stats.statusCounts}
            assetsByManager={stats.assetsByManager}
          />
          <RecentActivity recentAssets={stats.recentAssets} />
        </>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">전체 자산 목록</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>자산코드</TableHead>
                <TableHead>소유자</TableHead>
                <TableHead>관리자</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                {user.role === 'ADMIN' && <TableHead>관리</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets && assets.length > 0 ? (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/assets/${asset.assetCode}`}
                        className="text-blue-600 hover:underline"
                      >
                        {asset.assetCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {asset.ownerName} ({asset.ownerId})
                    </TableCell>
                    <TableCell>
                      {asset.managerName} ({asset.managerId})
                    </TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.status}</TableCell>
                    <TableCell>
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </TableCell>
                    {user.role === 'ADMIN' && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={user.role === 'ADMIN' ? 7 : 6} className="text-center h-24">
                    등록된 자산이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
