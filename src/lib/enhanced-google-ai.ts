import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelScrapedContent } from './vercel-compatible-scraper';

export interface EnhancedKeyword {
  keyword: string;
  relevance: number; // 0-100
  category: 'primary' | 'secondary' | 'long-tail';
  searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  estimatedSearchVolume: number;
  competitionLevel: 'low' | 'medium' | 'high';
  estimatedCPC: number; // in KRW
  seasonality: 'stable' | 'seasonal' | 'trending';
  relatedKeywords: string[];
}

export interface AIKeywordAnalysis {
  keywords: EnhancedKeyword[];
  suggestions: {
    primary: string[];
    secondary: string[];
    longTail: string[];
    opportunity: string[]; // Low competition, high volume keywords
  };
  contentAnalysis: {
    topic: string;
    industry: string;
    tone: string;
    targetAudience: string;
    contentQuality: number; // 0-100
    seoOptimization: number; // 0-100
  };
  marketInsights: {
    totalMarketSize: string;
    competitionLevel: 'low' | 'medium' | 'high';
    marketTrends: string[];
    opportunities: string[];
  };
}

class EnhancedGoogleAIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async analyzeContent(content: VercelScrapedContent): Promise<AIKeywordAnalysis> {
    if (!this.genAI) {
      throw new Error('Google AI API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      });

      const prompt = this.createDetailedPrompt(content);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const analysis = JSON.parse(jsonMatch[0]) as AIKeywordAnalysis;
      
      // Validate and enhance the response
      return this.validateAndEnhanceAnalysis(analysis, content);

    } catch (error) {
      console.error('Google AI analysis error:', error);
      
      // Return enhanced fallback analysis
      return this.createEnhancedFallbackAnalysis(content);
    }
  }

  private createDetailedPrompt(content: VercelScrapedContent): string {
    return `
      Analyze this Korean website content and provide comprehensive SEO keyword recommendations:

      **Website Information:**
      - URL: ${content.url}
      - Domain: ${content.domain}
      - Title: ${content.title}
      - Description: ${content.description}
      - Business Type: ${this.inferBusinessType(content)}
      
      **Content Analysis:**
      - H1 Headings: ${content.headings.h1.join(', ')}
      - H2 Headings: ${content.headings.h2.slice(0, 5).join(', ')}
      - Content Sample: ${content.content.slice(0, 1500)}
      - Meta Tags: ${JSON.stringify(content.metaTags)}

      **SEO Metrics:**
      - Current SEO Score: ${content.seoScore.overall}/100
      - Meta Tags: ${Object.keys(content.metaTags).length} tags found

      Please provide a comprehensive analysis with 40-50 keywords optimized for Korean search behavior and include:

      1. **Enhanced Keywords** (40-50 total):
         - Primary keywords (8-10): High-volume, directly related to main business
         - Secondary keywords (15-20): Supporting topics, services, features
         - Long-tail keywords (15-20): Specific phrases, local terms, questions
         - Each keyword should include:
           * Relevance score (0-100)
           * Estimated monthly search volume
           * Competition level (low/medium/high)
           * Estimated CPC in Korean Won
           * Search intent classification
           * Seasonality indicator
           * 3-5 related keywords

      2. **Market Intelligence**:
         - Industry analysis
         - Market size estimation
         - Competition assessment
         - Trending opportunities
         - Local SEO recommendations

      3. **Content Quality Assessment**:
         - Content optimization score
         - SEO improvement suggestions
         - Target audience analysis

      **Response Format (JSON only):**
      {
        "keywords": [
          {
            "keyword": "keyword in Korean/English",
            "relevance": 95,
            "category": "primary",
            "searchIntent": "transactional",
            "estimatedSearchVolume": 12000,
            "competitionLevel": "medium",
            "estimatedCPC": 850,
            "seasonality": "stable",
            "relatedKeywords": ["related1", "related2", "related3"]
          }
        ],
        "suggestions": {
          "primary": ["primary keyword suggestions"],
          "secondary": ["secondary keyword suggestions"],
          "longTail": ["long tail keyword suggestions"],
          "opportunity": ["low competition high volume keywords"]
        },
        "contentAnalysis": {
          "topic": "main business topic",
          "industry": "industry classification",
          "tone": "professional/friendly/medical/etc",
          "targetAudience": "detailed target audience description",
          "contentQuality": 75,
          "seoOptimization": 68
        },
        "marketInsights": {
          "totalMarketSize": "market size description",
          "competitionLevel": "medium",
          "marketTrends": ["trend1", "trend2", "trend3"],
          "opportunities": ["opportunity1", "opportunity2"]
        }
      }

      Focus on Korean search patterns, local business optimization, and mobile-first user behavior.
    `;
  }

