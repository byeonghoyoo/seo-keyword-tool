'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  DollarSign, 
  ShoppingCart, 
  MapPin, 
  Eye, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Filter,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getSearchTypeColor, getRankingColor, formatNumber, cn } from '@/lib/utils';
import type { KeywordResult } from '@/types';

interface SearchTypeBadgeProps {
  type: 'organic' | 'ad' | 'shopping' | 'local';
  size?: 'small' | 'normal';
}

function SearchTypeBadge({ type, size = 'normal' }: SearchTypeBadgeProps) {
  const configs = {
    organic: {
      bg: 'bg-success-100',
      text: 'text-success-800',
      label: '자연검색',
      icon: Search
    },
    ad: {
      bg: 'bg-warning-100',
      text: 'text-warning-800',
      label: '광고',
      icon: DollarSign
    },
    shopping: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      label: '쇼핑',
      icon: ShoppingCart
    },
    local: {
      bg: 'bg-primary-100',
      text: 'text-primary-800',
      label: '지역',
      icon: MapPin
    }
  };

  const config = configs[type] || configs.organic;
  const Icon = config.icon;
  const sizeClass = size === 'small' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span className={cn('badge inline-flex items-center rounded-full font-medium', config.bg, config.text, sizeClass)}>
      <Icon className={cn('mr-1', size === 'small' ? 'h-3 w-3' : 'h-3 w-3')} />
      {config.label}
    </span>
  );
}

interface RankingDisplayProps {
  position: number;
  type: string;
  previousPosition?: number;
}

function RankingDisplay({ position, type, previousPosition }: RankingDisplayProps) {
  const getRankChange = () => {
    if (!previousPosition) return null;
    const change = previousPosition - position;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-success-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span className="text-xs">+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-error-600">
          <TrendingDown className="h-3 w-3 mr-1" />
          <span className="text-xs">{change}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-slate-400">
        <Minus className="h-3 w-3" />
      </div>
    );
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={cn('text-lg font-bold', getRankingColor(position))}>
        #{position}
      </div>
      {getRankChange()}
    </div>
  );
}

interface TableHeaderProps {
  totalResults: number;
  selectedCount: number;
  onExport: () => void;
  onBulkAction: (action: string) => void;
}

function TableHeader({ totalResults, selectedCount, onExport, onBulkAction }: TableHeaderProps) {
  return (
    <div className="p-6 border-b border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            발견된 키워드 ({formatNumber(totalResults)}개)
          </h3>
          {selectedCount > 0 && (
            <p className="text-sm text-slate-600 mt-1">
              {selectedCount}개 선택됨
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBulkAction('add-to-watchlist')}
                className="btn btn-secondary btn-sm"
              >
                모니터링 추가
              </button>
              <button
                onClick={() => onBulkAction('export-selected')}
                className="btn btn-ghost btn-sm"
              >
                선택항목 내보내기
              </button>
            </div>
          )}
          
          <button onClick={onExport} className="btn btn-primary btn-sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </button>
        </div>
      </div>
    </div>
  );
}

interface TableFiltersProps {
  filterConfig: {
    type: string;
    position: string;
    page: string;
  };
  onFilterChange: (config: any) => void;
  onSearch: (query: string) => void;
}

function TableFilters({ filterConfig, onFilterChange, onSearch }: TableFiltersProps) {
  return (
    <div className="p-4 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select 
              value={filterConfig.type}
              onChange={(e) => onFilterChange({ ...filterConfig, type: e.target.value })}
              className="input text-sm py-1"
            >
              <option value="all">전체 타입</option>
              <option value="organic">자연검색</option>
              <option value="ad">광고</option>
              <option value="shopping">쇼핑</option>
              <option value="local">지역</option>
            </select>
          </div>
          
          <select 
            value={filterConfig.position}
            onChange={(e) => onFilterChange({ ...filterConfig, position: e.target.value })}
            className="input text-sm py-1"
          >
            <option value="all">전체 순위</option>
            <option value="top10">상위 10위</option>
            <option value="top20">상위 20위</option>
            <option value="others">21위 이하</option>
          </select>
          
          <select 
            value={filterConfig.page}
            onChange={(e) => onFilterChange({ ...filterConfig, page: e.target.value })}
            className="input text-sm py-1"
          >
            <option value="all">전체 페이지</option>
            <option value="1">1페이지</option>
            <option value="2-5">2-5페이지</option>
            <option value="6-10">6-10페이지</option>
            <option value="11+">11페이지 이상</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="키워드 검색..."
            onChange={(e) => onSearch(e.target.value)}
            className="input text-sm w-64"
          />
        </div>
      </div>
    </div>
  );
}

interface KeywordRowProps {
  result: KeywordResult;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onViewDetails: (result: KeywordResult) => void;
}

