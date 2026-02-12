'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ChatMessage, Citation } from '@/types';
import { supabase, getSessionToken } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/context';

interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  hasUnlockedContent: boolean;
  currentQuery: string;
  isAuthenticated: boolean;
  sendMessage: (content: string) => Promise<void>;
  unlockContent: () => void;
  clearMessages: () => void;
  loadChatHistory: (sessionId?: string) => Promise<void>;
  chatSessions: Array<{ session_id: string; message_id: string; first_message: string; created_at: string }>;
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

  // Load chat sessions khi user đăng nhập
  useEffect(() => {
    if (user) {
      setHasUnlockedContent(true);
      loadUserSessions();
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

  const sendMessage = useCallback(async (content: string) => {
    // Tạo session_id mới cho mỗi cặp hỏi-đáp
    const sessionToken = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
  }, [hasUnlockedContent, user]);

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

  return (
    <ChatContext.Provider
      value={{
        messages,
        isTyping,
        hasUnlockedContent,
        currentQuery,
        isAuthenticated: !!user,
        sendMessage,
        unlockContent,
        clearMessages,
        loadChatHistory,
        chatSessions,
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
