import axios from 'axios';
import * as cheerio from 'cheerio';

export interface RankingResult {
  keyword: string;
  searchEngine: 'naver' | 'google';
  position: number | null;
  url: string;
  title: string;
  snippet: string;
  lastChecked: string;
  featured: boolean;
  searchUrl: string;
}

export interface ComprehensiveRankingCheck {
  targetUrl: string;
  domain: string;
  results: RankingResult[];
  summary: {
    totalKeywords: number;
    rankedKeywords: number;
    averagePosition: number;
    topPositions: number; // 1-10 rankings
    featuredSnippets: number;
    visibility: number; // 0-100 percentage
  };
  lastUpdated: string;
}

export class RankingChecker {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private naverClientId = process.env.NAVER_CLIENT_ID;
  private naverClientSecret = process.env.NAVER_CLIENT_SECRET;

  async checkKeywordRankings(targetUrl: string, keywords: string[]): Promise<ComprehensiveRankingCheck> {
    console.log(`Checking rankings for ${keywords.length} keywords`);
    
    const domain = new URL(targetUrl).hostname;
    const results: RankingResult[] = [];
    
    for (const keyword of keywords) {
      try {
        console.log(`Checking rankings for: "${keyword}"`);
        
        // Check Naver ranking
        const naverResult = await this.checkNaverRanking(keyword, targetUrl);
        if (naverResult) {
          results.push(naverResult);
        }

        // Delay between searches to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check Google ranking (if API available)
        const googleResult = await this.checkGoogleRanking(keyword, targetUrl);
        if (googleResult) {
          results.push(googleResult);
        }

        // Additional delay between keywords
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.warn(`Failed to check ranking for "${keyword}":`, error);
      }
    }

    // Calculate summary statistics
    const summary = this.calculateSummary(results, keywords.length);

    return {
      targetUrl,
      domain,
      results,
      summary,
      lastUpdated: new Date().toISOString(),
    };
  }

