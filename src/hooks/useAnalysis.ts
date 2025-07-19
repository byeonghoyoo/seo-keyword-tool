import { useState, useCallback, useRef, useEffect } from 'react';
import type { AnalysisOptions, KeywordResult, LogEntry } from '@/types';

export interface AnalysisJob {
  id: string;
  targetUrl: string;
  domain: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentPhase: string;
  keywordsFound: number;
  processedKeywords: number;
  totalKeywords: number;
  currentKeyword?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface AnalysisState {
  job: AnalysisJob | null;
  results: KeywordResult[];
  logs: LogEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    job: null,
    results: [],
    logs: [],
    isLoading: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  const startAnalysis = useCallback(async (targetUrl: string, options: AnalysisOptions) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Start production analysis
      const response = await fetch('/api/analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUrl, options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start analysis');
      }

      const { jobId } = await response.json();
      currentJobIdRef.current = jobId;

      // Start listening for progress updates
      startProgressTracking(jobId);

      return jobId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start analysis',
      }));
      throw error;
    }
  }, []);

  const startProgressTracking = useCallback((jobId: string) => {
    // Close existing EventSource if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Use polling instead of EventSource for compatibility
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/analysis/status/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setState(prev => ({
            ...prev,
            job: data.job,
            isLoading: data.job.status === 'running' || data.job.status === 'pending',
          }));
          
          if (data.job.status === 'completed') {
            fetchResults(jobId);
            return;
          } else if (data.job.status === 'failed') {
            setState(prev => ({
              ...prev,
              error: data.job.errorMessage || 'Analysis failed',
              isLoading: false,
            }));
            return;
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error);
      }
      
      // Continue polling if still running
      setTimeout(pollProgress, 2000); // Poll every 2 seconds
    };
    
    pollProgress();

  }, []);

  const fetchResults = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/analysis/results/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        job: data.job,
        results: data.results || [],
        logs: data.logs || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch results',
        isLoading: false,
      }));
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    // Close event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reset state
    setState({
      job: null,
      results: [],
      logs: [],
      isLoading: false,
      error: null,
    });

    currentJobIdRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshResults = useCallback(() => {
    if (currentJobIdRef.current) {
      fetchResults(currentJobIdRef.current);
    }
  }, [fetchResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    startAnalysis,
    cancelAnalysis,
    clearError,
    refreshResults,
    currentJobId: currentJobIdRef.current,
  };
}