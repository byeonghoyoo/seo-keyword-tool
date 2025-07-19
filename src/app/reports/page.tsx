'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  FileSpreadsheet,
  Globe,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils';
import type { ReportTemplate, GeneratedReport } from '@/types';

interface ReportTemplateCardProps {
  template: ReportTemplate;
  onUse: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function ReportTemplateCard({ template, onUse, onEdit, onDelete, onDuplicate }: ReportTemplateCardProps) {
  return (
    <div className="card p-6 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-slate-900 mb-2">{template.name}</h3>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.description}</p>
          
          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <span>{template.sections.length}개 섹션</span>
            <span>•</span>
            <span>{formatRelativeTime(template.createdAt)} 생성</span>
            {template.lastUsed && (
              <>
                <span>•</span>
                <span>{formatRelativeTime(template.lastUsed)} 사용</span>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-medium text-slate-700 mb-2">포함된 섹션</h4>
        <div className="flex flex-wrap gap-1">
          {template.sections.slice(0, 3).map((section) => (
            <span key={section.id} className="badge bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
              {section.title}
            </span>
          ))}
          {template.sections.length > 3 && (
            <span className="badge bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
              +{template.sections.length - 3}개
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onUse(template.id)}
          className="btn btn-primary btn-sm flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          보고서 생성
        </button>
        <button
          onClick={() => onEdit(template.id)}
          className="btn btn-secondary btn-sm"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDuplicate(template.id)}
          className="btn btn-ghost btn-sm"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="btn btn-ghost btn-sm text-error-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface GeneratedReportCardProps {
  report: GeneratedReport;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerateIe: (id: string) => void;
}

function GeneratedReportCard({ report, onView, onDownload, onDelete, onRegenerateIe }: GeneratedReportCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-error-600" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-primary-600 animate-spin" />;
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
      case 'generating':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-error-600" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-success-600" />;
      case 'html':
        return <Globe className="h-4 w-4 text-primary-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="card p-6 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-medium text-slate-900">{report.title}</h3>
            <span className={cn('badge text-xs px-2 py-1 rounded-full flex items-center space-x-1', getStatusColor(report.status))}>
              {getStatusIcon(report.status)}
              <span>
                {report.status === 'completed' ? '완료' : 
                 report.status === 'failed' ? '실패' : 
                 report.status === 'generating' ? '생성 중' : '대기'}
              </span>
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
            <div className="flex items-center space-x-1">
              {getFormatIcon(report.format)}
              <span>{report.format.toUpperCase()}</span>
            </div>
            <span>•</span>
            <span>{report.analysisIds.length}개 분석 포함</span>
            <span>•</span>
            <span>{formatRelativeTime(report.generatedAt)}</span>
          </div>

          <p className="text-sm text-slate-600 mb-3">템플릿: {report.template.name}</p>
        </div>
      </div>

      {report.insights && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-slate-900">{report.insights.keyFindings.length}</div>
              <div className="text-xs text-slate-600">핵심 발견</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-slate-900">{report.insights.recommendations.length}</div>
              <div className="text-xs text-slate-600">권장사항</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-slate-900">{report.insights.alerts.length}</div>
              <div className="text-xs text-slate-600">주의사항</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {report.status === 'completed' && (
          <>
            <button
              onClick={() => onView(report.id)}
              className="btn btn-primary btn-sm flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              보기
            </button>
            <button
              onClick={() => onDownload(report.id)}
              className="btn btn-secondary btn-sm"
            >
              <Download className="h-4 w-4" />
            </button>
          </>
        )}
        {report.status === 'failed' && (
          <button
            onClick={() => onRegenerateIe(report.id)}
            className="btn btn-primary btn-sm flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 생성
          </button>
        )}
        {report.status === 'generating' && (
          <button disabled className="btn btn-secondary btn-sm flex-1">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            생성 중...
          </button>
        )}
        <button
          onClick={() => onDelete(report.id)}
          className="btn btn-ghost btn-sm text-error-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Mock data
const mockTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: '종합 SEO 분석 보고서',
    description: '키워드 성과, 경쟁사 비교, 트렌드 분석을 포함한 완전한 SEO 보고서입니다.',
    sections: [
      { id: '1', title: '요약', type: 'summary', config: {}, order: 1 },
      { id: '2', title: '키워드 분석', type: 'keywords', config: {}, order: 2 },
      { id: '3', title: '경쟁사 비교', type: 'competitors', config: {}, order: 3 },
      { id: '4', title: '트렌드 분석', type: 'trends', config: {}, order: 4 },
      { id: '5', title: '기회 분석', type: 'opportunities', config: {}, order: 5 }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: '월간 키워드 리포트',
    description: '월별 키워드 성과와 순위 변동을 추적하는 정기 보고서입니다.',
    sections: [
      { id: '1', title: '월간 요약', type: 'summary', config: {}, order: 1 },
      { id: '2', title: '키워드 순위', type: 'keywords', config: {}, order: 2 },
      { id: '3', title: '순위 변동', type: 'trends', config: {}, order: 3 }
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: '경쟁사 분석 보고서',
    description: '경쟁사와의 키워드 격차 분석과 기회 발굴에 특화된 보고서입니다.',
    sections: [
      { id: '1', title: '경쟁 현황', type: 'competitors', config: {}, order: 1 },
      { id: '2', title: '키워드 격차', type: 'opportunities', config: {}, order: 2 },
      { id: '3', title: '성과 차트', type: 'chart', config: {}, order: 3 }
    ],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
  }
];

const mockReports: GeneratedReport[] = [
  {
    id: '1',
    title: '종합 SEO 분석 보고서 - 2024년 7월',
    template: mockTemplates[0],
    analysisIds: ['1', '2', '3'],
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    format: 'pdf',
    status: 'completed',
    downloadUrl: '/reports/comprehensive-seo-july-2024.pdf',
    insights: {
      keyFindings: [
        '상위 10위 키워드가 전월 대비 15% 증가',
        '보톡스 관련 키워드에서 경쟁사 대비 우위',
        '모바일 검색 트래픽이 60% 증가'
      ],
      recommendations: [
        '필러 관련 키워드 최적화 강화 필요',
        '지역 기반 키워드 확장 검토',
        '계절성 키워드 대응 전략 수립'
      ],
      alerts: [
        '일부 핵심 키워드 순위 하락 감지',
        '경쟁사 A의 광고 투자 증가'
      ]
    }
  },
  {
    id: '2',
    title: '월간 키워드 리포트 - 6월',
    template: mockTemplates[1],
    analysisIds: ['4', '5'],
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    format: 'excel',
    status: 'completed',
    downloadUrl: '/reports/monthly-keyword-june-2024.xlsx',
    insights: {
      keyFindings: [
        '월간 키워드 성과 안정적 유지',
        '새로운 키워드 12개 상위권 진입'
      ],
      recommendations: [
        '성과 좋은 키워드 확장 검토'
      ],
      alerts: []
    }
  },
  {
    id: '3',
    title: '경쟁사 분석 보고서 - Q2',
    template: mockTemplates[2],
    analysisIds: ['6'],
    generatedAt: new Date(Date.now() - 10 * 60 * 1000),
    format: 'pdf',
    status: 'generating',
    insights: {
      keyFindings: [],
      recommendations: [],
      alerts: []
    }
  }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'reports'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return mockTemplates;
    return mockTemplates.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredReports = useMemo(() => {
    let filtered = mockReports;

    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    return filtered;
  }, [searchQuery, filterStatus]);

  const handleUseTemplate = (id: string) => {
    console.log('Use template:', id);
  };

  const handleEditTemplate = (id: string) => {
    console.log('Edit template:', id);
  };

  const handleDeleteTemplate = (id: string) => {
    console.log('Delete template:', id);
  };

  const handleDuplicateTemplate = (id: string) => {
    console.log('Duplicate template:', id);
  };

  const handleViewReport = (id: string) => {
    console.log('View report:', id);
  };

  const handleDownloadReport = (id: string) => {
    console.log('Download report:', id);
  };

  const handleDeleteReport = (id: string) => {
    console.log('Delete report:', id);
  };

  const handleRegenerateReport = (id: string) => {
    console.log('Regenerate report:', id);
  };

  const totalTemplates = filteredTemplates.length;
  const totalReports = filteredReports.length;
  const completedReports = filteredReports.filter(r => r.status === 'completed').length;
  const recentReports = filteredReports.filter(r => 
    new Date().getTime() - new Date(r.generatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">보고서</h1>
          <p className="text-slate-600 mt-1">분석 결과를 보고서로 생성하고 관리하세요</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary">
            <Plus className="h-4 w-4 mr-2" />
            템플릿 생성
          </button>
          <button className="btn btn-primary">
            <FileText className="h-4 w-4 mr-2" />
            보고서 생성
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">템플릿</h3>
            <p className="text-2xl font-bold text-slate-900">{totalTemplates}</p>
            <p className="text-xs text-slate-500">사용 가능한 템플릿</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">생성된 보고서</h3>
            <p className="text-2xl font-bold text-slate-900">{totalReports}</p>
            <p className="text-xs text-slate-500">전체 보고서 수</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">완료된 보고서</h3>
            <p className="text-2xl font-bold text-slate-900">{completedReports}</p>
            <p className="text-xs text-slate-500">다운로드 가능</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Calendar className="h-6 w-6 text-warning-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">최근 생성</h3>
            <p className="text-2xl font-bold text-slate-900">{recentReports}</p>
            <p className="text-xs text-slate-500">지난 7일</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              보고서 템플릿 ({totalTemplates})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'reports'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              생성된 보고서 ({totalReports})
            </button>
          </nav>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'templates' ? "템플릿 검색..." : "보고서 검색..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 input text-sm w-64"
                />
              </div>
              {activeTab === 'reports' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input text-sm py-1"
                >
                  <option value="all">전체 상태</option>
                  <option value="completed">완료</option>
                  <option value="generating">생성 중</option>
                  <option value="failed">실패</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'templates' ? (
            filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <ReportTemplateCard
                    key={template.id}
                    template={template}
                    onUse={handleUseTemplate}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    onDuplicate={handleDuplicateTemplate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">템플릿이 없습니다</h3>
                <p className="text-slate-600 mb-6">첫 번째 보고서 템플릿을 생성해보세요.</p>
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  템플릿 생성
                </button>
              </div>
            )
          ) : (
            filteredReports.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredReports.map((report) => (
                  <GeneratedReportCard
                    key={report.id}
                    report={report}
                    onView={handleViewReport}
                    onDownload={handleDownloadReport}
                    onDelete={handleDeleteReport}
                    onRegenerateIe={handleRegenerateReport}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">생성된 보고서가 없습니다</h3>
                <p className="text-slate-600 mb-6">첫 번째 보고서를 생성해보세요.</p>
                <button className="btn btn-primary">
                  <FileText className="h-4 w-4 mr-2" />
                  보고서 생성
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}