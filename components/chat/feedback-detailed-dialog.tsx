'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface FeedbackDetailedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  sessionId: string;
}

export function FeedbackDetailedDialog({
  open,
  onOpenChange,
  messageId,
  sessionId,
}: FeedbackDetailedDialogProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Vui lòng chọn đánh giá (Tích cực hoặc Tiêu cực)');
      return;
    }

    if (!comment.trim()) {
      toast.error('Vui lòng nhập ý kiến đóng góp');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      console.log('[Feedback] Submitting detailed feedback:', {
        messageId,
        sessionId,
        rating,
        userId: currentUserId,
      });

      // Delete existing feedback for this message/session
      await supabase
        .from('message_feedback')
        .delete()
        .eq('message_id', messageId)
        .eq('session_id', sessionId);

      // Insert new feedback
      const { error } = await supabase
        .from('message_feedback')
        .insert({
          message_id: messageId,
          session_id: sessionId,
          user_id: currentUserId,
          rating,
          comment: comment.trim(),
        });

      if (error) {
        console.error('[Feedback] Insert error:', error);
        throw error;
      }

      console.log('[Feedback] Successfully submitted');
      toast.success('Cảm ơn bạn đã đóng góp ý kiến!');

      // Reset form and close dialog
      setRating(null);
      setComment('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('[Feedback] Submission error:', error);
      toast.error('Không thể gửi phản hồi: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-600" />
            Góp ý về Chatbot
          </DialogTitle>
          <DialogDescription>
            Ý kiến của bạn giúp chúng tôi cải thiện chất lượng trả lời của AI. Cảm ơn bạn đã dành thời gian!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating Selection */}
          <div className="space-y-2">
            <Label htmlFor="rating">Đánh giá chung *</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={rating === 'positive' ? 'default' : 'outline'}
                className={`flex-1 ${
                  rating === 'positive'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                }`}
                onClick={() => setRating('positive')}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Tích cực
              </Button>
              <Button
                type="button"
                variant={rating === 'negative' ? 'default' : 'outline'}
                className={`flex-1 ${
                  rating === 'negative'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                }`}
                onClick={() => setRating('negative')}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Tiêu cực
              </Button>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-2">
            <Label htmlFor="comment">Ý kiến chi tiết *</Label>
            <Textarea
              id="comment"
              placeholder="Vui lòng chia sẻ ý kiến của bạn về câu trả lời này. Ví dụ: Thông tin thiếu chính xác, câu trả lời quá ngắn, hoặc rất hữu ích..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">
              {comment.length}/500 ký tự
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !rating || !comment.trim()}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi góp ý'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
