'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Globe,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap
} from 'lucide-react';
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils';
import type { CompetitorProfile, CompetitorComparison } from '@/types';

interface CompetitorCardProps {
  competitor: CompetitorProfile;
  onAnalyze: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

function CompetitorCard({ competitor, onAnalyze, onEdit, onDelete, onViewDetails }: CompetitorCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-error-600" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-success-600';
      case 'down':
        return 'text-error-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="card p-6 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
            {competitor.favicon ? (
              <img 
                src={competitor.favicon} 
                alt={competitor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Globe className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{competitor.name}</h3>
            <p className="text-sm text-slate-600">{competitor.domain}</p>
          </div>
        </div>

        <div className="relative">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{competitor.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-lg font-semibold text-slate-900">{formatNumber(competitor.metrics.totalKeywords)}</div>
          <div className="text-xs text-slate-600">총 키워드</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-lg font-semibold text-slate-900">{competitor.metrics.averageRanking.toFixed(1)}</div>
          <div className="text-xs text-slate-600">평균 순위</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-lg font-semibold text-slate-900">{formatNumber(competitor.metrics.organicTraffic)}</div>
          <div className="text-xs text-slate-600">오가닉 트래픽</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-lg font-semibold text-slate-900">{competitor.metrics.commonKeywords}</div>
          <div className="text-xs text-slate-600">공통 키워드</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {getTrendIcon(competitor.trends.rankingTrend)}
            <span className={cn('text-sm font-medium', getTrendColor(competitor.trends.rankingTrend))}>
              순위 {competitor.trends.rankingTrend === 'up' ? '상승' : competitor.trends.rankingTrend === 'down' ? '하락' : '유지'}
            </span>
          </div>
          <div className="text-sm text-slate-600">
            키워드 {competitor.trends.keywordGrowth > 0 ? '+' : ''}{competitor.trends.keywordGrowth}%
          </div>
        </div>
        {competitor.lastAnalyzed && (
          <span className="text-xs text-slate-500">
            {formatRelativeTime(competitor.lastAnalyzed)} 분석
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onAnalyze(competitor.id)}
          className="btn btn-primary btn-sm flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          재분석
        </button>
        <button
          onClick={() => onViewDetails(competitor.id)}
          className="btn btn-secondary btn-sm"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(competitor.id)}
          className="btn btn-ghost btn-sm"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(competitor.id)}
          className="btn btn-ghost btn-sm text-error-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ComparisonSummaryProps {
  comparison: CompetitorComparison;
}

function ComparisonSummary({ comparison }: ComparisonSummaryProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">경쟁 분석 요약</h3>
        <span className="badge bg-primary-100 text-primary-800 text-sm">
          {comparison.period}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="p-3 bg-blue-100 rounded-lg mb-2 mx-auto w-fit">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{comparison.metrics.keywordOverlap}%</div>
          <div className="text-sm text-slate-600">키워드 중복도</div>
        </div>

        <div className="text-center">
          <div className="p-3 bg-warning-100 rounded-lg mb-2 mx-auto w-fit">
            <AlertTriangle className="h-6 w-6 text-warning-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{comparison.metrics.rankingGaps}</div>
          <div className="text-sm text-slate-600">순위 격차</div>
        </div>

        <div className="text-center">
          <div className="p-3 bg-success-100 rounded-lg mb-2 mx-auto w-fit">
            <Zap className="h-6 w-6 text-success-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{comparison.metrics.opportunities}</div>
          <div className="text-sm text-slate-600">기회 키워드</div>
        </div>

        <div className="text-center">
          <div className="p-3 bg-error-100 rounded-lg mb-2 mx-auto w-fit">
            <AlertTriangle className="h-6 w-6 text-error-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{comparison.metrics.threats}</div>
          <div className="text-sm text-slate-600">위협 요소</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 text-success-600 mr-2" />
            키워드 격차 ({comparison.keywordGaps.length})
          </h4>
          <div className="space-y-2">
            {comparison.keywordGaps.slice(0, 3).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{keyword.keyword}</span>
                <span className="badge bg-success-100 text-success-800 text-xs">
                  #{keyword.position}
                </span>
              </div>
            ))}
            {comparison.keywordGaps.length > 3 && (
              <div className="text-xs text-slate-500 text-center">
                +{comparison.keywordGaps.length - 3}개 더
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 text-primary-600 mr-2" />
            강점 키워드 ({comparison.strongerKeywords.length})
          </h4>
          <div className="space-y-2">
            {comparison.strongerKeywords.slice(0, 3).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{keyword.keyword}</span>
                <span className="badge bg-primary-100 text-primary-800 text-xs">
                  #{keyword.position}
                </span>
              </div>
            ))}
            {comparison.strongerKeywords.length > 3 && (
              <div className="text-xs text-slate-500 text-center">
                +{comparison.strongerKeywords.length - 3}개 더
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center">
            <TrendingDown className="h-4 w-4 text-warning-600 mr-2" />
            취약 키워드 ({comparison.weakerKeywords.length})
          </h4>
          <div className="space-y-2">
            {comparison.weakerKeywords.slice(0, 3).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{keyword.keyword}</span>
                <span className="badge bg-warning-100 text-warning-800 text-xs">
                  #{keyword.position}
                </span>
              </div>
            ))}
            {comparison.weakerKeywords.length > 3 && (
              <div className="text-xs text-slate-500 text-center">
                +{comparison.weakerKeywords.length - 3}개 더
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data
const mockCompetitors: CompetitorProfile[] = [
  {
    id: '1',
    domain: 'competitor-a.com',
    name: '경쟁사 A 클리닉',
    description: '강남 지역 대표 성형외과로 보톡스와 필러 시술에 특화된 의료기관입니다.',
    website: 'https://competitor-a.com',
    favicon: '/favicon.ico',
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastAnalyzed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    metrics: {
      totalKeywords: 1547,
      averageRanking: 6.2,
      organicTraffic: 45000,
      commonKeywords: 156,
      uniqueKeywords: 892
    },
    trends: {
      rankingTrend: 'up',
      keywordGrowth: 12.5,
      trafficGrowth: 8.3
    }
  },
  {
    id: '2',
    domain: 'competitor-b.com',
    name: '경쟁사 B 의원',
    description: '피부과 전문 의원으로 레이저 시술과 스킨케어에 집중하고 있습니다.',
    website: 'https://competitor-b.com',
    favicon: '/favicon.ico',
    addedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    lastAnalyzed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    metrics: {
      totalKeywords: 892,
      averageRanking: 8.7,
      organicTraffic: 28000,
      commonKeywords: 98,
      uniqueKeywords: 445
    },
    trends: {
      rankingTrend: 'down',
      keywordGrowth: -3.2,
      trafficGrowth: -1.5
    }
  },
  {
    id: '3',
    domain: 'competitor-c.com',
    name: '경쟁사 C 센터',
    description: '종합 미용 센터로 다양한 시술과 관리 프로그램을 제공합니다.',
    website: 'https://competitor-c.com',
    favicon: '/favicon.ico',
    addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    lastAnalyzed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    metrics: {
      totalKeywords: 1234,
      averageRanking: 7.1,
      organicTraffic: 38000,
      commonKeywords: 134,
      uniqueKeywords: 678
    },
    trends: {
      rankingTrend: 'stable',
      keywordGrowth: 1.8,
      trafficGrowth: 4.2
    }
  }
];

const mockComparison: CompetitorComparison = {
  period: '지난 30일',
  metrics: {
    keywordOverlap: 68,
    rankingGaps: 156,
    opportunities: 89,
    threats: 23
  },
  keywordGaps: [
    {
      id: '1',
      keyword: '보톡스 가격',
      position: 3,
      page: 1,
      type: 'organic',
      url: 'https://example.com/botox-price',
      title: '보톡스 시술 가격 정보',
      discovered: new Date()
    },
    {
      id: '2', 
      keyword: '필러 후기',
      position: 5,
      page: 1,
      type: 'organic',
      url: 'https://example.com/filler-review',
      title: '필러 시술 후기',
      discovered: new Date()
    }
  ],
  strongerKeywords: [
    {
      id: '3',
      keyword: '리프팅 비용',
      position: 2,
      page: 1,
      type: 'organic',
      url: 'https://example.com/lifting-cost',
      title: '리프팅 시술 비용',
      discovered: new Date()
    }
  ],
  weakerKeywords: [
    {
      id: '4',
      keyword: '성형외과 추천',
      position: 15,
      page: 2,
      type: 'organic',
      url: 'https://example.com/clinic-recommend',
      title: '성형외과 추천',
      discovered: new Date()
    }
  ]
};

export default function CompetitorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredCompetitors = useMemo(() => {
    let filtered = mockCompetitors;

    if (searchQuery) {
      filtered = filtered.filter(competitor =>
        competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competitor.domain.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [searchQuery]);

  const handleAnalyze = (id: string) => {
    console.log('Analyze competitor:', id);
  };

  const handleEdit = (id: string) => {
    console.log('Edit competitor:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete competitor:', id);
  };

  const handleViewDetails = (id: string) => {
    console.log('View competitor details:', id);
  };

  const totalCompetitors = filteredCompetitors.length;
  const activeCompetitors = filteredCompetitors.filter(c => c.lastAnalyzed).length;
  const totalKeywords = filteredCompetitors.reduce((sum, c) => sum + c.metrics.totalKeywords, 0);
  const avgRanking = filteredCompetitors.reduce((sum, c) => sum + c.metrics.averageRanking, 0) / totalCompetitors;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">경쟁사 분석</h1>
          <p className="text-slate-600 mt-1">경쟁사를 등록하고 키워드 성과를 비교 분석하세요</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          경쟁사 추가
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">등록된 경쟁사</h3>
            <p className="text-2xl font-bold text-slate-900">{totalCompetitors}</p>
            <p className="text-xs text-slate-500">총 경쟁사 수</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">활성 분석</h3>
            <p className="text-2xl font-bold text-slate-900">{activeCompetitors}</p>
            <p className="text-xs text-slate-500">최근 분석된 경쟁사</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">총 키워드</h3>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(totalKeywords)}</p>
            <p className="text-xs text-slate-500">경쟁사 키워드 합계</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-warning-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">평균 순위</h3>
            <p className="text-2xl font-bold text-slate-900">{avgRanking.toFixed(1)}</p>
            <p className="text-xs text-slate-500">경쟁사 평균</p>
          </div>
        </div>
      </div>

      {/* Competition Analysis Summary */}
      <ComparisonSummary comparison={mockComparison} />

      {/* Search and Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="경쟁사 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input text-sm w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input text-sm py-1"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary btn-sm">
              <Download className="h-4 w-4 mr-2" />
              비교 보고서
            </button>
            <button className="btn btn-ghost btn-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              전체 재분석
            </button>
          </div>
        </div>
      </div>

      {/* Competitors Grid */}
      {filteredCompetitors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCompetitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              onAnalyze={handleAnalyze}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Globe className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">등록된 경쟁사가 없습니다</h3>
          <p className="text-slate-600 mb-6">첫 번째 경쟁사를 추가하여 비교 분석을 시작해보세요.</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            경쟁사 추가
          </button>
        </div>
      )}
    </div>
  );
}