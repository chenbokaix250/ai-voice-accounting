// 历史记录页面

'use client';

import { useState, useMemo } from 'react';
import { useRecords } from '@/hooks/use-records';
import { RecordCard } from '@/components/record-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Record, RecordType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES, FilterOptions } from '@/types/record';
import { Search, Filter, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { exportToCSV } from '@/lib/storage';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { records, isLoading, deleteRecord, getFilteredRecords } = useRecords();

  // 筛选状态
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<RecordType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 筛选后的记录
  const filteredRecords = useMemo(() => {
    const options: FilterOptions = {
      search,
      type: typeFilter || undefined,
      category: categoryFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    return getFilteredRecords(options);
  }, [records, search, typeFilter, categoryFilter, startDate, endDate, getFilteredRecords]);

  // 删除记录
  const handleDelete = (id: string) => {
    if (confirm('确定删除这条记录吗？')) {
      deleteRecord(id);
    }
  };

  // 导出 CSV
  const handleExport = () => {
    const csv = exportToCSV(filteredRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `记账记录_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 清除筛选
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = search || typeFilter || categoryFilter || startDate || endDate;

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
            <h1 className="text-xl font-bold">历史记录</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRecords.length === 0}>
            导出 CSV
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex gap-3">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索金额、类别、备注..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 类型筛选 */}
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v as RecordType | '')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                <SelectItem value="income">收入</SelectItem>
                <SelectItem value="expense">支出</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            {/* 类别筛选 */}
            <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as Category | '')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类别</SelectItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                {INCOME_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 日期范围 */}
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="开始日期"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-[140px]"
              />
              <span className="text-muted-foreground">至</span>
              <Input
                type="date"
                placeholder="结束日期"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-[140px]"
              />
            </div>
          </div>

          {/* 筛选状态 */}
          {hasFilters && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                已筛选 {filteredRecords.length} 条记录
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                清除筛选
              </Button>
            </div>
          )}
        </div>

        {/* 记录列表 */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {hasFilters ? (
              <p>没有符合条件的记录</p>
            ) : (
              <p>暂无记录</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map(record => (
              <RecordCard
                key={record.id}
                record={record}
                onDelete={handleDelete}
                compact
              />
            ))}
          </div>
        )}

        {/* 统计汇总 */}
        {filteredRecords.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">总收入</p>
                <p className="text-lg font-bold text-green-500">
                  ¥{filteredRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总支出</p>
                <p className="text-lg font-bold text-red-500">
                  ¥{filteredRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">结余</p>
                <p className="text-lg font-bold text-blue-500">
                  ¥{(filteredRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0) -
                     filteredRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}