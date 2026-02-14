'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
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
  // Rating state - quick like/dislike
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

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
        return;
      }

      try {
        const { data, error } = await supabase
          .from('message_ratings')
          .select('rating_type')
          .eq('message_id', message.id)
          .eq('session_id', sessionId)
          .maybeSingle();

        if (error) {
          console.error('[Rating] Error loading:', error);
          return;
        }

        if (data) {
          setUserRating(data.rating_type as 'like' | 'dislike');
        }
      } catch (error) {
        console.error('[Rating] Exception:', error);
      }
    };

    loadExistingRating();
  }, [message.id, sessionId]);

  // Handle quick rating (like/dislike)
  const handleRating = async (ratingType: 'like' | 'dislike') => {
    console.log('[Rating] Starting rating submission:', { messageId: message.id, sessionId, ratingType });

    if (!message.id) {
      console.error('[Rating] Missing message ID');
      toast.error('Lỗi: Không tìm thấy ID tin nhắn');
      return;
    }

    if (!sessionId || sessionId === 'no-session') {
      console.error('[Rating] Invalid session ID:', sessionId);
      toast.error('Lỗi: Session chưa được khởi tạo. Vui lòng tải lại trang.');
      return;
    }

    if (isSubmittingRating) {
      console.log('[Rating] Already submitting, ignoring request');
      return;
    }

    // If user clicks the same rating, remove it
    if (userRating === ratingType) {
      console.log('[Rating] Removing existing rating');
      setIsSubmittingRating(true);
      try {
        const { error } = await supabase
          .from('message_ratings')
          .delete()
          .eq('message_id', message.id)
          .eq('session_id', sessionId);

        if (error) {
          console.error('[Rating] Delete error:', error);
          throw error;
        }

        console.log('[Rating] Successfully removed rating');
        setUserRating(null);
        toast.success('Đã xóa đánh giá');
      } catch (error: any) {
        console.error('[Rating] Error removing rating:', error);
        toast.error('Không thể xóa đánh giá');
      } finally {
        setIsSubmittingRating(false);
      }
      return;
    }

    // Submit new rating (delete old + insert new for reliability)
    setIsSubmittingRating(true);
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      console.log('[Rating] Current user ID:', currentUserId);

      // First, delete any existing rating for this message/session
      console.log('[Rating] Deleting existing ratings...');
      const { error: deleteError } = await supabase
        .from('message_ratings')
        .delete()
        .eq('message_id', message.id)
        .eq('session_id', sessionId);

      if (deleteError) {
        console.error('[Rating] Delete error (ignoring):', deleteError);
      }

      // Then insert the new rating
      console.log('[Rating] Inserting new rating...');
      const { data: insertData, error: insertError } = await supabase
        .from('message_ratings')
        .insert({
          message_id: message.id,
          session_id: sessionId,
          rating_type: ratingType,
          user_id: currentUserId,
          ip_address: null,
          user_agent: null,
        })
        .select();

      if (insertError) {
        console.error('[Rating] Insert error:', insertError);
        throw insertError;
      }

      console.log('[Rating] Successfully inserted rating:', insertData);
      setUserRating(ratingType);
      toast.success(ratingType === 'like' ? 'Cảm ơn phản hồi tích cực!' : 'Cảm ơn phản hồi của bạn!');
    } catch (error: any) {
      console.error('[Rating] Rating submission error:', error);
      console.error('[Rating] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error('Không thể gửi đánh giá: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setIsSubmittingRating(false);
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
          <div className="flex flex-col gap-3">
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

            {/* Detailed Feedback Button - hiển thị sau khi đã rate */}
            {userRating && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedbackDialog(true)}
                className="w-fit text-cyan-700 border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Phản hồi chi tiết
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {userRating && message.id && (
        <FeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          messageId={message.id}
          sessionId={sessionId}
          rating={userRating === 'like' ? 'positive' : 'negative'}
        />
      )}
    </div>
  );
}
