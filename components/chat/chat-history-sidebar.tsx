'use client';

import { useState, useMemo } from 'react';
import { History, MessageSquare, Trash2, ChevronRight, Loader2, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from './chat-context';
import { useChatUI } from '@/lib/chat/chat-ui-context';
import { useLanguage } from '@/lib/i18n/context';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/context';

interface SessionGroup {
  session_id: string;
  first_message: string;
  created_at: string;
  questionCount: number;
  message_ids: string[];
}

export function ChatHistorySidebar() {
  const { chatSessions, loadChatHistory, isAuthenticated, clearMessages, deleteSessionGroup, activeSessionId } = useChat();
  const { user } = useAuth();
  const { openChat } = useChatUI();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState<string | null>(null);

  // Get date-fns locale based on current language
  const dateLocale = language === 'vi' ? vi : enUS;

  // Group chatSessions by session_id
  const groupedSessions = useMemo<SessionGroup[]>(() => {
    const map = new Map<string, SessionGroup>();

    for (const s of chatSessions) {
      const existing = map.get(s.session_id);
      if (existing) {
        existing.questionCount += 1;
        existing.message_ids.push(s.message_id);
        // Keep the earliest created_at
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
          message_ids: [s.message_id],
        });
      }
    }

    // Sort by most recent first
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [chatSessions]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLoadSession = async (sessionId: string) => {
    setLoadingSession(sessionId);
    setSelectedSession(sessionId);

    try {
      clearMessages();
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadChatHistory(sessionId);

      openChat();
      setIsOpen(false);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chat:history-loaded'));
      }, 400);
    } catch (error) {
      console.error('handleLoadSession ERROR:', error);
    } finally {
      setLoadingSession(null);
    }
  };

  const handleNewChat = () => {
    setSelectedSession(null);
    clearMessages();
    openChat();
    setIsOpen(false);

    setTimeout(() => {
      const chatInterface = document.getElementById('chat-interface');
      if (chatInterface) {
        chatInterface.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  const handleDeleteGroup = (e: React.MouseEvent, group: SessionGroup) => {
    e.stopPropagation();
    deleteSessionGroup(group.session_id);
    toast.success(`Đã ẩn cuộc trò chuyện`, {
      description: group.first_message.slice(0, 50) + (group.first_message.length > 50 ? '...' : ''),
    });

    if (selectedSession === group.session_id) {
      setSelectedSession(null);
    }
  };

  const handleRestoreAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hidden_chat_message_ids');
      if (user?.id) {
        localStorage.removeItem(`hidden_chats_${user.id}`);
      }
    }
    window.location.reload();
  };

  // Count total unique sessions for the toggle button
  const totalSessions = groupedSessions.length;

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 z-40 shadow-lg bg-white"
      >
        <History className="w-4 h-4 mr-2" />
        {t.chat.historyButton} ({totalSessions})
      </Button>

      {/* Sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Panel */}
          <Card className="fixed top-0 left-0 h-full w-80 z-50 shadow-2xl rounded-none border-r">
            <div className="p-4 border-b bg-gradient-to-r from-slate-900 to-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-semibold text-white">{t.chat.historyTitle}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  ✕
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">
                  {totalSessions} {t.chat.historyCount}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="text-xs bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-700 hover:text-white"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t.chat.newChatButton}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-130px)]">
              <div className="p-3 space-y-2">
                {groupedSessions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      {t.chat.emptyHistory}
                    </p>
                  </div>
                ) : (
                  groupedSessions.map((group) => {
                    const isLoading = loadingSession === group.session_id;
                    const isSelected = selectedSession === group.session_id;

                    return (
                      <div
                        key={group.session_id}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleLoadSession(group.session_id)}
                          disabled={isLoading}
                          className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md hover:border-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed pr-10 ${
                            isSelected
                              ? 'bg-cyan-50 border-cyan-400'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-1">
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
                              <Loader2 className="w-4 h-4 text-cyan-500 animate-spin flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Delete button — hover to show */}
                        {!isLoading && (
                          <button
                            onClick={(e) => handleDeleteGroup(e, group)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
                            title="Ẩn cuộc trò chuyện này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {t.chat.historyHint}
              </p>
              <button
                onClick={handleRestoreAll}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                title="Khôi phục tất cả cuộc trò chuyện đã ẩn"
              >
                <RotateCcw className="w-3 h-3" />
                Khôi phục
              </button>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
