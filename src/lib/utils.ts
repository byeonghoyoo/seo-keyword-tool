import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}일 전`;
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function estimateAnalysisTime(options: {
  maxPages: number;
  includeAds: boolean;
  deepAnalysis: boolean;
}): string {
  const baseTime = options.maxPages * 30; // 30초 per page
  const adTime = options.includeAds ? baseTime * 0.3 : 0;
  const aiTime = options.deepAnalysis ? baseTime * 0.5 : 0;
  
  const totalSeconds = baseTime + adTime + aiTime;
  const minutes = Math.ceil(totalSeconds / 60);
  
  if (minutes < 1) return '1분 이내';
  if (minutes < 60) return `약 ${minutes}분`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `약 ${hours}시간 ${remainingMinutes}분`;
}

export function getSearchTypeColor(type: string): {
  bg: string;
  text: string;
  icon: string;
} {
  const colors = {
    organic: {
      bg: 'bg-success-100',
      text: 'text-success-800',
      icon: 'text-success-600',
    },
    ad: {
      bg: 'bg-warning-100',
      text: 'text-warning-800',
      icon: 'text-warning-600',
    },
    shopping: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: 'text-purple-600',
    },
    local: {
      bg: 'bg-primary-100',
      text: 'text-primary-800',
      icon: 'text-primary-600',
    },
  };
  
  return colors[type as keyof typeof colors] || colors.organic;
}

export function getRankingColor(position: number): string {
  if (position <= 3) return 'text-success-600';
  if (position <= 10) return 'text-primary-600';
  if (position <= 20) return 'text-warning-600';
  return 'text-slate-600';
}