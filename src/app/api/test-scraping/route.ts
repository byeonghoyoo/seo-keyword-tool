import { NextRequest, NextResponse } from 'next/server';
import { enhancedWebScraper } from '@/lib/enhanced-scraper';
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

    console.log(`Testing web scraping for: ${url}`);
    
    // Try enhanced scraper first, fallback to basic scraper
    let scrapedContent;
    try {
      scrapedContent = await enhancedWebScraper.scrapeUrl(url);
    } catch (puppeteerError) {
      console.log('Puppeteer failed, using fallback scraper:', puppeteerError instanceof Error ? puppeteerError.message : String(puppeteerError));
      scrapedContent = await fallbackWebScraper.scrapeUrl(url);
    }
    
    // Return a subset of the results for testing
    const testResults = {
      success: true,
      url: scrapedContent.url,
      domain: scrapedContent.domain,
      title: scrapedContent.title,
      description: scrapedContent.description,
      keywordCount: scrapedContent.keywords.length,
      headingsCount: {
        h1: scrapedContent.headings.h1.length,
        h2: scrapedContent.headings.h2.length,
        h3: scrapedContent.headings.h3.length,
      },
      contentLength: scrapedContent.content.length,
      imageCount: scrapedContent.images.length,
      linkCount: scrapedContent.links.length,
      seoScore: scrapedContent.seoScore.overall,
      loadTime: scrapedContent.performance.loadTime,
      status: scrapedContent.performance.status,
    };

    return NextResponse.json(testResults);

  } catch (error) {
    console.error('Test scraping error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Scraping test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}