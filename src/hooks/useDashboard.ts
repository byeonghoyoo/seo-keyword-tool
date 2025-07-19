import { useState, useEffect, useCallback } from 'react';

export interface DashboardStats {
  total_analyses: number;
  unique_domains: number;
  total_keywords: number;
  avg_ranking: number;
  top_10_keywords: number;
  ad_opportunities: number;
  low_competition_keywords: number;
}

export interface AnalysisHistoryItem {
  id: string;
  target_url: string;
  domain: string;
  status: string;
  keywords_found: number;
  completed_at: string;
  created_at: string;
  duration_minutes: number;
  actual_keywords_count: number;
  average_ranking: number;
}

export interface DashboardData {
  stats: DashboardStats | null;
  history: AnalysisHistoryItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    history: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const result = await response.json();
      return result.stats;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }, []);

  const fetchAnalysisHistory = useCallback(async (limit: number = 20) => {
    try {
      const response = await fetch(`/api/dashboard/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis history');
      }
      
      const result = await response.json();
      return result.history;
    } catch (error) {
      console.error('Analysis history error:', error);
      throw error;
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const [stats, history] = await Promise.all([
        fetchDashboardStats(),
        fetchAnalysisHistory(),
      ]);

      setData(prev => ({
        ...prev,
        stats,
        history,
        isLoading: false,
        lastUpdated: new Date(),
      }));

    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  }, [fetchDashboardStats, fetchAnalysisHistory]);

  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const clearError = useCallback(() => {
    setData(prev => ({ ...prev, error: null }));
  }, []);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    ...data,
    refreshData,
    clearError,
    reloadStats: fetchDashboardStats,
    reloadHistory: fetchAnalysisHistory,
  };
}