// 语音录制组件 - 使用浏览器内置语音识别

'use client';

import { useEffect, useState, useRef } from 'react';
import { useVoice } from '@/hooks/use-voice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onResult, disabled }: VoiceRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);  // 防止重复处理

  const {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
  } = useVoice({
    onResult: async (text: string) => {
      // 防止重复处理
      if (processingRef.current) {
        console.log('正在处理中，跳过:', text);
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);

      try {
        console.log('处理语音结果:', text);
        await onResult(text);
      } catch (error) {
        console.error('处理语音结果失败:', error);
      } finally {
        // 延迟重置，防止快速连续触发
        setTimeout(() => {
          setIsProcessing(false);
          processingRef.current = false;
        }, 500);
      }
    },
    onError: (error) => {
      console.error('语音识别错误:', error);
      alert(error.message);
      setIsProcessing(false);
      processingRef.current = false;
    },
  });

  // 监听 F1 键（按下开始，松开结束）
  useEffect(() => {
    let keyPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' && !keyPressed) {
        e.preventDefault();
        keyPressed = true;

        // 只在不录音、不处理中时才开始
        if (!isRecording && !disabled && !isProcessing && !processingRef.current) {
          startRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'F1' && keyPressed) {
        e.preventDefault();
        keyPressed = false;

        // 松开时停止录音
        if (isRecording) {
          stopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, disabled, isProcessing, startRecording, stopRecording]);

  // 点击按钮处理
  const handleButtonClick = () => {
    // 处理中不允许操作
    if (isProcessing || processingRef.current) {
      return;
    }

    toggleRecording();
  };

  if (!isSupported) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground">您的浏览器不支持语音识别</p>
          <p className="text-sm text-muted-foreground mt-2">请使用 Chrome、Edge 或 Safari 浏览器</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
        {/* 录音按钮 */}
        <Button
          variant={isRecording ? 'destructive' : 'default'}
          size="lg"
          className={cn(
            'w-24 h-24 rounded-full',
            'transition-all duration-200',
            isRecording && 'animate-pulse scale-110'
          )}
          disabled={disabled || isProcessing}
          onClick={handleButtonClick}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>

        {/* 状态提示 */}
        <div className="text-center space-y-1">
          {isProcessing ? (
            <p className="text-muted-foreground">正在解析语音...</p>
          ) : isRecording ? (
            <>
              <p className="text-primary font-medium text-lg">🎤 正在录音...</p>
              <p className="text-sm text-muted-foreground">请说话，点击按钮结束</p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">点击按钮开始录音</p>
              <p className="text-xs text-muted-foreground">或按 F1 键（按住说话，松开结束）</p>
            </>
          )}
        </div>

        {/* 快捷键提示 */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>👆 点击按钮：开始/停止录音</p>
          <p>⌨️ F1 键：按住说话，松开结束</p>
        </div>
      </CardContent>
    </Card>
  );
}