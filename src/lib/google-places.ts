import { Client } from '@googlemaps/google-maps-services-js';

export interface CompetitorBusiness {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  website?: string;
  phoneNumber?: string;
  businessStatus: string;
  types: string[];
  priceLevel?: number;
  photos: Array<{
    photoReference: string;
    width: number;
    height: number;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  openingHours?: {
    openNow: boolean;
    weekdayText?: string[];
  };
  reviews?: Array<{
    authorName: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface CompetitorAnalysis {
  targetBusiness: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  competitors: CompetitorBusiness[];
  analysis: {
    totalCompetitors: number;
    averageRating: number;
    averageReviewCount: number;
    commonTypes: string[];
    priceRange: {
      min?: number;
      max?: number;
    };
    geographicDistribution: {
      within1km: number;
      within2km: number;
      within3km: number;
    };
  };
}

export class GooglePlacesService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    this.client = new Client({});
    
    if (!this.apiKey) {
      console.warn('Google Places API key not found. Competitor analysis will be limited.');
    }
  }

  async getCoordinatesFromUrl(websiteUrl: string): Promise<{lat: number; lng: number} | null> {
    try {
      // First, try to find the business by website
      const searchResponse = await this.client.textSearch({
        params: {
          query: websiteUrl,
          key: this.apiKey,
        },
      });

      if (searchResponse.data.results.length > 0) {
        const location = searchResponse.data.results[0].geometry?.location;
        if (location) {
          return {
            lat: location.lat,
            lng: location.lng,
          };
        }
      }

      // If not found by website, try to extract business name from URL and search
      const domain = new URL(websiteUrl).hostname.replace(/^www\./, '');
      const businessName = domain.split('.')[0];
      
      const nameSearchResponse = await this.client.textSearch({
        params: {
          query: businessName,
          key: this.apiKey,
        },
      });

      if (nameSearchResponse.data.results.length > 0) {
        const location = nameSearchResponse.data.results[0].geometry?.location;
        if (location) {
          return {
            lat: location.lat,
            lng: location.lng,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting coordinates from URL:', error);
      return null;
    }
  }

  async findCompetitors(
    targetUrl: string,
    businessType?: string,
    radius: number = 3000 // 3km in meters
  ): Promise<CompetitorAnalysis | null> {
    try {
      if (!this.apiKey) {
        console.warn('Google Places API key not configured');
        return null;
      }

      // Get coordinates for the target business
      const coordinates = await this.getCoordinatesFromUrl(targetUrl);
      if (!coordinates) {
        throw new Error('Could not determine location for the target business');
      }

      // Determine business type if not provided
      let searchQuery = businessType || this.inferBusinessType(targetUrl);
      
      // Search for nearby competitors
      const nearbyResponse = await this.client.placesNearby({
        params: {
          location: coordinates,
          radius,
          type: 'establishment',
          keyword: searchQuery,
          key: this.apiKey,
        },
      });

      const competitors: CompetitorBusiness[] = [];

      // Process each competitor
      for (const place of nearbyResponse.data.results.slice(0, 15)) {
        try {
          // Get detailed information for each place
          const detailsResponse = await this.client.placeDetails({
            params: {
              place_id: place.place_id!,
              fields: [
                'place_id',
                'name',
                'formatted_address',
                'rating',
                'user_ratings_total',
                'website',
                'formatted_phone_number',
                'business_status',
                'types',
                'price_level',
                'photos',
                'geometry',
                'opening_hours',
                'reviews',
              ],
              key: this.apiKey,
            },
          });

          const details = detailsResponse.data.result;
          if (details) {
            const competitor: CompetitorBusiness = {
              placeId: details.place_id!,
              name: details.name || '',
              address: details.formatted_address || '',
              rating: details.rating || 0,
              userRatingsTotal: details.user_ratings_total || 0,
              website: details.website,
              phoneNumber: details.formatted_phone_number,
              businessStatus: details.business_status || 'UNKNOWN',
              types: details.types || [],
              priceLevel: details.price_level,
              photos: (details.photos || []).map(photo => ({
                photoReference: photo.photo_reference,
                width: photo.width,
                height: photo.height,
              })),
              geometry: {
                location: {
                  lat: details.geometry?.location?.lat || 0,
                  lng: details.geometry?.location?.lng || 0,
                },
              },
              openingHours: details.opening_hours ? {
                openNow: details.opening_hours.open_now || false,
                weekdayText: details.opening_hours.weekday_text,
              } : undefined,
              reviews: (details.reviews || []).slice(0, 5).map(review => ({
                authorName: review.author_name,
                rating: review.rating,
                text: review.text,
                time: typeof review.time === 'number' ? review.time : Date.now(),
              })),
            };

            competitors.push(competitor);
          }

          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Error fetching competitor details:', error);
          continue;
        }
      }

      // Calculate analysis metrics
      const analysis = this.calculateCompetitorAnalysis(competitors, coordinates, radius);

      // Get target business info
      const targetBusiness = await this.getTargetBusinessInfo(targetUrl, coordinates);

      return {
        targetBusiness,
        competitors,
        analysis,
      };

    } catch (error) {
      console.error('Error finding competitors:', error);
      return null;
    }
  }

  private inferBusinessType(url: string): string {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Common business type keywords
    const typeMap: Record<string, string> = {
      'clinic': 'medical clinic',
      'hospital': 'hospital',
      'beauty': 'beauty salon',
      'salon': 'beauty salon',
      'restaurant': 'restaurant',
      'cafe': 'cafe',
      'hotel': 'hotel',
      'dental': 'dental clinic',
      'law': 'law firm',
      'gym': 'gym',
      'fitness': 'fitness center',
      'shop': 'store',
      'store': 'store',
      'market': 'market',
    };

    for (const [keyword, type] of Object.entries(typeMap)) {
      if (domain.includes(keyword)) {
        return type;
      }
    }

    return 'business'; // Default fallback
  }

  private calculateCompetitorAnalysis(
    competitors: CompetitorBusiness[],
    targetLocation: {lat: number; lng: number},
    radius: number
  ): CompetitorAnalysis['analysis'] {
    const validCompetitors = competitors.filter(c => c.businessStatus === 'OPERATIONAL');
    
    const averageRating = validCompetitors.length > 0
      ? validCompetitors.reduce((sum, c) => sum + c.rating, 0) / validCompetitors.length
      : 0;
    
    const averageReviewCount = validCompetitors.length > 0
      ? validCompetitors.reduce((sum, c) => sum + c.userRatingsTotal, 0) / validCompetitors.length
      : 0;

    // Calculate common business types
    const typeCount: Record<string, number> = {};
    validCompetitors.forEach(c => {
      c.types.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
    });
    
    const commonTypes = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);

    // Calculate price range
    const priceLevels = validCompetitors
      .map(c => c.priceLevel)
      .filter(level => level !== undefined) as number[];
    
    const priceRange = priceLevels.length > 0 ? {
      min: Math.min(...priceLevels),
      max: Math.max(...priceLevels),
    } : {};

    // Calculate geographic distribution
    const distances = validCompetitors.map(c => 
      this.calculateDistance(targetLocation, c.geometry.location)
    );

    const geographicDistribution = {
      within1km: distances.filter(d => d <= 1000).length,
      within2km: distances.filter(d => d <= 2000).length,
      within3km: distances.filter(d => d <= 3000).length,
    };

    return {
      totalCompetitors: validCompetitors.length,
      averageRating: Math.round(averageRating * 10) / 10,
      averageReviewCount: Math.round(averageReviewCount),
      commonTypes,
      priceRange,
      geographicDistribution,
    };
  }

  private async getTargetBusinessInfo(
    url: string,
    coordinates: {lat: number; lng: number}
  ): Promise<CompetitorAnalysis['targetBusiness']> {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      const businessName = domain.split('.')[0];
      
      // Try to get more specific business info
      const response = await this.client.textSearch({
        params: {
          query: businessName,
          location: coordinates,
          radius: 1000,
          key: this.apiKey,
        },
      });

      if (response.data.results.length > 0) {
        const business = response.data.results[0];
        return {
          name: business.name || businessName,
          address: business.formatted_address || '',
          coordinates,
        };
      }
    } catch (error) {
      console.error('Error getting target business info:', error);
    }

    // Fallback
    const domain = new URL(url).hostname.replace(/^www\./, '');
    return {
      name: domain.split('.')[0],
      address: 'Unknown',
      coordinates,
    };
  }

  private calculateDistance(
    point1: {lat: number; lng: number},
    point2: {lat: number; lng: number}
  ): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const googlePlacesService = new GooglePlacesService();