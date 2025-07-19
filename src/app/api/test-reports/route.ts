import { NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/report-generator';
import type { EnhancedAnalysisJob, EnhancedKeywordResult } from '@/lib/enhanced-analysis-service';

export async function GET() {
  try {
    console.log('Testing report generation...');
    
    // Create mock job and keyword data for testing
    const mockJob: EnhancedAnalysisJob = {
      id: 'test-report-job',
      targetUrl: 'https://m.rubyps.co.kr',
      domain: 'm.rubyps.co.kr',
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      phases: {
        phase1_scraping: { status: 'completed', progress: 100, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        phase2_ai_analysis: { status: 'completed', progress: 100, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        phase3_search_volume: { status: 'completed', progress: 100, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        phase4_ranking_check: { status: 'completed', progress: 100, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        phase5_data_save: { status: 'completed', progress: 100, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      },
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
        competitorAnalysis: null,
        finalStats: {
          totalKeywords: 20,
          primaryKeywords: 3,
          secondaryKeywords: 7,
          longTailKeywords: 10,
          opportunityKeywords: 5,
          avgSearchVolume: 2500,
          avgCPC: 850,
          totalAnalysisTime: 180
        }
      },
      options: { maxPages: 5, includeAds: true, deepAnalysis: true, searchEngine: 'naver' as const }
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
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        jobId: 'test-report-job',
        keyword: '눈성형',
        relevance: 90,
        category: 'primary',
        searchIntent: 'transactional',
        estimatedSearchVolume: 8000,
        competitionLevel: 'high',
        estimatedCPC: 1500,
        seasonality: 'stable',
        relatedKeywords: ['쌍꺼풀', '눈매교정', '상안검'],
        currentRanking: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        jobId: 'test-report-job',
        keyword: '코성형',
        relevance: 88,
        category: 'secondary',
        searchIntent: 'transactional',
        estimatedSearchVolume: 6500,
        competitionLevel: 'high',
        estimatedCPC: 1800,
        seasonality: 'stable',
        relatedKeywords: ['콧볼축소', '매부리코', '들창코'],
        currentRanking: 5,
        createdAt: new Date().toISOString()
      }
    ];

    // Test PDF report generation
    const reports = await reportGenerator.generateComprehensiveReport(
      mockJob,
      mockKeywords,
      { format: ['pdf', 'excel'], includeCharts: true, language: 'ko' }
    );

    return NextResponse.json({
      success: true,
      message: 'Report generation test completed',
      reportsGenerated: reports.length,
      reports: reports.map(report => ({
        type: report.type,
        format: report.format,
        size: report.buffer.length,
        filename: report.filename
      }))
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