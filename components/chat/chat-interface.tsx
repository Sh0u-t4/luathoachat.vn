'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, LogIn, Lock, Search, BookOpen, Zap, ArrowDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from './chat-context';
import { AssistantMessage } from './assistant-message';
import { EmailGateModal } from './email-gate-modal';
import { LoginGateModal } from './login-gate-modal';
import { OfflineBanner } from './offline-banner';
import { MobileChatInput } from './mobile-chat-input';
import { MobileChatHeader } from './mobile-chat-header';
import { MobileBottomDrawer } from './mobile-bottom-drawer';
import { MobileChatHistory } from './mobile-chat-history';
import { MobileMessageCard } from './mobile-message-card';
import { MobileDisclaimer } from './mobile-disclaimer';
import { DisclaimerToast } from './disclaimer-toast';
import { useOffline } from '@/hooks/use-offline';
import { useFAQCache } from '@/hooks/use-faq-cache';
import { useFirstTimeDisclaimer } from '@/hooks/use-first-time-disclaimer';
import { useKeyboardState } from '@/hooks/use-keyboard-state';
import { useScrollLock } from '@/hooks/use-scroll-lock';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { useMobile } from '@/lib/mobile/context';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ChatMessage } from '@/types';

interface ChatInterfaceProps {
  initialMessage?: string;
  hideDisclaimer?: boolean;
  hideHeader?: boolean;
  isFullscreen?: boolean;  // Controls table rendering mode
}

