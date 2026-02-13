'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ChatMessage, Citation } from '@/types';
import { supabase, getSessionToken } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/context';
import { toast } from 'sonner';

interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  hasUnlockedContent: boolean;
  currentQuery: string;
  isAuthenticated: boolean;
  questionCount: number;
  emailCollected: boolean;
  guestEmail: string | null;
  showEmailGate: boolean;
  showLoginGate: boolean;
  sessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  unlockContent: () => void;
  clearMessages: () => void;
  clearCurrentQuery: () => void;
  loadChatHistory: (sessionId?: string) => Promise<void>;
  chatSessions: Array<{ session_id: string; message_id: string; first_message: string; created_at: string }>;
  setShowEmailGate: (show: boolean) => void;
  setShowLoginGate: (show: boolean) => void;
  saveGuestEmail: (email: string, currentQuestion: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface EdgeFunctionResponse {
  summary: string;
  detailed: string;
  citations: Citation[];
  detected_chemicals: string[];
  response_time_ms: number;
}

async function callLegalAIEdgeFunction(query: string): Promise<EdgeFunctionResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/legal-ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Edge function error: ${response.statusText}`);
  }

  return await response.json();
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnlockedContent, setHasUnlockedContent] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [chatSessions, setChatSessions] = useState<Array<{ session_id: string; message_id: string; first_message: string; created_at: string }>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Freemium gate states
  const [questionCount, setQuestionCount] = useState(0);
  const [emailCollected, setEmailCollected] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);

  // Load freemium gate state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCount = localStorage.getItem('chatbot_question_count');
      const savedEmail = localStorage.getItem('chatbot_guest_email');
      const savedCollected = localStorage.getItem('chatbot_email_collected');

      if (savedCount) setQuestionCount(parseInt(savedCount, 10));
      if (savedEmail) setGuestEmail(savedEmail);
      if (savedCollected === 'true') setEmailCollected(true);
    }
  }, []);

  // Persist questionCount to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && questionCount > 0) {
      localStorage.setItem('chatbot_question_count', String(questionCount));
    }
  }, [questionCount]);

  // Persist emailCollected to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && emailCollected) {
      localStorage.setItem('chatbot_email_collected', 'true');
    }
  }, [emailCollected]);

  // Persist guestEmail to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && guestEmail) {
      localStorage.setItem('chatbot_guest_email', guestEmail);
    }
  }, [guestEmail]);

  // Listen to storage changes for cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatbot_question_count' && e.newValue) {
        setQuestionCount(parseInt(e.newValue, 10));
      } else if (e.key === 'chatbot_email_collected' && e.newValue) {
        setEmailCollected(e.newValue === 'true');
      } else if (e.key === 'chatbot_guest_email' && e.newValue) {
        setGuestEmail(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadUserSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, session_id, content, created_at')
        .eq('user_id', user.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(50); // Giới hạn 50 câu hỏi gần nhất

      if (error) throw error;

      // Mỗi user message là một item riêng biệt trong sidebar
      const sessions = data?.map((msg) => ({
        session_id: msg.session_id,
        message_id: msg.id,
        first_message: msg.content,
        created_at: msg.created_at,
      })) || [];

      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, [user]);

  // Load chat sessions khi user đăng nhập và reset freemium gates
  useEffect(() => {
    if (user) {
      setHasUnlockedContent(true);
      loadUserSessions();

      // Clear freemium gate states when user authenticates
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chatbot_question_count');
        localStorage.removeItem('chatbot_email_collected');
        localStorage.removeItem('chatbot_guest_email');
      }
      setQuestionCount(0); // Reset về 0 vì đã authenticated = unlimited
      setEmailCollected(false);
      setGuestEmail(null);
      setShowEmailGate(false);
      setShowLoginGate(false);
    } else {
      setHasUnlockedContent(false);
      setChatSessions([]);
    }
  }, [user, loadUserSessions]);

  // Realtime subscription để cập nhật chat sessions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Chỉ reload khi có assistant message mới (đánh dấu kết thúc cuộc hội thoại)
          if (payload.new && (payload.new as any).role === 'assistant') {
            loadUserSessions();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadUserSessions]);

  const loadChatHistory = useCallback(async (sessionId?: string) => {
    if (!user) {
      console.warn('Cannot load chat history: User not authenticated');
      return;
    }

    const targetSession = sessionId || getSessionToken();
    console.log('=== LOAD CHAT HISTORY START ===');
    console.log('Target session ID:', targetSession);
    console.log('User ID:', user.id);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', targetSession)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} messages from database`);
      console.log('Raw data:', JSON.stringify(data, null, 2));

      if (!data || data.length === 0) {
        console.warn('⚠️ No messages found for this session');
        setMessages([]);
        return;
      }

      const loadedMessages: ChatMessage[] = data.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        detailedContent: msg.detailed_content || undefined,
        citations: msg.citations || undefined,
        detectedChemicals: msg.detected_chemicals || undefined,
        isBlurred: false,
      }));

      console.log('✅ Mapped messages:', loadedMessages);
      console.log('Setting messages to state...');

      // Force update bằng cách tạo mảng mới hoàn toàn
      setMessages([...loadedMessages]);

      console.log('=== LOAD CHAT HISTORY END ===');
    } catch (error) {
      console.error('❌ Failed to load chat history:', error);
    }
  }, [user]);

  const saveGuestEmail = useCallback(async (email: string, currentQuestion: string) => {
    try {
      const sessionToken = getSessionToken();

      // Try to insert email into leads table
      // Use upsert pattern: ignore error if email already exists
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          email: email,
          phone_zalo: '',
          company_name: null,
          intent_tag: 'tu_van_luat',
          source_page: 'chatbot_email_gate',
          query_text: currentQuestion,
        });

      // If email already exists, that's okay - we still let user continue
      if (leadError && !leadError.message.includes('duplicate')) {
        console.error('Error saving lead:', leadError);
      }

      // Track email gate submission in analytics
      await supabase.from('chat_analytics').insert({
        session_id: sessionToken,
        user_query: currentQuestion,
        ai_response: email,
        response_source: 'email_gate_submitted',
        metadata: {
          question_number: questionCount + 1,
          email: email,
        },
      });

      // Update state
      setGuestEmail(email);
      setEmailCollected(true);

      toast.success('Email đã được lưu! Bạn có thể hỏi thêm 3 câu nữa.');
    } catch (error) {
      console.error('Failed to save guest email:', error);
      // Even on error, we let user continue (better UX)
      setGuestEmail(email);
      setEmailCollected(true);
      toast.success('Tiếp tục trải nghiệm!');
    }
  }, [questionCount]);

  const sendMessage = useCallback(async (content: string) => {
    const sessionToken = getSessionToken();
    setSessionId(sessionToken);

    // GATE LOGIC CHECK 1: Email gate (question 2)
    // Show email gate before the 2nd question (when questionCount >= 1)
    if (questionCount >= 1 && !emailCollected && !user) {
      setCurrentQuery(content);
      setShowEmailGate(true);

      // Track email gate shown
      await supabase.from('chat_analytics').insert({
        session_id: sessionToken,
        user_query: content,
        ai_response: '',
        response_source: 'email_gate_shown',
        metadata: {
          question_number: questionCount + 1,
          gate_type: 'email_gate',
        },
      });

      return; // Block sending message until email collected
    }

    // GATE LOGIC CHECK 2: Login gate (question 6)
    // Show login gate before the 6th question (when questionCount >= 5)
    if (questionCount >= 5 && !user) {
      setCurrentQuery(content);
      setShowLoginGate(true);

      // Track login gate shown
      await supabase.from('chat_analytics').insert({
        session_id: sessionToken,
        user_query: content,
        ai_response: '',
        response_source: 'login_gate_shown',
        metadata: {
          question_number: questionCount + 1,
          gate_type: 'login_gate',
          email_collected: emailCollected,
          guest_email: guestEmail,
        },
      });

      return; // Block sending message until user logs in
    }

    // If passed all gates, proceed with normal message sending
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentQuery(content);
    setIsTyping(true);

    // Lưu user message vào database
    try {
      await supabase.from('chat_messages').insert({
        user_id: user?.id || null,
        session_id: sessionToken,
        role: 'user',
        content: content,
        metadata: {
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          referer: typeof window !== 'undefined' ? window.location.href : null,
        },
      });
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    try {
      const startTime = Date.now();
      const aiResponse = await callLegalAIEdgeFunction(content);
      const responseTime = Date.now() - startTime;

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.summary,
        timestamp: new Date(),
        isBlurred: !hasUnlockedContent,
        detailedContent: aiResponse.detailed,
        citations: aiResponse.citations,
        detectedChemicals: aiResponse.detected_chemicals,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

      // Increment question count for freemium gate tracking (only for non-authenticated users)
      if (!user) {
        setQuestionCount((prev) => prev + 1);
      }

      // Lưu assistant message vào database
      try {
        await supabase.from('chat_messages').insert({
          user_id: user?.id || null,
          session_id: sessionToken,
          role: 'assistant',
          content: aiResponse.summary,
          detailed_content: aiResponse.detailed,
          detected_chemicals: aiResponse.detected_chemicals,
          citations: aiResponse.citations,
          response_time_ms: responseTime,
          is_error: false,
          metadata: {
            response_source: 'legal-ai-chat',
            question_number: !user ? questionCount + 1 : null,
          },
        });

        // Reload chat sessions để cập nhật sidebar ngay lập tức
        if (user) {
          await loadUserSessions();
        }
      } catch (error) {
        console.error('Failed to save assistant message:', error);
      }

      // Legacy: Vẫn lưu vào chat_sessions cho backward compatibility
      try {
        await supabase.from('chat_sessions').insert({
          session_token: sessionToken,
          query_summary: content,
          response_summary: aiResponse.summary,
          is_converted: hasUnlockedContent,
        });
      } catch {
        console.error('Failed to save chat session');
      }
    } catch (error) {
      console.error('Error calling AI:', error);

      const errorMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);

      // Lưu error message vào database
      try {
        await supabase.from('chat_messages').insert({
          user_id: user?.id || null,
          session_id: sessionToken,
          role: 'assistant',
          content: errorMessage.content,
          is_error: true,
          metadata: {
            error_details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (saveError) {
        console.error('Failed to save error message:', saveError);
      }
    }
  }, [hasUnlockedContent, user, questionCount, emailCollected, guestEmail, loadUserSessions]);

  const unlockContent = useCallback(() => {
    setHasUnlockedContent(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('content_unlocked', 'true');
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.role === 'assistant' ? { ...msg, isBlurred: false } : msg
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentQuery('');
  }, []);

  const clearCurrentQuery = useCallback(() => {
    setCurrentQuery('');
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isTyping,
        hasUnlockedContent,
        currentQuery,
        isAuthenticated: !!user,
        questionCount,
        emailCollected,
        guestEmail,
        showEmailGate,
        showLoginGate,
        sessionId,
        sendMessage,
        unlockContent,
        clearMessages,
        clearCurrentQuery,
        loadChatHistory,
        chatSessions,
        setShowEmailGate,
        setShowLoginGate,
        saveGuestEmail,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
