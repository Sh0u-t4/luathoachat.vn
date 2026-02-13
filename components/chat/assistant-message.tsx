'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTypingEffect } from '@/hooks/use-typing-effect';
import { LegalCitation } from './legal-citation';
import { FeedbackDialog } from './feedback-dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/types';

interface AssistantMessageProps {
  message: ChatMessage;
  isLatest: boolean;
  isAuthenticated: boolean;
  onUnlockClick: () => void;
  messageIndex: number; // Index của assistant message này (0-based)
  sessionId: string;
}

export function AssistantMessage({
  message,
  isLatest,
  isAuthenticated,
  onUnlockClick,
  messageIndex,
  sessionId,
}: AssistantMessageProps) {
  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [pendingRating, setPendingRating] = useState<'positive' | 'negative' | null>(null);

  // Unlock logic: Show unblurred content if:
  // 1. User is authenticated, OR
  // 2. This is one of the first 5 free messages (messageIndex < 5)
  const shouldShowUnblurred = isAuthenticated || messageIndex < 5;
  // Tách nội dung thành 2 phần: public (25%) và locked (75%)
  const splitContent = (content: string) => {
    const lines = content.split('\n');

    if (lines.length <= 2) {
      const splitPoint = Math.floor(content.length * 0.25);
      return {
        publicPart: content.substring(0, splitPoint),
        lockedPart: content.substring(splitPoint),
      };
    }

    const splitPoint = Math.floor(lines.length * 0.25);
    return {
      publicPart: lines.slice(0, Math.max(1, splitPoint)).join('\n'),
      lockedPart: lines.slice(Math.max(1, splitPoint)).join('\n'),
    };
  };

  const fullContent =
    message.detailedContent && message.detailedContent !== message.content
      ? `${message.content}\n\n${message.detailedContent}`
      : message.content;

  const { publicPart, lockedPart } = splitContent(fullContent);

  // Typing effect - chỉ apply cho message mới nhất
  const { displayedText: displayedPublic } = useTypingEffect(publicPart, isLatest, {
    speed: 15,
  });

  const { displayedText: displayedLocked } = useTypingEffect(lockedPart, isLatest, {
    speed: 15,
  });

  // Nếu không phải latest message, hiển thị toàn bộ ngay
  const finalPublic = isLatest ? displayedPublic : publicPart;
  const finalLocked = isLatest ? displayedLocked : lockedPart;

  // Handle feedback
  const handleFeedback = async (rating: 'positive' | 'negative') => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi phản hồi');
      return;
    }

    if (feedbackRating === rating) {
      // Already rated with the same rating, do nothing
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Vui lòng đăng nhập để gửi phản hồi');
        return;
      }

      // Quick feedback without detailed comment
      const { error } = await supabase.from('message_feedback').upsert(
        {
          message_id: message.id,
          user_id: user.id,
          session_id: sessionId,
          rating,
        },
        {
          onConflict: 'message_id,user_id',
        }
      );

      if (error) throw error;

      setFeedbackRating(rating);
      toast.success(
        rating === 'positive' ? 'Cảm ơn phản hồi tích cực!' : 'Cảm ơn phản hồi của bạn!'
      );

      // Open detailed feedback dialog
      setPendingRating(rating);
      setShowFeedbackDialog(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Không thể gửi phản hồi', {
        description: 'Vui lòng thử lại sau.',
      });
    }
  };

  return (
    <div className="p-4">
      {message.detectedChemicals && message.detectedChemicals.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {message.detectedChemicals.map((chemical, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="bg-cyan-50 text-cyan-700 border-cyan-200"
            >
              {chemical}
            </Badge>
          ))}
        </div>
      )}

      <div className="text-slate-800 leading-relaxed space-y-3">
        {/* Phần public - luôn hiển thị với typing effect */}
        <div className="whitespace-pre-wrap">
          {finalPublic}
          {isLatest && finalPublic.length < publicPart.length && (
            <span className="inline-block w-1 h-4 bg-cyan-600 ml-0.5 animate-pulse" />
          )}
        </div>

        {/* Phần locked - chỉ hiển thị nếu đã đăng nhập */}
        {lockedPart && (
          <div className="relative mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Lock
                className={`w-4 h-4 ${
                  shouldShowUnblurred ? 'text-cyan-600' : 'text-slate-400'
                }`}
              />
              <span className="text-sm font-medium text-slate-700">
                Chi tiết trích dẫn luật & Mức phạt
              </span>
            </div>

            <div className="relative">
              <div
                className={`text-slate-700 whitespace-pre-wrap ${
                  !shouldShowUnblurred ? 'blur-content' : ''
                }`}
              >
                {finalLocked}
                {shouldShowUnblurred &&
                  isLatest &&
                  finalLocked.length < lockedPart.length && (
                    <span className="inline-block w-1 h-4 bg-cyan-600 ml-0.5 animate-pulse" />
                  )}
              </div>

              {!shouldShowUnblurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/60 to-white/90">
                  <Button
                    onClick={onUnlockClick}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-xl"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Đăng nhập để xem chi tiết
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Citations - hiển thị cho user đã unlock (authenticated hoặc trong 5 câu free) */}
      {shouldShowUnblurred && message.citations && message.citations.length > 0 && (
        <div className="mt-4">
          <LegalCitation citations={message.citations} />
        </div>
      )}

      {/* Feedback Buttons - chỉ hiển thị cho user đã đăng nhập */}
      {isAuthenticated && shouldShowUnblurred && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Câu trả lời này có hữu ích không?</span>
            <div className="flex gap-2">
              <Button
                variant={feedbackRating === 'positive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFeedback('positive')}
                className={`transition-all ${
                  feedbackRating === 'positive'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                }`}
              >
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                Có
              </Button>
              <Button
                variant={feedbackRating === 'negative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFeedback('negative')}
                className={`transition-all ${
                  feedbackRating === 'negative'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                }`}
              >
                <ThumbsDown className="w-4 h-4 mr-1.5" />
                Không
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {pendingRating && (
        <FeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          messageId={message.id}
          sessionId={sessionId}
          rating={pendingRating}
        />
      )}
    </div>
  );
}
