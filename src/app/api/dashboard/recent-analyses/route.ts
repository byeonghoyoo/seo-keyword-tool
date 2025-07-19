import { NextResponse } from 'next/server';
import { dashboardStatsService } from '@/lib/dashboard-stats';

export async function GET() {
  try {
    const recentAnalyses = await dashboardStatsService.getRecentAnalyses();

    return NextResponse.json({
      success: true,
      analyses: recentAnalyses,
      count: recentAnalyses.length,
    });

  } catch (error) {
    console.error('Recent analyses error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent analyses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}