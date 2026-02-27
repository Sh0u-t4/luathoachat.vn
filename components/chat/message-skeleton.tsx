'use client';

interface MessageSkeletonProps {
  type: 'user' | 'assistant';
  className?: string;
}

export function MessageSkeleton({ type, className = '' }: MessageSkeletonProps) {
  if (type === 'user') {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[80%] space-y-2 animate-pulse">
          <div className="h-4 bg-slate-300 rounded w-48" />
          <div className="h-4 bg-slate-300 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Avatar skeleton */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 animate-pulse" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-3 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
        </div>

        {/* Citation badges skeleton */}
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-6 w-24 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Multi-message skeleton loader
 * Shows multiple message skeletons for initial load
 */
export function MessagesSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          <MessageSkeleton type="user" />
          <MessageSkeleton type="assistant" />
        </div>
      ))}
    </div>
  );
}
