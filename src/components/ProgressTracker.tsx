'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Zap, 
  Globe, 
  Brain, 
  CheckCircle, 
  Clock, 
  Pause, 
  X, 
  Target, 
  Activity, 
  TrendingUp,
  Terminal
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ProgressUpdate, LogEntry } from '@/types';

interface PhaseCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  progress: number;
  isActive: boolean;
  isCompleted: boolean;
  color: string;
}

function PhaseCard({ 
  icon: Icon, 
  title, 
  description, 
  progress, 
  isActive, 
  isCompleted, 
  color 
}: PhaseCardProps) {
  const getBackgroundClass = () => {
    if (isCompleted) return 'bg-success-50 border-success-200 text-success-800';
    if (isActive) return `bg-${color}-50 border-${color}-200 text-${color}-800`;
    return 'bg-slate-50 border-slate-200 text-slate-600';
  };

  return (
    <div className={`p-3 rounded-lg border transition-all duration-300 ${getBackgroundClass()}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{title}</span>
      </div>
      
      {isActive && (
        <div className="mb-2">
          <div className="w-full bg-slate-200 rounded-full h-1">
            <div
              className={`bg-${color}-500 h-1 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      <p className="text-xs opacity-75 leading-tight">{description}</p>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: string;
  progress?: number;
  color: string;
  isText?: boolean;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  progress, 
  color, 
  isText = false 
}: StatCardProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 text-${color}-600`} />
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-700`}>
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-xs text-slate-600 mb-1">{label}</p>
        {isText ? (
          <p className="text-sm font-medium text-slate-900 truncate" title={String(value)}>
            {value}
          </p>
        ) : (
          <p className="text-lg font-semibold text-slate-900">{value}</p>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-slate-200 rounded-full h-1">
            <div
              className={`bg-${color}-500 h-1 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface LiveLogProps {
  logs: LogEntry[];
}

function LiveLog({ logs }: LiveLogProps) {
  const getLogColor = (level: string) => {
    const colors = {
      info: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
      success: 'text-blue-400'
    };
    return colors[level as keyof typeof colors] || 'text-green-400';
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 flex items-center">
          <Terminal className="h-4 w-4 mr-2" />
          실시간 로그
        </h4>
      </div>
      
      <div className="bg-slate-900 text-green-400 font-mono text-xs p-4 h-32 overflow-y-auto scrollbar-thin">
        {logs.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-slate-500">[{log.timestamp}]</span>
            <span className={`ml-2 ${getLogColor(log.level)}`}>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-slate-500 text-center">
            분석이 시작되면 로그가 표시됩니다...
          </div>
        )}
      </div>
    </div>
  );
}

interface ProgressTrackerProps {
  progress?: ProgressUpdate;
  onPause?: () => void;
  onCancel?: () => void;
}

export default function ProgressTracker({ 
  progress, 
  onPause, 
  onCancel 
}: ProgressTrackerProps) {
  const [mockProgress, setMockProgress] = useState<ProgressUpdate>({
    jobId: 'demo',
    phase: 'analyzing',
    progress: 25,
    foundKeywords: 47,
    totalKeywords: 200,
    timeElapsed: 125000,
    estimatedTimeRemaining: 300000,
    currentKeyword: '보톡스 가격',
    errors: []
  });

  const [mockLogs, setMockLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '14:30:15',
      level: 'info',
      message: '웹사이트 메타데이터 분석 중...',
      phase: 'analyzing'
    },
    {
      id: '2',
      timestamp: '14:30:18',
      level: 'success',
      message: '시드 키워드 47개 발견',
      phase: 'analyzing'
    },
    {
      id: '3',
      timestamp: '14:30:20',
      level: 'info',
      message: '키워드 확장 시작',
      phase: 'expanding'
    }
  ]);

  // Mock data progression (실제 구현에서는 WebSocket 등으로 실시간 데이터 받음)
  useEffect(() => {
    const interval = setInterval(() => {
      setMockProgress(prev => ({
        ...prev,
        progress: Math.min(prev.progress + Math.random() * 5, 100),
        foundKeywords: prev.foundKeywords + Math.floor(Math.random() * 3),
        currentKeyword: [
          '보톡스 가격',
          '필러 후기',
          '성형외과 추천',
          '리프팅 비용',
          '보톡스 효과'
        ][Math.floor(Math.random() * 5)]
      }));

      if (Math.random() > 0.7) {
        const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('ko-KR', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          level: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)] as any,
          message: [
            '새로운 키워드 발견',
            '페이지 크롤링 완료',
            '네트워크 지연 발생',
            'AI 분석 진행 중'
          ][Math.floor(Math.random() * 4)],
          phase: 'crawling'
        };
        
        setMockLogs(prev => [...prev.slice(-10), newLog]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const currentProgress = progress || mockProgress;
  const currentLogs = progress?.errors.map(error => ({
    id: Date.now().toString(),
    timestamp: new Date().toLocaleTimeString(),
    level: 'error' as const,
    message: error
  })) || mockLogs;

  if (!currentProgress) return null;

  const phaseConfig = {
    analyzing: {
      icon: Search,
      title: '사이트 분석',
      description: '웹사이트 구조 및 메타데이터 분석',
      color: 'blue'
    },
    expanding: {
      icon: Zap,
      title: '키워드 확장',
      description: '시드 키워드 기반 확장 및 생성',
      color: 'purple'
    },
    crawling: {
      icon: Globe,
      title: '검색 크롤링',
      description: '네이버 검색 결과 수집',
      color: 'green'
    },
    processing: {
      icon: Brain,
      title: 'AI 분석',
      description: '결과 분석 및 숨은 키워드 발굴',
      color: 'orange'
    },
    completing: {
      icon: CheckCircle,
      title: '완료',
      description: '결과 정리 및 보고서 생성',
      color: 'emerald'
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card p-6 mb-8 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">분석 진행 상황</h3>
          <p className="text-sm text-slate-600">example.com</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600">
            남은 시간: {formatTime(Math.floor(currentProgress.estimatedTimeRemaining / 1000))}
          </div>
          {onPause && (
            <button 
              onClick={onPause}
              className="btn btn-ghost btn-sm"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}
          {onCancel && (
            <button 
              onClick={onCancel}
              className="btn btn-ghost btn-sm text-error-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 메인 진행률 바 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            전체 진행률
          </span>
          <span className="text-sm font-medium text-slate-900">
            {Math.round(currentProgress.progress)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${currentProgress.progress}%` }}
          />
        </div>
      </div>

      {/* 단계별 진행률 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-700 mb-4">단계별 진행 상황</h4>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(phaseConfig).map(([phaseKey, config], index) => {
            const isActive = currentProgress.phase === phaseKey;
            const isCompleted = index < Object.keys(phaseConfig).indexOf(currentProgress.phase);
            const phaseProgress = isActive ? (currentProgress.progress - index * 20) * 5 : 0;
            
            return (
              <PhaseCard
                key={phaseKey}
                icon={config.icon}
                title={config.title}
                description={config.description}
                progress={Math.max(0, Math.min(100, phaseProgress))}
                isActive={isActive}
                isCompleted={isCompleted}
                color={config.color}
              />
            );
          })}
        </div>
      </div>

      {/* 실시간 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Target}
          label="발견된 키워드"
          value={formatNumber(currentProgress.foundKeywords)}
          trend="+12"
          color="green"
        />
        <StatCard
          icon={Activity}
          label="처리 완료"
          value={`${currentProgress.foundKeywords}/${currentProgress.totalKeywords}`}
          progress={(currentProgress.foundKeywords / currentProgress.totalKeywords) * 100}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="현재 처리 중"
          value={currentProgress.currentKeyword || '대기 중...'}
          isText={true}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="처리 속도"
          value="2.3/초"
          trend="안정"
          color="orange"
        />
      </div>

      {/* 라이브 로그 */}
      <LiveLog logs={currentLogs} />
    </div>
  );
}