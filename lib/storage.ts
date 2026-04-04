// localStorage 操作封装

import { Record, FilterOptions, PeriodStats, CategoryStats } from '@/types/record';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

const STORAGE_KEY = 'accounting_records';

// 获取所有记录
export function getRecords(): Record[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 保存所有记录
export function saveRecords(records: Record[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// 添加记录
export function addRecord(record: Omit<Record, 'id' | 'createdAt'>): Record {
  const records = getRecords();
  const newRecord: Record = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  records.unshift(newRecord); // 最新记录放最前面
  saveRecords(records);
  return newRecord;
}

// 更新记录
export function updateRecord(id: string, updates: Partial<Record>): Record | null {
  const records = getRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;

  records[index] = { ...records[index], ...updates };
  saveRecords(records);
  return records[index];
}

// 删除记录
export function deleteRecord(id: string): boolean {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) return false;

  saveRecords(filtered);
  return true;
}

// 筛选记录
export function filterRecords(records: Record[], options: FilterOptions): Record[] {
  return records.filter(record => {
    // 类型筛选
    if (options.type && record.type !== options.type) return false;

    // 类别筛选
    if (options.category && record.category !== options.category) return false;

    // 日期范围筛选
    if (options.startDate && record.date < options.startDate) return false;
    if (options.endDate && record.date > options.endDate) return false;

    // 搜索筛选（金额、类别、备注）
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const matchAmount = record.amount.toString().includes(options.search);
      const matchCategory = record.category.toLowerCase().includes(searchLower);
      const matchNote = record.note.toLowerCase().includes(searchLower);
      if (!matchAmount && !matchCategory && !matchNote) return false;
    }

    return true;
  });
}

// 获取时间段统计
export function getPeriodStats(records: Record[], period: 'month' | 'week'): PeriodStats {
  const now = new Date();
  const start = period === 'month' ? startOfMonth(now) : startOfWeek(now, { weekStartsOn: 1 });
  const end = period === 'month' ? endOfMonth(now) : endOfWeek(now, { weekStartsOn: 1 });

  const periodRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return isWithinInterval(recordDate, { start, end });
  });

  const totalIncome = periodRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = periodRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  // 类别统计
  const categoryMap = new Map<string, { amount: number; count: number }>();
  periodRecords.forEach(r => {
    const existing = categoryMap.get(r.category) || { amount: 0, count: 0 };
    categoryMap.set(r.category, {
      amount: existing.amount + r.amount,
      count: existing.count + 1,
    });
  });

  const categoryBreakdown: CategoryStats[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryBreakdown,
  };
}

// 导出为 CSV
export function exportToCSV(records: Record[]): string {
  const headers = ['日期', '类型', '类别', '金额', '备注', '创建时间'];
  const rows = records.map(r => [
    r.date,
    r.type === 'income' ? '收入' : '支出',
    r.category,
    r.amount.toString(),
    r.note,
    format(r.createdAt, 'yyyy-MM-dd HH:mm:ss'),
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}