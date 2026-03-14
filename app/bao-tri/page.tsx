// @ts-nocheck
/* eslint-disable */
'use client';

import { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2026-04-01T08:00:00+07:00');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = TARGET_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Be Vietnam Pro', sans-serif;
          background: #050a14;
          color: #e2e8f0;
          min-height: 100vh;
        }

        .bg-wrapper {
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .bg-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.18) 0%, transparent 70%),
                      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(99,102,241,0.12) 0%, transparent 70%),
                      #050a14;
        }

        .particles {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(148,163,184,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 70%, rgba(148,163,184,0.2) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 80% 20%, rgba(99,102,241,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 90%, rgba(148,163,184,0.15) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 10% 80%, rgba(59,130,246,0.3) 0%, transparent 100%);
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: floatOrb 12s ease-in-out infinite;
        }
        .orb-1 {
          width: 400px; height: 400px;
          background: rgba(59,130,246,0.07);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: rgba(99,102,241,0.08);
          bottom: -80px; right: -80px;
          animation-delay: -6s;
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -20px); }
          66% { transform: translate(-20px, 30px); }
        }

        .container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          text-align: center;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }
        .logo-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 0 24px rgba(99,102,241,0.45);
        }
        .logo-text {
          font-size: 1.35rem;
          font-weight: 700;
          background: linear-gradient(135deg, #93c5fd, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 999px;
          padding: 0.4rem 1rem;
          margin-bottom: 1.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #fca5a5;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .status-dot {
          width: 7px; height: 7px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }

        .main-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: clamp(0.95rem, 2.5vw, 1.1rem);
          color: #64748b;
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 2.5rem;
        }
        .subtitle .highlight {
          color: #93c5fd;
          font-weight: 600;
        }

        .card {
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          max-width: 620px;
          width: 100%;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 60px rgba(59,130,246,0.08), 0 32px 64px rgba(0,0,0,0.4);
          margin-bottom: 2rem;
        }

        .wrench-icon {
          font-size: 3rem;
          margin-bottom: 1.25rem;
          display: block;
          animation: wiggle 3s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }

        .card-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.6rem;
        }
        .card-desc {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .countdown-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 1rem;
        }

        .countdown {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .time-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(30,41,59,0.8);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 14px;
          padding: 1rem 1.25rem;
          min-width: 80px;
          position: relative;
          overflow: hidden;
        }
        .time-block::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 70%);
        }

        .time-value {
          font-size: 2.25rem;
          font-weight: 800;
          background: linear-gradient(135deg, #93c5fd, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .time-unit {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #475569;
          margin-top: 0.35rem;
        }

        .time-sep {
          display: flex;
          align-items: center;
          padding-bottom: 0.5rem;
          color: #334155;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .return-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 12px;
          padding: 0.85rem 1.25rem;
          font-size: 0.9rem;
          color: #93c5fd;
          font-weight: 500;
        }
        .return-banner strong {
          font-weight: 800;
          color: #60a5fa;
        }

        .info-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 480px;
          width: 100%;
          margin-bottom: 2rem;
        }
        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: rgba(15,23,42,0.5);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 12px;
          padding: 0.85rem 1rem;
          text-align: left;
        }
        .info-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .info-text {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.6;
        }
        .info-text strong {
          color: #94a3b8;
          display: block;
          font-weight: 600;
          margin-bottom: 0.1rem;
        }

        .footer {
          color: #1e293b;
          font-size: 0.78rem;
          margin-top: 2rem;
        }

        @media (max-width: 480px) {
          .countdown { gap: 0.5rem; }
          .time-block { min-width: 65px; padding: 0.75rem 0.85rem; }
          .time-value { font-size: 1.75rem; }
          .time-sep { display: none; }
          .card { padding: 2rem 1.25rem; }
        }
      `}</style>

      <div className="bg-wrapper">
        <div className="bg-gradient" />
        <div className="particles" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="container">
        {/* Logo */}
        <div className="logo-area">
          <div className="logo-icon">⚗️</div>
          <span className="logo-text">LuatHoaChat.vn</span>
        </div>

        {/* Status badge */}
        <div className="status-badge">
          <span className="status-dot" />
          Hệ thống đang bảo trì
        </div>

        {/* Heading */}
        <h1 className="main-title">Chúng tôi đang nâng cấp<br />hệ thống AI</h1>
        <p className="subtitle">
          Trợ lý AI tư vấn pháp luật hóa chất đang được <span className="highlight">bảo trì và nâng cấp</span> để mang lại trải nghiệm tốt hơn.
          Chúng tôi sẽ sớm quay trở lại!
        </p>

        {/* Countdown card */}
        <div className="card">
          <span className="wrench-icon">🔧</span>
          <div className="card-title">Dự kiến trở lại vào ngày 1/4/2026</div>
          <div className="card-desc">
            Đội ngũ kỹ thuật đang khẩn trương xử lý sự cố và nâng cấp hệ thống.<br />
            Cảm ơn sự kiên nhẫn của bạn!
          </div>

          <div className="countdown-label">⏱ Thời gian còn lại</div>

          {mounted && (
            <div className="countdown">
              <div className="time-block">
                <span className="time-value">{pad(timeLeft.days)}</span>
                <span className="time-unit">Ngày</span>
              </div>
              <span className="time-sep">:</span>
              <div className="time-block">
                <span className="time-value">{pad(timeLeft.hours)}</span>
                <span className="time-unit">Giờ</span>
              </div>
              <span className="time-sep">:</span>
              <div className="time-block">
                <span className="time-value">{pad(timeLeft.minutes)}</span>
                <span className="time-unit">Phút</span>
              </div>
              <span className="time-sep">:</span>
              <div className="time-block">
                <span className="time-value">{pad(timeLeft.seconds)}</span>
                <span className="time-unit">Giây</span>
              </div>
            </div>
          )}

          <div className="return-banner">
            📅 &nbsp;Dự kiến hoạt động trở lại lúc <strong>08:00 SA, ngày 01/04/2026</strong>
          </div>
        </div>

        {/* Info items */}
        <ul className="info-list">
          <li className="info-item">
            <span className="info-icon">🤖</span>
            <div className="info-text">
              <strong>Trợ lý AI tạm dừng hoạt động</strong>
              Chức năng chat AI tư vấn luật hóa chất đang được nâng cấp hệ thống backend và cải thiện độ chính xác.
            </div>
          </li>
          <li className="info-item">
            <span className="info-icon">📋</span>
            <div className="info-text">
              <strong>Các dịch vụ khác</strong>
              Toàn bộ website hiện đang trong chế độ bảo trì. Tất cả dữ liệu của bạn được bảo toàn an toàn.
            </div>
          </li>
          <li className="info-item">
            <span className="info-icon">📧</span>
            <div className="info-text">
              <strong>Liên hệ hỗ trợ khẩn</strong>
              Trong trường hợp cần tư vấn gấp, vui lòng liên hệ qua email hoặc điện thoại hỗ trợ.
            </div>
          </li>
        </ul>

        <div className="footer">
          © 2026 LuatHoaChat.vn — Nền tảng AI Luật Hóa Chất Việt Nam
        </div>
      </div>
    </>
  );
}
