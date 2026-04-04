// 报表页面 - 月度/周度汇总

'use client';

import { useState, useMemo } from 'react';
import { useRecords } from '@/hooks/use-records';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Target, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Record, CategoryStats } from '@/types/record';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function ReportsPage() {
  const { records, isLoading } = useRecords();
  const [period, setPeriod] = useState<'month' | 'week'>('month');

  // 计算报表数据
  const reportData = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date, prevStart: Date, prevEnd: Date;

    if (period === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      prevEnd = endOfMonth(subMonths(now, 1));
    } else {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    }

    // 当前周期记录
    const currentRecords = records.filter(r => {
      const d = new Date(r.date);
      return isWithinInterval(d, { start, end });
    });

    // 上个周期记录
    const prevRecords = records.filter(r => {
      const d = new Date(r.date);
      return isWithinInterval(d, { start: prevStart, end: prevEnd });
    });

    // 当前周期统计
    const currentIncome = currentRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const currentExpense = currentRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

    // 上个周期统计
    const prevIncome = prevRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const prevExpense = prevRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

    // 变化率
    const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

    // 日均支出
    const daysInPeriod = eachDayOfInterval({ start, end }).length;
    const avgDailyExpense = currentExpense / daysInPeriod;

    // 支出类别统计
    const categoryMap = new Map<string, { amount: number; count: number }>();
    currentRecords.filter(r => r.type === 'expense').forEach(r => {
      const existing = categoryMap.get(r.category) || { amount: 0, count: 0 };
      categoryMap.set(r.category, {
        amount: existing.amount + r.amount,
        count: existing.count + 1,
      });
    });

    const categoryStats: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: currentExpense > 0 ? (data.amount / currentExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 最大支出类别
    const topCategory = categoryStats[0];

    return {
      periodName: period === 'month' ? format(now, 'yyyy年MM月', { locale: zhCN }) : format(now, '第w周', { locale: zhCN }),
      currentIncome,
      currentExpense,
      currentBalance: currentIncome - currentExpense,
      prevIncome,
      prevExpense,
      incomeChange,
      expenseChange,
      avgDailyExpense,
      categoryStats,
      topCategory,
      recordCount: currentRecords.length,
    };
  }, [records, period]);

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
            <h1 className="text-xl font-bold">收支报表</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 时间段选择 */}
        <Tabs value={period} onValueChange={v => setPeriod(v as 'month' | 'week')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="month">月度报表</TabsTrigger>
            <TabsTrigger value="week">周度报表</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : (
          <>
            {/* 报表标题 */}
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold">{reportData.periodName} 收支报表</h2>
              <p className="text-muted-foreground mt-1">共 {reportData.recordCount} 笔记录</p>
            </div>

            {/* 收支汇总 */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    收入
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    ¥{reportData.currentIncome.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    较上期 {reportData.incomeChange >= 0 ? '+' : ''}{reportData.incomeChange.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    支出
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    ¥{reportData.currentExpense.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    较上期 {reportData.expenseChange >= 0 ? '+' : ''}{reportData.expenseChange.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">结余</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${reportData.currentBalance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                    ¥{reportData.currentBalance.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 详细分析 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 日均支出 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    日均支出
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">¥{reportData.avgDailyExpense.toFixed(2)}</p>
                </CardContent>
              </Card>

              {/* 最大支出类别 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    主要支出
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.topCategory ? (
                    <div>
                      <Badge className="mb-2">{reportData.topCategory.category}</Badge>
                      <p className="text-xl font-bold">¥{reportData.topCategory.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        占总支出 {reportData.topCategory.percentage.toFixed(1)}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">暂无数据</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 支出预警 */}
            {reportData.expenseChange > 20 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="py-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-700">支出增长提醒</p>
                    <p className="text-sm text-orange-600">
                      本期支出较上期增长 {reportData.expenseChange.toFixed(1)}%，请注意控制消费
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 分类明细 */}
            <Card>
              <CardHeader>
                <CardTitle>支出分类明细</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.categoryStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">暂无支出数据</p>
                ) : (
                  <div className="space-y-3">
                    {reportData.categoryStats.map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium w-6">{index + 1}</span>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{item.count}笔</span>
                          <span className="font-medium">¥{item.amount.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 空状态 */}
            {records.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无记账数据</p>
                <p className="text-sm mt-2">开始记账后即可查看报表</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}