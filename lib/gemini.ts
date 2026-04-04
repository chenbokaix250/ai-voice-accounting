// AI 文本解析封装（使用 Gemini API）
// 文档：https://ai.google.dev/gemini-api/docs

import { ParsedVoiceResult, Category, RecordType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/record';
import { format, parse, isValid } from 'date-fns';

// 可用的模型列表（按优先级）
const MODELS = [
  'gemma-3-4b-it',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// 调用 AI API 解析文本
async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 未配置');

  let lastError: Error | null = null;

  // 尝试多个模型
  for (const model of MODELS) {
    try {
      const response = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (content) {
        return content;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Model ${model} failed:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error('所有模型都不可用');
}

// 验证并规范化日期格式
function validateDate(dateStr: string | undefined, defaultDate: string): string {
  if (!dateStr) return defaultDate;

  // 尝试解析日期
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  if (isValid(parsed)) {
    return format(parsed, 'yyyy-MM-dd');
  }

  // 如果解析失败，返回默认日期
  return defaultDate;
}

// 从文本解析记账信息
export async function parseTextToRecord(text: string): Promise<ParsedVoiceResult> {
  const today = format(new Date(), 'yyyy-MM-dd');

  const prompt = `你是一个记账助手。请从用户的文本中提取记账信息。

用户文本："${text}"
当前日期：${today}

请分析并返回以下信息（JSON格式）：
1. amount: 金额（数字，单位为元，从文本中提取数字）
2. category: 类别（必须从以下预设类别中选择最合适的）
   - 支出类别：${EXPENSE_CATEGORIES.join('、')}
   - 收入类别：${INCOME_CATEGORIES.join('、')}
3. type: 类型（"income" 表示收入，"expense" 表示支出）
4. date: 日期（必须是 YYYY-MM-DD 格式，例如 "${today}"，默认使用当前日期）
5. note: 备注（简洁描述，不超过20字）
6. confidence: 置信度（0-1之间的数字）

注意：
- 必须从预设类别中选择，不能创造新类别
- 如果金额不明确，默认为0
- 如果无法判断类型，默认为支出
- date 字段必须使用 YYYY-MM-DD 格式

只返回JSON，不要其他解释。`;

  const content = await callAI(prompt);

  // 提取 JSON
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('未找到JSON');

    const parsed = JSON.parse(jsonMatch[0]);

    // 验证并修正类别
    const validCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    if (!validCategories.includes(parsed.category)) {
      parsed.category = parsed.type === 'income' ? '其他收入' : '其他支出';
    }

    // 验证并规范化日期
    const validatedDate = validateDate(parsed.date, today);

    console.log('AI 解析结果:', { ...parsed, date: validatedDate });

    return {
      amount: Number(parsed.amount) || 0,
      category: parsed.category as Category,
      type: parsed.type as RecordType,
      date: validatedDate,
      note: parsed.note || text.slice(0, 20),
      confidence: Number(parsed.confidence) || 0.5,
    };
  } catch {
    return {
      amount: 0,
      category: '其他支出',
      type: 'expense',
      date: today,
      note: text.slice(0, 20),
      confidence: 0,
    };
  }
}

// 处理语音文本（浏览器语音识别后的文本）
export async function processVoiceToRecord(voiceText: string): Promise<ParsedVoiceResult> {
  if (!voiceText || !voiceText.trim()) {
    throw new Error('语音识别结果为空');
  }
  return parseTextToRecord(voiceText);
}