  private validateAndEnhanceAnalysis(analysis: AIKeywordAnalysis, content: VercelScrapedContent): AIKeywordAnalysis {
    const enhanced: AIKeywordAnalysis = {
      keywords: [],
      suggestions: {
        primary: [],
        secondary: [],
        longTail: [],
        opportunity: [],
      },
      contentAnalysis: {
        topic: analysis.contentAnalysis?.topic || content.title || 'Website Content',
        industry: analysis.contentAnalysis?.industry || this.inferIndustry(content),
        tone: analysis.contentAnalysis?.tone || 'Professional',
        targetAudience: analysis.contentAnalysis?.targetAudience || 'General Public',
        contentQuality: Math.min(100, Math.max(0, analysis.contentAnalysis?.contentQuality || 70)),
        seoOptimization: Math.min(100, Math.max(0, analysis.contentAnalysis?.seoOptimization || content.seoScore.overall)),
      },
      marketInsights: {
        totalMarketSize: analysis.marketInsights?.totalMarketSize || 'Medium-sized market',
        competitionLevel: analysis.marketInsights?.competitionLevel || 'medium',
        marketTrends: Array.isArray(analysis.marketInsights?.marketTrends) 
          ? analysis.marketInsights.marketTrends.slice(0, 5) 
          : ['Digital transformation', 'Mobile optimization'],
        opportunities: Array.isArray(analysis.marketInsights?.opportunities) 
          ? analysis.marketInsights.opportunities.slice(0, 5) 
          : ['Local SEO optimization', 'Content marketing'],
      },
    };

    // Validate and enhance keywords
    if (Array.isArray(analysis.keywords)) {
      enhanced.keywords = analysis.keywords
        .filter(k => k.keyword && typeof k.keyword === 'string')
        .map(k => this.enhanceKeyword(k))
        .slice(0, 50);
    }

    // If we don't have enough keywords, add from content
    if (enhanced.keywords.length < 30) {
      const additionalKeywords = this.generateAdditionalKeywords(content, enhanced.keywords.length);
      enhanced.keywords.push(...additionalKeywords);
    }

    // Validate suggestions
    enhanced.suggestions = this.validateSuggestions(analysis.suggestions, enhanced.keywords);

    return enhanced;
  }

  private enhanceKeyword(keyword: any): EnhancedKeyword {
    return {
      keyword: keyword.keyword.trim(),
      relevance: Math.min(100, Math.max(0, keyword.relevance || 50)),
      category: ['primary', 'secondary', 'long-tail'].includes(keyword.category) 
        ? keyword.category as 'primary' | 'secondary' | 'long-tail'
        : 'secondary',
      searchIntent: ['informational', 'navigational', 'transactional', 'commercial'].includes(keyword.searchIntent)
        ? keyword.searchIntent as 'informational' | 'navigational' | 'transactional' | 'commercial'
        : 'informational',
      estimatedSearchVolume: Math.max(0, keyword.estimatedSearchVolume || this.estimateSearchVolume(keyword.keyword)),
      competitionLevel: ['low', 'medium', 'high'].includes(keyword.competitionLevel)
        ? keyword.competitionLevel as 'low' | 'medium' | 'high'
        : 'medium',
      estimatedCPC: Math.max(0, keyword.estimatedCPC || this.estimateCPC(keyword.keyword)),
      seasonality: ['stable', 'seasonal', 'trending'].includes(keyword.seasonality)
        ? keyword.seasonality as 'stable' | 'seasonal' | 'trending'
        : 'stable',
      relatedKeywords: Array.isArray(keyword.relatedKeywords) 
        ? keyword.relatedKeywords.slice(0, 5)
        : this.generateRelatedKeywords(keyword.keyword),
    };
  }

