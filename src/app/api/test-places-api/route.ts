import { NextResponse } from 'next/server';

export async function POST() {
  const results = {
    timestamp: new Date().toISOString(),
    placesApiTest: null as any,
    error: null as string | null
  };

  try {
    // Test Google Places API with a search for plastic surgery clinics in Gangnam
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Search for plastic surgery clinics near Gangnam
    const query = '강남 성형외과';
    const location = '37.4979,127.0276'; // Gangnam coordinates
    const radius = '3000'; // 3km radius

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&key=${apiKey}`;

    console.log('Testing Google Places API...');
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const competitors = data.results.slice(0, 5).map((place: any) => ({
        name: place.name,
        rating: place.rating,
        address: place.formatted_address,
        placeId: place.place_id,
        types: place.types
      }));

      results.placesApiTest = {
        success: true,
        status: data.status,
        totalResults: data.results.length,
        competitors,
        message: 'Google Places API is working correctly!'
      };
    } else {
      results.placesApiTest = {
        success: false,
        status: data.status,
        error: data.error_message || 'Places API request failed',
        details: data
      };
    }

    return NextResponse.json({
      success: results.placesApiTest?.success || false,
      message: results.placesApiTest?.message || 'Places API test completed',
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
    message: 'Google Places API Test',
    instructions: 'Use POST method to test Places API',
    apiKey: process.env.GOOGLE_PLACES_API_KEY ? 'Set' : 'Missing'
  });
}