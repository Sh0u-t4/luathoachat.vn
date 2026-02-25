'use client';

import { useRef } from 'react';
import { Header } from '@/components/landing/header';
import { HeroSectionWithChat } from '@/components/landing/hero-section-with-chat';
import { FeaturesSection } from '@/components/landing/features-section';
import { StatsSection } from '@/components/landing/stats-section';
import { Footer } from '@/components/landing/footer';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { GoogleConversionTracker } from '@/components/google-conversion-tracker';

export default function HomePage() {
  const chatRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      {/* Google Ads Conversion Tracking - Lượt xem trang */}
      <GoogleConversionTracker />

      <Header />
      <ChatHistorySidebar />

      <main>
        {/* Hero với Chat Input tích hợp */}
        <HeroSectionWithChat onSearch={handleSearch} />

        {/* Chatbox hiển thị kết quả */}
        <section ref={chatRef} className="py-16 px-4 bg-white" id="chat">
          <ChatInterface />
        </section>

        <StatsSection />
        <FeaturesSection />
      </main>

      <Footer />
    </div>
  );
}
