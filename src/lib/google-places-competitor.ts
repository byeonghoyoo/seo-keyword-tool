import axios from 'axios';
import { supabaseAdmin } from './supabase';
import { enhancedWebScraper } from './enhanced-scraper';
import { enhancedGoogleAI } from './enhanced-google-ai';

export interface CompetitorProfile {
  id: string;
  domain: string;
  name: string;
  website: string;
  businessType: string;
  googlePlaceId: string;
  rating: number;
  reviewCount: number;
  phone?: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  categories: string[];
  photos: string[];
  isActive: boolean;
}

export interface CompetitorAnalysis {
  competitor: CompetitorProfile;
  commonKeywords: number;
  uniqueKeywords: number;
  averageRanking: number;
  opportunityScore: number;
  threatLevel: 'low' | 'medium' | 'high';
  keywordOverlap: string[];
  gapKeywords: string[];
}

export interface CompetitorSearchResult {
  competitors: CompetitorProfile[];
  analysis: CompetitorAnalysis[];
  totalFound: number;
  searchRadius: number;
  centerLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}

class GooglePlacesCompetitorService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
    }
  }

  async findCompetitors(
    targetUrl: string,
    radius: number = 3000, // 3km radius
    maxResults: number = 15
  ): Promise<CompetitorSearchResult> {
    try {
      // Extract business information from target URL
      const targetInfo = await this.extractBusinessInfo(targetUrl);
      
      if (!targetInfo.location) {
        throw new Error('Could not determine business location from target URL');
      }

      // Search for nearby competitors
      const competitors = await this.searchNearbyBusinesses(
        targetInfo.location,
        targetInfo.businessType,
        radius,
        maxResults
      );

      // Analyze competitors
      const analysis = await this.analyzeCompetitors(competitors, targetUrl);

      // Store competitors in database
      await this.storeCompetitors(competitors);

      return {
        competitors,
        analysis,
        totalFound: competitors.length,
        searchRadius: radius,
        centerLocation: {
          lat: targetInfo.location.lat,
          lng: targetInfo.location.lng,
          address: targetInfo.address || 'Unknown location',
        },
      };

    } catch (error) {
      console.error('Competitor search error:', error);
      throw new Error(`Failed to find competitors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractBusinessInfo(targetUrl: string): Promise<any> {
    try {
      // Scrape target website to extract business information
      const scrapedContent = await enhancedWebScraper.scrapeUrl(targetUrl);
      
      let location = null;
      let businessType = 'general';
      let address = '';

      // Extract location from scraped content
      if (scrapedContent.businessInfo?.location?.coordinates) {
        location = scrapedContent.businessInfo.location.coordinates;
        address = scrapedContent.businessInfo.location.address || '';
      }

      // If no coordinates found, try to geocode the address
      if (!location && scrapedContent.contactInfo?.addresses?.length > 0) {
        const firstAddress = scrapedContent.contactInfo.addresses[0];
        location = await this.geocodeAddress(firstAddress);
        address = firstAddress;
      }

      // Infer business type from content
      businessType = this.inferBusinessType(scrapedContent);

      return {
        location,
        businessType,
        address,
        name: scrapedContent.businessInfo?.name || scrapedContent.title,
      };

    } catch (error) {
      console.error('Failed to extract business info:', error);
      throw new Error('Could not extract business information from target URL');
    }
  }

  private async geocodeAddress(address: string): Promise<{lat: number; lng: number} | null> {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: address,
            key: this.apiKey,
            language: 'ko',
          },
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  private async searchNearbyBusinesses(
    location: {lat: number; lng: number},
    businessType: string,
    radius: number,
    maxResults: number
  ): Promise<CompetitorProfile[]> {
    try {
      const competitors: CompetitorProfile[] = [];
      
      // Determine search query based on business type
      const searchQueries = this.getSearchQueries(businessType);
      
      for (const query of searchQueries) {
        if (competitors.length >= maxResults) break;
        
        const results = await this.performPlacesSearch(location, query, radius);
        
        for (const place of results) {
          if (competitors.length >= maxResults) break;
          
          try {
            const competitor = await this.processPlaceResult(place);
            if (competitor && competitor.website) {
              competitors.push(competitor);
            }
          } catch (error) {
            console.error('Error processing place result:', error);
            continue;
          }
        }
      }

      return competitors.slice(0, maxResults);
      
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  }

  private async performPlacesSearch(
    location: {lat: number; lng: number},
    query: string,
    radius: number
  ): Promise<any[]> {
    try {
      // Text search for businesses
      const response = await axios.get(
        `${this.baseUrl}/textsearch/json`,
        {
          params: {
            query: query,
            location: `${location.lat},${location.lng}`,
            radius: radius,
            key: this.apiKey,
            language: 'ko',
            type: 'establishment',
          },
        }
      );

      if (response.data.status === 'OK') {
        return response.data.results || [];
      }

      return [];
    } catch (error) {
      console.error('Places API error:', error);
      return [];
    }
  }

  private async processPlaceResult(place: any): Promise<CompetitorProfile | null> {
    try {
      // Get detailed place information
      const details = await this.getPlaceDetails(place.place_id);
      
      if (!details || !details.website) {
        return null; // Skip if no website
      }

      const domain = this.extractDomain(details.website);
      
      return {
        id: place.place_id,
        domain,
        name: details.name || place.name,
        website: details.website,
        businessType: this.categorizeBusinessType(details.types || place.types || []),
        googlePlaceId: place.place_id,
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        phone: details.formatted_phone_number,
        address: details.formatted_address || place.formatted_address || '',
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        categories: details.types || place.types || [],
        photos: this.extractPhotos(details.photos || place.photos || []),
        isActive: true,
      };
      
    } catch (error) {
      console.error('Error processing place result:', error);
      return null;
    }
  }

  private async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'name,website,formatted_phone_number,formatted_address,types,photos,rating,user_ratings_total',
            key: this.apiKey,
            language: 'ko',
          },
        }
      );

      if (response.data.status === 'OK') {
        return response.data.result;
      }

      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  private async analyzeCompetitors(
    competitors: CompetitorProfile[],
    targetUrl: string
  ): Promise<CompetitorAnalysis[]> {
    const analysis: CompetitorAnalysis[] = [];
    
    try {
      // Get target website keywords for comparison
      const targetContent = await enhancedWebScraper.scrapeUrl(targetUrl);
      const targetAI = await enhancedGoogleAI.analyzeContent(targetContent);
      const targetKeywords = new Set(targetAI.keywords.map(k => k.keyword.toLowerCase()));

      for (const competitor of competitors) {
        try {
          const competitorAnalysis = await this.analyzeCompetitor(
            competitor,
            targetKeywords
          );
          analysis.push(competitorAnalysis);
        } catch (error) {
          console.error(`Error analyzing competitor ${competitor.name}:`, error);
          // Add basic analysis even if detailed analysis fails
          analysis.push({
            competitor,
            commonKeywords: 0,
            uniqueKeywords: 0,
            averageRanking: 50,
            opportunityScore: 0,
            threatLevel: 'low',
            keywordOverlap: [],
            gapKeywords: [],
          });
        }
      }
      
    } catch (error) {
      console.error('Competitor analysis error:', error);
    }

    return analysis;
  }

  private async analyzeCompetitor(
    competitor: CompetitorProfile,
    targetKeywords: Set<string>
  ): Promise<CompetitorAnalysis> {
    try {
      // Analyze competitor website
      const competitorContent = await enhancedWebScraper.scrapeUrl(competitor.website);
      const competitorAI = await enhancedGoogleAI.analyzeContent(competitorContent);
      
      const competitorKeywords = competitorAI.keywords.map(k => k.keyword.toLowerCase());
      const competitorKeywordSet = new Set(competitorKeywords);

      // Find overlapping keywords
      const overlap = Array.from(targetKeywords).filter(k => competitorKeywordSet.has(k));
      
      // Find gap keywords (competitor has, target doesn't)
      const gaps = competitorKeywords.filter(k => !targetKeywords.has(k)).slice(0, 10);

      // Calculate metrics
      const commonKeywords = overlap.length;
      const uniqueKeywords = competitorKeywords.length - commonKeywords;
      const averageRanking = competitorAI.keywords.reduce((sum, k) => sum + (k.relevance || 50), 0) / competitorKeywords.length;
      
      // Calculate opportunity score (higher when competitor has many unique high-value keywords)
      const opportunityScore = Math.min(100, (uniqueKeywords * 2) + (competitor.rating * 10));
      
      // Determine threat level
      let threatLevel: 'low' | 'medium' | 'high' = 'low';
      if (commonKeywords > 15 && competitor.rating > 4.0) threatLevel = 'high';
      else if (commonKeywords > 8 || competitor.rating > 3.5) threatLevel = 'medium';

      return {
        competitor,
        commonKeywords,
        uniqueKeywords,
        averageRanking,
        opportunityScore,
        threatLevel,
        keywordOverlap: overlap.slice(0, 10),
        gapKeywords: gaps,
      };

    } catch (error) {
      console.error(`Failed to analyze competitor ${competitor.name}:`, error);
      
      // Return basic analysis
      return {
        competitor,
        commonKeywords: 0,
        uniqueKeywords: 0,
        averageRanking: 50,
        opportunityScore: 0,
        threatLevel: 'low',
        keywordOverlap: [],
        gapKeywords: [],
      };
    }
  }

  private async storeCompetitors(competitors: CompetitorProfile[]): Promise<void> {
    try {
      for (const competitor of competitors) {
        const { error } = await supabaseAdmin
          .from('competitor_profiles')
          .upsert({
            id: competitor.id,
            domain: competitor.domain,
            name: competitor.name,
            website: competitor.website,
            business_type: competitor.businessType,
            google_place_id: competitor.googlePlaceId,
            rating: competitor.rating,
            review_count: competitor.reviewCount,
            phone: competitor.phone,
            address: competitor.address,
            location_lat: competitor.location.lat,
            location_lng: competitor.location.lng,
            categories: competitor.categories,
            photos: competitor.photos,
            last_analyzed: new Date().toISOString(),
            is_active: competitor.isActive,
          }, {
            onConflict: 'google_place_id'
          });

        if (error) {
          console.error('Error storing competitor:', error);
        }
      }
    } catch (error) {
      console.error('Failed to store competitors:', error);
    }
  }

  private getSearchQueries(businessType: string): string[] {
    const queryMap: Record<string, string[]> = {
      'medical': ['병원', '의원', '클리닉', '치과', '한의원'],
      'beauty': ['미용실', '네일샵', '피부관리실', '성형외과', '뷰티샵'],
      'restaurant': ['레스토랑', '식당', '카페', '음식점', '맛집'],
      'retail': ['쇼핑몰', '상점', '매장', '스토어', '판매점'],
      'education': ['학원', '교육원', '스쿨', '센터', '학습지'],
      'fitness': ['헬스장', '요가원', '필라테스', '체육관', '운동센터'],
      'automotive': ['정비소', '세차장', '자동차', '카센터', '주유소'],
      'general': ['비즈니스', '서비스', '업체', '센터', '사무소'],
    };

    return queryMap[businessType] || queryMap['general'];
  }

  private categorizeBusinessType(types: string[]): string {
    const typeMap: Record<string, string> = {
      'doctor': 'medical',
      'hospital': 'medical',
      'dentist': 'medical',
      'beauty_salon': 'beauty',
      'hair_care': 'beauty',
      'spa': 'beauty',
      'restaurant': 'restaurant',
      'cafe': 'restaurant',
      'food': 'restaurant',
      'store': 'retail',
      'shopping_mall': 'retail',
      'school': 'education',
      'university': 'education',
      'gym': 'fitness',
      'car_repair': 'automotive',
      'gas_station': 'automotive',
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    return 'general';
  }

  private inferBusinessType(scrapedContent: any): string {
    const content = (scrapedContent.title + ' ' + scrapedContent.description + ' ' + scrapedContent.content).toLowerCase();
    
    const businessTypes = {
      'medical': ['병원', '의원', '클리닉', '치과', '한의원', '의료', '진료', '치료'],
      'beauty': ['미용', '뷰티', '성형', '피부', '네일', '헤어', '화장품'],
      'restaurant': ['음식', '레스토랑', '카페', '식당', '요리', '맛집', '메뉴'],
      'retail': ['쇼핑', '판매', '상품', '제품', '스토어', '매장'],
      'education': ['교육', '학원', '수업', '강의', '학습', '공부'],
      'fitness': ['헬스', '운동', '피트니스', '요가', '필라테스', '체육'],
    };

    for (const [type, keywords] of Object.entries(businessTypes)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return type;
      }
    }

    return 'general';
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  private extractPhotos(photos: any[]): string[] {
    return photos.slice(0, 5).map(photo => {
      if (photo.photo_reference) {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`;
      }
      return '';
    }).filter(Boolean);
  }
}

export const googlePlacesCompetitor = new GooglePlacesCompetitorService();