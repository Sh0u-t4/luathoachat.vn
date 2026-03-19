'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, ThumbsUp, ThumbsDown, MessageSquare, Copy, Check } from 'lucide-react';
import { useTypingEffect } from '@/hooks/use-typing-effect';
import { LegalCitation } from './legal-citation';
import { FeedbackDialog } from './feedback-dialog';
import { QuickReplyButtons, generateQuickReplies } from './quick-reply-buttons';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n/context';
import type { ChatMessage } from '@/types';

interface AssistantMessageProps {
  message: ChatMessage;
  isLatest: boolean;
  isAuthenticated: boolean;
  onUnlockClick: () => void;
  messageIndex: number;
  sessionId: string;
  isFullscreen?: boolean;  // When true, tables render at full width without column limit
  onQuickReply?: (reply: string) => void;
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
  isFullscreen = false,
  onQuickReply,
}: AssistantMessageProps) {
  const { t } = useLanguage();
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
  // Tách nội dung thành 2 phần: public (câu đầu đủ ý) và locked (phần còn lại)
  // Tách nội dung thành 2 phần: public (câu đầu đủ ý) và locked (phần còn lại)
  // Luôn hoàn thành câu đầu tiên trước khi cắt
  const splitContent = (content: string) => {
    const maxPublic = Math.floor(content.length * 0.55);
    let lastValidCut = -1;

    // Duyệt ký tự tìm điểm kết thúc câu hợp lệ:
    // - Dấu . sau chữ KHÔNG phải chữ số → hợp lệ
    // - Dấu . sau chữ số ("1.", "25/2026.", "Nghị định 100.") → BỎ QUA
    // - Dấu ! và ? luôn hợp lệ
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      const isEndPunct = ch === '!' || ch === '?';
      const isDot = ch === '.';

      if (!isEndPunct && !isDot) continue;

      // Bỏ qua dấu . ngay sau chữ số (số thứ tự, số nghị đinh, năm)
      if (isDot) {
        const prevChar = i > 0 ? content[i - 1] : '';
        if (/\d/.test(prevChar)) continue;
      }

      // Phải được theo sau bởi khoảng trắng, newline hoặc end-of-string
      const nextChar = content[i + 1];
      if (nextChar !== undefined && nextChar !== ' ' && nextChar !== '\n' && nextChar !== '\r') continue;

      const cutAt = i + 1; // bao gồm cả dấu câu
      if (cutAt <= maxPublic) {
        lastValidCut = cutAt;
      } else {
        if (lastValidCut === -1) lastValidCut = cutAt;
        break;
      }
    }

    // Nếu không tìm được dấu câu hợp lệ → fallback cắt 30% thô
    if (lastValidCut === -1) {
      const rawSplit = Math.floor(content.length * 0.3);
      return {
        publicPart: content.substring(0, rawSplit),
        lockedPart: content.substring(rawSplit),
      };
    }

    return {
      publicPart: content.substring(0, lastValidCut).trim(),
      lockedPart: content.substring(lastValidCut).trim(),
    };
  };



  const fullContent =
    message.detailedContent && message.detailedContent !== message.content
      ? `${message.content}\n\n${message.detailedContent}`
      : message.content;

  const { publicPart, lockedPart } = splitContent(fullContent);

  // Typing effect disabled for streaming — chat-context updates content incrementally as tokens arrive
  // useTypingEffect would add a second animation layer on top of streaming (double-slow)
  const finalPublic = publicPart;
  const finalLocked = lockedPart;

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
      toast.error(t.chat.ratingError);
      return;
    }

    if (!sessionId || sessionId === 'no-session') {
      console.error('[Rating] Invalid session ID:', sessionId);
      toast.error(t.chat.ratingError);
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
      // Lấy toàn bộ nội dung (public + locked nếu đã unlock)
      const fullContent = shouldShowUnblurred
        ? message.content
        : publicPart;

      await navigator.clipboard.writeText(fullContent);
      setIsCopied(true);
      toast.success(t.chat.copiedToast);

      // Reset icon sau 2 giây
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error(t.common.error);
    }
  };

  /** 
   * Renders markdown content with smart table handling.
   * Narrow widget (isFullscreen=false): wide tables (>2 data cols) → compact bullet list.
   * Fullscreen: all tables render normally.
   */
  const renderMarkdownContent = (text: string) => {
    if (!text) return null;

    // Parse content into blocks: table blocks and text blocks
    const blocks: Array<{ type: 'table' | 'text'; content: string }> = [];
    const lines = text.split('\n');
    let currentText: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];

    const flushText = () => {
      if (currentText.length > 0) {
        blocks.push({ type: 'text', content: currentText.join('\n') });
        currentText = [];
      }
    };
    const flushTable = () => {
      if (tableLines.length > 0) {
        blocks.push({ type: 'table', content: tableLines.join('\n') });
        tableLines = [];
      }
    };

    for (const line of lines) {
      const isTableRow = /^\s*\|/.test(line);
      if (isTableRow) {
        if (!inTable) { flushText(); inTable = true; }
        tableLines.push(line);
      } else {
        if (inTable) { flushTable(); inTable = false; }
        currentText.push(line);
      }
    }
    if (inTable) flushTable(); else flushText();

    // Render inline: bold, source citations
    const renderInline = (s: string, key: number) => {
      const parts: React.ReactNode[] = [];
      let last = 0;
      const re = /(\*\*([^*]+)\*\*|\[(?:Nguồn|Source):[^\]]+\])/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(s)) !== null) {
        if (m.index > last) parts.push(s.slice(last, m.index));
        if (m[0].startsWith('**')) {
          parts.push(<strong key={`b${m.index}`}>{m[2]}</strong>);
        } else {
          parts.push(<span key={`src${m.index}`} className="text-xs text-cyan-700 font-medium italic">{m[0]}</span>);
        }
        last = m.index + m[0].length;
      }
      if (last < s.length) parts.push(s.slice(last));
      return <span key={key}>{parts}</span>;
    };

    // Render a table block — either as HTML table or bullet list
    const renderTable = (raw: string, blockIdx: number) => {
      const tableRowLines = raw.split('\n').filter(l => /^\s*\|/.test(l));
      if (tableRowLines.length < 2) return <pre key={blockIdx} className="text-sm">{raw}</pre>;

      // Parse rows (skip separator row |---|...)
      const dataRows = tableRowLines.filter(l => !/^\s*\|[-:|\s]+\|/.test(l));
      if (dataRows.length === 0) return null;

      const parseCells = (row: string) =>
        row.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);

      const headers = parseCells(dataRows[0]);
      const bodyRows = dataRows.slice(1);
      const dataCols = headers.length; // number of data columns

      // Narrow mode + wide table: convert to bullet list
      if (!isFullscreen && dataCols > 2) {
        return (
          <div key={blockIdx} className="space-y-2 my-2">
            {bodyRows.map((row, ri) => {
              const cells = parseCells(row);
              return (
                <div key={ri} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
                  {cells.map((cell, ci) => (
                    <div key={ci} className="flex gap-1.5 min-w-0">
                      {headers[ci] && (
                        <span className="font-semibold text-slate-600 shrink-0">{headers[ci]}:</span>
                      )}
                      <span className="text-slate-800 break-words">{cell}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      }

      // Normal table render (≤2 cols or fullscreen)
      return (
        <div key={blockIdx} className="overflow-x-auto my-3 rounded-lg border border-slate-200">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => {
                const cells = parseCells(row);
                return (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-slate-800 border-b border-slate-100 break-words max-w-[180px]">{cell}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    // Render a text block
    const renderTextBlock = (raw: string, blockIdx: number) => {
      const textLines = raw.split('\n');
      return (
        <div key={blockIdx} className="space-y-1">
          {textLines.map((line, li) => {
            if (line.trim() === '') return <br key={li} />;
            // Numbered list
            const numMatch = line.match(/^(\d+)\.\s+(.+)/);
            if (numMatch) return (
              <div key={li} className="flex gap-2">
                <span className="font-semibold text-slate-500 shrink-0 min-w-[1.2rem]">{numMatch[1]}.</span>
                <span>{renderInline(numMatch[2], li)}</span>
              </div>
            );
            // Bullet
            const bulletMatch = line.match(/^[-•*]\s+(.+)/);
            if (bulletMatch) return (
              <div key={li} className="flex gap-2">
                <span className="text-cyan-600 mt-0.5 shrink-0">•</span>
                <span>{renderInline(bulletMatch[1], li)}</span>
              </div>
            );
            // Heading (## or **text**)
            if (/^#{1,3}\s/.test(line)) {
              const heading = line.replace(/^#{1,3}\s/, '');
              return <p key={li} className="font-bold text-slate-800 mt-2">{renderInline(heading, li)}</p>;
            }
            return <p key={li}>{renderInline(line, li)}</p>;
          })}
        </div>
      );
    };

    return (
      <div className="space-y-2">
        {blocks.map((block, i) =>
          block.type === 'table'
            ? renderTable(block.content, i)
            : renderTextBlock(block.content, i)
        )}
      </div>
    );
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
        {/* Content: rendered markdown with smart table handling */}
        <div>
          {renderMarkdownContent(finalPublic)}
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
                className={`text-slate-700 ${
                  !shouldShowUnblurred ? 'blur-content' : ''
                }`}
              >
                {renderMarkdownContent(finalLocked)}
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
                    {t.auth.loginButton}
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">{t.chat.feedbackQuestion}</span>
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
                  {t.chat.helpful}
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
                  {t.chat.notHelpful}
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
                      {t.chat.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" />
                      {t.chat.copy}
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
                  {t.chat.detailedFeedback}
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
