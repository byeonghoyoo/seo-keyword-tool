import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ScrapedContent } from './scraper';

export interface KeywordAnalysis {
  primaryKeywords: Array<{
    keyword: string;
    relevance: number;
    searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
    difficulty: 'low' | 'medium' | 'high';
    priority: 'high' | 'medium' | 'low';
  }>;
  secondaryKeywords: Array<{
    keyword: string;
    relevance: number;
    searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  }>;
  longTailKeywords: Array<{
    keyword: string;
    relevance: number;
    searchVolumePotential: 'high' | 'medium' | 'low';
  }>;
  competitorKeywords: Array<{
    keyword: string;
    relevance: number;
    competitionLevel: 'high' | 'medium' | 'low';
  }>;
  contentGaps: string[];
  recommendations: string[];
}

export class GoogleAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeKeywords(scrapedContent: ScrapedContent, targetDomain: string): Promise<KeywordAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(scrapedContent, targetDomain);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = this.parseAnalysisResponse(response.text());
      
      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildAnalysisPrompt(content: ScrapedContent, domain: string): string {
    return `
당신은 SEO 키워드 분석 전문가입니다. 다음 웹사이트 콘텐츠를 분석하여 SEO 키워드를 추천해주세요.

웹사이트 정보:
- 도메인: ${domain}
- 제목: ${content.title}
- 설명: ${content.description}
- H1 태그: ${content.headings.h1.join(', ')}
- H2 태그: ${content.headings.h2.join(', ')}
- H3 태그: ${content.headings.h3.join(', ')}
- 기존 키워드: ${content.keywords.join(', ')}
- 콘텐츠 (일부): ${content.content.substring(0, 1000)}

다음 형식으로 JSON 응답을 제공해주세요:

{
  "primaryKeywords": [
    {
      "keyword": "키워드",
      "relevance": 0.95,
      "searchIntent": "commercial",
      "difficulty": "medium",
      "priority": "high"
    }
  ],
  "secondaryKeywords": [
    {
      "keyword": "보조 키워드",
      "relevance": 0.80,
      "searchIntent": "informational"
    }
  ],
  "longTailKeywords": [
    {
      "keyword": "긴꼬리 키워드",
      "relevance": 0.70,
      "searchVolumePotential": "medium"
    }
  ],
  "competitorKeywords": [
    {
      "keyword": "경쟁사 키워드",
      "relevance": 0.85,
      "competitionLevel": "high"
    }
  ],
  "contentGaps": [
    "부족한 콘텐츠 영역 1",
    "부족한 콘텐츠 영역 2"
  ],
  "recommendations": [
    "SEO 개선 권장사항 1",
    "SEO 개선 권장사항 2"
  ]
}

분석 기준:
1. 주요 키워드 (Primary Keywords): 웹사이트의 핵심 비즈니스와 직접 관련된 키워드 (5-10개)
2. 보조 키워드 (Secondary Keywords): 관련성은 있지만 부차적인 키워드 (10-15개)
3. 롱테일 키워드 (Long-tail Keywords): 구체적이고 긴 검색어 (10-20개)
4. 경쟁사 키워드 (Competitor Keywords): 경쟁에서 우위를 점할 수 있는 키워드 (5-10개)
5. 콘텐츠 갭 (Content Gaps): 현재 콘텐츠에서 부족한 부분
6. 권장사항 (Recommendations): 구체적인 SEO 개선 방안

한국어 키워드를 우선으로 하되, 필요시 영어 키워드도 포함하세요.
relevance는 0.0-1.0 사이의 값으로 제공하세요.
`;
  }

  private parseAnalysisResponse(responseText: string): KeywordAnalysis {
    try {
      // Clean up the response text (remove markdown formatting if any)
      const cleanText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Validate and sanitize the response
      return {
        primaryKeywords: this.validateKeywordArray(parsed.primaryKeywords || [], 'primary'),
        secondaryKeywords: this.validateKeywordArray(parsed.secondaryKeywords || [], 'secondary'),
        longTailKeywords: this.validateKeywordArray(parsed.longTailKeywords || [], 'longTail'),
        competitorKeywords: this.validateKeywordArray(parsed.competitorKeywords || [], 'competitor'),
        contentGaps: Array.isArray(parsed.contentGaps) ? parsed.contentGaps.slice(0, 10) : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 10) : [],
      };
    } catch (error) {
      // Fallback: create a basic analysis from the original content
      console.error('Failed to parse AI response, using fallback:', error);
      return this.createFallbackAnalysis();
    }
  }

  private validateKeywordArray(keywords: any[], type: string): any[] {
    if (!Array.isArray(keywords)) return [];
    
    return keywords
      .filter(k => k && typeof k.keyword === 'string' && k.keyword.trim().length > 0)
      .map(k => ({
        keyword: k.keyword.trim(),
        relevance: typeof k.relevance === 'number' ? Math.max(0, Math.min(1, k.relevance)) : 0.5,
        ...this.getTypeSpecificFields(k, type)
      }))
      .slice(0, type === 'primary' ? 10 : type === 'secondary' ? 15 : 20);
  }

  private getTypeSpecificFields(keyword: any, type: string): any {
    switch (type) {
      case 'primary':
        return {
          searchIntent: ['informational', 'navigational', 'transactional', 'commercial'].includes(keyword.searchIntent) 
            ? keyword.searchIntent : 'informational',
          difficulty: ['low', 'medium', 'high'].includes(keyword.difficulty) ? keyword.difficulty : 'medium',
          priority: ['high', 'medium', 'low'].includes(keyword.priority) ? keyword.priority : 'medium',
        };
      case 'secondary':
        return {
          searchIntent: ['informational', 'navigational', 'transactional', 'commercial'].includes(keyword.searchIntent) 
            ? keyword.searchIntent : 'informational',
        };
      case 'longTail':
        return {
          searchVolumePotential: ['high', 'medium', 'low'].includes(keyword.searchVolumePotential) 
            ? keyword.searchVolumePotential : 'medium',
        };
      case 'competitor':
        return {
          competitionLevel: ['high', 'medium', 'low'].includes(keyword.competitionLevel) 
            ? keyword.competitionLevel : 'medium',
        };
      default:
        return {};
    }
  }

  private createFallbackAnalysis(): KeywordAnalysis {
    return {
      primaryKeywords: [
        {
          keyword: "기본 키워드",
          relevance: 0.8,
          searchIntent: 'informational' as const,
          difficulty: 'medium' as const,
          priority: 'medium' as const,
        }
      ],
      secondaryKeywords: [],
      longTailKeywords: [],
      competitorKeywords: [],
      contentGaps: ["AI 분석을 완료할 수 없어 기본 분석을 제공합니다."],
      recommendations: ["Google AI API 키를 확인하고 다시 시도해주세요."],
    };
  }

  async enhanceKeywords(keywords: string[], domain: string): Promise<string[]> {
    try {
      const prompt = `
다음 키워드들을 "${domain}" 도메인에 맞게 확장하고 개선해주세요:
${keywords.join(', ')}

추가적인 관련 키워드와 롱테일 키워드를 제안해주세요.
결과는 JSON 배열 형태로 제공해주세요:
["키워드1", "키워드2", "키워드3", ...]

최대 30개의 키워드를 제안해주세요.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const enhancedKeywords = JSON.parse(response.text());
      
      return Array.isArray(enhancedKeywords) ? enhancedKeywords.slice(0, 30) : keywords;
    } catch (error) {
      console.error('Failed to enhance keywords:', error);
      return keywords;
    }
  }
}

export const googleAI = new GoogleAIService();