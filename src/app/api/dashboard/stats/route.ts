import { NextResponse } from 'next/server';
import { dashboardStatsService } from '@/lib/dashboard-stats';

export async function GET() {
  try {
    const stats = await dashboardStatsService.getDashboardStats();

    return NextResponse.json({
      success: true,
      stats,
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