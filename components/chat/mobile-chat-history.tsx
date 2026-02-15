'use client';

import { useState, useRef } from 'react';
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
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In production, this would reload chat sessions from server
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
          {chatSessions.length} {t.chat.historyCount}
        </p>
      </div>

      {/* Chat Sessions List */}
      <div className="p-3 space-y-2">
        {chatSessions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{t.chat.emptyHistory}</p>
          </div>
        ) : (
          chatSessions.map((session) => {
            const isLoading = loadingSession === session.session_id;
            const isSelected = selectedSession === session.session_id;

            return (
              <button
                key={session.message_id}
                onClick={() => handleLoadSession(session.session_id)}
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
                      {session.first_message}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(session.created_at), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
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
