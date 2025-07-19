import { NextResponse } from 'next/server';
import { productionAnalysisService } from '@/lib/production-analysis-service';

export async function GET() {
  try {
    // Get dashboard statistics from production service
    const stats = await productionAnalysisService.getDashboardStats();

    // If no data exists, return zero stats
    if (!stats) {
      return NextResponse.json({
        success: true,
        stats: {
          total_analyses: 0,
          unique_domains: 0,
          total_keywords: 0,
          avg_ranking: 0,
          top_10_keywords: 0,
          ad_opportunities: 0,
          low_competition_keywords: 0,
        },
        generatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        total_analyses: stats.total_analyses || 0,
        unique_domains: stats.unique_domains || 0,
        total_keywords: stats.total_keywords || 0,
        avg_ranking: parseFloat(stats.avg_ranking) || 0,
        top_10_keywords: stats.top_10_keywords || 0,
        ad_opportunities: stats.ad_opportunities || 0,
        low_competition_keywords: stats.low_competition_keywords || 0,
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}