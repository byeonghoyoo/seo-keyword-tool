'use client';

import { useState, useMemo } from 'react';
import { 
  Clock, 
  Globe, 
  BarChart3, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  ArrowUpDown,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils';
import type { AnalysisHistory } from '@/types';

interface HistoryFilters {
  status: string;
  dateRange: string;
  domain: string;
  tag: string;
}

interface HistoryCardProps {
  analysis: AnalysisHistory;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

function HistoryCard({ analysis, onView, onDownload, onDelete }: HistoryCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-error-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-warning-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'failed':
        return 'bg-error-100 text-error-800';
      case 'partial':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="card p-6 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Globe className="h-4 w-4 text-slate-500" />
            <h3 className="font-medium text-slate-900 truncate" title={analysis.targetUrl}>
              {analysis.domain}
            </h3>
            <span className={cn('badge text-xs px-2 py-1 rounded-full flex items-center space-x-1', getStatusColor(analysis.status))}>
              {getStatusIcon(analysis.status)}
              <span>{analysis.status === 'completed' ? '완료' : analysis.status === 'failed' ? '실패' : '부분 완료'}</span>
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-3">{analysis.targetUrl}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">{formatNumber(analysis.keywordsFound)}</div>
              <div className="text-xs text-slate-600">키워드</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">{analysis.averageRanking.toFixed(1)}</div>
              <div className="text-xs text-slate-600">평균 순위</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">{analysis.duration}분</div>
              <div className="text-xs text-slate-600">소요 시간</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-600">
            {formatRelativeTime(analysis.analyzedAt)}
          </span>
          {analysis.tags.length > 0 && (
            <>
              <Tag className="h-3 w-3 text-slate-400 ml-2" />
              <div className="flex items-center space-x-1">
                {analysis.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="badge bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
                {analysis.tags.length > 2 && (
                  <span className="text-xs text-slate-500">+{analysis.tags.length - 2}</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(analysis.id)}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="상세 보기"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDownload(analysis.id)}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="다운로드"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(analysis.id)}
            className="p-2 text-slate-400 hover:text-error-600 transition-colors"
            title="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface FilterBarProps {
  filters: HistoryFilters;
  onFilterChange: (filters: HistoryFilters) => void;
  onSearch: (query: string) => void;
}

function FilterBar({ filters, onFilterChange, onSearch }: FilterBarProps) {
  return (
    <div className="card p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="input text-sm py-1"
            >
              <option value="all">전체 상태</option>
              <option value="completed">완료</option>
              <option value="failed">실패</option>
              <option value="partial">부분 완료</option>
            </select>
          </div>

          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
            className="input text-sm py-1"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">지난 주</option>
            <option value="month">지난 달</option>
            <option value="quarter">지난 3개월</option>
          </select>

          <input
            type="text"
            placeholder="도메인 검색..."
            onChange={(e) => onSearch(e.target.value)}
            className="input text-sm w-48"
          />
        </div>

        <button className="btn btn-primary btn-sm">
          <Plus className="h-4 w-4 mr-2" />
          새 분석
        </button>
      </div>
    </div>
  );
}

// Mock data
const mockAnalysisHistory: AnalysisHistory[] = [
  {
    id: '1',
    targetUrl: 'https://example-beauty.com',
    domain: 'example-beauty.com',
    analyzedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'completed',
    keywordsFound: 1247,
    averageRanking: 8.3,
    analysisOptions: {
      maxPages: 15,
      includeAds: true,
      deepAnalysis: true,
      searchEngine: 'naver'
    },
    duration: 12,
    tags: ['성형외과', '미용', '보톡스']
  },
  {
    id: '2',
    targetUrl: 'https://competitor-clinic.com',
    domain: 'competitor-clinic.com',
    analyzedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: 'completed',
    keywordsFound: 892,
    averageRanking: 12.1,
    analysisOptions: {
      maxPages: 10,
      includeAds: false,
      deepAnalysis: false,
      searchEngine: 'naver'
    },
    duration: 8,
    tags: ['경쟁사', '피부과']
  },
  {
    id: '3',
    targetUrl: 'https://medical-center.com',
    domain: 'medical-center.com',
    analyzedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'failed',
    keywordsFound: 0,
    averageRanking: 0,
    analysisOptions: {
      maxPages: 20,
      includeAds: true,
      deepAnalysis: true,
      searchEngine: 'naver'
    },
    duration: 0,
    tags: ['의료', '실패']
  },
  {
    id: '4',
    targetUrl: 'https://skincare-shop.com',
    domain: 'skincare-shop.com',
    analyzedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    status: 'partial',
    keywordsFound: 456,
    averageRanking: 15.7,
    analysisOptions: {
      maxPages: 15,
      includeAds: true,
      deepAnalysis: false,
      searchEngine: 'naver'
    },
    duration: 15,
    tags: ['스킨케어', '화장품']
  }
];

export default function AnalysisPage() {
  const [filters, setFilters] = useState<HistoryFilters>({
    status: 'all',
    dateRange: 'all',
    domain: '',
    tag: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'analyzedAt',
    direction: 'desc'
  });

  const filteredHistory = useMemo(() => {
    let filtered = mockAnalysisHistory;

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.analyzedAt);
        switch (filters.dateRange) {
          case 'today':
            return itemDate.toDateString() === now.toDateString();
          case 'week':
            return (now.getTime() - itemDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          case 'month':
            return (now.getTime() - itemDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          case 'quarter':
            return (now.getTime() - itemDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof AnalysisHistory];
      const bValue = b[sortConfig.key as keyof AnalysisHistory];
      
      if (!aValue || !bValue) return 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [filters, searchQuery, sortConfig]);

  const handleView = (id: string) => {
    console.log('View analysis:', id);
    // Navigate to detailed view
  };

  const handleDownload = (id: string) => {
    console.log('Download analysis:', id);
    // Generate and download report
  };

  const handleDelete = (id: string) => {
    console.log('Delete analysis:', id);
    // Show confirmation dialog and delete
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const totalAnalyses = filteredHistory.length;
  const completedAnalyses = filteredHistory.filter(item => item.status === 'completed').length;
  const totalKeywords = filteredHistory.reduce((sum, item) => sum + item.keywordsFound, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">분석 히스토리</h1>
          <p className="text-slate-600 mt-1">과거 키워드 분석 결과를 조회하고 관리하세요</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          새 분석 시작
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">총 분석 수</h3>
            <p className="text-2xl font-bold text-slate-900">{totalAnalyses}</p>
            <p className="text-xs text-slate-500">전체 분석 기록</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">완료된 분석</h3>
            <p className="text-2xl font-bold text-slate-900">{completedAnalyses}</p>
            <p className="text-xs text-slate-500">성공률 {Math.round((completedAnalyses / totalAnalyses) * 100)}%</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">발견된 키워드</h3>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(totalKeywords)}</p>
            <p className="text-xs text-slate-500">누적 키워드 수</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">평균 소요시간</h3>
            <p className="text-2xl font-bold text-slate-900">
              {Math.round(filteredHistory.reduce((sum, item) => sum + item.duration, 0) / totalAnalyses)}분
            </p>
            <p className="text-xs text-slate-500">분석당 평균</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar 
        filters={filters}
        onFilterChange={setFilters}
        onSearch={setSearchQuery}
      />

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">정렬:</span>
          <button
            onClick={() => handleSort('analyzedAt')}
            className={cn(
              'btn btn-ghost btn-sm',
              sortConfig.key === 'analyzedAt' && 'bg-slate-100'
            )}
          >
            <Calendar className="h-4 w-4 mr-1" />
            날짜
            {sortConfig.key === 'analyzedAt' && (
              <ArrowUpDown className="h-3 w-3 ml-1" />
            )}
          </button>
          <button
            onClick={() => handleSort('keywordsFound')}
            className={cn(
              'btn btn-ghost btn-sm',
              sortConfig.key === 'keywordsFound' && 'bg-slate-100'
            )}
          >
            <Search className="h-4 w-4 mr-1" />
            키워드 수
            {sortConfig.key === 'keywordsFound' && (
              <ArrowUpDown className="h-3 w-3 ml-1" />
            )}
          </button>
          <button
            onClick={() => handleSort('averageRanking')}
            className={cn(
              'btn btn-ghost btn-sm',
              sortConfig.key === 'averageRanking' && 'bg-slate-100'
            )}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            평균 순위
            {sortConfig.key === 'averageRanking' && (
              <ArrowUpDown className="h-3 w-3 ml-1" />
            )}
          </button>
        </div>
        <span className="text-sm text-slate-600">
          {filteredHistory.length}개 결과
        </span>
      </div>

      {/* History Grid */}
      {filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHistory.map((analysis) => (
            <HistoryCard
              key={analysis.id}
              analysis={analysis}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">분석 기록이 없습니다</h3>
          <p className="text-slate-600 mb-6">첫 번째 키워드 분석을 시작해보세요.</p>
          <button className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            새 분석 시작
          </button>
        </div>
      )}
    </div>
  );
}