  private generateAdditionalKeywords(content: VercelScrapedContent, currentCount: number): EnhancedKeyword[] {
    const needed = Math.min(20, 45 - currentCount);
    const additional: EnhancedKeyword[] = [];

    // Extract from content with enhanced metadata
    const contentKeywords = [
      ...this.extractKeywordsFromText(content.title),
      ...this.extractKeywordsFromText(content.description),
      ...content.headings.h1.flatMap(h => this.extractKeywordsFromText(h)),
      ...content.headings.h2.flatMap(h => this.extractKeywordsFromText(h)),
      ...content.keywords.slice(0, 30),
    ];

    const keywordSet = new Set(contentKeywords);
    const uniqueKeywords = Array.from(keywordSet).slice(0, needed);

    uniqueKeywords.forEach((keyword, index) => {
      additional.push({
        keyword,
        relevance: Math.max(30, 90 - index * 3),
        category: index < 3 ? 'primary' : index < 10 ? 'secondary' : 'long-tail',
        searchIntent: this.inferSearchIntent(keyword),
        estimatedSearchVolume: this.estimateSearchVolume(keyword),
        competitionLevel: this.estimateCompetition(keyword),
        estimatedCPC: this.estimateCPC(keyword),
        seasonality: 'stable',
        relatedKeywords: this.generateRelatedKeywords(keyword),
      });
    });

    return additional;
  }

  private createEnhancedFallbackAnalysis(content: VercelScrapedContent): AIKeywordAnalysis {
    const baseKeywords = this.generateAdditionalKeywords(content, 0);
    
    return {
      keywords: baseKeywords.slice(0, 45),
      suggestions: {
        primary: baseKeywords.filter(k => k.category === 'primary').map(k => k.keyword).slice(0, 8),
        secondary: baseKeywords.filter(k => k.category === 'secondary').map(k => k.keyword).slice(0, 12),
        longTail: baseKeywords.filter(k => k.category === 'long-tail').map(k => k.keyword).slice(0, 15),
        opportunity: baseKeywords.filter(k => k.competitionLevel === 'low' && k.estimatedSearchVolume > 500).map(k => k.keyword).slice(0, 8),
      },
      contentAnalysis: {
        topic: content.title || 'Website Content',
        industry: this.inferIndustry(content),
        tone: 'Professional',
        targetAudience: 'General Public',
        contentQuality: 70,
        seoOptimization: content.seoScore.overall,
      },
      marketInsights: {
        totalMarketSize: 'Medium-sized market with growth potential',
        competitionLevel: 'medium',
        marketTrends: ['Digital transformation', 'Mobile-first approach', 'Local SEO importance'],
        opportunities: ['Content optimization', 'Local search presence', 'Mobile user experience'],
      },
    };
  }

  private validateSuggestions(suggestions: any, keywords: EnhancedKeyword[]): AIKeywordAnalysis['suggestions'] {
    return {
      primary: Array.isArray(suggestions?.primary) 
        ? suggestions.primary.slice(0, 10) 
        : keywords.filter(k => k.category === 'primary').map(k => k.keyword).slice(0, 8),
      secondary: Array.isArray(suggestions?.secondary) 
        ? suggestions.secondary.slice(0, 15) 
        : keywords.filter(k => k.category === 'secondary').map(k => k.keyword).slice(0, 12),
      longTail: Array.isArray(suggestions?.longTail) 
        ? suggestions.longTail.slice(0, 20) 
        : keywords.filter(k => k.category === 'long-tail').map(k => k.keyword).slice(0, 15),
      opportunity: Array.isArray(suggestions?.opportunity) 
        ? suggestions.opportunity.slice(0, 10) 
        : keywords.filter(k => k.competitionLevel === 'low' && k.estimatedSearchVolume > 500).map(k => k.keyword).slice(0, 8),
    };
  }

  private inferBusinessType(content: VercelScrapedContent): string {
    const domain = content.domain.toLowerCase();
    const contentText = (content.title + ' ' + content.description).toLowerCase();
    
    const businessTypes = {
      'Medical/Healthcare': ['병원', '클리닉', '의료', '건강', '치료', 'hospital', 'clinic', 'medical'],
      'Beauty/Cosmetic': ['미용', '뷰티', '성형', '피부', '화장품', 'beauty', 'cosmetic'],
      'Education': ['교육', '학원', '수업', '강의', 'education', 'academy'],
      'Restaurant/Food': ['음식', '레스토랑', '카페', '식당', 'restaurant', 'cafe'],
      'Technology': ['기술', 'IT', '소프트웨어', '앱', 'tech', 'software'],
      'Retail/Shopping': ['쇼핑', '상점', '판매', '제품', 'shop', 'store'],
    };

    for (const [type, keywords] of Object.entries(businessTypes)) {
      if (keywords.some(keyword => domain.includes(keyword) || contentText.includes(keyword))) {
        return type;
      }
    }

    return 'General Business';
  }

