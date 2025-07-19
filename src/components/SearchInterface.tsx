'use client';

import { useState } from 'react';
import { Search, Globe, CheckCircle, X, Target, DollarSign, Brain, Clock } from 'lucide-react';
import { isValidUrl, estimateAnalysisTime, cn } from '@/lib/utils';
import type { AnalysisOptions } from '@/types';

interface AnalysisOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  value: any;
  onChange: (value: any) => void;
  options?: any[];
  type?: 'select' | 'toggle';
}

function AnalysisOption({ 
  icon: Icon, 
  title, 
  description, 
  value, 
  onChange, 
  options,
  type = 'select' 
}: AnalysisOptionProps) {
  return (
    <div className="card p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-primary-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-slate-900 mb-1">{title}</h4>
          <p className="text-sm text-slate-600 mb-3">{description}</p>
          
          {type === 'select' && options && (
            <select
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full input text-sm"
            >
              {options.map(option => (
                <option key={option} value={option}>
                  {option}페이지
                </option>
              ))}
            </select>
          )}
          
          {type === 'toggle' && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

interface SearchInterfaceProps {
  onSubmit: (url: string, options: AnalysisOptions) => void;
  isLoading?: boolean;
}

export default function SearchInterface({ onSubmit, isLoading = false }: SearchInterfaceProps) {
  const [url, setUrl] = useState('');
  const [isValidUrlState, setIsValidUrlState] = useState(false);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    maxPages: 15,
    includeAds: true,
    deepAnalysis: false,
    searchEngine: 'naver'
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValidUrlState(newUrl ? isValidUrl(newUrl) : false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrlState && !isLoading) {
      onSubmit(url, analysisOptions);
    }
  };

  const estimatedTime = isValidUrlState ? estimateAnalysisTime(analysisOptions) : '';

  return (
    <div className="card p-8 mb-8 animate-fade-in">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          역방향 키워드 발굴 도구
        </h2>
        <p className="text-lg text-slate-600">
          웹사이트 URL을 입력하여 노출되고 있는 모든 키워드를 발견하세요
        </p>
      </div>

      {/* URL 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL 입력창 */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            분석할 웹사이트 URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com"
              className={cn(
                'w-full pl-10 pr-12 py-3 text-lg input',
                url && !isValidUrlState && 'input-error'
              )}
              required
              disabled={isLoading}
            />
            
            {/* 상태 아이콘 */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {url && (
                <>
                  {isValidUrlState ? (
                    <CheckCircle className="h-5 w-5 text-success-500" />
                  ) : (
                    <X className="h-5 w-5 text-error-500" />
                  )}
                </>
              )}
            </div>
          </div>
          
          {url && !isValidUrlState && (
            <p className="mt-1 text-sm text-error-600">
              유효한 URL을 입력해주세요 (http:// 또는 https:// 포함)
            </p>
          )}
        </div>

        {/* 분석 옵션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalysisOption
            icon={Target}
            title="검색 깊이"
            description="최대 몇 페이지까지 분석할지 설정"
            value={analysisOptions.maxPages}
            onChange={(value) => setAnalysisOptions(prev => ({ ...prev, maxPages: value }))}
            options={[10, 15, 20]}
          />
          
          <AnalysisOption
            icon={DollarSign}
            title="광고 포함"
            description="유료 광고 키워드도 분석에 포함"
            value={analysisOptions.includeAds}
            onChange={(value) => setAnalysisOptions(prev => ({ ...prev, includeAds: value }))}
            type="toggle"
          />
          
          <AnalysisOption
            icon={Brain}
            title="심화 분석"
            description="AI 기반 숨은 키워드 발굴"
            value={analysisOptions.deepAnalysis}
            onChange={(value) => setAnalysisOptions(prev => ({ ...prev, deepAnalysis: value }))}
            type="toggle"
          />
        </div>

        {/* 시작 버튼 */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!isValidUrlState || isLoading}
            className={cn(
              'px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 flex items-center space-x-2',
              isValidUrlState && !isLoading
                ? 'btn-primary shadow-lg hover:shadow-xl'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>키워드 발굴 시작</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 예상 소요 시간 */}
      {isValidUrlState && estimatedTime && !isLoading && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg animate-slide-up">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 text-primary-600" />
            <span className="text-sm text-primary-800">
              예상 소요 시간: {estimatedTime}
            </span>
          </div>
        </div>
      )}

      {/* 기능 안내 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
        <div className="text-center">
          <div className="p-3 bg-success-100 rounded-lg inline-block mb-3">
            <Search className="h-6 w-6 text-success-600" />
          </div>
          <h3 className="font-medium text-slate-900 mb-1">자동 발굴</h3>
          <p className="text-sm text-slate-600">
            15페이지 내 모든 키워드 자동 수집
          </p>
        </div>
        
        <div className="text-center">
          <div className="p-3 bg-warning-100 rounded-lg inline-block mb-3">
            <DollarSign className="h-6 w-6 text-warning-600" />
          </div>
          <h3 className="font-medium text-slate-900 mb-1">광고 분석</h3>
          <p className="text-sm text-slate-600">
            자연검색과 광고 키워드 구분 분석
          </p>
        </div>
        
        <div className="text-center">
          <div className="p-3 bg-purple-100 rounded-lg inline-block mb-3">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-medium text-slate-900 mb-1">AI 인사이트</h3>
          <p className="text-sm text-slate-600">
            숨겨진 키워드 기회 발굴
          </p>
        </div>
      </div>
    </div>
  );
}