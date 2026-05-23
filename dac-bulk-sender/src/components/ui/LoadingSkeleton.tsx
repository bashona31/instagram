"use client";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className = "", lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded-lg"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-6 w-1/3 rounded-lg" />
      <div className="skeleton h-4 w-2/3 rounded-lg" />
      <div className="skeleton h-10 w-full rounded-lg" />
      <div className="skeleton h-4 w-1/2 rounded-lg" />
    </div>
  );
}