  private extractKeywordsFromText(text: string): string[] {
    if (!text) return [];

    const koreanWords = text.match(/[가-힣]{2,}/g) || [];
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    
    const stopWords = new Set([
      'and', 'or', 'but', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'have', 'has', 'had',
      '그리고', '또는', '하지만', '그런데', '이것', '저것', '입니다', '있습니다', '없습니다', '통해', '위해'
    ]);

    const allWords = [...koreanWords, ...englishWords];
    return allWords
      .map(word => word.toLowerCase().trim())
      .filter(word => word.length >= 2 && !stopWords.has(word))
      .slice(0, 20);
  }

  private inferSearchIntent(keyword: string): 'informational' | 'navigational' | 'transactional' | 'commercial' {
    const lowerKeyword = keyword.toLowerCase();
    
    const intentPatterns = {
      transactional: ['구매', '예약', '신청', '주문', '결제', 'buy', 'order', 'book', 'purchase'],
      commercial: ['가격', '비용', '료금', '할인', '비교', 'price', 'cost', 'cheap', 'discount'],
      navigational: ['사이트', '홈페이지', '로그인', 'website', 'site', 'login', 'official'],
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => lowerKeyword.includes(pattern))) {
        return intent as any;
      }
    }
    
    return 'informational';
  }

  private inferIndustry(content: VercelScrapedContent): string {
    const businessType = this.inferBusinessType(content);
    return businessType.split('/')[0];
  }

  private estimateSearchVolume(keyword: string): number {
    const length = keyword.length;
    const hasKorean = /[가-힣]/.test(keyword);
    
    // Base estimation logic
    let volume = 1000;
    
    if (hasKorean) volume *= 1.5; // Korean keywords tend to have higher local volume
    if (length <= 5) volume *= 2; // Short keywords have higher volume
    if (length > 10) volume *= 0.5; // Long keywords have lower volume
    
    // Add randomization for realism
    volume = Math.floor(volume * (0.5 + Math.random()));
    
    return Math.max(100, Math.min(50000, volume));
  }

  private estimateCompetition(keyword: string): 'low' | 'medium' | 'high' {
    const length = keyword.length;
    const hasNumbers = /\d/.test(keyword);
    
    if (length > 12 || hasNumbers) return 'low';
    if (length < 6) return 'high';
    return 'medium';
  }

  private estimateCPC(keyword: string): number {
    const intent = this.inferSearchIntent(keyword);
    const competition = this.estimateCompetition(keyword);
    
    let baseCPC = 500; // Base CPC in KRW
    
    if (intent === 'transactional') baseCPC *= 2;
    if (intent === 'commercial') baseCPC *= 1.5;
    if (competition === 'high') baseCPC *= 1.8;
    if (competition === 'low') baseCPC *= 0.6;
    
    return Math.floor(baseCPC * (0.7 + Math.random() * 0.6));
  }

  private generateRelatedKeywords(keyword: string): string[] {
    const related = [];
    
    // Add common variations
    if (keyword.includes('클리닉')) {
      related.push(keyword.replace('클리닉', '병원'), keyword.replace('클리닉', '의원'));
    }
    if (keyword.includes('beauty')) {
      related.push(keyword.replace('beauty', '뷰티'), keyword + ' salon');
    }
    
    // Add common suffixes/prefixes
    related.push(
      keyword + ' 가격',
      keyword + ' 예약',
      keyword + ' 후기',
      '최고의 ' + keyword,
      keyword + ' 추천'
    );
    
    const filteredRelated = related.filter(r => r !== keyword);
    return filteredRelated.slice(0, 5);
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.genAI) {
        return {
          success: false,
          message: 'Google AI not initialized - missing API key',
        };
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Test connection - respond with "OK"');
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: 'Google AI connection successful',
        details: { response: text.substring(0, 100) }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Google AI connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const enhancedGoogleAI = new EnhancedGoogleAIService();