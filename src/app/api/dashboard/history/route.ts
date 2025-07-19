import { NextRequest, NextResponse } from 'next/server';
import { productionAnalysisService } from '@/lib/production-analysis-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const history = await productionAnalysisService.getAnalysisHistory(limit);

    return NextResponse.json({
      success: true,
      history: history.map(item => ({
        id: item.id,
        target_url: item.target_url,
        domain: item.domain,
        status: item.status,
        keywords_found: item.keywords_found,
        completed_at: item.completed_at,
        created_at: item.created_at,
        duration_minutes: item.duration_minutes,
        actual_keywords_count: item.actual_keywords_count,
        average_ranking: item.average_ranking,
      })),
      count: history.length,
    });

  } catch (error) {
    console.error('Analysis history error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analysis history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}