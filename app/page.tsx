'use client';

import { useRef } from 'react';
import { Header } from '@/components/landing/header';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { StatsSection } from '@/components/landing/stats-section';
import { Footer } from '@/components/landing/footer';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';

export default function HomePage() {
  const chatRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <ChatHistorySidebar />

      <main className="pt-16">
        <HeroSection onSearch={handleSearch} />

        {/* Chatbox luôn hiển thị */}
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
