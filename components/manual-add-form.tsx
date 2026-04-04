// 手动添加记账表单组件

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RecordType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES, Record } from '@/types/record';
import { format } from 'date-fns';
import { Loader2, Wand2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ManualAddFormProps {
  onAdd: (record: Omit<Record, 'id' | 'createdAt'>) => void;
}

export function ManualAddForm({ onAdd }: ManualAddFormProps) {
  const [type, setType] = useState<RecordType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('餐饮');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

  // 获取当前类型的类别列表
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // 类型变化时重置类别
  const handleTypeChange = (newType: RecordType) => {
    setType(newType);
    setCategory(newType === 'expense' ? '餐饮' : '工资');
  };

  // AI 智能分类
  const handleAIClassify = async () => {
    if (!note.trim()) {
      toast.error('请先输入备注内容');
      return;
    }

    setIsAILoading(true);
    try {
      const response = await fetch('/api/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: note }),
      });

      const result = await response.json();

      if (result.success) {
        const parsed = result.data;
        // 自动填充 AI 解析结果
        if (parsed.amount > 0) {
          setAmount(parsed.amount.toString());
        }
        setCategory(parsed.category);
        setType(parsed.type);
        setDate(parsed.date);
        toast.success('AI 已智能识别，请确认后添加');
      } else {
        toast.error('AI 解析失败，请手动填写');
      }
    } catch (error) {
      toast.error('AI 解析失败');
    } finally {
      setIsAILoading(false);
    }
  };

  // 添加记录
  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('请输入有效金额');
      return;
    }

    onAdd({
      amount: numAmount,
      category,
      type,
      date,
      note: note.trim() || `${category} ${type === 'expense' ? '支出' : '收入'}`,
    });

    // 重置表单
    setAmount('');
    setNote('');
    toast.success('记账成功！');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          手动记账
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 类型选择 */}
        <div className="flex gap-2">
          <Button
            variant={type === 'expense' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange('expense')}
            className="flex-1"
          >
            支出
          </Button>
          <Button
            variant={type === 'income' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange('income')}
            className="flex-1 bg-green-500 hover:bg-green-600"
          >
            收入
          </Button>
        </div>

        {/* 金额输入 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-12">金额</span>
          <div className="flex-1 flex items-center relative">
            <span className="absolute left-3 text-muted-foreground">¥</span>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="pl-8"
              step="0.01"
            />
          </div>
        </div>

        {/* 类别选择 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-12">类别</span>
          <Select value={category} onValueChange={v => setCategory(v as Category)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  <Badge variant="outline" className="mr-2">{cat}</Badge>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 日期选择 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-12">日期</span>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* 备注输入 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-12">备注</span>
          <Input
            placeholder="例如：午餐、打车、买书..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="flex-1"
          />
          {/* AI 智能分类按钮 */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleAIClassify}
            disabled={isAILoading || !note.trim()}
            title="AI 智能分类"
          >
            {isAILoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          添加记录
        </Button>

        {/* AI 提示 */}
        <p className="text-xs text-muted-foreground text-center">
          💡 输入备注后点击魔法棒图标，AI 会自动识别金额和类别
        </p>
      </CardContent>
    </Card>
  );
}