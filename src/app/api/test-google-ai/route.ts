import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST() {
  const results = {
    timestamp: new Date().toISOString(),
    googleAiTest: null as any,
    error: null as string | null
  };

  try {
    // Test Google AI with Ruby Plastic Surgery content
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
루비성형외과 웹사이트를 위한 SEO 키워드를 분석해주세요.
대상 웹사이트: https://m.rubyps.co.kr/

다음 형식으로 10개의 주요 키워드를 제공해주세요:
1. 키워드
2. 검색 의도 (정보성/거래성/탐색성)
3. 경쟁도 (낮음/중간/높음)
4. 예상 월 검색량

루비성형외과는 한국의 성형외과 클리닉입니다.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    results.googleAiTest = {
      success: true,
      prompt: prompt.substring(0, 100) + '...',
      responseLength: text.length,
      response: text
    };

    return NextResponse.json({
      success: true,
      message: 'Google AI is working correctly!',
      results
    });

  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: results.error,
      results
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google AI API Key Status',
    apiKey: process.env.GOOGLE_AI_API_KEY ? 'Set' : 'Missing',
    keyFormat: process.env.GOOGLE_AI_API_KEY?.substring(0, 10) + '...'
  });
}