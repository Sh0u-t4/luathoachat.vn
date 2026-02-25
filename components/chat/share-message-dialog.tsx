'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Link as LinkIcon, Facebook, Twitter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent: string;
  messageId?: string;
}

export function ShareMessageDialog({
  open,
  onOpenChange,
  messageContent,
  messageId,
}: ShareMessageDialogProps) {
  const [copied, setCopied] = useState(false);

  // Generate shareable link (if messageId exists)
  const shareUrl = messageId
    ? `${window.location.origin}/chat?message=${messageId}`
    : window.location.href;

  // Format message for sharing
  const shareText = `${messageContent.slice(0, 200)}${messageContent.length > 200 ? '...' : ''}\n\n📚 Nguồn: ${shareUrl}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      toast.success('Đã sao chép nội dung!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Không thể sao chép');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép link!');
    } catch (error) {
      toast.error('Không thể sao chép link');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Câu trả lời từ Luathoachat.vn',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          toast.error('Không thể chia sẻ');
        }
      }
    } else {
      toast.error('Trình duyệt không hỗ trợ tính năng này');
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter') => {
    let url = '';

    if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Chia sẻ câu trả lời
          </DialogTitle>
          <DialogDescription>
            Chia sẻ câu trả lời này với đồng nghiệp hoặc bạn bè
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Chia sẻ
            </Button>
          )}

          {/* Copy Text */}
          <Button
            onClick={handleCopyText}
            variant="outline"
            className="w-full justify-start"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Đã sao chép nội dung
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Sao chép nội dung
              </>
            )}
          </Button>

          {/* Copy Link */}
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full justify-start"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Sao chép link
          </Button>

          {/* Social Share */}
          <div className="border-t pt-4">
            <p className="text-sm text-slate-600 mb-3">Hoặc chia sẻ qua:</p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSocialShare('facebook')}
                variant="outline"
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button
                onClick={() => handleSocialShare('twitter')}
                variant="outline"
                className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
