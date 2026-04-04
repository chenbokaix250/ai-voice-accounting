// 统计图表组件

'use client';

import { CategoryStats } from '@/types/record';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatsChartProps {
  categoryBreakdown: CategoryStats[];
  title?: string;
}

// 类别颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  餐饮: '#f97316',
  交通: '#3b82f6',
  购物: '#ec4899',
  娱乐: '#a855f7',
  医疗: '#ef4444',
  教育: '#06b6d4',
  居住: '#f59e0b',
  其他支出: '#6b7280',
  工资: '#22c55e',
  奖金: '#10b981',
  投资: '#14b8a6',
  兼职: '#84cc16',
  其他收入: '#059669',
};

export function StatsChart({ categoryBreakdown, title = '分类统计' }: StatsChartProps) {
  // 准备图表数据
  const pieData = categoryBreakdown.map(item => ({
    name: item.category,
    value: item.amount,
    count: item.count,
    percentage: item.percentage,
  }));

  const barData = categoryBreakdown.map(item => ({
    category: item.category,
    amount: item.amount,
    count: item.count,
  }));

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { count: number; percentage: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">金额: ¥{data.value.toFixed(2)}</p>
          <p className="text-sm">笔数: {data.payload.count}笔</p>
          <p className="text-sm">占比: {data.payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  if (categoryBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          暂无数据
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie">
          <TabsList className="mb-4">
            <TabsTrigger value="pie">饼图</TabsTrigger>
            <TabsTrigger value="bar">柱状图</TabsTrigger>
          </TabsList>

          <TabsContent value="pie">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, payload }) => `${name} ${(payload?.percentage ?? 0).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 类别详情列表 */}
            <div className="mt-4 space-y-2">
              {categoryBreakdown.map(item => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#6b7280' }}
                    />
                    <span>{item.category}</span>
                  </div>
                  <div className="flex gap-4">
                    <span>{item.count}笔</span>
                    <span className="font-medium">¥{item.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bar">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="amount" name="金额" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}