function KeywordRow({ result, index, isSelected, onSelect, onViewDetails }: KeywordRowProps) {
  const rowColor = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
  
  return (
    <tr className={cn(rowColor, 'hover:bg-primary-50 transition-colors')}>
      {/* 선택 체크박스 */}
      <td className="w-4 p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(result.id)}
          className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
        />
      </td>

      {/* 키워드 */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <span className="font-medium text-slate-900">{result.keyword}</span>
          {result.searchVolume && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {formatNumber(result.searchVolume)}
            </span>
          )}
        </div>
      </td>

      {/* 순위 */}
      <td className="px-6 py-4">
        <RankingDisplay 
          position={result.position}
          type={result.type}
          previousPosition={result.previousPosition}
        />
      </td>

      {/* 검색 타입 */}
      <td className="px-6 py-4">
        <SearchTypeBadge type={result.type} />
      </td>

      {/* 페이지 */}
      <td className="px-6 py-4 text-sm text-slate-600">
        {result.page}페이지
      </td>

      {/* 제목 */}
      <td className="px-6 py-4 max-w-xs">
        <p className="text-sm text-slate-900 truncate" title={result.title}>
          {result.title}
        </p>
      </td>

      {/* 메트릭 */}
      <td className="px-6 py-4">
        <div className="flex flex-col space-y-1">
          {result.competition && (
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              result.competition === 'high' ? 'bg-error-100 text-error-800' :
              result.competition === 'medium' ? 'bg-warning-100 text-warning-800' :
              'bg-success-100 text-success-800'
            )}>
              경쟁도: {result.competition}
            </span>
          )}
          {result.estimatedCPC && (
            <span className="text-xs text-slate-600">
              CPC: {formatNumber(result.estimatedCPC)}원
            </span>
          )}
        </div>
      </td>

      {/* 액션 */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewDetails(result)}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="상세 보기"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.open(result.url, '_blank')}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="링크 열기"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface TableHeadProps {
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
}

function TableHead({ sortConfig, onSort, onSelectAll, allSelected }: TableHeadProps) {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) {
      return <ChevronDown className="h-4 w-4 text-slate-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-slate-700" /> : 
      <ChevronDown className="h-4 w-4 text-slate-700" />;
  };

  return (
    <thead className="bg-slate-50">
      <tr>
        <th className="w-4 p-4">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
          />
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort('keyword')}
        >
          <div className="flex items-center space-x-1">
            <span>키워드</span>
            <SortIcon column="keyword" />
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort('position')}
        >
          <div className="flex items-center space-x-1">
            <span>순위</span>
            <SortIcon column="position" />
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          타입
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          페이지
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          제목
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          메트릭
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          액션
        </th>
      </tr>
    </thead>
  );
}

// Mock data for demonstration
const mockResults: KeywordResult[] = [
  {
    id: '1',
    keyword: '보톡스 가격',
    position: 3,
    page: 1,
    type: 'organic',
    url: 'https://example.com/botox-price',
    title: '보톡스 시술 비용 및 가격 정보 | 강남 성형외과',
    snippet: '보톡스 시술의 정확한 가격 정보를 확인하세요...',
    searchVolume: 12000,
    competition: 'high',
    estimatedCPC: 1500,
    previousPosition: 5,
    discovered: new Date()
  },
  {
    id: '2',
    keyword: '필러 후기',
    position: 8,
    page: 1,
    type: 'ad',
    url: 'https://example.com/filler-review',
    title: '필러 시술 후기 및 전후 사진 공개',
    searchVolume: 8500,
    competition: 'medium',
    estimatedCPC: 2000,
    discovered: new Date()
  },
  {
    id: '3',
    keyword: '리프팅 비용',
    position: 15,
    page: 2,
    type: 'organic',
    url: 'https://example.com/lifting-cost',
    title: '울쎄라 리프팅 비용과 효과 완전 분석',
    searchVolume: 5200,
    competition: 'low',
    previousPosition: 18,
    discovered: new Date()
  }
];

export default function KeywordResultsTable() {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'position', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({
    type: 'all',
    position: 'all',
    page: 'all'
  });
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResults = useMemo(() => {
    let filtered = mockResults;

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(result => 
        result.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 타입 필터
    if (filterConfig.type !== 'all') {
      filtered = filtered.filter(result => result.type === filterConfig.type);
    }

    // 순위 필터
    if (filterConfig.position !== 'all') {
      filtered = filtered.filter(result => {
        if (filterConfig.position === 'top10') return result.position <= 10;
        if (filterConfig.position === 'top20') return result.position <= 20;
        if (filterConfig.position === 'others') return result.position > 20;
        return true;
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof KeywordResult];
      const bValue = b[sortConfig.key as keyof KeywordResult];
      
      if (!aValue || !bValue) return 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [searchQuery, filterConfig, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowSelect = (id: string) => {
    setSelectedKeywords(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedKeywords(selected ? filteredResults.map(r => r.id) : []);
  };

  const handleExport = () => {
    console.log('내보내기 기능');
  };

  const handleBulkAction = (action: string) => {
    console.log('대량 작업:', action, selectedKeywords);
  };

  const handleViewDetails = (result: KeywordResult) => {
    console.log('상세 보기:', result);
  };

  return (
    <div className="card overflow-hidden animate-fade-in">
      <TableHeader 
        totalResults={filteredResults.length}
        selectedCount={selectedKeywords.length}
        onExport={handleExport}
        onBulkAction={handleBulkAction}
      />

      <TableFilters 
        filterConfig={filterConfig}
        onFilterChange={setFilterConfig}
        onSearch={setSearchQuery}
      />

      <div className="overflow-x-auto">
        <table className="w-full table-auto-striped">
          <TableHead 
            sortConfig={sortConfig}
            onSort={handleSort}
            onSelectAll={handleSelectAll}
            allSelected={selectedKeywords.length === filteredResults.length && filteredResults.length > 0}
          />
          <tbody className="divide-y divide-slate-200">
            {filteredResults.map((result, index) => (
              <KeywordRow
                key={result.id}
                result={result}
                index={index}
                isSelected={selectedKeywords.includes(result.id)}
                onSelect={handleRowSelect}
                onViewDetails={handleViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {filteredResults.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          검색 조건에 맞는 키워드가 없습니다.
        </div>
      )}
    </div>
  );
}