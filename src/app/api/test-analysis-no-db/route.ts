import { NextResponse } from 'next/server';
import { enhancedWebScraper } from '@/lib/enhanced-scraper';
import { enhancedGoogleAI } from '@/lib/enhanced-google-ai';

export async function POST() {
  const targetUrl = 'https://m.rubyps.co.kr/';
  const results = {
    timestamp: new Date().toISOString(),
    targetUrl,
    phases: [] as any[],
    keywords: [] as any[],
    error: null as string | null
  };

  try {
    // Phase 1: Web Scraping
    console.log('Starting web scraping...');
    results.phases.push({ phase: 'scraping', status: 'started', time: new Date().toISOString() });
    
    const scrapedContent = await enhancedWebScraper.scrapeUrl(targetUrl);
    
    results.phases.push({
      phase: 'scraping',
      status: 'completed',
      time: new Date().toISOString(),
      data: {
        title: scrapedContent.title,
        keywordsFound: scrapedContent.keywords.length,
        headings: {
          h1: scrapedContent.headings.h1.length,
          h2: scrapedContent.headings.h2.length,
          h3: scrapedContent.headings.h3.length
        },
        seoScore: scrapedContent.seoScore
      }
    });

    // Phase 2: AI Analysis
    console.log('Starting AI analysis...');
    results.phases.push({ phase: 'ai-analysis', status: 'started', time: new Date().toISOString() });
    
    const aiAnalysis = await enhancedGoogleAI.analyzeContent(scrapedContent);
    
    results.phases.push({
      phase: 'ai-analysis',
      status: 'completed',
      time: new Date().toISOString(),
      data: {
        keywordsGenerated: aiAnalysis.keywords.length,
        contentAnalysis: aiAnalysis.contentAnalysis,
        marketInsights: aiAnalysis.marketInsights,
        suggestions: aiAnalysis.suggestions
      }
    });

    // Sample keywords for display
    results.keywords = aiAnalysis.keywords.slice(0, 10).map((kw, idx) => ({
      id: idx,
      keyword: kw.keyword,
      category: kw.category,
      relevance: kw.relevance,
      searchIntent: kw.searchIntent,
      competitionLevel: kw.competitionLevel,
      estimatedSearchVolume: kw.estimatedSearchVolume,
      estimatedCPC: kw.estimatedCPC
    }));

    // Cleanup
    await enhancedWebScraper.close();

    return NextResponse.json({
      success: true,
      message: 'Analysis completed successfully without database',
      results
    });

  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('Analysis error:', error);
    
    // Ensure cleanup
    await enhancedWebScraper.close();
    
    return NextResponse.json({
      success: false,
      error: results.error,
      results
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to test analysis',
    endpoint: '/api/test-analysis-no-db',
    method: 'POST'
  });
}