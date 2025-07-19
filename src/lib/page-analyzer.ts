import axios from 'axios';
import * as cheerio from 'cheerio';
import { fallbackWebScraper } from './fallback-scraper';

export interface WebsitePage {
  id: string;
  url: string;
  title: string;
  description: string;
  content: string;
  publishDate?: string;
  author?: string;
  category?: string;
  tags: string[];
  keywords: string[];
  metaKeywords: string[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  images: Array<{
    src: string;
    alt: string;
    title?: string;
  }>;
  wordCount: number;
  readingTime: number; // in minutes
  lastModified?: string;
  canonical?: string;
  ogTags: Record<string, string>;
  structuredData: any[];
}

export interface PageRankingInfo {
  pageId: string;
  targetKeywords: string[];
  rankings: Array<{
    keyword: string;
    searchEngine: 'naver' | 'google';
    position: number | null; // null if not found in top 100
    searchUrl: string;
    lastChecked: string;
    snippet?: string;
    featured?: boolean; // if appears in featured snippet
  }>;
  visibility: {
    totalKeywords: number;
    rankedKeywords: number;
    averagePosition: number;
    topRankings: number; // positions 1-10
  };
}

export interface PageAnalysisResult {
  page: WebsitePage;
  ranking: PageRankingInfo;
  status: 'indexed' | 'not-indexed' | 'error';
  seoScore: {
    title: number;
    description: number;
    content: number;
    keywords: number;
    overall: number;
  };
  opportunities: string[];
  warnings: string[];
}

export class PageAnalyzer {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async discoverPages(baseUrl: string, maxPages: number = 50): Promise<string[]> {
    try {
      console.log(`Discovering pages for: ${baseUrl}`);
      
      const discoveredUrls = new Set<string>();
      const urlsToCheck = [baseUrl];
      const checkedUrls = new Set<string>();
      
      const domain = new URL(baseUrl).hostname;

      while (urlsToCheck.length > 0 && discoveredUrls.size < maxPages) {
        const currentUrl = urlsToCheck.shift()!;
        
        if (checkedUrls.has(currentUrl)) continue;
        checkedUrls.add(currentUrl);

        try {
          console.log(`Checking: ${currentUrl}`);
          
          const response = await axios.get(currentUrl, {
            headers: { 'User-Agent': this.userAgent },
            timeout: 10000,
            maxRedirects: 3,
          });

          if (response.status === 200) {
            discoveredUrls.add(currentUrl);
            
            // Parse links from the page
            const $ = cheerio.load(response.data);
            
            $('a[href]').each((_, element) => {
              const href = $(element).attr('href');
              if (href) {
                const resolvedUrl = this.resolveUrl(href, currentUrl);
                if (this.isValidPageUrl(resolvedUrl, domain) && !checkedUrls.has(resolvedUrl)) {
                  urlsToCheck.push(resolvedUrl);
                }
              }
            });

            // Also check for sitemap
            if (currentUrl === baseUrl) {
              await this.checkSitemap(baseUrl, urlsToCheck, domain);
            }
          }
        } catch (error) {
          console.warn(`Failed to check ${currentUrl}:`, error instanceof Error ? error.message : 'Unknown error');
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const finalUrls = Array.from(discoveredUrls).slice(0, maxPages);
      console.log(`Discovered ${finalUrls.length} pages`);
      return finalUrls;

    } catch (error) {
      console.error('Page discovery error:', error);
      return [baseUrl]; // Return at least the base URL
    }
  }

  async analyzePage(url: string): Promise<WebsitePage> {
    try {
      console.log(`Analyzing page: ${url}`);
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const pageId = this.generatePageId(url);

      // Extract basic information
      const title = $('title').text().trim() || $('h1').first().text().trim() || '';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';

      // Extract content
      const content = this.extractMainContent($);
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      const readingTime = Math.ceil(wordCount / 200); // Assume 200 words per minute

      // Extract headings
      const headings = {
        h1: $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean),
        h2: $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean),
        h3: $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      };

      // Extract meta keywords
      const metaKeywords = $('meta[name="keywords"]').attr('content')
        ?.split(',').map(k => k.trim()).filter(Boolean) || [];

      // Extract keywords from content
      const extractedKeywords = this.extractKeywords(title, description, content, headings);

      // Extract publish date
      const publishDate = this.extractPublishDate($);

      // Extract author
      const author = $('meta[name="author"]').attr('content') || 
                    $('.author').first().text().trim() || 
                    $('[rel="author"]').first().text().trim() || '';

      // Extract category/tags
      const category = this.extractCategory($);
      const tags = this.extractTags($);

      // Extract images
      const images = this.extractImages($, url);

      // Extract OG tags
      const ogTags: Record<string, string> = {};
      $('meta[property^="og:"]').each((_, el) => {
        const property = $(el).attr('property');
        const content = $(el).attr('content');
        if (property && content) {
          ogTags[property] = content;
        }
      });

      // Extract structured data
      const structuredData = this.extractStructuredData($);

      // Other meta information
      const lastModified = $('meta[name="last-modified"]').attr('content') || '';
      const canonical = $('link[rel="canonical"]').attr('href') || url;

      return {
        id: pageId,
        url,
        title,
        description,
        content,
        publishDate,
        author,
        category,
        tags,
        keywords: extractedKeywords,
        metaKeywords,
        headings,
        images,
        wordCount,
        readingTime,
        lastModified,
        canonical,
        ogTags,
        structuredData,
      };

    } catch (error) {
      throw new Error(`Failed to analyze page ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkPageRankings(page: WebsitePage, targetKeywords: string[]): Promise<PageRankingInfo> {
    console.log(`Checking rankings for: ${page.title}`);
    
    const rankings: PageRankingInfo['rankings'] = [];
    let totalPosition = 0;
    let rankedCount = 0;
    let topRankings = 0;

    for (const keyword of targetKeywords) {
      try {
        // Check Naver ranking
        const naverRanking = await this.checkNaverRanking(keyword, page.url);
        if (naverRanking) {
          rankings.push(naverRanking);
          totalPosition += naverRanking.position || 101;
          if (naverRanking.position) {
            rankedCount++;
            if (naverRanking.position <= 10) topRankings++;
          }
        }

        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check Google ranking (if available)
        const googleRanking = await this.checkGoogleRanking(keyword, page.url);
        if (googleRanking) {
          rankings.push(googleRanking);
          totalPosition += googleRanking.position || 101;
          if (googleRanking.position) {
            rankedCount++;
            if (googleRanking.position <= 10) topRankings++;
          }
        }

        // Delay between keywords to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.warn(`Failed to check ranking for keyword "${keyword}":`, error);
      }
    }

    const averagePosition = rankedCount > 0 ? Math.round(totalPosition / rankedCount) : 0;

    return {
      pageId: page.id,
      targetKeywords,
      rankings,
      visibility: {
        totalKeywords: targetKeywords.length,
        rankedKeywords: rankedCount,
        averagePosition,
        topRankings,
      },
    };
  }

  private async checkNaverRanking(keyword: string, targetUrl: string): Promise<PageRankingInfo['rankings'][0] | null> {
    try {
      const clientId = process.env.NAVER_CLIENT_ID;
      const clientSecret = process.env.NAVER_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return null;
      }

      const searchUrl = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(keyword)}&display=100`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'User-Agent': this.userAgent,
        },
        timeout: 10000,
      });

