'use client';

import { Clock, Settings, TrendingUp } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface AnalysisHistoryItem {
  id: string;
  domain: string;
  keywordCount: number;
  status: 'completed' | 'running' | 'failed';
  createdAt: Date;
}

const mockHistory: AnalysisHistoryItem[] = [
  {
    id: '1',
    domain: 'example.com',
    keywordCount: 247,
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
  },
  {
    id: '2',
    domain: 'competitor.com',
    keywordCount: 189,
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
  },
  {
    id: '3',
    domain: 'mysite.com',
    keywordCount: 156,
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10분 전
  },
];

function StatusBadge({ status }: { status: AnalysisHistoryItem['status'] }) {
  const statusConfig = {
    completed: { class: 'badge-success', text: '완료' },
    running: { class: 'badge-warning', text: '진행중' },
    failed: { class: 'badge-error', text: '실패' },
  };
  
  const config = statusConfig[status];
  
  return (
    <span className={`badge ${config.class}`}>
      {config.text}
    </span>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-80 bg-white border-r border-slate-200 p-6 space-y-6 overflow-y-auto">
      {/* 최근 분석 */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            최근 분석
          </h3>
        </div>
        
        <div className="space-y-3">
          {mockHistory.map((analysis) => (
            <div
              key={analysis.id}
              className="card-hover p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {analysis.domain}
                  </p>
                  <p className="text-xs text-slate-500">
                    {analysis.keywordCount}개 키워드 발견
                  </p>
                </div>
                <StatusBadge status={analysis.status} />
              </div>
              
              <p className="text-xs text-slate-400">
                {formatRelativeTime(analysis.createdAt)}
              </p>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 btn btn-ghost btn-sm text-primary-600">
          전체 히스토리 보기
        </button>
      </div>
      
      {/* 빠른 설정 */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            빠른 설정
          </h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">기본 검색 깊이</span>
            <select className="text-xs border border-slate-300 rounded px-2 py-1">
              <option value={10}>10페이지</option>
              <option value={15}>15페이지</option>
              <option value={20}>20페이지</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">자동 저장</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">실시간 알림</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* 성능 통계 */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            이번 주 성과
          </h3>
        </div>
        
        <div className="space-y-3">
          <div className="card p-4 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-700">1,247</p>
              <p className="text-xs text-primary-600">발견된 키워드</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <p className="text-lg font-bold text-success-600">324</p>
              <p className="text-xs text-slate-600">상위 10위</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg font-bold text-warning-600">89</p>
              <p className="text-xs text-slate-600">광고 기회</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}