'use client';

import { useState } from 'react';
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

export function ChatHistorySidebar() {
  const { chatSessions, loadChatHistory, isAuthenticated, clearMessages, deleteSession, removeMessagePair, activeSessionId } = useChat();
  const { user } = useAuth();
  const { openChat } = useChatUI();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState<string | null>(null);

  // Get date-fns locale based on current language
  const dateLocale = language === 'vi' ? vi : enUS;

  if (!isAuthenticated) {
    return null;
  }

  const handleLoadSession = async (sessionId: string, messageId: string) => {
    setLoadingSession(sessionId);
    setSelectedSession(sessionId);

    try {
      clearMessages();
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadChatHistory(sessionId);

      // Open the chat window first, then dispatch scroll-to-top event
      // after the window's CSS transition (300ms) + React render have completed
      openChat();
      setIsOpen(false);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chat:history-loaded', {
          detail: { messageId },
        }));
      }, 400); // 300ms for CSS open transition + 100ms render buffer
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

  const handleDeleteSession = (e: React.MouseEvent, messageId: string, sessionId: string, firstMessage: string) => {
    e.stopPropagation();
    deleteSession(messageId);
    toast.success(`Đã ẩn cuộc trò chuyện`, {
      description: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
    });

    // If this session is currently displayed, remove just the deleted Q&A pair
    if (sessionId === activeSessionId || selectedSession === sessionId) {
      removeMessagePair(messageId);
    }
  };

  const handleRestoreAll = () => {
    if (typeof window !== 'undefined') {
      // Clear legacy shared key
      localStorage.removeItem('hidden_chat_message_ids');
      // Clear new user-scoped key
      if (user?.id) {
        localStorage.removeItem(`hidden_chats_${user.id}`);
      }
    }
    window.location.reload();
  };

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
        {t.chat.historyButton} ({chatSessions.length})
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
                  {chatSessions.length} {t.chat.historyCount}
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
                {chatSessions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      {t.chat.emptyHistory}
                    </p>
                  </div>
                ) : (
                  chatSessions.map((session) => {
                    const isLoading = loadingSession === session.session_id;
                    const isSelected = selectedSession === session.session_id;

                    return (
                      <div
                        key={session.message_id}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleLoadSession(session.session_id, session.message_id)}
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
                              <Loader2 className="w-4 h-4 text-cyan-500 animate-spin flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Delete button — pure CSS group-hover, always rendered */}
                        {!isLoading && (
                          <button
                            onClick={(e) => handleDeleteSession(e, session.message_id, session.session_id, session.first_message)}
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
