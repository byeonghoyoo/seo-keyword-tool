import { NextRequest, NextResponse } from 'next/server';
import { googlePlacesCompetitor } from '@/lib/google-places-competitor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUrl, radius, maxResults } = body;

    // Validate input
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Target URL is required' },
        { status: 400 }
      );
    }

    // Default options
    const searchRadius = radius || 3000; // 3km default
    const maxCompetitors = maxResults || 15;

    // Find and analyze competitors
    const competitorResult = await googlePlacesCompetitor.findCompetitors(
      targetUrl,
      searchRadius,
      maxCompetitors
    );

    return NextResponse.json({
      success: true,
      data: competitorResult,
      message: `Found ${competitorResult.competitors.length} competitors within ${searchRadius}m radius`,
    });

  } catch (error) {
    console.error('Competitor analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze competitors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}