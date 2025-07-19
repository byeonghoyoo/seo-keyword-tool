import { NextRequest, NextResponse } from 'next/server';
import { enhancedGoogleAI } from '@/lib/enhanced-google-ai';
import { fallbackWebScraper } from '@/lib/fallback-scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`Testing AI analysis for: ${url}`);
    
    // First scrape the content
    const scrapedContent = await fallbackWebScraper.scrapeUrl(url);
    console.log(`Scraped content: ${scrapedContent.title}`);
    
    // Then analyze with AI (this will use fallback if no API key)
    const aiAnalysis = await enhancedGoogleAI.analyzeContent(scrapedContent);
    
    return NextResponse.json({
      success: true,
      url: scrapedContent.url,
      title: scrapedContent.title,
      description: scrapedContent.description,
      scrapedKeywords: scrapedContent.keywords.length,
      aiAnalysis: {
        keywordsFound: aiAnalysis.keywords.length,
        primaryKeywords: aiAnalysis.suggestions.primary.length,
        secondaryKeywords: aiAnalysis.suggestions.secondary.length,
        longTailKeywords: aiAnalysis.suggestions.longTail.length,
        industryDetected: aiAnalysis.contentAnalysis.industry,
        sampleKeywords: aiAnalysis.keywords.slice(0, 5).map(k => ({
          keyword: k.keyword,
          relevance: k.relevance,
          category: k.category,
          searchVolume: k.estimatedSearchVolume
        }))
      }
    });

  } catch (error) {
    console.error('AI analysis test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'AI analysis test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}