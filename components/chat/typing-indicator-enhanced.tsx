'use client';

import { useEffect, useState } from 'react';
import { Bot, Search, BookOpen, Sparkles } from 'lucide-react';

interface TypingIndicatorEnhancedProps {
  className?: string;
}

const stages = [
  { icon: Search, text: 'Đang phân tích câu hỏi...', progress: 25 },
  { icon: BookOpen, text: 'Đang tra cứu văn bản pháp luật...', progress: 50 },
  { icon: Sparkles, text: 'Đang tổng hợp câu trả lời...', progress: 75 },
  { icon: Bot, text: 'Hoàn tất', progress: 100 },
];

export function TypingIndicatorEnhanced({ className = '' }: TypingIndicatorEnhancedProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Stage progression: 2s -> 3s -> 3s -> done
    const stageDurations = [2000, 3000, 3000];
    let stageTimer: NodeJS.Timeout;

    const advanceStage = () => {
      setCurrentStage((prev) => {
        if (prev < stages.length - 1) {
          const nextStage = prev + 1;
          if (nextStage < stageDurations.length) {
            stageTimer = setTimeout(advanceStage, stageDurations[nextStage]);
          }
          return nextStage;
        }
        return prev;
      });
    };

    // Start first stage timer
    stageTimer = setTimeout(advanceStage, stageDurations[0]);

    return () => {
      clearTimeout(stageTimer);
    };
  }, []);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const stage = stages[currentStage];
  const Icon = stage.icon;
  const estimatedTotal = 8; // seconds
  const remaining = Math.max(0, estimatedTotal - elapsedTime);

  return (
    <div className={`flex items-start gap-3 p-4 ${className}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 space-y-3">
        {/* Stage Text with Icon */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Icon className="w-4 h-4 text-cyan-600 animate-pulse" />
          <span className="font-medium">{stage.text}</span>
          <span className="inline-flex gap-0.5">
            <span className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${stage.progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Time Estimate */}
        {remaining > 0 && currentStage < stages.length - 1 && (
          <p className="text-xs text-slate-500">
            Còn khoảng {remaining} giây...
          </p>
        )}
      </div>

      {/* Custom Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
