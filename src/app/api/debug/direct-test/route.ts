import { NextResponse } from 'next/server';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY?.substring(0, 20) + '...',
    },
    tests: [] as any[]
  };

  // Test 1: Check if we have a valid Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('lxgnpywigemmxfsnajdhi')) {
    results.tests.push({
      name: 'Supabase URL Check',
      status: 'error',
      message: 'Supabase URL appears to be invalid or placeholder. Need correct Supabase project URL.',
      current: supabaseUrl
    });
  }

  // Test 2: Google AI key test
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GOOGLE_AI_API_KEY);
      const data = await response.json();
      
      results.tests.push({
        name: 'Google AI API Key Test',
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        message: response.ok ? 'API key is valid' : data.error?.message || 'Invalid API key'
      });
    } catch (error) {
      results.tests.push({
        name: 'Google AI API Key Test',
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to test API key'
      });
    }
  }

  // Test 3: Check key format
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (anonKey.startsWith('sb_publishable_') || serviceKey.startsWith('sb_secret_')) {
    results.tests.push({
      name: 'Supabase Key Format Check',
      status: 'warning',
      message: 'Keys use new Supabase format. Ensure you have the correct Supabase project URL.',
      suggestion: 'The Supabase URL should be something like: https://[project-ref].supabase.co'
    });
  }

  return NextResponse.json(results);
}

export async function POST() {
  // Manual test with corrected credentials
  try {
    // We need the correct Supabase URL to proceed
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl.includes('lxgnpywigemmxfsnajdhi')) {
      return NextResponse.json({
        error: 'Invalid Supabase URL',
        message: 'Please provide the correct Supabase project URL in format: https://[project-ref].supabase.co',
        currentUrl: supabaseUrl
      });
    }

    // If we have valid URL, test the connection
    const testUrl = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(testUrl, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });

    return NextResponse.json({
      supabaseTest: {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}