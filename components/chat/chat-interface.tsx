'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, LogIn, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useChat } from './chat-context';
import { AssistantMessage } from './assistant-message';
import { EmailGateModal } from './email-gate-modal';
import { LoginGateModal } from './login-gate-modal';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const wasCleared = useRef(false);
  const router = useRouter();

  const {
    messages,
    isTyping,
    isAuthenticated,
    sendMessage,
    questionCount,
    emailCollected,
    guestEmail,
    showEmailGate,
    showLoginGate,
    setShowEmailGate,
    setShowLoginGate,
    saveGuestEmail,
    currentQuery,
    clearCurrentQuery,
  } = useChat();

  // Track latest assistant message ID để apply typing effect
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null);

  // Cập nhật latestAssistantId khi có message mới
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      setLatestAssistantId(lastMessage.id);
    }
  }, [messages]);

  // Log messages changes để debug
  useEffect(() => {
    console.log('💬 ChatInterface: messages updated', {
      count: messages.length,
      messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) }))
    });
  }, [messages]);

  // Detect khi messages được clear (load history)
  useEffect(() => {
    if (messages.length === 0 && prevMessagesLengthRef.current > 0) {
      wasCleared.current = true;
      console.log('🔄 Messages cleared, marking as wasCleared');
    }
  }, [messages.length]);

  // Auto-scroll logic
  useEffect(() => {
    const hasNewMessage = messages.length > prevMessagesLengthRef.current;
    const isLoadingHistory = wasCleared.current && messages.length > 0;

    if (hasNewMessage || isTyping) {
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          // Nếu đang load history, scroll lên top để xem từ đầu
          // Nếu là message mới khi chat, scroll xuống bottom
          if (isLoadingHistory) {
            chatContainerRef.current.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
            wasCleared.current = false;
          } else {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }
      }, 100);

      prevMessagesLengthRef.current = messages.length;

      return () => clearTimeout(timer);
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Save query and clear input IMMEDIATELY before async operation
    const query = inputValue.trim();
    setInputValue('');

    await sendMessage(query);
  };

  const handleUnlockClick = () => {
    setShowLoginPrompt(true);
  };

  const handleLoginRedirect = () => {
    router.push('/dang-nhap');
  };

  const handleRegisterRedirect = () => {
    router.push('/dang-ky');
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto overflow-hidden border-0 shadow-xl bg-white/95 backdrop-blur">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Trợ lý AI Luật Hóa Chất</h2>
              <p className="text-slate-400 text-sm">Luật Hóa chất 69/2025 & Nghị định 24, 25, 26/2026</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">Trực tuyến</span>
            </div>
          </div>
        </div>

        <div
          ref={chatContainerRef}
          className="h-[400px] md:h-[500px] overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white scroll-smooth"
        >
          {messages.length === 0 && !isTyping && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Hỏi bất kỳ điều gì về Luật Hóa chất
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Ví dụ: &quot;Axit HCl cần giấy phép gì?&quot; hoặc &quot;Mức phạt lưu trữ hóa chất sai quy định?&quot;
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Axit HCl cần giấy phép gì?', 'Methanol là tiền chất?', 'Mức phạt vi phạm PCCC?'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInputValue(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-full hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {messages.length > 0 && messages.map((message, index) => {
            // Calculate assistant message index (0-based count of assistant messages)
            // Assistant messages are typically at odd indices (1, 3, 5, 7, ...)
            const assistantMessageIndex = message.role === 'assistant'
              ? Math.floor(index / 2)
              : 0;

            return (
              <div
                key={`${message.id}-${index}`}
                className={`flex gap-3 animate-slide-up ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-cyan-600" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm px-4 py-3'
                      : 'bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <AssistantMessage
                      message={message}
                      isLatest={message.id === latestAssistantId}
                      isAuthenticated={isAuthenticated}
                      onUnlockClick={handleUnlockClick}
                      messageIndex={assistantMessageIndex}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="typing-indicator flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-200 bg-white"
        >
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi về luật hóa chất..."
              className="flex-1 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Thông tin chỉ mang tính tham khảo. Liên hệ chuyên gia để được tư vấn cụ thể.
          </p>
        </form>
      </Card>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-600" />
              Đăng nhập để xem chi tiết
            </DialogTitle>
            <DialogDescription className="pt-4">
              Để xem chi tiết trích dẫn luật, mức phạt và tải các văn bản pháp luật, vui lòng đăng nhập hoặc tạo tài khoản miễn phí.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleLoginRedirect}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập
            </Button>

            <Button
              onClick={handleRegisterRedirect}
              variant="outline"
              className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
              size="lg"
            >
              Tạo tài khoản miễn phí
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-slate-500 text-center">
              Tài khoản miễn phí bao gồm:
            </p>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                Xem chi tiết trích dẫn luật đầy đủ
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                Tải văn bản Nghị định 24, 25, 26/2026
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                Lưu lịch sử tra cứu
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Gate Modal - Appears before question 2 */}
      <EmailGateModal
        open={showEmailGate}
        onClose={() => {
          setShowEmailGate(false);
          clearCurrentQuery();
        }}
        onEmailSubmit={saveGuestEmail}
        currentQuestion={currentQuery}
      />

      {/* Login Gate Modal - Appears after question 5 */}
      <LoginGateModal
        open={showLoginGate}
        onClose={() => {
          setShowLoginGate(false);
          clearCurrentQuery();
        }}
        email={guestEmail}
        questionCount={questionCount}
      />
    </>
  );
}
