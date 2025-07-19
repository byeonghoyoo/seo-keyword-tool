import { NextResponse } from 'next/server';
import { googlePlacesService } from '@/lib/google-places';

export async function POST() {
  try {
    const testUrl = 'https://m.rubyps.co.kr';
    
    console.log(`Testing Google Places for: ${testUrl}`);
    
    const competitorAnalysis = await googlePlacesService.findCompetitors(
      testUrl,
      'beauty salon',
      3000 // 3km radius
    );

    if (competitorAnalysis) {
      return NextResponse.json({
        success: true,
        message: 'Google Places API working correctly',
        targetBusiness: competitorAnalysis.targetBusiness,
        competitorsFound: competitorAnalysis.competitors.length,
        analysis: competitorAnalysis.analysis,
        sampleCompetitors: competitorAnalysis.competitors.slice(0, 3).map(comp => ({
          name: comp.name,
          rating: comp.rating,
          address: comp.address,
          types: comp.types.slice(0, 3)
        }))
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Google Places API not configured or no results found',
        details: 'Either API key is missing or no competitors found in the area'
      });
    }

  } catch (error) {
    console.error('Google Places test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Google Places test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}