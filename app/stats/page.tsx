// 统计图表页面

'use client';

import { useState } from 'react';
import { useRecords } from '@/hooks/use-records';
import { StatsChart } from '@/components/stats-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { getPeriodStats } from '@/lib/storage';

export default function StatsPage() {
  const { records, isLoading } = useRecords();
  const [period, setPeriod] = useState<'month' | 'week'>('month');

  // 获取统计数据
  const stats = getPeriodStats(records, period);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">统计图表</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 时间段选择 */}
        <Tabs value={period} onValueChange={v => setPeriod(v as 'month' | 'week')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="month">本月</TabsTrigger>
            <TabsTrigger value="week">本周</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : (
          <>
            {/* 收支概览 */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    收入
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{stats.totalIncome.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    支出
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    ¥{stats.totalExpense.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className={stats.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}>
                <CardHeader className="pb-2">
                  <CardTitle className={stats.balance >= 0 ? 'text-sm text-blue-700' : 'text-sm text-orange-700'}>
                    结余
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    ¥{stats.balance.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 分类统计图表 */}
            <StatsChart
              categoryBreakdown={stats.categoryBreakdown}
              title="支出分类统计"
            />

            {/* 空状态 */}
            {records.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无记账数据</p>
                <p className="text-sm mt-2">开始记账后即可查看统计</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}