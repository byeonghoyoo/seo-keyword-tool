import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface EnhancedScrapedContent {
  url: string;
  domain: string;
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
    title?: string;
  }>;
  links: Array<{
    href: string;
    text: string;
    isInternal: boolean;
  }>;
  structuredData: any[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  contactInfo: {
    phones: string[];
    emails: string[];
    addresses: string[];
  };
  businessInfo: {
    name?: string;
    category?: string;
    location?: {
      address?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  performance: {
    loadTime: number;
    size: number;
    status: number;
  };
  seoScore: {
    title: number;
    description: number;
    headings: number;
    keywords: number;
    images: number;
    overall: number;
  };
}

export class EnhancedWebScraper {
  private browser: Browser | null = null;
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeUrl(url: string): Promise<EnhancedScrapedContent> {
    const startTime = Date.now();
    
    try {
      await this.initialize();
      
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(url);
      const domain = this.extractDomain(normalizedUrl);

      const page = await this.browser!.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to page with timeout
      const response = await page.goto(normalizedUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      if (!response) {
        throw new Error('Failed to load page');
      }

      const status = response.status();
      if (status >= 400) {
        throw new Error(`HTTP ${status}: ${response.statusText()}`);
      }

      // Wait for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get page content
      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract basic information
      const title = $('title').text().trim() || '';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';

      // Extract headings
      const headings = {
        h1: $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean),
        h2: $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean),
        h3: $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      };

      // Extract meta tags
      const metaTags: Record<string, string> = {};
      $('meta').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('http-equiv');
        const content = $(el).attr('content');
        if (name && content) {
          metaTags[name.toLowerCase()] = content;
        }
      });

      // Extract keywords from various sources
      const keywords = this.extractKeywords($, title, description, headings);

      // Extract content
      const content = this.extractTextContent($);

      // Extract images
      const images = this.extractImages($, domain);

      // Extract links
      const links = this.extractLinks($, domain);

      // Extract structured data
      const structuredData = this.extractStructuredData($);

      // Extract social media links
      const socialMedia = this.extractSocialMedia($);

      // Extract contact information
      const contactInfo = this.extractContactInfo($, content);

      // Extract business information
      const businessInfo = this.extractBusinessInfo($, structuredData, metaTags);

      // Calculate performance metrics
      const loadTime = Date.now() - startTime;
      const size = html.length;

      // Calculate SEO score
      const seoScore = this.calculateSeoScore({
        title,
        description,
        headings,
        keywords,
        images,
        content,
      });

      await page.close();

      return {
        url: normalizedUrl,
        domain,
        title,
        description,
        keywords,
        headings,
        content,
        metaTags,
        images,
        links,
        structuredData,
        socialMedia,
        contactInfo,
        businessInfo,
        performance: {
          loadTime,
          size,
          status,
        },
        seoScore,
      };

    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private normalizeUrl(url: string): string {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      return new URL(url).toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private extractKeywords($: cheerio.CheerioAPI, title: string, description: string, headings: any): string[] {
    const keywordSources = [
      // Meta keywords
      $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [],
      
      // Title keywords
      this.extractKeywordsFromText(title),
      
      // Description keywords
      this.extractKeywordsFromText(description),
      
      // Heading keywords
      ...headings.h1.flatMap((h: string) => this.extractKeywordsFromText(h)),
      ...headings.h2.flatMap((h: string) => this.extractKeywordsFromText(h)),
      ...headings.h3.flatMap((h: string) => this.extractKeywordsFromText(h)),
      
      // Content keywords
      this.extractKeywordsFromText($('body').text()),
      
      // Alt text keywords
      $('img[alt]').map((_, el) => this.extractKeywordsFromText($(el).attr('alt') || '')).get().flat(),
    ];

    // Combine and deduplicate
    const allKeywords = keywordSources.flat().filter(Boolean);
    const keywordSet = new Set(allKeywords);
    return Array.from(keywordSet).slice(0, 100); // Limit to top 100 initial keywords
  }

  private extractKeywordsFromText(text: string): string[] {
    if (!text) return [];

    // Korean and English keyword extraction
    const koreanWords = text.match(/[가-힣]{2,}/g) || [];
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    
    // Filter common stop words
    const stopWords = new Set([
      'and', 'or', 'but', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'have', 'has', 'had',
      '그리고', '또는', '하지만', '그런데', '이것', '저것', '입니다', '있습니다', '없습니다'
    ]);

    const cleanWords = [...koreanWords, ...englishWords]
      .map(word => word.toLowerCase().trim())
      .filter(word => word.length >= 2 && !stopWords.has(word));

    return cleanWords.slice(0, 50);
  }

  private extractTextContent($: cheerio.CheerioAPI): string {
    // Remove script and style elements
    $('script, style, nav, footer, header, aside').remove();
    
    // Get main content
    const mainContent = $('main, article, .content, .main, #content, #main').first();
    if (mainContent.length) {
      return mainContent.text().trim();
    }
    
    return $('body').text().trim();
  }

  private extractImages($: cheerio.CheerioAPI, domain: string): Array<{src: string; alt: string; title?: string}> {
    const images: Array<{src: string; alt: string; title?: string}> = [];
    
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const title = $(el).attr('title');
      
      if (src) {
        images.push({
          src: this.resolveUrl(src, domain),
          alt,
          title,
        });
      }
    });
    
    return images.slice(0, 50); // Limit to 50 images
  }

  private extractLinks($: cheerio.CheerioAPI, domain: string): Array<{href: string; text: string; isInternal: boolean}> {
    const links: Array<{href: string; text: string; isInternal: boolean}> = [];
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href && text) {
        const resolvedUrl = this.resolveUrl(href, domain);
        const isInternal = resolvedUrl.includes(domain);
        
        links.push({
          href: resolvedUrl,
          text,
          isInternal,
        });
      }
    });
    
    return links.slice(0, 100); // Limit to 100 links
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

  private extractSocialMedia($: cheerio.CheerioAPI): any {
    const socialMedia: any = {};
    
    // Facebook
    const facebook = $('a[href*="facebook.com"], meta[property="og:url"]').first().attr('href') || 
                    $('meta[property="og:url"]').attr('content');
    if (facebook) socialMedia.facebook = facebook;
    
    // Twitter
    const twitter = $('a[href*="twitter.com"], a[href*="x.com"], meta[name="twitter:site"]').first().attr('href') ||
                   $('meta[name="twitter:site"]').attr('content');
    if (twitter) socialMedia.twitter = twitter;
    
    // Instagram
    const instagram = $('a[href*="instagram.com"]').first().attr('href');
    if (instagram) socialMedia.instagram = instagram;
    
    // LinkedIn
    const linkedin = $('a[href*="linkedin.com"]').first().attr('href');
    if (linkedin) socialMedia.linkedin = linkedin;
    
    return socialMedia;
  }

  private extractContactInfo($: cheerio.CheerioAPI, content: string): any {
    const contactInfo = {
      phones: [] as string[],
      emails: [] as string[],
      addresses: [] as string[],
    };
    
    // Extract phone numbers
    const phoneRegex = /(?:\+82|0)(?:\d{1,2}[-.\s]?)?\d{3,4}[-.\s]?\d{4}/g;
    const phones = content.match(phoneRegex) || [];
    const phoneSet = new Set(phones);
    contactInfo.phones = Array.from(phoneSet).slice(0, 10);
    
    // Extract email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = content.match(emailRegex) || [];
    const emailSet = new Set(emails);
    contactInfo.emails = Array.from(emailSet).slice(0, 10);
    
    // Extract addresses (Korean addresses)
    const addressRegex = /[가-힣]+(?:시|구|군|동|로|길)\s*\d+(?:번지|번|호)?/g;
    const addresses = content.match(addressRegex) || [];
    const addressSet = new Set(addresses);
    contactInfo.addresses = Array.from(addressSet).slice(0, 5);
    
    return contactInfo;
  }

  private extractBusinessInfo($: cheerio.CheerioAPI, structuredData: any[], metaTags: Record<string, string>): any {
    const businessInfo: any = {};
    
    // Extract from structured data
    for (const data of structuredData) {
      if (data['@type'] === 'LocalBusiness' || data['@type'] === 'Organization') {
        businessInfo.name = data.name;
        businessInfo.category = data['@type'];
        if (data.address) {
          businessInfo.location = {
            address: typeof data.address === 'string' ? data.address : data.address.streetAddress,
          };
        }
        if (data.geo) {
          businessInfo.location = {
            ...businessInfo.location,
            coordinates: {
              lat: parseFloat(data.geo.latitude),
              lng: parseFloat(data.geo.longitude),
            },
          };
        }
      }
    }
    
    // Extract from meta tags
    if (!businessInfo.name) {
      businessInfo.name = metaTags['og:site_name'] || $('title').text().split(' - ')[0].trim();
    }
    
    return businessInfo;
  }

  private calculateSeoScore(data: any): any {
    const scores = {
      title: 0,
      description: 0,
      headings: 0,
      keywords: 0,
      images: 0,
      overall: 0,
    };
    
    // Title score (0-100)
    if (data.title) {
      scores.title = Math.min(100, data.title.length >= 30 && data.title.length <= 60 ? 100 : 70);
    }
    
    // Description score (0-100)
    if (data.description) {
      scores.description = Math.min(100, data.description.length >= 120 && data.description.length <= 160 ? 100 : 70);
    }
    
    // Headings score (0-100)
    const totalHeadings = data.headings.h1.length + data.headings.h2.length + data.headings.h3.length;
    scores.headings = Math.min(100, totalHeadings * 20);
    
    // Keywords score (0-100)
    scores.keywords = Math.min(100, data.keywords.length * 2);
    
    // Images score (0-100)
    const imagesWithAlt = data.images.filter((img: any) => img.alt).length;
    scores.images = data.images.length > 0 ? Math.min(100, (imagesWithAlt / data.images.length) * 100) : 50;
    
    // Overall score
    scores.overall = Math.round((scores.title + scores.description + scores.headings + scores.keywords + scores.images) / 5);
    
    return scores;
  }

  private resolveUrl(url: string, domain: string): string {
    try {
      if (url.startsWith('http')) {
        return url;
      }
      if (url.startsWith('//')) {
        return 'https:' + url;
      }
      if (url.startsWith('/')) {
        return `https://${domain}${url}`;
      }
      return `https://${domain}/${url}`;
    } catch {
      return url;
    }
  }
}

export const enhancedWebScraper = new EnhancedWebScraper();