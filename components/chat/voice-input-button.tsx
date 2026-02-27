'use client';

import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  lang?: string;
}

export function VoiceInputButton({ onTranscript, disabled, lang = 'vi-VN' }: VoiceInputButtonProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useVoiceInput({
    lang,
    continuous: false,
    interimResults: true,
    onResult: (text) => {
      onTranscript(text);
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 3000 });
    }
  }, [error]);

  useEffect(() => {
    if (transcript && !isListening) {
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  useEffect(() => {
    if (interimTranscript) {
      toast.info(`Đang nghe: ${interimTranscript}`, {
        duration: 1000,
        id: 'voice-interim',
      });
    }
  }, [interimTranscript]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info('Bắt đầu lắng nghe...', { duration: 2000 });
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      type="button"
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      className={`
        relative flex items-center justify-center
        h-14 w-14 rounded-xl transition-all duration-200
        ${isListening
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
          : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
        active:scale-95
      `}
    >
      {isListening ? (
        <>
          <MicOff className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        </>
      ) : (
        <Mic className="w-6 h-6" />
      )}
    </button>
  );
}
