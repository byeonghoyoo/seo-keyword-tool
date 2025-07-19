import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ScrapedContent {
  title: string;
  description: string;
  keywords: string[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  content: string;
  metaTags: Record<string, string>;
  images: Array<{
    src: string;
    alt: string;
  }>;
  links: Array<{
    href: string;
    text: string;
    title?: string;
  }>;
}

export class WebScraper {
  private readonly timeout = 30000; // 30 seconds

  async scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
      // Validate URL
      const validUrl = this.validateUrl(url);
      
      // Fetch page content
      const html = await this.fetchHtml(validUrl);
      
      // Parse content
      const content = this.parseHtml(html, validUrl);
      
      return content;
    } catch (error) {
      throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      
      // Basic validation
      if (!urlObj.hostname) {
        throw new Error('Invalid hostname');
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 400,
      });

      if (!response.data) {
        throw new Error('No content received');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout');
        }
        if (error.response?.status === 404) {
          throw new Error('Page not found');
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden');
        }
        if (error.response?.status && error.response.status >= 500) {
          throw new Error('Server error');
        }
      }
      throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseHtml(html: string, url: string): ScrapedContent {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, noscript').remove();
    
    // Extract title
    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('h1').first().text().trim() || 
                  'No title found';
    
    // Extract description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="twitter:description"]').attr('content') || 
                       $('p').first().text().trim().substring(0, 160) || 
                       '';
    
    // Extract meta keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const keywordsFromMeta = metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    // Extract headings
    const headings = {
      h1: $('h1').map((_, el) => $(el).text().trim()).get().filter(h => h.length > 0),
      h2: $('h2').map((_, el) => $(el).text().trim()).get().filter(h => h.length > 0),
      h3: $('h3').map((_, el) => $(el).text().trim()).get().filter(h => h.length > 0),
    };
    
    // Extract all text content
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Extract potential keywords from content
    const contentKeywords = this.extractKeywordsFromText(bodyText);
    
    // Combine all keywords
    const keywordSet = new Set([...keywordsFromMeta, ...contentKeywords]);
    const allKeywords = Array.from(keywordSet);
    
    // Extract meta tags
    const metaTags: Record<string, string> = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      const content = $(el).attr('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });
    
    // Extract images
    const images = $('img').map((_, el) => ({
      src: this.resolveUrl($(el).attr('src') || '', url),
      alt: $(el).attr('alt') || '',
    })).get().filter(img => img.src);
    
    // Extract links
    const links = $('a[href]').map((_, el) => ({
      href: this.resolveUrl($(el).attr('href') || '', url),
      text: $(el).text().trim(),
      title: $(el).attr('title'),
    })).get().filter(link => link.href && link.text);
    
    return {
      title,
      description,
      keywords: allKeywords.slice(0, 50), // Limit to 50 keywords
      headings,
      content: bodyText.substring(0, 5000), // Limit content length
      metaTags,
      images: images.slice(0, 20), // Limit images
      links: links.slice(0, 50), // Limit links
    };
  }

  private extractKeywordsFromText(text: string): string[] {
    // Remove common Korean and English stop words and extract meaningful terms
    const stopWords = new Set([
      '그', '이', '저', '것', '들', '을', '를', '이', '가', '은', '는', '에', '서', '와', '과', '의', '로', '으로',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
      '있다', '없다', '하다', '되다', '이다', '아니다', '같다', '다르다', '좋다', '나쁘다'
    ]);
    
    // Extract words (2+ characters, Korean/English/numbers)
    const words = text.toLowerCase()
      .match(/[가-힣a-zA-Z0-9]{2,}/g) || [];
    
    // Filter and count words
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      if (!stopWords.has(word) && word.length >= 2 && word.length <= 30) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    
    // Return top keywords sorted by frequency
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word]) => word);
  }

  private resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString();
    } catch {
      return relativeUrl;
    }
  }
}

export const webScraper = new WebScraper();