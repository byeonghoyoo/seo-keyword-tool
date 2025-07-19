import { NextRequest, NextResponse } from 'next/server';
import { enhancedAnalysisService } from '@/lib/enhanced-analysis-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job status and results
    const [job, keywordResults, logs] = await Promise.all([
      enhancedAnalysisService.getJobStatus(jobId),
      enhancedAnalysisService.getJobResults(jobId),
      enhancedAnalysisService.getJobLogs(jobId),
    ]);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Format response with comprehensive results
    const response = {
      success: true,
      job: {
        id: job.id,
        targetUrl: job.targetUrl,
        domain: job.domain,
        status: job.status,
        overallProgress: job.overallProgress,
        currentPhase: job.currentPhase,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        errorMessage: job.errorMessage,
        
        // Phase details
        phases: Object.entries(job.phases).map(([key, phase]) => ({
          id: key,
          name: phase.name,
          description: phase.description,
          progress: phase.progress,
          completed: phase.completed,
          startTime: phase.startTime?.toISOString(),
          endTime: phase.endTime?.toISOString(),
          details: phase.details,
          subTasks: phase.subTasks,
        })),

        // Analysis options
        options: job.options,

        // Final statistics
        finalStats: job.results.finalStats,
      },

      // Keyword results with enhanced data
      keywordResults: keywordResults.map(keyword => ({
        id: keyword.id,
        keyword: keyword.keyword,
        relevance: keyword.relevance,
        category: keyword.category,
        searchIntent: keyword.searchIntent,
        estimatedSearchVolume: keyword.estimatedSearchVolume,
        competitionLevel: keyword.competitionLevel,
        estimatedCPC: keyword.estimatedCPC,
        currentRanking: keyword.currentRanking,
        seasonality: keyword.seasonality,
        relatedKeywords: keyword.relatedKeywords,
        discovered: keyword.discovered.toISOString(),
      })),

      // Content analysis (if available)
      contentAnalysis: job.results.aiAnalysis ? {
        topic: job.results.aiAnalysis.contentAnalysis.topic,
        industry: job.results.aiAnalysis.contentAnalysis.industry,
        tone: job.results.aiAnalysis.contentAnalysis.tone,
        targetAudience: job.results.aiAnalysis.contentAnalysis.targetAudience,
        contentQuality: job.results.aiAnalysis.contentAnalysis.contentQuality,
        seoOptimization: job.results.aiAnalysis.contentAnalysis.seoOptimization,
        
        // Market insights
        marketInsights: job.results.aiAnalysis.marketInsights,
        
        // Keyword suggestions
        suggestions: job.results.aiAnalysis.suggestions,
      } : null,

      // Competitor analysis (if available)
      competitorAnalysis: job.results.competitorAnalysis ? {
        targetBusiness: job.results.competitorAnalysis.targetBusiness,
        totalCompetitors: job.results.competitorAnalysis.analysis.totalCompetitors,
        averageRating: job.results.competitorAnalysis.analysis.averageRating,
        averageReviewCount: job.results.competitorAnalysis.analysis.averageReviewCount,
        commonTypes: job.results.competitorAnalysis.analysis.commonTypes,
        geographicDistribution: job.results.competitorAnalysis.analysis.geographicDistribution,
        competitors: job.results.competitorAnalysis.competitors.slice(0, 10).map(comp => ({
          name: comp.name,
          address: comp.address,
          rating: comp.rating,
          userRatingsTotal: comp.userRatingsTotal,
          website: comp.website,
          phoneNumber: comp.phoneNumber,
          types: comp.types,
        })),
      } : null,

      // SEO performance metrics
      seoMetrics: job.results.scrapedContent ? {
        overallScore: job.results.scrapedContent.seoScore.overall,
        titleScore: job.results.scrapedContent.seoScore.title,
        descriptionScore: job.results.scrapedContent.seoScore.description,
        headingsScore: job.results.scrapedContent.seoScore.headings,
        keywordsScore: job.results.scrapedContent.seoScore.keywords,
        imagesScore: job.results.scrapedContent.seoScore.images,
        
        // Performance data
        loadTime: job.results.scrapedContent.performance.loadTime,
        pageSize: job.results.scrapedContent.performance.size,
        statusCode: job.results.scrapedContent.performance.status,
      } : null,

      // Analysis logs (last 20 entries)
      logs: logs.slice(-20).map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        phase: log.phase,
        details: log.details,
      })),

      // Summary insights
      insights: {
        keywordOpportunities: keywordResults
          .filter(k => k.competitionLevel === 'low' && k.estimatedSearchVolume > 500)
          .length,
        highVolumeKeywords: keywordResults
          .filter(k => k.estimatedSearchVolume > 2000)
          .length,
        transactionalKeywords: keywordResults
          .filter(k => k.searchIntent === 'transactional')
          .length,
        avgRanking: keywordResults
          .filter(k => k.currentRanking)
          .reduce((sum, k) => sum + (k.currentRanking || 0), 0) / 
          Math.max(1, keywordResults.filter(k => k.currentRanking).length),
      },

      // Recommendations
      recommendations: [
        {
          type: 'priority',
          title: '우선순위 키워드 최적화',
          description: `주요 키워드 ${job.results.finalStats.primaryKeywords}개를 페이지 제목과 메타 설명에 최적화하세요.`,
          impact: 'high',
        },
        {
          type: 'opportunity',
          title: '기회 키워드 활용',
          description: `낮은 경쟁도의 기회 키워드 ${job.results.finalStats.opportunityKeywords}개를 활용한 새로운 콘텐츠를 제작하세요.`,
          impact: 'medium',
        },
        {
          type: 'content',
          title: '롱테일 키워드 콘텐츠',
          description: `롱테일 키워드 ${job.results.finalStats.longTailKeywords}개를 활용한 블로그 포스트를 작성하세요.`,
          impact: 'medium',
        },
        {
          type: 'technical',
          title: 'SEO 기술적 개선',
          description: job.results.scrapedContent ? 
            `현재 SEO 점수 ${job.results.scrapedContent.seoScore.overall}/100을 개선하기 위해 메타 태그와 구조적 데이터를 최적화하세요.` :
            'SEO 기술적 요소들을 점검하고 개선하세요.',
          impact: 'high',
        },
      ],
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get enhanced analysis results error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get analysis results',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}