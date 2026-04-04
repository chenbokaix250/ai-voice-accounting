// 记账记录类型定义

export type RecordType = 'income' | 'expense';

// 预设类别
export const EXPENSE_CATEGORIES = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '医疗',
  '教育',
  '居住',
  '其他支出',
] as const;

export const INCOME_CATEGORIES = [
  '工资',
  '奖金',
  '投资',
  '兼职',
  '其他收入',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type Category = ExpenseCategory | IncomeCategory;

// 记账记录
export interface Record {
  id: string;
  amount: number;
  category: Category;
  type: RecordType;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: number; // timestamp
}

// AI 解析结果
export interface ParsedVoiceResult {
  amount: number;
  category: Category;
  type: RecordType;
  date: string;
  note: string;
  confidence: number; // 0-1, AI 解析置信度
}

// 统计数据
export interface CategoryStats {
  category: string; // 允许任意类别名称
  amount: number;
  count: number;
  percentage: number;
}

export interface PeriodStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryStats[];
}

// 筛选条件
export interface FilterOptions {
  type?: RecordType;
  category?: Category;
  startDate?: string;
  endDate?: string;
  search?: string;
}