export function ChatInterface({ initialMessage, hideDisclaimer = false, hideHeader = false, isFullscreen = false }: ChatInterfaceProps = {}) {
  const [inputValue, setInputValue] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const wasCleared = useRef(false);
  const suppressAutoScrollRef = useRef(false); // Suppress ResizeObserver after history load
  const router = useRouter();

  // Smart Auto-Scroll States
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAnyTyping, setIsAnyTyping] = useState(false);
  const autoScrollEnabledRef = useRef(true);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // i18n
  const { t } = useLanguage();

  // Mobile detection
  const { shouldUseMobileUI } = useMobile();

  // Keyboard state detection for mobile
  const keyboardState = useKeyboardState();

  // Lock body scroll when keyboard is open on mobile
  useScrollLock({
    enabled: shouldUseMobileUI && keyboardState.isKeyboardOpen,
    reserveScrollBarGap: false,
    allowTouchMove: (target) => {
      // Allow touch move in chat container
      const chatContainer = chatContainerRef.current;
      if (!chatContainer || !target) return false;
      return chatContainer.contains(target as Node);
    },
  });

  // Fix hydration: Only render mobile UI after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Offline detection and FAQ cache
  const isOffline = useOffline();
  const { faqs, searchFAQ, isLoading: isFAQLoading } = useFAQCache();

  // First-time disclaimer
  const { shouldShowDisclaimer, isReady, markDisclaimerAsSeen } = useFirstTimeDisclaimer();

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
    chatSessions,
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

  // Cycle through loading stages while typing — 3s per stage for responsive feedback
  useEffect(() => {
    if (!isTyping) {
      setLoadingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStage(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isTyping]);

  // Auto-submit initialMessage from Smart Search Bar
  const initialMessageSent = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialMessageSent.current && isMounted) {
      initialMessageSent.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, isMounted, sendMessage]);

  // Show first-time disclaimer toast
  useEffect(() => {
    if (!isMounted || !isReady || !shouldShowDisclaimer) return;

    // Wait 1.5s for UI to settle before showing toast
    const timer = setTimeout(() => {
      // Only show if user hasn't started chatting yet
      if (messages.length === 0) {
        toast(
          <DisclaimerToast
            disclaimer={t.chat.disclaimer}
          />,
          {
            duration: 6000,
            onDismiss: markDisclaimerAsSeen,
            onAutoClose: markDisclaimerAsSeen,
          }
        );
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isMounted, isReady, shouldShowDisclaimer, messages.length, t.chat.disclaimer, markDisclaimerAsSeen]);

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

  // Check if user is near bottom (within 150px)
  const checkIfNearBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return false;

    const threshold = 150;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  // Scroll to bottom function with mobile optimization
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Add offset for mobile to keep disclaimer visible
    const offset = shouldUseMobileUI ? 200 : 0;

    container.scrollTo({
      top: container.scrollHeight - offset,
      behavior,
    });
  }, [shouldUseMobileUI]);

  // Handle scroll events to track position
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = checkIfNearBottom();
      setIsNearBottom(nearBottom);
      setShowScrollButton(!nearBottom);
      autoScrollEnabledRef.current = nearBottom;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfNearBottom]);

  // Track typing state - simplified to only track loading state
  // Tracking typing effect state causes infinite loop due to callback recreation
  useEffect(() => {
    setIsAnyTyping(isTyping);
  }, [isTyping]);

  // Smart Auto-scroll: Scroll when new message arrives OR content changes (typing effect)
  useEffect(() => {
    const hasNewMessage = messages.length > prevMessagesLengthRef.current;

    // Skip scroll logic when history load is in progress (handled by event listener)
    if (wasCleared.current && messages.length > 0) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if ((hasNewMessage || isTyping) && autoScrollEnabledRef.current) {
      const timer = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
          scrollToBottom('smooth');
        }
      }, 80);
      prevMessagesLengthRef.current = messages.length;
      return () => clearTimeout(timer);
    } else if (hasNewMessage) {
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages, isTyping, scrollToBottom]);

  // ResizeObserver: Auto-scroll when content height changes (typing effect)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      // Suppressed after history load to avoid overriding scroll-to-top
      if (suppressAutoScrollRef.current) return;
      if (autoScrollEnabledRef.current && isAnyTyping) {
        scrollToBottom('auto');
      }
    });

    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [isAnyTyping, scrollToBottom]);

  // Listen for history-loaded event to reliably scroll to top
  // This avoids the race condition where ResizeObserver fires after scroll-to-top
  useEffect(() => {
    const handleHistoryLoaded = () => {
      const container = chatContainerRef.current;
      if (!container) return;

      // Suppress ResizeObserver auto-scroll temporarily
      suppressAutoScrollRef.current = true;
      autoScrollEnabledRef.current = false;

      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
          wasCleared.current = false;

          // Re-enable after 800ms (enough time for content to fully render)
          setTimeout(() => {
            suppressAutoScrollRef.current = false;
            autoScrollEnabledRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          }, 800);
        });
      });
    };

    window.addEventListener('chat:history-loaded', handleHistoryLoaded);
    return () => window.removeEventListener('chat:history-loaded', handleHistoryLoaded);
  }, []);

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
      {/* Mobile Layout Wrapper with Dynamic Viewport Height */}
      {isMounted && shouldUseMobileUI ? (
        <div
          className="mobile-viewport-container flex flex-col"
          style={{
            height: '100dvh',
            maxHeight: '-webkit-fill-available',
          }}
        >
          {/* Mobile Chat Header - Fixed */}
          {!hideHeader && (
            <MobileChatHeader
              onHistoryClick={() => setShowMobileHistory(true)}
              chatSessionCount={chatSessions.length}
            />
          )}

          {/* Chat Content - Flexible */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white">
            {/* Chat Messages Container - Scrollable */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mobile-chat-container p-3 space-y-3"
              style={{
                paddingBottom: keyboardState.isKeyboardOpen ? '20px' : '80px',
              }}
              suppressHydrationWarning
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
                const assistantMessageIndex = message.role === 'assistant'
                  ? Math.floor(index / 2)
                  : 0;

                // Ẩn card khi assistant message chưa có nội dung (đang chờ token đầu)
                if (message.role === 'assistant' && !message.content && message.id === latestAssistantId) return null;

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
                          isFullscreen={isFullscreen}
                          onQuickReply={(reply) => {
                            setInputValue(reply);
                            inputRef.current?.focus();
                          }}
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

            {/* Scroll to Bottom Button - Floating at bottom-right */}
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-20 right-6 z-20 w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 animate-fade-in"
                aria-label="Scroll to bottom"
                suppressHydrationWarning
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* AI Typing Indicator - Above input */}
          {isAnyTyping && messages.length > 0 && (
            <div className="px-4 py-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">{t.chat.aiTyping}</span>
              </div>
            </div>
          )}

          {/* Mobile Chat Input with Disclaimer - Fixed at bottom */}
          <div className="flex-shrink-0">
            <MobileChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              disabled={isTyping}
              placeholder={t.chat.inputPlaceholder}
              keyboardState={keyboardState}
              disclaimer={hideDisclaimer ? undefined : t.chat.disclaimer}
            />
          </div>
        </div>
      ) : (
        <div
          id="chat-interface"
          className={hideHeader
            ? "flex flex-col h-full w-full overflow-hidden bg-white"
            : "w-full max-w-4xl mx-auto overflow-hidden border-0 shadow-xl bg-white/95 backdrop-blur rounded-lg"
          }
          suppressHydrationWarning
        >
          {/* Desktop Header */}
          {!hideHeader && (
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
          )}

          <div className={hideHeader ? "flex-1 relative overflow-hidden" : "relative"}>
            <div
              ref={chatContainerRef}
              className={hideHeader
                ? "h-full overflow-y-auto scroll-smooth p-4 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-slate-50 to-white"
                : "h-[400px] md:h-[500px] overflow-y-auto scroll-smooth p-4 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-slate-50 to-white"
              }
              suppressHydrationWarning
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
                const assistantMessageIndex = message.role === 'assistant'
                  ? Math.floor(index / 2)
                  : 0;

                // Ẩn card khi assistant message chưa có nội dung (đang chờ token đầu)
                if (message.role === 'assistant' && !message.content && message.id === latestAssistantId) return null;

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
                          isFullscreen={isFullscreen}
                          onQuickReply={(reply) => {
                            setInputValue(reply);
                            inputRef.current?.focus();
                          }}
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

            {/* Scroll to Bottom Button - Floating at bottom-right */}
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 animate-fade-in"
                aria-label="Scroll to bottom"
                suppressHydrationWarning
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* AI Typing Indicator - Above input */}
          {isAnyTyping && messages.length > 0 && (
            <div className="px-6 py-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700">
              <div className="flex items-center justify-center gap-2 max-w-5xl mx-auto">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">{t.chat.aiTyping}</span>
              </div>
            </div>
          )}

          {/* Desktop Input Form - Redesigned to match search bar style */}
          <form
            onSubmit={handleSubmit}
            role="search"
            aria-label="Send message"
            className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          >
            <div className="flex gap-3 items-center max-w-5xl mx-auto">
              {/* Large Dark Input Field */}
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t.chat.inputPlaceholderChat}
                  aria-label="Message input"
                  aria-describedby="chat-input-hint"
                  className="h-14 px-6 text-base bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  disabled={isTyping}
                />
              </div>

              {/* Gradient Submit Button - "Tư vấn ngay" style */}
              <Button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send message"
                className="h-14 px-8 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/50 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">{t.chat.sendButton}</span>
                <span className="sm:hidden">{t.chat.sendButtonMobile}</span>
              </Button>
            </div>
            {!hideDisclaimer && (
              <p id="chat-input-hint" className="text-xs text-slate-400 mt-3 text-center max-w-5xl mx-auto">
                {t.chat.disclaimer}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Mobile Bottom Drawer for Chat History */}
      {isMounted && shouldUseMobileUI && (
        <MobileBottomDrawer
          isOpen={showMobileHistory}
          onClose={() => setShowMobileHistory(false)}
          title={t.chat.historyTitle}
          height="full"
        >
          <MobileChatHistory onSessionSelect={() => setShowMobileHistory(false)} />
        </MobileBottomDrawer>
      )}

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
