import { NextResponse } from 'next/server';
import { dashboardStatsService } from '@/lib/dashboard-stats';

export async function GET() {
  try {
    const competitors = await dashboardStatsService.getCompetitorProfiles();

    return NextResponse.json({
      success: true,
      competitors,
      count: competitors.length,
    });

  } catch (error) {
    console.error('Competitor profiles error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch competitor profiles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}