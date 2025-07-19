import { NextRequest, NextResponse } from 'next/server';
import { enhancedAnalysisService } from '@/lib/enhanced-analysis-service';
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

    // Validate URL format
    try {
      new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Default options with enhanced settings
    const analysisOptions: AnalysisOptions = {
      maxPages: options?.maxPages || 5,
      includeAds: options?.includeAds ?? true,
      deepAnalysis: options?.deepAnalysis ?? true,
      searchEngine: options?.searchEngine || 'naver',
    };

    // Start enhanced analysis
    const jobId = await enhancedAnalysisService.startAnalysis(targetUrl, analysisOptions);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Enhanced SEO analysis started successfully',
      estimatedDuration: '3-5 minutes',
      features: [
        'Advanced web scraping with Puppeteer',
        'AI-powered keyword extraction (30-50 keywords)',
        'Real-time 5-phase progress tracking',
        'Google Places competitor analysis',
        'Comprehensive ranking verification',
        'Professional report generation',
      ],
    });

  } catch (error) {
    console.error('Enhanced analysis start error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start enhanced analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}