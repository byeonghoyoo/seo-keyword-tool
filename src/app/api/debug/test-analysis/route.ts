import { NextResponse } from 'next/server';
import { productionAnalysisService } from '@/lib/production-analysis-service';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  const targetUrl = 'https://m.rubyps.co.kr/';
  const options = {
    maxPages: 3,
    includeAds: true,
    deepAnalysis: true,
    searchEngine: 'naver' as const,
  };

  const debugInfo = {
    timestamp: new Date().toISOString(),
    targetUrl,
    options,
    steps: [] as Array<{ step: string; status: 'success' | 'error' | 'warning'; details: any; timestamp: string }>
  };

  const addStep = (step: string, status: 'success' | 'error' | 'warning', details: any) => {
    debugInfo.steps.push({
      step,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  };

  try {
    // Step 1: Test URL normalization
    addStep('URL Normalization', 'success', { 
      original: targetUrl,
      normalized: targetUrl,
      domain: new URL(targetUrl).hostname 
    });

    // Step 2: Test database connection
    try {
      const { data, error } = await supabaseAdmin
        .from('analysis_jobs')
        .select('count')
        .limit(1);
      
      if (error) {
        addStep('Database Connection', 'error', error);
        return NextResponse.json(debugInfo);
      }
      addStep('Database Connection', 'success', 'Connected to Supabase');
    } catch (dbError) {
      addStep('Database Connection', 'error', dbError instanceof Error ? dbError.message : 'Unknown database error');
      return NextResponse.json(debugInfo);
    }

    // Step 3: Test job creation
    try {
      const jobId = await productionAnalysisService.startAnalysis(targetUrl, options);
      addStep('Job Creation', 'success', { jobId });

      // Step 4: Check job status
      setTimeout(async () => {
        try {
          const job = await productionAnalysisService.getJobStatus(jobId);
          addStep('Job Status Check', 'success', { 
            status: job?.status,
            progress: job?.progress,
            currentPhase: job?.currentPhase 
          });
        } catch (statusError) {
          addStep('Job Status Check', 'error', statusError instanceof Error ? statusError.message : 'Status check failed');
        }
      }, 1000);

      return NextResponse.json({
        ...debugInfo,
        result: 'success',
        jobId,
        message: 'Analysis started successfully'
      });

    } catch (analysisError) {
      addStep('Analysis Start', 'error', analysisError instanceof Error ? analysisError.message : 'Analysis failed');
      return NextResponse.json(debugInfo);
    }

  } catch (error) {
    addStep('General Error', 'error', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(debugInfo);
  }
}

export async function GET() {
  // Get recent debug information from database
  try {
    const { data: recentJobs, error } = await supabaseAdmin
      .from('analysis_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch recent jobs',
        details: error.message
      });
    }

    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from('analysis_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    return NextResponse.json({
      recentJobs,
      recentLogs: logsError ? null : recentLogs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug info fetch failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}