'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTypingEffect } from '@/hooks/use-typing-effect';
import { LegalCitation } from './legal-citation';
import { toast } from 'sonner';
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
  // Rating state - quick like/dislike
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

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

  // Load existing rating when component mounts
  useEffect(() => {
    const loadExistingRating = async () => {
      if (!message.id || !sessionId || sessionId === 'no-session') {
        console.log('[Rating] Skipping load - missing data:', { messageId: message.id, sessionId });
        return;
      }

      console.log('[Rating] Loading existing rating for:', { messageId: message.id, sessionId });

      try {
        // Use API route instead of direct Supabase call
        const response = await fetch(
          `/api/rate-message?messageId=${message.id}&sessionId=${sessionId}`,
          { method: 'GET' }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.rating) {
            console.log('[Rating] Found existing rating:', result.rating);
            setUserRating(result.rating as 'like' | 'dislike');
          } else {
            console.log('[Rating] No existing rating found');
          }
        } else {
          console.error('[Rating] Error loading rating:', await response.text());
        }
      } catch (error) {
        console.error('[Rating] Exception loading rating:', error);
      }
    };

    loadExistingRating();
  }, [message.id, sessionId]);

  // Handle quick rating (like/dislike)
  const handleRating = async (ratingType: 'like' | 'dislike') => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 RATING DEBUG START');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 Button clicked:', ratingType);
    console.log('📌 Message ID:', message.id);
    console.log('📌 Session ID:', sessionId);
    console.log('📌 Current rating:', userRating);
    console.log('📌 Is submitting:', isSubmittingRating);

    if (!message.id) {
      console.error('❌ VALIDATION FAILED: Missing message.id');
      toast.error('Lỗi: Không tìm thấy ID tin nhắn');
      return;
    }

    if (!sessionId || sessionId === 'no-session') {
      console.error('❌ VALIDATION FAILED: Invalid sessionId:', sessionId);
      toast.error('Lỗi: Session chưa được khởi tạo. Vui lòng tải lại trang.');
      return;
    }

    if (isSubmittingRating) {
      console.log('⏸️  SKIPPED: Already submitting');
      return;
    }

    console.log('✅ Validation passed, proceeding...');

    // If user clicks the same rating, remove it
    if (userRating === ratingType) {
      setIsSubmittingRating(true);
      try {
        // Use API route to delete rating
        const response = await fetch('/api/rate-message', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: message.id,
            sessionId,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to remove rating');
        }

        setUserRating(null);
        toast.success('Đã xóa đánh giá');
      } catch (error: any) {
        console.error('Error removing rating:', error);
        toast.error('Không thể xóa đánh giá', {
          description: error?.message || 'Vui lòng thử lại sau.',
        });
      } finally {
        setIsSubmittingRating(false);
      }
      return;
    }

    // Submit new rating
    console.log('📤 Submitting new rating...');
    setIsSubmittingRating(true);
    try {
      // Don't call supabase.auth.getUser() - let API route handle it
      const payload = {
        messageId: message.id,
        sessionId,
        userId: null, // API route will get this from auth header if available
        ratingType,
      };

      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      console.log('🌐 Fetching: POST /api/rate-message');

      const response = await fetch('/api/rate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status, response.statusText);

      const result = await response.json();
      console.log('📥 Response body:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.error('❌ API returned error:', result);
        throw new Error(result.details || result.error || 'Failed to submit rating');
      }

      console.log('✅ Rating submitted successfully!');
      setUserRating(ratingType);
      toast.success(ratingType === 'like' ? 'Cảm ơn phản hồi tích cực! 👍' : 'Cảm ơn phản hồi của bạn! 👎');
    } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ RATING ERROR:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      toast.error('Không thể gửi đánh giá', {
        description: error?.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmittingRating(false);
      console.log('🏁 RATING DEBUG END');
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

      {/* Quick Rating Buttons - cho tất cả users (kể cả anonymous) */}
      {shouldShowUnblurred && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Câu trả lời này có hữu ích không?</span>
            <div className="flex gap-2">
              <Button
                variant={userRating === 'like' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRating('like')}
                disabled={isSubmittingRating}
                className={`transition-all ${
                  userRating === 'like'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                }`}
              >
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                Hữu ích
              </Button>
              <Button
                variant={userRating === 'dislike' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRating('dislike')}
                disabled={isSubmittingRating}
                className={`transition-all ${
                  userRating === 'dislike'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                }`}
              >
                <ThumbsDown className="w-4 h-4 mr-1.5" />
                Chưa hữu ích
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
