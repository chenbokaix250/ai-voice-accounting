// 主页 - 记账入口

'use client';

import { useState, useMemo } from 'react';
import { useRecords } from '@/hooks/use-records';
import { VoiceRecorder } from '@/components/voice-recorder';
import { RecordCard } from '@/components/record-card';
import { ManualAddForm } from '@/components/manual-add-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ParsedVoiceResult } from '@/types/record';
import { ArrowUpCircle, ArrowDownCircle, History, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Home() {
  const { records, isLoading, addRecord } = useRecords();
  const [latestParsed, setLatestParsed] = useState<ParsedVoiceResult | null>(null);

  // 处理语音识别结果（接收文本）
  const handleVoiceResult = async (text: string) => {
    try {
      // 调用 API 解析文本
      const response = await fetch('/api/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('语音解析失败: ' + result.error);
        return;
      }

      const parsed = result.data as ParsedVoiceResult;
      setLatestParsed(parsed);

      // 自动添加记录
      addRecord({
        amount: parsed.amount,
        category: parsed.category,
        type: parsed.type,
        date: parsed.date,
        note: parsed.note,
      });

      toast.success(`已添加: ${parsed.note} ¥${parsed.amount}`);

    } catch (error) {
      console.error('处理语音错误:', error);
      toast.error('处理失败，请重试');
    }
  };

  // 使用 useMemo 确保统计正确计算
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayStats = useMemo(() => {
    const todayRecords = records.filter(r => r.date === today);
    const income = todayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = todayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    return { income, expense, balance: income - expense, count: todayRecords.length };
  }, [records, today]);

  // 最近5条记录
  const recentRecords = useMemo(() => records.slice(0, 5), [records]);

  // 调试日志
  console.log('今日日期:', today);
  console.log('记录总数:', records.length);
  console.log('今日统计:', todayStats);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">AI语音记账</h1>
          <div className="flex gap-2">
            <Link href="/history">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                <History className="w-3 h-3 mr-1" />
                历史
              </Badge>
            </Link>
            <Link href="/stats">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                <BarChart3 className="w-3 h-3 mr-1" />
                统计
              </Badge>
            </Link>
            <Link href="/reports">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                <FileText className="w-3 h-3 mr-1" />
                报表
              </Badge>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 今日概览 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <ArrowUpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">今日收入</span>
            </div>
            <p className="text-2xl font-bold">¥{todayStats.income.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <ArrowDownCircle className="w-5 h-5" />
              <span className="text-sm font-medium">今日支出</span>
            </div>
            <p className="text-2xl font-bold">¥{todayStats.expense.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <span className="text-sm font-medium">今日结余</span>
            </div>
            <p className="text-2xl font-bold">¥{todayStats.balance.toFixed(2)}</p>
          </div>
        </div>

        {/* 语音录音区域 */}
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice">语音记账</TabsTrigger>
            <TabsTrigger value="manual">手动添加</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4">
            <VoiceRecorder onResult={handleVoiceResult} />

            {/* 最新解析结果 */}
            {latestParsed && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 mb-2">AI 解析结果：</p>
                <div className="flex gap-4 text-sm">
                  <span>金额: ¥{latestParsed.amount}</span>
                  <span>类别: {latestParsed.category}</span>
                  <span>备注: {latestParsed.note}</span>
                  <span>置信度: {Math.round(latestParsed.confidence * 100)}%</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <ManualAddForm onAdd={addRecord} />
          </TabsContent>
        </Tabs>

        {/* 最近记录 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            最近记录
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无记录</p>
              <p className="text-sm">开始语音记账吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRecords.map(record => (
                <RecordCard
                  key={record.id}
                  record={record}
                  compact
                />
              ))}
            </div>
          )}

          {records.length > 5 && (
            <Link href="/history" className="block text-center text-sm text-primary hover:underline">
              查看全部 {records.length} 条记录
            </Link>
          )}
        </section>
      </main>

      <Toaster />
    </div>
  );
}