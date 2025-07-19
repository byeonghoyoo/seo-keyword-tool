import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Naver API credentials not configured',
        configured: {
          clientId: !!clientId,
          clientSecret: !!clientSecret
        }
      });
    }

    // Test with a simple search query
    const testQuery = '루비성형외과';
    const searchUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(testQuery)}&display=5`;

    const response = await axios.get(searchUrl, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Tool/1.0)',
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      const items = response.data.items || [];
      return NextResponse.json({
        success: true,
        message: 'Naver API working correctly',
        testQuery,
        resultsCount: items.length,
        sampleResults: items.slice(0, 2).map((item: any) => ({
          title: item.title?.replace(/<[^>]*>/g, ''),
          link: item.link,
          description: item.description?.replace(/<[^>]*>/g, '').slice(0, 100) + '...'
        }))
      });
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error('Naver API test error:', error);
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        success: false,
        error: 'Naver API request failed',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          data: error.response?.data
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Naver API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}