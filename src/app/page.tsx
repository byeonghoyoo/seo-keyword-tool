'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import SearchInterface from '@/components/SearchInterface';
import ProgressTracker from '@/components/ProgressTracker';
import KeywordResultsTable from '@/components/KeywordResultsTable';
import Dashboard from '@/components/Dashboard';
import { useAnalysis } from '@/hooks/useAnalysis';
import type { AnalysisOptions } from '@/types';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'search' | 'progress' | 'results' | 'dashboard'>('search');
  const { 
    job, 
    results, 
    logs, 
    isLoading, 
    error, 
    startAnalysis, 
    cancelAnalysis, 
    clearError 
  } = useAnalysis();

  // Auto-navigate based on analysis state
  useEffect(() => {
    if (isLoading && job) {
      setCurrentView('progress');
    } else if (!isLoading && job?.status === 'completed' && results.length > 0) {
      setCurrentView('results');
    } else if (!isLoading && job?.status === 'failed') {
      setCurrentView('search');
    }
  }, [isLoading, job, results]);

  const handleAnalysisStart = async (url: string, options: AnalysisOptions) => {
    try {
      clearError();
      await startAnalysis(url, options);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };

  const handleAnalysisCancel = () => {
    cancelAnalysis();
    setCurrentView('search');
  };

  const renderMainContent = () => {
    // Show error message if there's an error
    if (error) {
      return (
        <div className="space-y-6">
          <div className="card p-6 border-error-200 bg-error-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-error-100 rounded-lg">
                <svg className="h-5 w-5 text-error-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-error-900">분석 오류</h3>
                <p className="text-error-700">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => {
                  clearError();
                  setCurrentView('search');
                }}
                className="btn btn-error btn-sm"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'progress':
        return (
          <ProgressTracker 
            job={job}
            logs={logs}
            onCancel={handleAnalysisCancel}
          />
        );
      case 'results':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">분석 결과</h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setCurrentView('search')}
                  className="btn btn-ghost btn-sm"
                >
                  새 분석
                </button>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="btn btn-secondary btn-sm"
                >
                  대시보드 보기
                </button>
              </div>
            </div>
            <KeywordResultsTable results={results} job={job} />
          </div>
        );
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">분석 대시보드</h2>
              <button 
                onClick={() => setCurrentView('search')}
                className="btn btn-primary btn-sm"
              >
                새 분석 시작
              </button>
            </div>
            <Dashboard />
          </div>
        );
      default:
        return (
          <SearchInterface 
            onSubmit={handleAnalysisStart}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}