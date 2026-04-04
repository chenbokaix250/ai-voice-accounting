// 文本解析 API Route（用于手动添加时 AI 辅助分类）

import { NextRequest, NextResponse } from 'next/server';
import { parseTextToRecord } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text as string;

    if (!text) {
      return NextResponse.json(
        { error: '未提供文本内容' },
        { status: 400 }
      );
    }

    // 调用 Gemini API 解析文本
    const result = await parseTextToRecord(text);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('文本解析错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '文本解析失败' },
      { status: 500 }
    );
  }
}