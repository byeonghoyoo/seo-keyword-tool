export interface KeywordResult {
  id: string;
  keyword: string;
  position: number;
  page: number;
  type: 'organic' | 'ad' | 'shopping' | 'local';
  url: string;
  title: string;
  snippet?: string;
  searchVolume?: number;
  competition?: 'low' | 'medium' | 'high';
  estimatedCPC?: number;
  previousPosition?: number;
  discovered: Date;
}

export interface AnalysisJob {
  id: string;
  targetUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    overall: number;
    phases: {
      analyzing: { progress: number; completed: boolean };
      expanding: { progress: number; completed: boolean };
      crawling: { progress: number; completed: boolean };
      processing: { progress: number; completed: boolean };
      completing: { progress: number; completed: boolean };
    };
    foundKeywords: number;
    processedKeywords: number;
    totalKeywords: number;
    currentKeyword?: string;
    logs: LogEntry[];
  };
  options: AnalysisOptions;
  results: KeywordResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface AnalysisOptions {
  maxPages: number;
  includeAds: boolean;
  deepAnalysis: boolean;
  searchEngine: 'naver' | 'google';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  phase?: string;
}

export interface ProgressUpdate {
  jobId: string;
  phase: 'analyzing' | 'expanding' | 'crawling' | 'processing' | 'completing';
  progress: number;
  currentKeyword?: string;
  foundKeywords: number;
  totalKeywords: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  errors: string[];
}

export interface AnalyticsMetrics {
  totalKeywords: number;
  keywordChange: number;
  avgRanking: number;
  rankingChange: number;
  adOpportunities: number;
  adChange: number;
  competitionScore: number;
  competitionChange: number;
}

export interface CompetitorData {
  competitors: Array<{
    name: string;
    domain: string;
    favicon: string;
    commonKeywords: number;
    avgRanking: number;
  }>;
  rankings: Array<{
    date: string;
    competitor1: number;
    competitor2: number;
    competitor3: number;
    myRanking: number;
  }>;
}

export interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunity: number;
  currentRank?: number;
}