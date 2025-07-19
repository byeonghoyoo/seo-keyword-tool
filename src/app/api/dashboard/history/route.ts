import { NextRequest, NextResponse } from 'next/server';
import { dashboardStatsService } from '@/lib/dashboard-stats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const history = await dashboardStatsService.getAnalysisHistory(limit);

    return NextResponse.json({
      success: true,
      history,
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