// 记账数据 React hook

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Record, FilterOptions, PeriodStats } from '@/types/record';
import {
  getRecords,
  addRecord as addRecordStorage,
  updateRecord as updateRecordStorage,
  deleteRecord as deleteRecordStorage,
  filterRecords,
  getPeriodStats,
} from '@/lib/storage';

export function useRecords() {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化加载记录
  useEffect(() => {
    const loadRecords = () => {
      const data = getRecords();
      console.log('从 localStorage 加载记录:', data.length, '条');
      setRecords(data);
      setIsLoading(false);
    };

    loadRecords();

    // 监听 storage 变化（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accounting_records') {
        loadRecords();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 添加记录
  const addRecord = useCallback((record: Omit<Record, 'id' | 'createdAt'>) => {
    console.log('添加记录:', record);
    const newRecord = addRecordStorage(record);
    console.log('新记录已创建:', newRecord);

    // 重新从 localStorage 加载以确保同步
    const updatedRecords = getRecords();
    console.log('更新后的记录列表:', updatedRecords.length, '条');
    setRecords(updatedRecords);

    return newRecord;
  }, []);

  // 更新记录
  const updateRecord = useCallback((id: string, updates: Partial<Record>) => {
    const updated = updateRecordStorage(id, updates);
    if (updated) {
      setRecords(getRecords());
    }
    return updated;
  }, []);

  // 删除记录
  const deleteRecord = useCallback((id: string) => {
    const success = deleteRecordStorage(id);
    if (success) {
      setRecords(getRecords());
    }
    return success;
  }, []);

  // 筛选记录
  const getFilteredRecords = useCallback((options: FilterOptions) => {
    return filterRecords(records, options);
  }, [records]);

  // 获取统计
  const getStats = useCallback((period: 'month' | 'week'): PeriodStats => {
    return getPeriodStats(records, period);
  }, [records]);

  // 刷新数据
  const refresh = useCallback(() => {
    setRecords(getRecords());
  }, []);

  return {
    records,
    isLoading,
    addRecord,
    updateRecord,
    deleteRecord,
    getFilteredRecords,
    getStats,
    refresh,
  };
}