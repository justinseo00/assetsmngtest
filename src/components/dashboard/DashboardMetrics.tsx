'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, CheckCircle, Wrench, Trash2 } from 'lucide-react';

interface DashboardMetricsProps {
    totalCount: number;
    statusCounts: { status: string; count: number }[];
}

export function DashboardMetrics({ totalCount, statusCounts }: DashboardMetricsProps) {
    const getCount = (status: string) => statusCounts.find((s) => s.status === status)?.count || 0;

    const metrics = [
        {
            title: '총 자산',
            value: totalCount,
            icon: Box,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
        },
        {
            title: '사용중',
            value: getCount('ACTIVE'),
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-100',
        },
        {
            title: '수리중',
            value: getCount('REPAIR'),
            icon: Wrench,
            color: 'text-orange-600',
            bg: 'bg-orange-100',
        },
        {
            title: '폐기/미사용',
            value: getCount('DISCARDED') + getCount('INACTIVE'),
            icon: Trash2,
            color: 'text-gray-600',
            bg: 'bg-gray-100',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
                <Card key={metric.title} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {metric.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${metric.bg}`}>
                            <metric.icon className={`h-4 w-4 ${metric.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
