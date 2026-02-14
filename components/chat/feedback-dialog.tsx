'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  sessionId: string;
  rating?: 'positive' | 'negative';
}

export function FeedbackDialog({
  open,
  onOpenChange,
  messageId,
  sessionId,
  rating: initialRating,
}: FeedbackDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<'positive' | 'negative'>(
    initialRating || 'positive'
  );

  // Update rating when initialRating changes
  useEffect(() => {
    if (initialRating) {
      setSelectedRating(initialRating);
    }
  }, [initialRating]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nhận xét của bạn');
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Vui lòng đăng nhập để gửi phản hồi');
        return;
      }

      const { error } = await supabase.from('message_feedback').upsert(
        {
          message_id: messageId,
          user_id: user.id,
          session_id: sessionId,
          rating: selectedRating,
          comment: comment.trim(),
        },
        {
          onConflict: 'message_id,user_id',
        }
      );

      if (error) throw error;

      toast.success('Cảm ơn bạn đã gửi phản hồi!', {
        description: 'Ý kiến của bạn giúp chúng tôi cải thiện dịch vụ.',
      });

      setComment('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Không thể gửi phản hồi', {
        description: 'Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingText = selectedRating === 'positive' ? 'hữu ích' : 'chưa hữu ích';
  const ratingColor = selectedRating === 'positive' ? 'text-green-600' : 'text-red-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Gửi phản hồi chi tiết</DialogTitle>
          <DialogDescription>
            {initialRating ? (
              <>
                Bạn đã đánh giá câu trả lời này là{' '}
                <span className={`font-semibold ${ratingColor}`}>{ratingText}</span>. Hãy cho chúng
                tôi biết thêm để cải thiện dịch vụ.
              </>
            ) : (
              'Hãy cho chúng tôi biết ý kiến của bạn về câu trả lời này để giúp chúng tôi cải thiện dịch vụ.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating Selection - chỉ hiển thị nếu chưa có rating */}
          {!initialRating && (
            <div className="space-y-2">
              <Label>Đánh giá của bạn *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedRating === 'positive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRating('positive')}
                  className={`flex-1 ${
                    selectedRating === 'positive'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Hữu ích
                </Button>
                <Button
                  type="button"
                  variant={selectedRating === 'negative' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRating('negative')}
                  className={`flex-1 ${
                    selectedRating === 'negative'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Chưa hữu ích
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét của bạn *</Label>
            <Textarea
              id="comment"
              placeholder={
                selectedRating === 'positive'
                  ? 'Điều gì khiến câu trả lời này hữu ích? (VD: Thông tin chính xác, trích dẫn rõ ràng, giải thích dễ hiểu...)'
                  : 'Câu trả lời cần cải thiện gì? (VD: Thiếu thông tin, không đúng trọng tâm, khó hiểu...)'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Tối thiểu 10 ký tự. Phản hồi của bạn hoàn toàn ẩn danh.
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
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi phản hồi'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