  async checkNaverRanking(keyword: string, targetUrl: string): Promise<RankingResult | null> {
    try {
      if (!this.naverClientId || !this.naverClientSecret) {
        console.warn('Naver API credentials not configured');
        return null;
      }

      const searchUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(keyword)}&display=100&sort=sim`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'X-Naver-Client-Id': this.naverClientId,
          'X-Naver-Client-Secret': this.naverClientSecret,
          'User-Agent': this.userAgent,
        },
        timeout: 15000,
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const items = response.data.items || [];
      const targetDomain = new URL(targetUrl).hostname.replace('www.', '');

      // Look for exact URL match first, then domain match
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemUrl = item.link;
        
        if (itemUrl) {
          const itemDomain = new URL(itemUrl).hostname.replace('www.', '');
          
          // Check if this result is from our target domain
          if (itemDomain === targetDomain || itemDomain.includes(targetDomain) || targetDomain.includes(itemDomain)) {
            return {
              keyword,
              searchEngine: 'naver',
              position: i + 1,
              url: itemUrl,
              title: item.title?.replace(/<[^>]*>/g, '') || '',
              snippet: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) + '...' || '',
              lastChecked: new Date().toISOString(),
              featured: i === 0, // First result is considered featured
              searchUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`,
            };
          }
        }
      }

      // Not found in top 100 - return null position result
      return {
        keyword,
        searchEngine: 'naver',
        position: null,
        url: '',
        title: '',
        snippet: `"${keyword}" 검색에서 상위 100위 내에 노출되지 않음`,
        lastChecked: new Date().toISOString(),
        featured: false,
        searchUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`,
      };

    } catch (error) {
      console.error(`Naver ranking check failed for "${keyword}":`, error);
      return null;
    }
  }

  async checkGoogleRanking(keyword: string, targetUrl: string): Promise<RankingResult | null> {
    try {
      // For now, we'll use a simple approach
      // In production, this would use Google Custom Search API
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=100`;
      
      try {
        const response = await axios.get(googleSearchUrl, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 15000,
        });

        const $ = cheerio.load(response.data);
        const targetDomain = new URL(targetUrl).hostname.replace('www.', '');
        
        // Parse Google search results
        let position = 0;
        let foundResult: RankingResult | null = null;
        
        $('div.g, div[data-ved]').each((index, element) => {
          const linkElement = $(element).find('a[href^="http"]').first();
          const href = linkElement.attr('href');
          
          if (href) {
            position++;
            try {
              const resultDomain = new URL(href).hostname.replace('www.', '');
              
              if (resultDomain === targetDomain || resultDomain.includes(targetDomain) || targetDomain.includes(resultDomain)) {
                const title = linkElement.find('h3').text() || linkElement.text() || '';
                const snippet = $(element).find('span:contains("...")').parent().text() || 
                               $(element).find('.VwiC3b').text() || '';
                
                foundResult = {
                  keyword,
                  searchEngine: 'google' as const,
                  position,
                  url: href,
                  title: title.slice(0, 100),
                  snippet: snippet.slice(0, 200) + '...',
                  lastChecked: new Date().toISOString(),
                  featured: position === 1,
                  searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
                };
                return false; // Break out of the loop
              }
            } catch (urlError) {
              // Skip invalid URLs
            }
          }
        });

        // If we found a result, return it
        if (foundResult) {
          return foundResult;
        }

      } catch (searchError) {
        console.warn(`Google search blocked or failed for "${keyword}":`, searchError);
      }

      // Return not found result
      return {
        keyword,
        searchEngine: 'google',
        position: null,
        url: '',
        title: '',
        snippet: `"${keyword}" 구글 검색에서 상위 100위 내에 노출되지 않음`,
        lastChecked: new Date().toISOString(),
        featured: false,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
      };

    } catch (error) {
      console.error(`Google ranking check failed for "${keyword}":`, error);
      return null;
    }
  }

  async bulkCheckRankings(targetUrl: string, keywords: string[], batchSize: number = 5): Promise<ComprehensiveRankingCheck> {
    console.log(`Starting bulk ranking check for ${keywords.length} keywords`);
    
    const results: RankingResult[] = [];
    
    // Process keywords in batches to avoid rate limiting
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(keywords.length / batchSize)}`);
      
      const batchPromises = batch.map(async (keyword) => {
        try {
          const naverResult = await this.checkNaverRanking(keyword, targetUrl);
          return naverResult;
        } catch (error) {
          console.warn(`Batch check failed for "${keyword}":`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((result): result is RankingResult => result !== null));

      // Delay between batches
      if (i + batchSize < keywords.length) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const domain = new URL(targetUrl).hostname;
    const summary = this.calculateSummary(results, keywords.length);

    return {
      targetUrl,
      domain,
      results,
      summary,
      lastUpdated: new Date().toISOString(),
    };
  }

  private calculateSummary(results: RankingResult[], totalKeywords: number): ComprehensiveRankingCheck['summary'] {
    const rankedResults = results.filter(r => r.position !== null);
    const topPositions = rankedResults.filter(r => r.position && r.position <= 10).length;
    const featuredSnippets = results.filter(r => r.featured).length;
    
    const totalPositions = rankedResults.reduce((sum, r) => sum + (r.position || 0), 0);
    const averagePosition = rankedResults.length > 0 ? Math.round(totalPositions / rankedResults.length) : 0;
    
    // Calculate visibility percentage (rough estimate)
    const visibility = Math.round((rankedResults.length / totalKeywords) * 100);

    return {
      totalKeywords,
      rankedKeywords: rankedResults.length,
      averagePosition,
      topPositions,
      featuredSnippets,
      visibility,
    };
  }

  async getKeywordSuggestions(targetUrl: string, baseKeywords: string[]): Promise<string[]> {
    // Extract related keywords from the target website
    try {
      const response = await axios.get(targetUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const content = $('body').text();
      
      // Extract potential keywords from content
      const koreanWords = content.match(/[가-힣]{2,}/g) || [];
      const englishWords = content.match(/[a-zA-Z]{3,}/g) || [];
      
      const allWords = [...koreanWords, ...englishWords];
      const wordFreq: Record<string, number> = {};
      
      allWords.forEach(word => {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord.length >= 2) {
          wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
      });

      // Get top frequent words that aren't already in base keywords
      const suggestions = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 50)
        .map(([word]) => word)
        .filter(word => !baseKeywords.includes(word));

      return suggestions.slice(0, 20);

    } catch (error) {
      console.warn('Failed to get keyword suggestions:', error);
      return [];
    }
  }
}

export const rankingChecker = new RankingChecker();