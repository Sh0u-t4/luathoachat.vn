'use client';

import { useState } from 'react';
import { History, MessageSquare, Trash2, ChevronRight, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChat } from './chat-context';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function ChatHistorySidebar() {
  const { chatSessions, loadChatHistory, isAuthenticated, clearMessages } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState<string | null>(null);

  if (!isAuthenticated) {
    return null;
  }

  const handleLoadSession = async (sessionId: string) => {
    console.log('🔵 handleLoadSession START - sessionId:', sessionId);
    setLoadingSession(sessionId);
    setSelectedSession(sessionId);

    try {
      // Clear messages hiện tại trước khi load chat cũ
      console.log('🔵 Step 1: Clearing current messages...');
      clearMessages();

      // Thêm một chút delay để đảm bảo state được clear
      await new Promise(resolve => setTimeout(resolve, 100));

      // Load lại toàn bộ đoạn chat (câu hỏi + câu trả lời)
      console.log('🔵 Step 2: Loading chat history...');
      await loadChatHistory(sessionId);

      console.log('🔵 handleLoadSession SUCCESS - Chat history loaded');

      // Đóng sidebar
      setIsOpen(false);

      // Scroll đến chat box
      setTimeout(() => {
        const chatInterface = document.getElementById('chat-interface');
        if (chatInterface) {
          chatInterface.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } catch (error) {
      console.error('🔵 handleLoadSession ERROR:', error);
    } finally {
      setLoadingSession(null);
    }
  };

  const handleNewChat = () => {
    setSelectedSession(null);
    clearMessages();
    setIsOpen(false);

    // Scroll xuống phần chat
    setTimeout(() => {
      const chatInterface = document.getElementById('chat-interface');
      if (chatInterface) {
        chatInterface.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
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
        Lịch sử chat ({chatSessions.length})
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
                  <h2 className="font-semibold text-white">Lịch sử trò chuyện</h2>
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
                  {chatSessions.length} câu hỏi
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="text-xs bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-700 hover:text-white"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Chat mới
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-3 space-y-2">
                {chatSessions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      Chưa có lịch sử trò chuyện
                    </p>
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
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md hover:border-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed ${
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
                                locale: vi,
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
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t bg-slate-50">
              <p className="text-xs text-slate-500 text-center">
                💡 Click vào câu hỏi để xem lại đoạn chat
              </p>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
