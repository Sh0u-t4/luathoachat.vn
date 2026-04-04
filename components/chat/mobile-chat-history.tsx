'use client';

import { useState, useRef, useMemo } from 'react';
import { MessageSquare, Plus, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from './chat-context';
import { useLanguage } from '@/lib/i18n/context';
import { useMobile } from '@/lib/mobile/context';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

interface MobileChatHistoryProps {
  onSessionSelect?: () => void;
}

interface SessionGroup {
  session_id: string;
  first_message: string;
  created_at: string;
  questionCount: number;
}

/**
 * Mobile-optimized chat history với pull-to-refresh
 */
export function MobileChatHistory({ onSessionSelect }: MobileChatHistoryProps) {
  const { chatSessions, loadChatHistory, isAuthenticated, clearMessages } = useChat();
  const { t, language } = useLanguage();
  const { shouldUseMobileUI } = useMobile();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Get date-fns locale
  const dateLocale = language === 'vi' ? vi : enUS;

  // Group chatSessions by session_id
  const groupedSessions = useMemo<SessionGroup[]>(() => {
    const map = new Map<string, SessionGroup>();

    for (const s of chatSessions) {
      const existing = map.get(s.session_id);
      if (existing) {
        existing.questionCount += 1;
        if (new Date(s.created_at) < new Date(existing.created_at)) {
          existing.created_at = s.created_at;
          existing.first_message = s.first_message;
        }
      } else {
        map.set(s.session_id, {
          session_id: s.session_id,
          first_message: s.first_message,
          created_at: s.created_at,
          questionCount: 1,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [chatSessions]);

  // Pull-to-refresh
  const {
    pullDistance,
    pullProgress,
    isRefreshing,
    isPulling,
    shouldTriggerRefresh,
  } = usePullToRefresh(containerRef, {
    threshold: 80,
    onRefresh: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      hapticFeedback(HapticPatterns.success);
    },
  });

  const handleLoadSession = async (sessionId: string) => {
    hapticFeedback(HapticPatterns.light);
    setLoadingSession(sessionId);
    setSelectedSession(sessionId);

    try {
      clearMessages();
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadChatHistory(sessionId);
      onSessionSelect?.();

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chat:history-loaded'));
      }, 400);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoadingSession(null);
    }
  };

  const handleNewChat = () => {
    hapticFeedback(HapticPatterns.light);
    setSelectedSession(null);
    clearMessages();
    onSessionSelect?.();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-600 mb-2">Đăng nhập để xem lịch sử chat</p>
        <p className="text-sm text-slate-500">
          Lưu trữ và truy cập lại các cuộc trò chuyện của bạn
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto smooth-scroll-ios">
      {/* Pull-to-Refresh Indicator */}
      {shouldUseMobileUI && (isPulling || isRefreshing) && (
        <div
          className="pull-to-refresh"
          style={{
            height: `${pullDistance}px`,
            opacity: pullProgress,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
          ) : (
            <div className="text-sm text-slate-500">
              {shouldTriggerRefresh ? 'Thả để làm mới' : 'Kéo xuống để làm mới'}
            </div>
          )}
        </div>
      )}

      {/* New Chat Button */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <Button
          onClick={handleNewChat}
          className="w-full mobile-button bg-cyan-600 hover:bg-cyan-700 text-white touch-feedback"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t.chat.newChatButton}
        </Button>
        <p className="text-xs text-slate-500 mt-2 text-center">
          {groupedSessions.length} {t.chat.historyCount}
        </p>
      </div>

      {/* Chat Sessions List — Grouped */}
      <div className="p-3 space-y-2">
        {groupedSessions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{t.chat.emptyHistory}</p>
          </div>
        ) : (
          groupedSessions.map((group) => {
            const isLoading = loadingSession === group.session_id;
            const isSelected = selectedSession === group.session_id;

            return (
              <button
                key={group.session_id}
                onClick={() => handleLoadSession(group.session_id)}
                disabled={isLoading}
                className={`
                  w-full text-left p-4 rounded-xl border
                  transition-all touch-feedback
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${
                    isSelected
                      ? 'bg-cyan-50 border-cyan-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-md'
                  }
                  ${shouldUseMobileUI ? 'mobile-card' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-1.5">
                      {group.first_message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-medium">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {group.questionCount} câu hỏi
                      </span>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(group.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </div>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-cyan-500 animate-spin flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
