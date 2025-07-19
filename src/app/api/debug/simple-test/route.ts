import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{ name: string; success: boolean; details: any }>
  };

  // Test 1: Environment Variables
  results.tests.push({
    name: 'Environment Variables',
    success: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    details: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      googleAiKey: process.env.GOOGLE_AI_API_KEY ? 'Set' : 'Missing',
    }
  });

  // Test 2: Database Connection
  try {
    const { data, error } = await supabaseAdmin
      .from('analysis_jobs')
      .select('count')
      .limit(1);
    
    results.tests.push({
      name: 'Database Connection',
      success: !error,
      details: error ? error.message : 'Connected successfully'
    });
  } catch (dbError) {
    results.tests.push({
      name: 'Database Connection',
      success: false,
      details: dbError instanceof Error ? dbError.message : 'Connection failed'
    });
  }

  // Test 3: Insert Test Job
  try {
    const testUrl = 'https://m.rubyps.co.kr/';
    const testDomain = new URL(testUrl).hostname;
    
    const { data: job, error } = await supabaseAdmin
      .from('analysis_jobs')
      .insert({
        target_url: testUrl,
        domain: testDomain,
        status: 'pending',
        progress: 0,
        current_phase: 'testing',
        analysis_options: { test: true }
      })
      .select()
      .single();

    if (error) {
      results.tests.push({
        name: 'Job Creation Test',
        success: false,
        details: error.message
      });
    } else {
      results.tests.push({
        name: 'Job Creation Test',
        success: true,
        details: { jobId: job.id, created: true }
      });

      // Clean up test job
      await supabaseAdmin
        .from('analysis_jobs')
        .delete()
        .eq('id', job.id);
    }
  } catch (insertError) {
    results.tests.push({
      name: 'Job Creation Test',
      success: false,
      details: insertError instanceof Error ? insertError.message : 'Insert failed'
    });
  }

  // Test 4: URL Validation
  try {
    const testUrl = 'https://m.rubyps.co.kr/';
    const urlObj = new URL(testUrl);
    
    results.tests.push({
      name: 'URL Validation',
      success: true,
      details: {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname
      }
    });
  } catch (urlError) {
    results.tests.push({
      name: 'URL Validation',
      success: false,
      details: urlError instanceof Error ? urlError.message : 'URL validation failed'
    });
  }

  return NextResponse.json(results);
}

export async function POST() {
  // Test actual job creation similar to production service
  try {
    const targetUrl = 'https://m.rubyps.co.kr/';
    const domain = new URL(targetUrl).hostname;
    const options = {
      maxPages: 3,
      includeAds: true,
      deepAnalysis: true,
      searchEngine: 'naver' as const,
    };

    console.log('Creating test analysis job...', { targetUrl, domain, options });

    const { data: job, error } = await supabaseAdmin
      .from('analysis_jobs')
      .insert({
        target_url: targetUrl,
        domain: domain,
        status: 'pending',
        progress: 0,
        current_phase: 'analyzing',
        keywords_found: 0,
        processed_keywords: 0,
        total_keywords: 0,
        analysis_options: options,
      })
      .select()
      .single();

    if (error) {
      console.error('Job creation error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create job',
        details: error
      });
    }

    console.log('Test job created successfully:', job.id);

    // Immediately update to running status to test update functionality
    const { error: updateError } = await supabaseAdmin
      .from('analysis_jobs')
      .update({
        status: 'running',
        progress: 10,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      console.error('Job update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Test job created and updated successfully',
      details: {
        targetUrl,
        domain,
        options,
        updateError: updateError ? updateError.message : null
      }
    });

  } catch (error) {
    console.error('Test creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}