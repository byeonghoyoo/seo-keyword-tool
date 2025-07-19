import axios from 'axios';

export interface SearchResult {
  position: number;
  title: string;
  url: string;
  snippet: string;
  type: 'organic' | 'ad' | 'shopping' | 'local';
  page: number;
}

export interface RankingResult {
  keyword: string;
  targetDomain: string;
  results: SearchResult[];
  targetFound: boolean;
  targetPosition: number | null;
  totalResults: number;
  searchEngine: 'naver' | 'google';
  timestamp: Date;
}

export class SearchRankingService {
  private naverClientId: string;
  private naverClientSecret: string;
  private googleApiKey: string;
  private googleSearchEngineId: string;

  constructor() {
    this.naverClientId = process.env.NAVER_CLIENT_ID || '';
    this.naverClientSecret = process.env.NAVER_CLIENT_SECRET || '';
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
  }

  async checkKeywordRanking(
    keyword: string, 
    targetDomain: string, 
    searchEngine: 'naver' | 'google' = 'naver',
    maxPages: number = 3
  ): Promise<RankingResult> {
    try {
      if (searchEngine === 'naver') {
        return await this.checkNaverRanking(keyword, targetDomain, maxPages);
      } else {
        return await this.checkGoogleRanking(keyword, targetDomain, maxPages);
      }
    } catch (error) {
      throw new Error(`Failed to check ranking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkNaverRanking(keyword: string, targetDomain: string, maxPages: number): Promise<RankingResult> {
    if (!this.naverClientId || !this.naverClientSecret) {
      throw new Error('Naver API credentials not configured');
    }

    const results: SearchResult[] = [];
    let targetFound = false;
    let targetPosition: number | null = null;
    let currentPosition = 1;

    try {
      for (let page = 1; page <= maxPages; page++) {
        const start = (page - 1) * 10 + 1;
        
        const response = await axios.get('https://openapi.naver.com/v1/search/webkr.json', {
          params: {
            query: keyword,
            display: 10,
            start: start,
            sort: 'sim' // similarity order
          },
          headers: {
            'X-Naver-Client-Id': this.naverClientId,
            'X-Naver-Client-Secret': this.naverClientSecret,
          },
          timeout: 10000,
        });

        if (response.data && response.data.items) {
          for (const item of response.data.items) {
            const cleanUrl = this.cleanUrl(item.link);
            const domain = this.extractDomain(cleanUrl);
            
            const result: SearchResult = {
              position: currentPosition,
              title: this.cleanHtml(item.title),
              url: cleanUrl,
              snippet: this.cleanHtml(item.description),
              type: 'organic',
              page: page,
            };
            
            results.push(result);
            
            // Check if this is our target domain
            if (domain === targetDomain && !targetFound) {
              targetFound = true;
              targetPosition = currentPosition;
            }
            
            currentPosition++;
          }
        }

        // Add delay between requests to respect rate limits
        if (page < maxPages) {
          await this.delay(1000);
        }
      }

      return {
        keyword,
        targetDomain,
        results,
        targetFound,
        targetPosition,
        totalResults: results.length,
        searchEngine: 'naver',
        timestamp: new Date(),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid API credentials');
        }
      }
      throw new Error(`Naver search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkGoogleRanking(keyword: string, targetDomain: string, maxPages: number): Promise<RankingResult> {
    if (!this.googleApiKey || !this.googleSearchEngineId) {
      throw new Error('Google API credentials not configured');
    }

    const results: SearchResult[] = [];
    let targetFound = false;
    let targetPosition: number | null = null;
    let currentPosition = 1;

    try {
      for (let page = 1; page <= maxPages; page++) {
        const start = (page - 1) * 10 + 1;
        
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: this.googleApiKey,
            cx: this.googleSearchEngineId,
            q: keyword,
            start: start,
            num: 10,
          },
          timeout: 10000,
        });

        if (response.data && response.data.items) {
          for (const item of response.data.items) {
            const cleanUrl = this.cleanUrl(item.link);
            const domain = this.extractDomain(cleanUrl);
            
            const result: SearchResult = {
              position: currentPosition,
              title: item.title,
              url: cleanUrl,
              snippet: item.snippet || '',
              type: 'organic',
              page: page,
            };
            
            results.push(result);
            
            // Check if this is our target domain
            if (domain === targetDomain && !targetFound) {
              targetFound = true;
              targetPosition = currentPosition;
            }
            
            currentPosition++;
          }
        }

        // Add delay between requests to respect rate limits
        if (page < maxPages) {
          await this.delay(1000);
        }
      }

      return {
        keyword,
        targetDomain,
        results,
        targetFound,
        targetPosition,
        totalResults: results.length,
        searchEngine: 'google',
        timestamp: new Date(),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (error.response?.status === 403) {
          throw new Error('API quota exceeded or invalid credentials');
        }
      }
      throw new Error(`Google search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchCheckRankings(
    keywords: string[], 
    targetDomain: string, 
    searchEngine: 'naver' | 'google' = 'naver',
    maxPages: number = 3,
    onProgress?: (completed: number, total: number, currentKeyword: string) => void
  ): Promise<RankingResult[]> {
    const results: RankingResult[] = [];
    
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      
      try {
        if (onProgress) {
          onProgress(i, keywords.length, keyword);
        }
        
        const result = await this.checkKeywordRanking(keyword, targetDomain, searchEngine, maxPages);
        results.push(result);
        
        // Add delay between keyword checks to respect rate limits
        if (i < keywords.length - 1) {
          await this.delay(2000);
        }
      } catch (error) {
        console.error(`Failed to check ranking for keyword "${keyword}":`, error);
        
        // Add a failed result to maintain the order
        results.push({
          keyword,
          targetDomain,
          results: [],
          targetFound: false,
          targetPosition: null,
          totalResults: 0,
          searchEngine,
          timestamp: new Date(),
        });
      }
    }
    
    if (onProgress) {
      onProgress(keywords.length, keywords.length, '');
    }
    
    return results;
  }

  private cleanUrl(url: string): string {
    try {
      // Remove tracking parameters and clean up URL
      const urlObj = new URL(url);
      
      // Remove common tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  private cleanHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to estimate search volume (mock implementation)
  estimateSearchVolume(keyword: string): number {
    // This is a simple estimation based on keyword length and common patterns
    // In a real implementation, you'd use tools like Google Keyword Planner API
    const baseVolume = Math.floor(Math.random() * 10000) + 100;
    
    // Adjust based on keyword characteristics
    if (keyword.length > 20) return Math.floor(baseVolume * 0.3); // Long tail keywords
    if (keyword.split(' ').length === 1) return Math.floor(baseVolume * 1.5); // Single word keywords
    if (keyword.includes('가격') || keyword.includes('비용') || keyword.includes('후기')) {
      return Math.floor(baseVolume * 1.2); // Commercial intent
    }
    
    return baseVolume;
  }

  // Utility method to estimate keyword difficulty
  estimateKeywordDifficulty(keyword: string, competitorCount: number): 'low' | 'medium' | 'high' {
    if (competitorCount > 100000) return 'high';
    if (competitorCount > 10000) return 'medium';
    return 'low';
  }
}

export const searchRanking = new SearchRankingService();