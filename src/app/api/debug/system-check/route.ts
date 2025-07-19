import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enhancedGoogleAI } from '@/lib/enhanced-google-ai';
import { enhancedWebScraper } from '@/lib/enhanced-scraper';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGoogleAiKey: !!process.env.GOOGLE_AI_API_KEY,
      hasNaverClientId: !!process.env.NAVER_CLIENT_ID,
      hasNaverClientSecret: !!process.env.NAVER_CLIENT_SECRET,
    },
    tests: {
      supabaseConnection: { status: 'pending', details: null as any },
      googleAiConnection: { status: 'pending', details: null as any },
      webScrapingTest: { status: 'pending', details: null as any },
      databaseSchema: { status: 'pending', details: null as any },
    }
  };

  // Test 1: Supabase Connection
  try {
    const { data, error } = await supabaseAdmin
      .from('analysis_jobs')
      .select('count')
      .limit(1);
    
    if (error) {
      results.tests.supabaseConnection = {
        status: 'error',
        details: error.message
      };
    } else {
      results.tests.supabaseConnection = {
        status: 'success',
        details: 'Connected successfully'
      };
    }
  } catch (error) {
    results.tests.supabaseConnection = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown supabase error'
    };
  }

  // Test 2: Database Schema Check
  try {
    const { data: tables, error } = await supabaseAdmin
      .rpc('get_table_info')
      .select('*');
    
    if (error) {
      // Try alternative method to check tables exist
      const checkTables = await Promise.allSettled([
        supabaseAdmin.from('analysis_jobs').select('count').limit(0),
        supabaseAdmin.from('keyword_results').select('count').limit(0),
        supabaseAdmin.from('analysis_logs').select('count').limit(0),
      ]);

      const tablesExist = checkTables.map((result, index) => ({
        table: ['analysis_jobs', 'keyword_results', 'analysis_logs'][index],
        exists: result.status === 'fulfilled'
      }));

      results.tests.databaseSchema = {
        status: tablesExist.every(t => t.exists) ? 'success' : 'warning',
        details: tablesExist
      };
    } else {
      results.tests.databaseSchema = {
        status: 'success',
        details: tables
      };
    }
  } catch (error) {
    results.tests.databaseSchema = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Schema check failed'
    };
  }

  // Test 3: Google AI Connection
  try {
    const testResult = await enhancedGoogleAI.testConnection();
    results.tests.googleAiConnection = {
      status: testResult.success ? 'success' : 'error',
      details: testResult
    };
  } catch (error) {
    results.tests.googleAiConnection = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Google AI test failed'
    };
  }

  // Test 4: Web Scraping Test
  try {
    const scrapingResult = await enhancedWebScraper.testConnection();
    results.tests.webScrapingTest = {
      status: scrapingResult.success ? 'success' : 'warning',
      details: scrapingResult
    };
  } catch (error) {
    results.tests.webScrapingTest = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Web scraping test failed'
    };
  }

  return NextResponse.json(results);
}