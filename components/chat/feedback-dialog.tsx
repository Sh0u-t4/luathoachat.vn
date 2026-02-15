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
import { useLanguage } from '@/lib/i18n/context';
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
  const { t } = useLanguage();
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
      toast.error(t.chat.feedbackErrorEmpty);
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Allow both authenticated and anonymous users to submit feedback
      const feedbackData = {
        message_id: messageId,
        user_id: user?.id || null,
        session_id: sessionId,
        rating: selectedRating,
        comment: comment.trim(),
      };

      const { error } = await supabase.from('message_feedback').upsert(
        feedbackData,
        {
          onConflict: 'message_id,session_id',
        }
      );

      if (error) throw error;

      toast.success(t.chat.feedbackSuccessTitle, {
        description: t.chat.feedbackSuccessDescription,
      });

      setComment('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(t.chat.feedbackErrorTitle, {
        description: t.chat.feedbackErrorDescription,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingText = selectedRating === 'positive'
    ? t.chat.feedbackRatingTextHelpful
    : t.chat.feedbackRatingTextNotHelpful;
  const ratingColor = selectedRating === 'positive' ? 'text-green-600' : 'text-red-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t.chat.feedbackDialogTitle}</DialogTitle>
          <DialogDescription>
            {initialRating ? (
              <>
                {t.chat.feedbackDescWithRatingPrefix}{' '}
                <span className={`font-semibold ${ratingColor}`}>{ratingText}</span>
                {t.chat.feedbackDescWithRatingSuffix}
              </>
            ) : (
              t.chat.feedbackDescNoRating
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating Selection - chỉ hiển thị nếu chưa có rating */}
          {!initialRating && (
            <div className="space-y-2">
              <Label>{t.chat.feedbackRatingLabel}</Label>
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
                  {t.chat.feedbackHelpful}
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
                  {t.chat.feedbackNotHelpful}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">{t.chat.feedbackCommentLabel}</Label>
            <Textarea
              id="comment"
              placeholder={
                selectedRating === 'positive'
                  ? t.chat.feedbackCommentPlaceholderPositive
                  : t.chat.feedbackCommentPlaceholderNegative
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {t.chat.feedbackCommentHint}
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
            {t.chat.feedbackCancelButton}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.chat.feedbackSubmitting}
              </>
            ) : (
              t.chat.feedbackSubmitButton
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
