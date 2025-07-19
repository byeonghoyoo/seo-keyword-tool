'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import SearchInterface from '@/components/SearchInterface';
import ProgressTracker from '@/components/ProgressTracker';
import KeywordResultsTable from '@/components/KeywordResultsTable';
import Dashboard from '@/components/Dashboard';
import type { AnalysisOptions, ProgressUpdate } from '@/types';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'search' | 'progress' | 'results' | 'dashboard'>('search');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | undefined>();

  const handleAnalysisStart = (url: string, options: AnalysisOptions) => {
    console.log('분석 시작:', url, options);
    setIsAnalyzing(true);
    setCurrentView('progress');
    
    // Mock progress simulation
    setTimeout(() => {
      setCurrentView('results');
      setIsAnalyzing(false);
    }, 10000);
  };

  const handleAnalysisCancel = () => {
    setIsAnalyzing(false);
    setCurrentView('search');
    setProgress(undefined);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'progress':
        return (
          <ProgressTracker 
            progress={progress}
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
            <KeywordResultsTable />
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
            isLoading={isAnalyzing}
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