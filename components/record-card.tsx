// 记账卡片组件

'use client';

import { Record as AccountingRecord, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/record';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Edit, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecordCardProps {
  record: AccountingRecord;
  onEdit?: (record: AccountingRecord) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

// 类别颜色映射
const categoryColors: Record<string, string> = {
  // 支出类别
  餐饮: 'bg-orange-500',
  交通: 'bg-blue-500',
  购物: 'bg-pink-500',
  娱乐: 'bg-purple-500',
  医疗: 'bg-red-500',
  教育: 'bg-cyan-500',
  居住: 'bg-amber-500',
  其他支出: 'bg-gray-500',
  // 收入类别
  工资: 'bg-green-600',
  奖金: 'bg-green-500',
  投资: 'bg-teal-500',
  兼职: 'bg-lime-500',
  其他收入: 'bg-emerald-500',
};

export function RecordCard({ record, onEdit, onDelete, compact }: RecordCardProps) {
  const isIncome = record.type === 'income';
  const categoryColor = categoryColors[record.category] || 'bg-gray-500';

  if (compact) {
    // 紧凑模式 - 用于列表项
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          {/* 类型图标 */}
          {isIncome ? (
            <ArrowUpCircle className="w-5 h-5 text-green-500" />
          ) : (
            <ArrowDownCircle className="w-5 h-5 text-red-500" />
          )}

          {/* 类别 */}
          <Badge className={cn(categoryColor, 'text-white')}>
            {record.category}
          </Badge>

          {/* 备注 */}
          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
            {record.note || '无备注'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* 金额 */}
          <span className={cn(
            'font-bold',
            isIncome ? 'text-green-500' : 'text-red-500'
          )}>
            {isIncome ? '+' : '-'}¥{record.amount.toFixed(2)}
          </span>

          {/* 操作按钮 */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(record)}>
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(record.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  // 完整卡片模式
  return (
    <Card className="overflow-hidden">
      <CardHeader className={cn('pb-2', isIncome ? 'bg-green-50' : 'bg-red-50')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isIncome ? (
              <ArrowUpCircle className="w-5 h-5 text-green-500" />
            ) : (
              <ArrowDownCircle className="w-5 h-5 text-red-500" />
            )}
            <CardTitle className={cn(
              'text-lg',
              isIncome ? 'text-green-700' : 'text-red-700'
            )}>
              {isIncome ? '收入' : '支出'}
            </CardTitle>
          </div>
          <Badge className={cn(categoryColor, 'text-white')}>
            {record.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {/* 金额 */}
        <div className="text-center">
          <span className={cn(
            'text-3xl font-bold',
            isIncome ? 'text-green-500' : 'text-red-500'
          )}>
            ¥{record.amount.toFixed(2)}
          </span>
        </div>

        {/* 日期和备注 */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{format(new Date(record.date), 'yyyy年MM月dd日')}</span>
          <span>{record.note || '无备注'}</span>
        </div>

        {/* 操作按钮 */}
        {(onEdit || onDelete) && (
          <div className="flex justify-end gap-2 pt-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(record)}>
                <Edit className="w-4 h-4 mr-1" />
                编辑
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(record.id)}>
                <Trash2 className="w-4 h-4 mr-1" />
                删除
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}