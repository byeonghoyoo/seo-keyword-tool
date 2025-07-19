import { NextRequest, NextResponse } from 'next/server';
import { productionAnalysisService } from '@/lib/production-analysis-service';
import type { AnalysisOptions } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUrl, options }: { targetUrl: string; options: AnalysisOptions } = body;

    // Validate input
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Target URL is required' },
        { status: 400 }
      );
    }

    // Default options
    const analysisOptions: AnalysisOptions = {
      maxPages: options?.maxPages || 3,
      includeAds: options?.includeAds ?? true,
      deepAnalysis: options?.deepAnalysis ?? true,
      searchEngine: options?.searchEngine || 'naver',
    };

    // Start production analysis
    const jobId = await productionAnalysisService.startAnalysis(targetUrl, analysisOptions);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Analysis started successfully',
    });
  } catch (error) {
    console.error('Start analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}