'use client';

import { 
  Search, 
  Zap, 
  Globe, 
  Brain, 
  CheckCircle, 
  Clock, 
  X, 
  Target, 
  Activity, 
  TrendingUp,
  Terminal
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { LogEntry } from '@/types';
import type { AnalysisJob } from '@/hooks/useAnalysis';

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
        {isCompleted && <CheckCircle className="h-3 w-3 text-success-600 ml-auto" />}
        {isActive && <div className="h-2 w-2 bg-current rounded-full ml-auto animate-pulse" />}
      </div>
      
      <p className="text-xs mb-2 opacity-75">{description}</p>
      
      {isActive && (
        <div className="w-full bg-white/50 rounded-full h-1">
          <div
            className={`bg-current h-1 rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
  progress?: number;
  isText?: boolean;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  trend, 
  progress, 
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

interface LogItemProps {
  log: LogEntry;
}

function LogItem({ log }: LogItemProps) {
  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'error':
        return <X className="h-4 w-4 text-error-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-warning-600" />;
      default:
        return <Terminal className="h-4 w-4 text-slate-600" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-success-800';
      case 'error':
        return 'text-error-800';
      case 'warning':
        return 'text-warning-800';
      default:
        return 'text-slate-700';
    }
  };

  return (
    <div className="flex items-start space-x-3 py-2">
      {getLogIcon(log.level)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">{log.timestamp}</span>
          {log.phase && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {log.phase}
            </span>
          )}
        </div>
        <p className={`text-sm mt-1 ${getLogColor(log.level)}`}>{log.message}</p>
      </div>
    </div>
  );
}

interface ProgressTrackerProps {
  job: AnalysisJob | null;
  logs: LogEntry[];
  onCancel?: () => void;
}

export default function ProgressTracker({ 
  job, 
  logs, 
  onCancel 
}: ProgressTrackerProps) {
  
  if (!job) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">분석을 준비하고 있습니다</h3>
          <p className="text-slate-600">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  const phases = [
    {
      key: 'analyzing',
      icon: Search,
      title: '웹사이트 분석',
      description: '메타데이터 및 콘텐츠 추출',
      color: 'blue',
      progress: job.currentPhase === 'analyzing' ? job.progress : job.currentPhase === 'expanding' || job.currentPhase === 'crawling' || job.currentPhase === 'processing' || job.currentPhase === 'completing' ? 100 : 0
    },
    {
      key: 'expanding',
      icon: Brain,
      title: 'AI 키워드 분석',
      description: 'Google AI로 키워드 생성',
      color: 'purple',
      progress: job.currentPhase === 'expanding' ? job.progress : job.currentPhase === 'crawling' || job.currentPhase === 'processing' || job.currentPhase === 'completing' ? 100 : 0
    },
    {
      key: 'crawling',
      icon: Globe,
      title: '검색 순위 확인',
      description: '네이버/구글 검색 결과 수집',
      color: 'green',
      progress: job.currentPhase === 'crawling' ? job.progress : job.currentPhase === 'processing' || job.currentPhase === 'completing' ? 100 : 0
    },
    {
      key: 'processing',
      icon: Zap,
      title: '데이터 처리',
      description: '결과 저장 및 분석',
      color: 'yellow',
      progress: job.currentPhase === 'processing' ? job.progress : job.currentPhase === 'completing' ? 100 : 0
    }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.key === job.currentPhase);
  const timeElapsed = Math.floor((new Date().getTime() - new Date(job.createdAt).getTime()) / 1000);
  const estimatedTotal = timeElapsed > 0 && job.progress > 0 ? Math.floor((timeElapsed * 100) / job.progress) : 0;
  const estimatedRemaining = estimatedTotal > timeElapsed ? estimatedTotal - timeElapsed : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">분석 진행 중</h2>
          <p className="text-slate-600 mt-1">{job.targetUrl}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">{job.progress}%</p>
            <p className="text-xs text-slate-600">완료</p>
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="btn btn-ghost btn-sm text-error-600 hover:text-error-700"
            >
              <X className="h-4 w-4 mr-2" />
              취소
            </button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">전체 진행률</span>
            <span className="text-sm text-slate-600">{job.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
        
        {job.currentKeyword && (
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-1">현재 분석 중</p>
            <p className="text-lg font-medium text-slate-900">{job.currentKeyword}</p>
          </div>
        )}
      </div>

      {/* Phase Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.key}
            icon={phase.icon}
            title={phase.title}
            description={phase.description}
            progress={phase.progress}
            isActive={phase.key === job.currentPhase}
            isCompleted={index < currentPhaseIndex || (index === currentPhaseIndex && job.progress === 100)}
            color={phase.color}
          />
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Search}
          label="발견된 키워드"
          value={formatNumber(job.keywordsFound)}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="처리된 키워드"
          value={formatNumber(job.processedKeywords)}
          color="green"
          progress={job.totalKeywords > 0 ? (job.processedKeywords / job.totalKeywords) * 100 : 0}
        />
        <StatCard
          icon={Clock}
          label="소요 시간"
          value={`${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`}
          color="yellow"
          isText
        />
        <StatCard
          icon={TrendingUp}
          label="예상 남은 시간"
          value={estimatedRemaining > 0 ? `${Math.floor(estimatedRemaining / 60)}:${(estimatedRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
          color="purple"
          isText
        />
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-900">분석 로그</h3>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {logs.slice(-10).map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}