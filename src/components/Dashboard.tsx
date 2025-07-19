'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw,
  Search,
  DollarSign,
  Users,
  Target
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { AnalyticsMetrics, CompetitorData, KeywordOpportunity } from '@/types';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle: string;
}

function MetricCard({ title, value, change, icon: Icon, color, subtitle }: MetricCardProps) {
  const isPositive = change > 0;
  const colorClasses = {
    blue: 'text-primary-600 bg-primary-50',
    green: 'text-success-600 bg-success-50',
    yellow: 'text-warning-600 bg-warning-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className={`flex items-center space-x-1 text-sm ${
          isPositive ? 'text-success-600' : 'text-error-600'
        }`}>
          {isPositive ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { value: '7d', label: '7일' },
    { value: '30d', label: '30일' },
    { value: '90d', label: '90일' },
    { value: '1y', label: '1년' }
  ];

  return (
    <div className="flex bg-slate-100 rounded-lg p-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
            value === range.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

interface OpportunityChartProps {
  opportunities: KeywordOpportunity[];
}

function OpportunityChart({ opportunities }: OpportunityChartProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">키워드 기회 분석</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          상세 보기 →
        </button>
      </div>

      {/* 간단한 차트 대체 - 실제로는 Recharts 사용 */}
      <div className="space-y-4 mb-6">
        {opportunities.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900">{item.keyword}</span>
                <span className="text-xs text-slate-500">기회도: {Math.round(item.opportunity * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                  style={{ width: `${item.opportunity * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 높은 기회 키워드 리스트 */}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">높은 기회 키워드</h4>
        <div className="space-y-2">
          {opportunities.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">{item.keyword}</span>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-600">검색량: {formatNumber(item.searchVolume)}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  item.opportunity > 0.8 ? 'bg-success-100 text-success-800' :
                  item.opportunity > 0.6 ? 'bg-warning-100 text-warning-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {item.opportunity > 0.8 ? '높음' : item.opportunity > 0.6 ? '중간' : '낮음'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RankingTrendsProps {
  data: Array<{
    date: string;
    top10: number;
    top20: number;
    others: number;
  }>;
}

function RankingTrends({ data }: RankingTrendsProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">순위 트렌드</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-slate-600">상위 10위</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span className="text-slate-600">11-20위</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
            <span className="text-slate-600">21위 이하</span>
          </div>
        </div>
      </div>

      {/* 간단한 트렌드 차트 대체 */}
      <div className="h-48 flex items-end justify-between space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-slate-200 rounded-t-lg overflow-hidden" style={{ height: '120px' }}>
              <div className="w-full flex flex-col-reverse">
                <div 
                  className="w-full bg-success-500" 
                  style={{ height: `${(item.top10 / 100) * 120}px` }}
                />
                <div 
                  className="w-full bg-primary-500" 
                  style={{ height: `${(item.top20 / 100) * 120}px` }}
                />
                <div 
                  className="w-full bg-warning-500" 
                  style={{ height: `${(item.others / 100) * 120}px` }}
                />
              </div>
            </div>
            <span className="text-xs text-slate-600 mt-2">{item.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CompetitorAnalysisProps {
  competitorData: CompetitorData;
}

function CompetitorAnalysis({ competitorData }: CompetitorAnalysisProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">경쟁자 분석</h3>
        <button className="btn btn-secondary btn-sm">
          경쟁자 추가
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 경쟁자 순위 비교 */}
        <div className="lg:col-span-2">
          <h4 className="text-sm font-medium text-slate-700 mb-4">순위 비교</h4>
          <div className="space-y-3">
            {competitorData.rankings.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">{item.date}</span>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-900">{item.myRanking}</div>
                    <div className="text-xs text-slate-500">내 순위</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-700">{item.competitor1}</div>
                    <div className="text-xs text-slate-500">경쟁사 A</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-700">{item.competitor2}</div>
                    <div className="text-xs text-slate-500">경쟁사 B</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 경쟁자 리스트 */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-4">주요 경쟁자</h4>
          <div className="space-y-3">
            {competitorData.competitors.map((competitor, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-slate-200 rounded overflow-hidden">
                      <img 
                        src={competitor.favicon} 
                        alt={competitor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="font-medium text-slate-900 text-sm">{competitor.name}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">공통 키워드</span>
                    <p className="font-medium">{competitor.commonKeywords}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">평균 순위</span>
                    <p className="font-medium">{competitor.avgRanking}위</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data
const mockMetrics: AnalyticsMetrics = {
  totalKeywords: 1247,
  keywordChange: 12.5,
  avgRanking: 8.3,
  rankingChange: -2.1,
  adOpportunities: 89,
  adChange: 15.2,
  competitionScore: 7.2,
  competitionChange: 3.8
};

const mockOpportunities: KeywordOpportunity[] = [
  { keyword: '보톡스 가격', searchVolume: 12000, difficulty: 0.6, opportunity: 0.85 },
  { keyword: '필러 후기', searchVolume: 8500, difficulty: 0.4, opportunity: 0.75 },
  { keyword: '리프팅 비용', searchVolume: 5200, difficulty: 0.7, opportunity: 0.65 },
  { keyword: '성형외과 추천', searchVolume: 15000, difficulty: 0.8, opportunity: 0.55 },
  { keyword: '보톡스 효과', searchVolume: 9800, difficulty: 0.5, opportunity: 0.72 }
];

const mockTrendData = [
  { date: '12/01', top10: 32, top20: 45, others: 23 },
  { date: '12/02', top10: 35, top20: 42, others: 23 },
  { date: '12/03', top10: 38, top20: 40, others: 22 },
  { date: '12/04', top10: 41, top20: 38, others: 21 },
  { date: '12/05', top10: 44, top20: 35, others: 21 },
  { date: '12/06', top10: 47, top20: 33, others: 20 },
  { date: '12/07', top10: 45, top20: 35, others: 20 }
];

const mockCompetitorData: CompetitorData = {
  competitors: [
    {
      name: 'competitor-a.com',
      domain: 'competitor-a.com',
      favicon: '/favicon.ico',
      commonKeywords: 156,
      avgRanking: 6.2
    },
    {
      name: 'competitor-b.com',
      domain: 'competitor-b.com',
      favicon: '/favicon.ico',
      commonKeywords: 98,
      avgRanking: 8.7
    },
    {
      name: 'competitor-c.com',
      domain: 'competitor-c.com',
      favicon: '/favicon.ico',
      commonKeywords: 134,
      avgRanking: 7.1
    }
  ],
  rankings: [
    { date: '12/07', competitor1: 4, competitor2: 7, competitor3: 9, myRanking: 5 },
    { date: '12/06', competitor1: 5, competitor2: 6, competitor3: 8, myRanking: 6 },
    { date: '12/05', competitor1: 6, competitor2: 8, competitor3: 7, myRanking: 7 },
    { date: '12/04', competitor1: 7, competitor2: 9, competitor3: 6, myRanking: 8 },
    { date: '12/03', competitor1: 8, competitor2: 7, competitor3: 5, myRanking: 9 }
  ]
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const { stats, history, isLoading, error, refreshData } = useDashboard();

  // Transform real data to match component expectations
  const realMetrics: AnalyticsMetrics = stats ? {
    totalKeywords: stats.total_keywords || 0,
    keywordChange: 12.5, // This would need to be calculated from historical data
    avgRanking: stats.avg_ranking || 0,
    rankingChange: -2.1, // This would need to be calculated from historical data
    adOpportunities: stats.ad_opportunities || 0,
    adChange: 15.2, // This would need to be calculated from historical data
    competitionScore: stats.low_competition_keywords || 0,
    competitionChange: 3.8, // This would need to be calculated from historical data
  } : mockMetrics;

  // Generate trend data from history (simplified)
  const trendData = history.length > 0 ? 
    history.slice(-7).map((item, index) => ({
      date: new Date(item.completed_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      top10: Math.round((item.actual_keywords_count * 0.1) || 10 + index * 2),
      top20: Math.round((item.actual_keywords_count * 0.2) || 20 + index),
      others: Math.round((item.actual_keywords_count * 0.7) || 70 - index),
    })) : mockTrendData;

  // Use mock data for opportunities for now (would need API endpoint)
  const opportunities = mockOpportunities;

  // Use mock data for competitor data for now (would need API endpoint)
  const competitorData = mockCompetitorData;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-2 text-slate-600">대시보드 데이터를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card p-6">
          <div className="text-center">
            <p className="text-error-600 mb-4">데이터를 불러올 수 없습니다: {error}</p>
            <button 
              onClick={refreshData}
              className="btn btn-primary"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 대시보드 헤더 */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">SEO 분석 대시보드</h2>
            <p className="text-slate-600 mt-1">키워드 성과 및 경쟁 분석 인사이트</p>
          </div>

          <div className="flex items-center space-x-4">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            
            <button 
              onClick={refreshData}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="총 발견 키워드"
          value={formatNumber(realMetrics.totalKeywords)}
          change={realMetrics.keywordChange}
          icon={Search}
          color="blue"
          subtitle="지난 주 대비"
        />
        
        <MetricCard
          title="평균 순위"
          value={`${realMetrics.avgRanking.toFixed(1)}위`}
          change={realMetrics.rankingChange}
          icon={TrendingUp}
          color="green"
          subtitle="순위 개선"
        />
        
        <MetricCard
          title="광고 기회"
          value={realMetrics.adOpportunities}
          change={realMetrics.adChange}
          icon={DollarSign}
          color="yellow"
          subtitle="추천 키워드"
        />
        
        <MetricCard
          title="낮은 경쟁 키워드"
          value={realMetrics.competitionScore}
          change={realMetrics.competitionChange}
          icon={Target}
          color="purple"
          subtitle="기회 키워드"
        />
      </div>

      {/* 트렌드 분석 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingTrends data={trendData} />
        <OpportunityChart opportunities={opportunities} />
      </div>

      {/* 경쟁자 분석 */}
      <CompetitorAnalysis competitorData={competitorData} />
    </div>
  );
}