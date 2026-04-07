// 文本解析 API Route（使用百炼 API - 通义千问）

import { NextRequest, NextResponse } from 'next/server';
import { parseTextToRecord } from '@/lib/dashscope';

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

    // 调用百炼 API 解析文本
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