import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST() {
  const targetUrl = 'https://m.rubyps.co.kr/';
  const results = {
    timestamp: new Date().toISOString(),
    targetUrl,
    analysis: {
      googleAI: null as any,
      databaseTest: null as any,
      error: null as string | null
    }
  };

  try {
    // Phase 1: Test Google AI Analysis for Ruby Plastic Surgery
    console.log('Testing Google AI analysis for Ruby Plastic Surgery...');
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
루비성형외과 웹사이트 (https://m.rubyps.co.kr/)에 대한 상세한 SEO 키워드 분석을 수행해주세요.

다음 정보를 JSON 형식으로 제공해주세요:
{
  "primary_keywords": ["키워드1", "키워드2", "키워드3"],
  "secondary_keywords": ["키워드4", "키워드5", "키워드6"],
  "long_tail_keywords": ["긴꼬리 키워드1", "긴꼬리 키워드2"],
  "business_analysis": {
    "industry": "성형외과",
    "target_audience": "성형수술 관심고객",
    "main_services": ["서비스1", "서비스2"]
  },
  "seo_recommendations": ["추천1", "추천2", "추천3"]
}

루비성형외과는 한국의 성형외과 클리닉입니다. 성형수술, 피부관리, 미용 시술 등을 제공합니다.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from the response
    let parsedAnalysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        parsedAnalysis = { raw_response: text.substring(0, 500) };
      }
    } catch {
      parsedAnalysis = { raw_response: text.substring(0, 500) };
    }

    results.analysis.googleAI = {
      success: true,
      responseLength: text.length,
      analysisData: parsedAnalysis,
      fullResponse: text.substring(0, 1000) + '...'
    };

    // Phase 2: Test Supabase Database Connection
    console.log('Testing Supabase database connection...');
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );

      // Test basic database query
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('count')
        .limit(1);

      if (error) {
        results.analysis.databaseTest = {
          success: false,
          error: error.message,
          suggestion: 'Please provide the correct Supabase project URL'
        };
      } else {
        results.analysis.databaseTest = {
          success: true,
          message: 'Database connection successful',
          tablesAccessible: true
        };
      }
    } catch (dbError) {
      results.analysis.databaseTest = {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Database connection failed',
        suggestion: 'Please verify Supabase URL and credentials'
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis test completed',
      results
    });

  } catch (error) {
    results.analysis.error = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: results.analysis.error,
      results
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Ruby Plastic Surgery SEO Analysis Test',
    instructions: 'Use POST method to run the test',
    targetUrl: 'https://m.rubyps.co.kr/'
  });
}