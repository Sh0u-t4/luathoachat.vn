'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, LogIn, Lock, Search, BookOpen, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useChat } from './chat-context';
import { AssistantMessage } from './assistant-message';
import { EmailGateModal } from './email-gate-modal';
import { LoginGateModal } from './login-gate-modal';
import { OfflineBanner } from './offline-banner';
import { useOffline } from '@/hooks/use-offline';
import { useFAQCache } from '@/hooks/use-faq-cache';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ChatMessage } from '@/types';

export function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const wasCleared = useRef(false);
  const router = useRouter();

  // i18n
  const { t } = useLanguage();

  // Offline detection and FAQ cache
  const isOffline = useOffline();
  const { faqs, searchFAQ, isLoading: isFAQLoading } = useFAQCache();

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
    sessionId,
  } = useChat();

  // Track latest assistant message ID để apply typing effect
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null);

  // Track loading stage for dynamic typing indicator
  const [loadingStage, setLoadingStage] = useState(0);

  // Cập nhật latestAssistantId khi có message mới
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      setLatestAssistantId(lastMessage.id);
    }
  }, [messages]);

  // Cycle through loading stages while typing
  useEffect(() => {
    if (!isTyping) {
      setLoadingStage(0);
      return;
    }

    // Start cycling through stages
    const interval = setInterval(() => {
      setLoadingStage(prev => (prev + 1) % 3);
    }, 10000); // Change stage every 10 seconds

    return () => clearInterval(interval);
  }, [isTyping]);

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

    // If offline, try to answer from FAQ cache
    if (isOffline && !isFAQLoading) {
      const faqMatch = searchFAQ(query);

      if (faqMatch) {
        // Create offline response from FAQ
        const offlineMessage: ChatMessage = {
          id: `offline-${Date.now()}`,
          role: 'assistant',
          content: faqMatch.answer,
          citations: faqMatch.citations || [],
          timestamp: new Date(),
        };

        // Manually add messages (simulate chat)
        // Note: This requires exposing an addMessage method from chat-context
        // For now, we'll still use sendMessage but it should handle offline gracefully
        await sendMessage(query);
        return;
      }

      // No FAQ match found
      const noMatchMessage: ChatMessage = {
        id: `offline-nomatch-${Date.now()}`,
        role: 'assistant',
        content:
          'Xin lỗi, tôi không tìm thấy câu trả lời trong bộ nhớ cache offline. Vui lòng kết nối Internet để sử dụng đầy đủ tính năng tư vấn pháp lý AI.',
        citations: [],
        timestamp: new Date(),
      };

      // Same as above - need to add to messages
      // For now, fall through to normal sendMessage
    }

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
      <Card
        id="chat-interface"
        className="w-full max-w-4xl mx-auto overflow-hidden border-0 shadow-xl bg-white/95 backdrop-blur"
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">{t.chat.title}</h2>
              <p className="text-slate-400 text-sm">{t.chat.subtitle}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isOffline ? 'bg-amber-400' : 'bg-green-400'}`} />
              <span className={`text-sm ${isOffline ? 'text-amber-400' : 'text-green-400'}`}>
                {isOffline ? t.chat.offline : t.chat.online}
              </span>
            </div>
          </div>
        </div>

        <div
          ref={chatContainerRef}
          className="h-[400px] md:h-[500px] overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white scroll-smooth"
        >
          {/* Offline Banner */}
          <OfflineBanner isVisible={isOffline} cachedFAQCount={faqs.length} />
          {messages.length === 0 && !isTyping && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {t.chat.emptyTitle}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {t.chat.emptyDescription}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[t.chat.suggestion1, t.chat.suggestion2, t.chat.suggestion3].map(
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
                      sessionId={sessionId || 'no-session'}
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
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm min-w-[240px]">
                <div className="flex items-center gap-3">
                  {loadingStage === 0 && (
                    <>
                      <Search className="w-4 h-4 text-cyan-500 animate-pulse" />
                      <span className="text-sm text-slate-600 animate-fade-in">{t.chat.loadingStage1}</span>
                    </>
                  )}
                  {loadingStage === 1 && (
                    <>
                      <BookOpen className="w-4 h-4 text-cyan-600 animate-pulse" />
                      <span className="text-sm text-slate-600 animate-fade-in">{t.chat.loadingStage2}</span>
                    </>
                  )}
                  {loadingStage === 2 && (
                    <>
                      <Zap className="w-4 h-4 text-cyan-700 animate-pulse" />
                      <span className="text-sm text-slate-600 animate-fade-in">{t.chat.loadingStage3}</span>
                    </>
                  )}
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
              placeholder={t.chat.inputPlaceholder}
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
          <div className="text-xs text-slate-400 mt-2 text-center space-y-1">
            <p>{t.chat.disclaimer1}</p>
            <p>{t.chat.disclaimer2}</p>
          </div>
        </form>
      </Card>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-600" />
              {t.chat.loginPromptTitle}
            </DialogTitle>
            <DialogDescription className="pt-4">
              {t.chat.loginPromptDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleLoginRedirect}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {t.chat.loginButton}
            </Button>

            <Button
              onClick={handleRegisterRedirect}
              variant="outline"
              className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
              size="lg"
            >
              {t.chat.registerButton}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-slate-500 text-center">
              {t.chat.freeAccountIncludes}
            </p>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                {t.chat.benefit1}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                {t.chat.benefit2}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                {t.chat.benefit3}
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
