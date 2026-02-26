'use client';

import { Header } from '@/components/landing/header';
import { HeroSectionSearch } from '@/components/landing/hero-section-search';
import { FeaturesSection } from '@/components/landing/features-section';
import { StatsSection } from '@/components/landing/stats-section';
import { Footer } from '@/components/landing/footer';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { GoogleConversionTracker } from '@/components/google-conversion-tracker';
import { FloatingChatBubble } from '@/components/chat/floating-chat-bubble';
import { ExpandableChatWindow } from '@/components/chat/expandable-chat-window';
import { ChatUIProvider, useChatUI } from '@/lib/chat/chat-ui-context';

function HomePageContent() {
  const { isChatOpen, openChat, closeChat, toggleChat, initialMessage } = useChatUI();

  const handleSearch = (query: string) => {
    openChat(query);
  };

  return (
    <div className="min-h-screen">
      {/* Google Ads Conversion Tracking - Lượt xem trang */}
      <GoogleConversionTracker />

      <Header />
      <ChatHistorySidebar />

      <main>
        {/* Hero với Smart Search Bar */}
        <HeroSectionSearch onSearch={handleSearch} />

        <StatsSection />
        <FeaturesSection />
      </main>

      <Footer />

      {/* Floating Chat Bubble (góc dưới phải) */}
      <FloatingChatBubble
        isOpen={isChatOpen}
        onClick={toggleChat}
        unreadCount={0}
      />

      {/* Expandable Chat Window (Sidebar/Fullscreen) */}
      <ExpandableChatWindow
        isOpen={isChatOpen}
        onClose={closeChat}
        initialMessage={initialMessage}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <ChatUIProvider>
      <HomePageContent />
    </ChatUIProvider>
  );
}
