import { NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/simple-report-generator';
import type { EnhancedAnalysisJob, EnhancedKeywordResult } from '@/lib/enhanced-analysis-service';
import type { KeywordResult } from '@/types';

export async function GET() {
  try {
    console.log('Testing report generation...');
    
    // Create mock job and keyword data for testing
    const mockJob: EnhancedAnalysisJob = {
      id: 'test-report-job',
      targetUrl: 'https://m.rubyps.co.kr',
      domain: 'm.rubyps.co.kr',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      overallProgress: 100,
      currentPhase: 'completed',
      options: { maxPages: 5, includeAds: true, deepAnalysis: true, searchEngine: 'naver' as const },
      phases: {
        phase1_scraping: { name: '페이지 스크래핑', description: '웹페이지 분석', progress: 100, completed: true, startTime: new Date() },
        phase2_ai_analysis: { name: 'AI 키워드 분석', description: 'AI 키워드 추출', progress: 100, completed: true, startTime: new Date() },
        phase3_search_volume: { name: '검색량 조사', description: '키워드 검색량 분석', progress: 100, completed: true, startTime: new Date() },
        phase4_ranking_check: { name: '순위 확인', description: '키워드 순위 체크', progress: 100, completed: true, startTime: new Date() },
        phase5_data_save: { name: '데이터 저장', description: '결과 데이터 저장', progress: 100, completed: true, startTime: new Date() },
      },
      logs: [],
      results: {
        scrapedContent: {
          url: 'https://m.rubyps.co.kr',
          domain: 'm.rubyps.co.kr',
          title: '루비성형외과',
          description: '루비성형외과,눈성형,코성형,안면윤곽성형,가슴성형,바디성형,리프팅,안티에이징,남자성형',
          keywords: ['루비성형외과', '눈성형', '코성형'],
          headings: { h1: ['루비성형외과'], h2: ['전문 시술'], h3: ['안전한 수술'] },
          content: '루비성형외과는 전문적인 성형수술을 제공합니다.',
          metaTags: { description: '루비성형외과' },
          images: [],
          links: [],
          structuredData: [],
          socialMedia: {},
          contactInfo: { phones: [], emails: [], addresses: [] },
          businessInfo: { name: '루비성형외과' },
          performance: { loadTime: 300, size: 1000, status: 200 },
          seoScore: { title: 80, description: 70, headings: 60, keywords: 85, images: 50, overall: 69 }
        },
        aiAnalysis: {
          keywords: [],
          suggestions: { primary: [], secondary: [], longTail: [], opportunity: [] },
          contentAnalysis: { topic: '성형외과', industry: 'Medical', tone: 'Professional', targetAudience: '성형수술 고객', contentQuality: 75, seoOptimization: 70 },
          marketInsights: { totalMarketSize: '중간 규모', competitionLevel: 'medium' as const, marketTrends: [], opportunities: [] }
        },
        competitorAnalysis: undefined,
        finalStats: {
          totalKeywords: 20,
          primaryKeywords: 3,
          secondaryKeywords: 7,
          longTailKeywords: 10,
          opportunityKeywords: 5,
          avgSearchVolume: 2500,
          avgCompetition: 0.6,
          avgCPC: 850
        },
        keywordResults: []
      }
    };

    const mockKeywords: EnhancedKeywordResult[] = [
      {
        id: '1',
        jobId: 'test-report-job',
        keyword: '루비성형외과',
        relevance: 95,
        category: 'primary',
        searchIntent: 'navigational',
        estimatedSearchVolume: 5000,
        competitionLevel: 'medium',
        estimatedCPC: 1200,
        seasonality: 'stable',
        relatedKeywords: ['성형외과', '루비', '성형수술'],
        currentRanking: 1,
        discovered: new Date()
      },
      {
        id: '2',
        jobId: 'test-report-job',
        keyword: '눈성형',
        relevance: 0.90,
        category: 'primary',
        searchIntent: 'transactional',
        estimatedSearchVolume: 8000,
        competitionLevel: 'high',
        estimatedCPC: 1500,
        seasonality: 'stable',
        relatedKeywords: ['쌍꺼풀', '눈매교정', '상안검'],
        currentRanking: 3,
        discovered: new Date()
      },
      {
        id: '3',
        jobId: 'test-report-job',
        keyword: '코성형',
        relevance: 0.88,
        category: 'secondary',
        searchIntent: 'transactional',
        estimatedSearchVolume: 6500,
        competitionLevel: 'high',
        estimatedCPC: 1800,
        seasonality: 'stable',
        relatedKeywords: ['콧볼축소', '매부리코', '들창코'],
        currentRanking: 5,
        discovered: new Date()
      }
    ];

    // Transform data for simple report generator
    const reportData = {
      jobId: mockJob.id,
      targetUrl: mockJob.targetUrl,
      domain: mockJob.domain,
      keywords: mockKeywords.map(k => ({
        id: k.id,
        keyword: k.keyword,
        position: k.currentRanking || 999,
        page: 1,
        type: (k.searchIntent === 'transactional' ? 'ad' : 'organic') as 'organic' | 'ad' | 'shopping' | 'local',
        url: mockJob.targetUrl,
        title: k.keyword,
        searchVolume: k.estimatedSearchVolume,
        competition: k.competitionLevel,
        estimatedCPC: k.estimatedCPC,
        discovered: k.discovered,
      })),
      analysis: {
        totalKeywords: mockJob.results.finalStats.totalKeywords,
        avgRanking: mockKeywords.reduce((sum, k) => sum + (k.currentRanking || 999), 0) / mockKeywords.length || 0,
        top10Keywords: mockKeywords.filter(k => k.currentRanking && k.currentRanking <= 10).length,
        adOpportunities: mockKeywords.filter(k => k.searchIntent === 'transactional').length,
        lowCompetitionKeywords: mockJob.results.finalStats.opportunityKeywords,
      },
      generatedAt: new Date(),
    };

    // Test PDF report generation
    const report = await reportGenerator.generateReport(reportData, {
      format: 'pdf',
      sections: {
        summary: true,
        keywords: true,
        competitors: false,
        recommendations: true,
      },
      title: `테스트 보고서 - ${mockJob.domain}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Report generation test completed',
      report: {
        downloadUrl: report.downloadUrl,
        fileName: report.fileName,
        fileSize: report.fileSize,
        format: 'pdf',
      }
    });

  } catch (error) {
    console.error('Report generation test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Report generation test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}