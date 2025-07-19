import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enhancedGoogleAI } from '@/lib/enhanced-google-ai';
import type { KeywordResultInsert } from '@/types';

export async function POST(request: Request) {
  try {
    const { targetUrl, options } = await request.json();
    
    // Validate URL
    const normalizedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const domain = new URL(normalizedUrl).hostname.replace(/^www\./, '');
    
    console.log(`Starting analysis for ${normalizedUrl}`);
    
    // Create analysis job in database
    const { data: job, error } = await supabaseAdmin
      .from('analysis_jobs')
      .insert({
        target_url: normalizedUrl,
        domain: domain,
        status: 'running',
        progress: 0,
        current_phase: 'analyzing',
        keywords_found: 0,
        processed_keywords: 0,
        total_keywords: 0,
        analysis_options: options || {},
      })
      .select()
      .single();

    if (error || !job) {
      throw new Error(`Failed to create analysis job: ${error?.message || 'Unknown error'}`);
    }

    console.log(`Created job ${job.id}`);

    // Phase 1: Update progress - analyzing (20%)
    await updateJobProgress(job.id, 20, 'analyzing', 'Creating simulated website data...');
    
    // Create mock scraped content for Ruby Plastic Surgery
    const mockScrapedContent = {
      url: normalizedUrl,
      domain: domain,
      title: '루비성형외과 - 강남 성형외과 전문의',
      description: '강남역 루비성형외과는 쌍꺼풀수술, 코성형, 리프팅 등 다양한 성형수술을 전문으로 하는 성형외과입니다.',
      keywords: ['루비성형외과', '강남성형외과', '성형수술', '쌍꺼풀수술', '코성형', '리프팅', '보톡스', '필러'],
      headings: {
        h1: ['루비성형외과', '전문 성형외과 클리닉'],
        h2: ['쌍꺼풀수술', '코성형', '안면윤곽', '가슴성형', '리프팅'],
        h3: ['자연스러운 결과', '안전한 수술', '1:1 맞춤 상담']
      },
      content: '루비성형외과는 강남역에 위치한 전문 성형외과 클리닉입니다. 쌍꺼풀수술, 코성형, 안면윤곽, 가슴성형, 리프팅 등 다양한 성형수술을 제공합니다.',
      metaTags: {
        'og:title': '루비성형외과 - 강남 성형외과',
        'description': '강남역 루비성형외과는 쌍꺼풀수술, 코성형, 리프팅 등 다양한 성형수술을 전문으로 하는 성형외과입니다.'
      },
      images: [],
      links: [],
      structuredData: [],
      socialMedia: {},
      contactInfo: {
        phones: ['02-1234-5678'],
        emails: ['info@rubyps.co.kr'],
        addresses: ['서울특별시 강남구 강남대로']
      },
      businessInfo: {
        name: '루비성형외과',
        category: '성형외과',
        location: {
          address: '서울특별시 강남구 강남대로'
        }
      },
      performance: {
        loadTime: 2000,
        size: 50000,
        status: 200
      },
      seoScore: {
        title: 85,
        description: 80,
        headings: 90,
        keywords: 88,
        images: 70,
        overall: 83
      }
    };

    // Phase 2: Update progress - AI analysis (40%)
    await updateJobProgress(job.id, 40, 'expanding', 'Analyzing content with Google AI...');
    
    // Perform AI analysis
    const aiAnalysis = await enhancedGoogleAI.analyzeContent(mockScrapedContent);
    
    console.log(`AI analysis completed. Generated ${aiAnalysis.keywords.length} keywords`);

    // Phase 3: Update progress - processing (60%)
    await updateJobProgress(job.id, 60, 'crawling', 'Processing keyword metrics...');
    
    // Process keywords into database format
    const keywordResults: KeywordResultInsert[] = aiAnalysis.keywords.map((keyword, index) => ({
      job_id: job.id,
      keyword: keyword.keyword,
      position: estimatePosition(keyword),
      page: Math.ceil(estimatePosition(keyword) / 10),
      type: inferResultType(keyword.searchIntent),
      url: normalizedUrl,
      title: `${keyword.keyword} - 루비성형외과`,
      snippet: `루비성형외과에서 ${keyword.keyword} 관련 전문 서비스를 제공합니다.`,
      search_volume: keyword.estimatedSearchVolume,
      competition: keyword.competitionLevel,
      estimated_cpc: keyword.estimatedCPC,
      previous_position: undefined,
      discovered_at: new Date().toISOString(),
    }));

    // Phase 4: Update progress - saving (80%)
    await updateJobProgress(job.id, 80, 'processing', 'Saving analysis results...');
    
    // Save keyword results to database
    if (keywordResults.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('keyword_results')
        .insert(keywordResults);

      if (insertError) {
        throw new Error(`Failed to save keyword results: ${insertError.message}`);
      }
    }

    // Add analysis log
    await addLog(job.id, 'success', `Saved ${keywordResults.length} keyword results`);

    // Phase 5: Complete analysis (100%)
    await updateJobProgress(job.id, 100, 'completing', 'Analysis completed successfully');
    
    // Update job as completed
    await supabaseAdmin
      .from('analysis_jobs')
      .update({
        status: 'completed',
        progress: 100,
        keywords_found: keywordResults.length,
        processed_keywords: keywordResults.length,
        total_keywords: keywordResults.length,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    await addLog(job.id, 'success', `Analysis completed successfully. Processed ${keywordResults.length} keywords`);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Analysis completed successfully (simulated)',
      results: {
        keywordsFound: keywordResults.length,
        aiAnalysis: {
          contentAnalysis: aiAnalysis.contentAnalysis,
          marketInsights: aiAnalysis.marketInsights,
          suggestions: aiAnalysis.suggestions
        }
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper functions
async function updateJobProgress(
  jobId: string,
  progress: number,
  phase: string,
  currentKeyword?: string
): Promise<void> {
  const updateData: any = {
    progress: Math.round(progress),
    current_phase: phase,
    updated_at: new Date().toISOString(),
  };
  
  if (currentKeyword) updateData.current_keyword = currentKeyword;

  const { error } = await supabaseAdmin
    .from('analysis_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error('Failed to update job progress:', error);
  }
}

async function addLog(
  jobId: string,
  level: 'info' | 'warning' | 'error' | 'success',
  message: string,
  phase?: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('analysis_logs')
    .insert({
      job_id: jobId,
      level,
      message,
      phase,
      timestamp: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to add log:', error);
  }
}

function estimatePosition(keyword: any): number {
  let basePosition = 50;
  
  if (keyword.category === 'primary') basePosition = 20;
  else if (keyword.category === 'secondary') basePosition = 35;
  else if (keyword.category === 'long-tail') basePosition = 15;
  
  if (keyword.competitionLevel === 'low') basePosition *= 0.6;
  else if (keyword.competitionLevel === 'high') basePosition *= 1.4;
  
  if (keyword.relevance > 80) basePosition *= 0.7;
  
  return Math.min(100, Math.max(1, Math.round(basePosition + (Math.random() - 0.5) * 20)));
}

function inferResultType(searchIntent: string): 'organic' | 'ad' | 'shopping' | 'local' {
  switch (searchIntent) {
    case 'transactional':
      return Math.random() > 0.7 ? 'ad' : 'organic';
    case 'commercial':
      return Math.random() > 0.6 ? 'shopping' : 'organic';
    case 'navigational':
      return Math.random() > 0.8 ? 'local' : 'organic';
    default:
      return 'organic';
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SEO Analysis Test (Without Web Scraping)',
    instructions: 'Use POST method with targetUrl and options',
    example: {
      targetUrl: 'https://m.rubyps.co.kr/',
      options: {
        maxPages: 3,
        includeAds: true,
        deepAnalysis: true,
        searchEngine: 'naver'
      }
    }
  });
}