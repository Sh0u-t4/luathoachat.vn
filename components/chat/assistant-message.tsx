'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, ThumbsUp, ThumbsDown, MessageSquare, Copy, Check } from 'lucide-react';
import { useTypingEffect } from '@/hooks/use-typing-effect';
import { LegalCitation } from './legal-citation';
import { FeedbackDialog } from './feedback-dialog';
import { QuickReplyButtons, generateQuickReplies } from './quick-reply-buttons';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/types';

// ── Markdown helpers ──────────────────────────────────────────────────────────

/** Renders inline formatting: **bold**, *italic*, [Nguồn: ...] citations */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[Nguồn:[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('[Nguồn:'))
      return <span key={i} className="inline-flex items-center text-xs text-cyan-700 font-medium bg-cyan-50 border border-cyan-200 rounded px-1.5 py-0.5 mx-0.5">{part}</span>;
    return part;
  });
}

/** Full block-level markdown renderer (lists, headings, paragraphs) */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list items: "1. ", "2. ", ...
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="list-decimal list-outside ml-5 space-y-1 my-2">
          {items.map((item, j) => <li key={j} className="pl-1">{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Bullet list: "- " or "• "
    if (/^[-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-•]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="list-disc list-outside ml-5 space-y-1 my-2">
          {items.map((item, j) => <li key={j} className="pl-1">{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={elements.length} className="font-bold text-slate-900 text-base mt-3 mb-1">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={elements.length} className="font-bold text-slate-900 text-lg mt-4 mb-1">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={elements.length} className="font-bold text-slate-900 text-xl mt-4 mb-1">{renderInline(line.slice(2))}</h1>);

    // Table: trim line to handle \r from Windows line endings
    } else if (/^\|.+\|/.test(line.trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // Filter separator rows: |---|---| or |:---|:---|
      const isSeparator = (r: string) => /^\|[-|: ]+\|$/.test(r);
      const rows = tableLines.filter(r => !isSeparator(r));
      const headerCells = rows[0]?.split('|').filter(Boolean).map(c => c.trim()) ?? [];
      const bodyRows = rows.slice(1);
      elements.push(
        <div key={elements.length} className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                {headerCells.map((cell, j) => (
                  <th key={j} className="px-3 py-2 text-left font-semibold border-r border-slate-600 last:border-r-0">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => {
                const cells = row.split('|').filter(Boolean).map(c => c.trim());
                return (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 border-t border-r border-slate-200 last:border-r-0 align-top">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;

    } else if (line.trim() === '') {
      elements.push(<div key={elements.length} className="h-1" />);
    } else {
      elements.push(<p key={elements.length} className="leading-relaxed">{renderInline(line)}</p>);
    }

    i++;
  }

  return <>{elements}</>;
}

interface AssistantMessageProps {
  message: ChatMessage;
  isLatest: boolean;
  isAuthenticated: boolean;
  onUnlockClick: () => void;
  messageIndex: number; // Index của assistant message này (0-based)
  sessionId: string;
  onQuickReply?: (reply: string) => void; // Callback for quick reply selection
}

// Helper function to validate if a string is a valid UUID
const isValidUUID = (str: string | undefined): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function AssistantMessage({
  message,
  isLatest,
  isAuthenticated,
  onUnlockClick,
  messageIndex,
  sessionId,
  onQuickReply,
}: AssistantMessageProps) {
  // Rating state - quick like/dislike
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Check if message has a valid database UUID (not temporary client-side ID)
  const hasValidMessageId = isValidUUID(message.id);

  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);


  // Copy state
  const [isCopied, setIsCopied] = useState(false);

  // Unlock logic: Show unblurred content if:
  // 1. User is authenticated, OR
  // 2. This is one of the first 5 free messages (messageIndex < 5)
  const shouldShowUnblurred = isAuthenticated || messageIndex < 5;

  const fullContent =
    message.detailedContent && message.detailedContent !== message.content
      ? `${message.content}\n\n${message.detailedContent}`
      : message.content;

  // Single typing effect on full content — no need to split text
  const { displayedText } = useTypingEffect(fullContent, isLatest, { speed: 15 });
  const finalContent = isLatest ? displayedText : fullContent;

  // Generate quick reply suggestions based on content
  const quickReplySuggestions = shouldShowUnblurred && !isLatest
    ? generateQuickReplies(fullContent)
    : [];

  // Load existing rating when component mounts
  useEffect(() => {
    const loadExistingRating = async () => {
      // Only load if message has valid UUID from database
      if (!hasValidMessageId || !sessionId || sessionId === 'no-session') {
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
  }, [message.id, sessionId, hasValidMessageId]);

  // Handle quick rating (like/dislike)
  const handleRating = async (ratingType: 'like' | 'dislike') => {
    console.log('[Rating] Starting rating submission:', { messageId: message.id, sessionId, ratingType });

    // Check if message has valid UUID from database
    if (!hasValidMessageId) {
      console.error('[Rating] Message not yet saved to database. ID:', message.id);
      toast.error('Vui lòng đợi tin nhắn được lưu trước khi đánh giá');
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

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      setIsCopied(true);
      toast.success('Đã sao chép câu trả lời!');
      setTimeout(() => { setIsCopied(false); }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Không thể sao chép');
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

      {/* Content block: full content, CSS blur for locked users */}
      <div className="text-slate-800 leading-relaxed">
        <div className={`space-y-1.5 ${!shouldShowUnblurred ? 'max-h-52 overflow-hidden' : ''}`}>
          {renderMarkdown(finalContent)}
          {isLatest && finalContent.length < fullContent.length && (
            <span className="inline-block w-1 h-4 bg-cyan-600 ml-0.5 animate-pulse" />
          )}
        </div>

        {/* Gradient fade + login button for locked users — appears AFTER content, never inside */}
        {!shouldShowUnblurred && (
          <div className="relative">
            <div className="absolute -top-20 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            <div className="pt-2 pb-1 flex items-center justify-center border-t border-slate-100 mt-1">
              <Button
                onClick={onUnlockClick}
                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập để đọc toàn bộ câu trả lời
              </Button>
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">Câu trả lời này có hữu ích không?</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={userRating === 'like' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRating('like')}
                  disabled={isSubmittingRating || !hasValidMessageId}
                  className={`transition-all ${
                    userRating === 'like'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                  }`}
                  title={!hasValidMessageId ? 'Đang lưu tin nhắn...' : ''}
                >
                  <ThumbsUp className="w-4 h-4 mr-1.5" />
                  Hữu ích
                </Button>
                <Button
                  variant={userRating === 'dislike' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRating('dislike')}
                  disabled={isSubmittingRating || !hasValidMessageId}
                  className={`transition-all ${
                    userRating === 'dislike'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                  }`}
                  title={!hasValidMessageId ? 'Đang lưu tin nhắn...' : ''}
                >
                  <ThumbsDown className="w-4 h-4 mr-1.5" />
                  Chưa hữu ích
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className={`transition-all ${
                    isCopied
                      ? 'text-green-700 border-green-300 bg-green-50'
                      : 'text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" />
                      Sao chép
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFeedbackDialog(true)}
                  disabled={!hasValidMessageId}
                  className="text-cyan-700 border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                  title={!hasValidMessageId ? 'Đang lưu tin nhắn...' : ''}
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Phản hồi chi tiết
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reply Suggestions */}
      {quickReplySuggestions.length > 0 && onQuickReply && (
        <QuickReplyButtons
          suggestions={quickReplySuggestions}
          onSelect={onQuickReply}
          className="mt-4"
        />
      )}


      {/* Feedback Dialog - Only render if message has valid UUID */}
      {hasValidMessageId && (
        <FeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          messageId={message.id!}
          sessionId={sessionId}
          rating={userRating ? (userRating === 'like' ? 'positive' : 'negative') : undefined}
        />
      )}
    </div>
  );
}
