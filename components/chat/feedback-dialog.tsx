'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  sessionId: string;
  rating: 'positive' | 'negative';
}

export function FeedbackDialog({
  open,
  onOpenChange,
  messageId,
  sessionId,
  rating,
}: FeedbackDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          rating,
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

  const ratingText = rating === 'positive' ? 'hữu ích' : 'chưa hữu ích';
  const ratingColor = rating === 'positive' ? 'text-green-600' : 'text-red-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Gửi phản hồi chi tiết</DialogTitle>
          <DialogDescription>
            Bạn đã đánh giá câu trả lời này là{' '}
            <span className={`font-semibold ${ratingColor}`}>{ratingText}</span>. Hãy cho chúng
            tôi biết thêm để cải thiện dịch vụ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét của bạn *</Label>
            <Textarea
              id="comment"
              placeholder={
                rating === 'positive'
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