      const items = response.data.items || [];
      const targetDomain = new URL(targetUrl).hostname;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemUrl = item.link;
        
        if (itemUrl && itemUrl.includes(targetDomain)) {
          return {
            keyword,
            searchEngine: 'naver',
            position: i + 1,
            searchUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`,
            lastChecked: new Date().toISOString(),
            snippet: item.description?.replace(/<[^>]*>/g, '').slice(0, 150) + '...',
            featured: i === 0,
          };
        }
      }

      // Not found in top 100
      return {
        keyword,
        searchEngine: 'naver',
        position: null,
        searchUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      console.warn(`Naver ranking check failed for "${keyword}":`, error);
      return null;
    }
  }

  private async checkGoogleRanking(keyword: string, targetUrl: string): Promise<PageRankingInfo['rankings'][0] | null> {
    try {
      // For now, return null as Google Custom Search API requires setup
      // This can be implemented with Google Custom Search API when available
      return null;
    } catch (error) {
      return null;
    }
  }

  private generatePageId(url: string): string {
    return Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .navigation, .menu, .sidebar').remove();
    
    // Try to find main content area
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '#content',
      '#main',
      '.container',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        return element.text().trim();
      }
    }

    // Fallback to body
    return $('body').text().trim();
  }

  private extractKeywords(title: string, description: string, content: string, headings: any): string[] {
    const text = [title, description, ...headings.h1, ...headings.h2, content].join(' ');
    
    // Extract Korean and English keywords
    const koreanWords = text.match(/[가-힣]{2,}/g) || [];
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    
    // Filter common stop words
    const stopWords = new Set([
      'and', 'or', 'but', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'have', 'has', 'had',
      '그리고', '또는', '하지만', '그런데', '이것', '저것', '입니다', '있습니다', '없습니다', '위해', '통해'
    ]);

    const allWords = [...koreanWords, ...englishWords];
    const filteredWords = allWords
      .map(word => word.toLowerCase().trim())
      .filter(word => word.length >= 2 && !stopWords.has(word));

    // Count frequency and return top keywords
    const wordCount: Record<string, number> = {};
    filteredWords.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private extractPublishDate($: cheerio.CheerioAPI): string | undefined {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="publish_date"]',
      'meta[name="date"]',
      'time[datetime]',
      '.publish-date',
      '.date',
      '.post-date',
    ];

    for (const selector of dateSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const dateValue = element.attr('content') || element.attr('datetime') || element.text().trim();
        if (dateValue) {
          try {
            return new Date(dateValue).toISOString();
          } catch {
            // Continue to next selector if date parsing fails
          }
        }
      }
    }

    return undefined;
  }

  private extractCategory($: cheerio.CheerioAPI): string {
    const categorySelectors = [
      'meta[name="category"]',
      '.category',
      '.post-category',
      '.breadcrumb a:last-child',
      'nav.breadcrumb a:last-child',
    ];

    for (const selector of categorySelectors) {
      const element = $(selector).first();
      if (element.length) {
        const category = element.attr('content') || element.text().trim();
        if (category) return category;
      }
    }

    return '';
  }

  private extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    
    $('.tag, .tags a, .post-tags a, .hashtag').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    });

    return tags.slice(0, 10);
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): WebsitePage['images'] {
    const images: WebsitePage['images'] = [];
    
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const title = $(el).attr('title');
      
      if (src) {
        images.push({
          src: this.resolveUrl(src, baseUrl),
          alt,
          title,
        });
      }
    });
    
    return images.slice(0, 20);
  }

  private extractStructuredData($: cheerio.CheerioAPI): any[] {
    const structuredData: any[] = [];
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        structuredData.push(data);
      } catch {
        // Ignore invalid JSON
      }
    });
    
    return structuredData;
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }

  private isValidPageUrl(url: string, domain: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Same domain check
      if (!urlObj.hostname.includes(domain.replace('www.', ''))) {
        return false;
      }

      // Skip certain file types
      const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.xml', '.ico'];
      if (skipExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))) {
        return false;
      }

      // Skip admin/system URLs
      const skipPaths = ['/admin', '/wp-admin', '/wp-content', '/wp-includes', '/ajax', '/api'];
      if (skipPaths.some(path => urlObj.pathname.startsWith(path))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private async checkSitemap(baseUrl: string, urlsToCheck: string[], domain: string): Promise<void> {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/robots.txt`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await axios.get(sitemapUrl, {
          headers: { 'User-Agent': this.userAgent },
          timeout: 5000,
        });

        if (response.status === 200) {
          if (sitemapUrl.endsWith('.xml')) {
            // Parse XML sitemap
            const $ = cheerio.load(response.data, { xmlMode: true });
            $('url > loc, sitemap > loc').each((_, el) => {
              const url = $(el).text().trim();
              if (this.isValidPageUrl(url, domain)) {
                urlsToCheck.push(url);
              }
            });
          } else if (sitemapUrl.endsWith('robots.txt')) {
            // Parse robots.txt for sitemap references
            const lines = response.data.split('\n');
            lines.forEach((line: string) => {
              if (line.toLowerCase().startsWith('sitemap:')) {
                const sitemapRef = line.substring(8).trim();
                if (sitemapRef) {
                  urlsToCheck.push(sitemapRef);
                }
              }
            });
          }
        }
      } catch {
        // Ignore sitemap errors
      }
    }
  }
}

export const pageAnalyzer = new PageAnalyzer();