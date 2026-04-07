// 语音录制 hook - 使用浏览器内置语音识别

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceOptions {
  onResult?: (text: string) => void;
  onError?: (error: Error) => void;
}

// 语音识别类型
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// 检查浏览器是否支持语音识别
function getSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null;

  // @ts-ignore
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) return null;

  const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
  recognition.continuous = false;
  recognition.interimResults = false;  // 只获取最终结果，避免重复
  recognition.lang = 'zh-CN';

  return recognition;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const optionsRef = useRef(options);
  const isStartingRef = useRef(false);
  const hasResultRef = useRef(false);  // 防止重复回调

  // 保持 options 最新
  useEffect(() => {
    optionsRef.current = options;
  }, [options.onResult, options.onError]);

  // 初始化语音识别（只执行一次）
  useEffect(() => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log('🎤 语音识别已启动');
      setIsRecording(true);
      isStartingRef.current = false;
      hasResultRef.current = false;  // 重置结果标记
    };

    recognition.onresult = (event) => {
      // 防止重复回调
      if (hasResultRef.current) {
        console.log('已处理过结果，跳过');
        return;
      }

      // 只获取最终结果
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      // 如果没有 isFinal 结果，取最后一个
      if (!finalTranscript && event.results.length > 0) {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult[0]?.transcript) {
          finalTranscript = lastResult[0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        hasResultRef.current = true;  // 标记已处理
        console.log('📝 最终识别结果:', finalTranscript);
        optionsRef.current.onResult?.(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error, event.message);
      isStartingRef.current = false;

      // 提供更友好的错误提示
      let errorMessage = '语音识别出错';
      switch (event.error) {
        case 'not-allowed':
          errorMessage = '请允许麦克风权限';
          break;
        case 'no-speech':
          errorMessage = '未检测到语音，请重试';
          break;
        case 'network':
          errorMessage = '网络错误，请检查网络连接';
          break;
        case 'audio-capture':
          errorMessage = '无法访问麦克风';
          break;
        case 'aborted':
          // 用户取消，不报错
          return;
      }

      optionsRef.current.onError?.(new Error(errorMessage));
      setIsRecording(false);
    };

    recognition.onend = () => {
      console.log('🎤 语音识别已结束');
      setIsRecording(false);
      isStartingRef.current = false;
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // 开始录音
  const startRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.error('语音识别未初始化');
      optionsRef.current.onError?.(new Error('浏览器不支持语音识别'));
      return;
    }

    // 防止重复启动
    if (isStartingRef.current || isRecording) {
      console.log('语音识别正在进行中...');
      return;
    }

    isStartingRef.current = true;
    hasResultRef.current = false;  // 重置结果标记

    try {
      recognition.start();
    } catch (error: any) {
      console.error('启动语音识别失败:', error);
      isStartingRef.current = false;

      // 如果已经在运行，先停止
      if (error.name === 'InvalidStateError') {
        try {
          recognition.abort();
          // 短暂延迟后重试
          setTimeout(() => {
            try {
              hasResultRef.current = false;
              recognition.start();
            } catch (e) {
              console.error('重试启动失败:', e);
              isStartingRef.current = false;
            }
          }, 200);
        } catch (e) {
          console.error('停止失败:', e);
          isStartingRef.current = false;
        }
      }
    }
  }, [isRecording]);

  // 停止录音
  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    console.log('🛑 停止语音识别');
    try {
      recognition.stop();
    } catch (error) {
      console.error('停止语音识别失败:', error);
    }
    isStartingRef.current = false;
  }, []);

  // 切换录音状态
  const toggleRecording = useCallback(() => {
    if (isRecording || isStartingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}