'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatUIContextType {
  isChatOpen: boolean;
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  initialMessage?: string;
}

const ChatUIContext = createContext<ChatUIContextType | undefined>(undefined);

export function ChatUIProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);

  const openChat = (message?: string) => {
    setInitialMessage(message);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    // Clear initial message sau khi đóng
    setTimeout(() => setInitialMessage(undefined), 300);
  };

  const toggleChat = () => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  return (
    <ChatUIContext.Provider
      value={{
        isChatOpen,
        openChat,
        closeChat,
        toggleChat,
        initialMessage,
      }}
    >
      {children}
    </ChatUIContext.Provider>
  );
}

export function useChatUI() {
  const context = useContext(ChatUIContext);
  if (!context) {
    throw new Error('useChatUI must be used within ChatUIProvider');
  }
  return context;
}
