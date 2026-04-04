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
  recognition.interimResults = false;
  recognition.lang = 'zh-CN';

  return recognition;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const optionsRef = useRef(options);

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
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        optionsRef.current.onResult?.(transcript);
      }
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      optionsRef.current.onError?.(new Error(`语音识别错误: ${event.error}`));
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    return () => {
      recognition.abort();
    };
  }, []);

  // 开始录音
  const startRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.error('语音识别未初始化');
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      // 如果已经在录音，先停止再开始
      console.log('重新启动语音识别');
      recognition.stop();
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.error('启动语音识别失败:', e);
        }
      }, 100);
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch (error) {
      console.error('停止语音识别失败:', error);
    }
    setIsRecording(false);
  }, []);

  // 切换录音状态
  const toggleRecording = useCallback(() => {
    if (isRecording) {
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