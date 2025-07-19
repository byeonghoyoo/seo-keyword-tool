import { webScraper, type ScrapedContent } from './scraper';
import type { AnalysisOptions, KeywordResult, LogEntry } from '@/types';

export interface AnalysisJob {
  id: string;
  targetUrl: string;
  domain: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentPhase: string;
  keywordsFound: number;
  processedKeywords: number;
  totalKeywords: number;
  currentKeyword?: string;
  analysisOptions: AnalysisOptions;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// Mock database for testing
const mockJobs = new Map<string, AnalysisJob>();
const mockResults = new Map<string, KeywordResult[]>();
const mockLogs = new Map<string, LogEntry[]>();

export class TestAnalysisService {
  async startAnalysis(targetUrl: string, options: AnalysisOptions): Promise<string> {
    try {
      // Generate a test job ID
      const jobId = `test-job-${Date.now()}`;
      const domain = this.extractDomain(targetUrl);
      
      // Create analysis job
      const job: AnalysisJob = {
        id: jobId,
        targetUrl,
        domain,
        status: 'pending',
        progress: 0,
        currentPhase: 'initializing',
        keywordsFound: 0,
        processedKeywords: 0,
        totalKeywords: 0,
        analysisOptions: options,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockJobs.set(jobId, job);
      mockResults.set(jobId, []);
      mockLogs.set(jobId, []);

      // Start the analysis process (don't await - run in background)
      this.runAnalysis(jobId, targetUrl, domain, options).catch(error => {
        console.error('Analysis failed:', error);
        this.updateJobStatus(jobId, 'failed', error.message);
      });

      return jobId;
    } catch (error) {
      throw new Error(`Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runAnalysis(jobId: string, targetUrl: string, domain: string, options: AnalysisOptions): Promise<void> {
    try {
      await this.updateJobStatus(jobId, 'running', undefined, 0, 'analyzing');
      await this.addLog(jobId, 'info', 'Starting website analysis', 'analyzing');

      // Phase 1: Scrape website content
      await this.updateJobProgress(jobId, 10, 'analyzing', 'Scraping website content...');
      const scrapedContent = await webScraper.scrapeUrl(targetUrl);
      await this.addLog(jobId, 'success', `Website scraped successfully. Found ${scrapedContent.keywords.length} initial keywords`, 'analyzing');

      // Phase 2: Generate mock AI analysis (since we don't have real API keys)
      await this.updateJobProgress(jobId, 30, 'expanding', 'Analyzing content with AI...');
      const allKeywords = this.generateMockKeywords(scrapedContent, domain);
      await this.addLog(jobId, 'success', `AI analysis completed. Generated ${allKeywords.length} keywords`, 'expanding');

      // Update total keywords count
      const currentJob = mockJobs.get(jobId)!;
      currentJob.totalKeywords = allKeywords.length;
      currentJob.keywordsFound = allKeywords.length;
      mockJobs.set(jobId, currentJob);

      // Phase 3: Generate mock search results
      await this.updateJobProgress(jobId, 50, 'crawling', 'Checking search rankings...');
      
      const keywordResults: KeywordResult[] = [];
      
      // Process keywords in batches
      for (let i = 0; i < allKeywords.length; i++) {
        const keyword = allKeywords[i];
        const progress = 50 + ((i + 1) / allKeywords.length) * 30;
        await this.updateJobProgress(jobId, progress, 'crawling', `Checking rankings: ${keyword}`);
        
        // Generate mock result for each keyword
        const result: KeywordResult = {
          id: `result-${jobId}-${i}`,
          keyword,
          position: Math.floor(Math.random() * 50) + 1,
          page: Math.floor(Math.random() * 5) + 1,
          type: Math.random() > 0.8 ? 'ad' : 'organic',
          url: `${targetUrl}sample-page-${i}`,
          title: `${keyword} - ${domain}`,
          snippet: `Sample snippet for ${keyword} on ${domain}`,
          searchVolume: Math.floor(Math.random() * 10000) + 100,
          competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          estimatedCPC: Math.floor(Math.random() * 5000) + 100,
          previousPosition: undefined,
          discovered: new Date(),
        };
        
        keywordResults.push(result);
        
        // Add some delay to simulate real processing
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      mockResults.set(jobId, keywordResults);
      await this.addLog(jobId, 'info', `Processed ${allKeywords.length} keywords`, 'crawling');

      // Phase 4: Complete analysis
      await this.updateJobProgress(jobId, 85, 'processing', 'Saving results...');
      await this.addLog(jobId, 'success', `Saved ${keywordResults.length} keyword results`, 'processing');

      // Phase 5: Finish
      await this.updateJobProgress(jobId, 100, 'completing', 'Analysis completed');
      await this.updateJobStatus(jobId, 'completed');
      
      const finalJob = mockJobs.get(jobId)!;
      finalJob.processedKeywords = allKeywords.length;
      finalJob.completedAt = new Date();
      mockJobs.set(jobId, finalJob);
      
      await this.addLog(jobId, 'success', 'Analysis completed successfully', 'completing');

    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      await this.addLog(jobId, 'error', `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateMockKeywords(content: ScrapedContent, domain: string): string[] {
    // Start with scraped keywords
    const baseKeywords = [...content.keywords];
    
    // Add some domain-specific keywords
    const domainKeywords = [
      ...content.headings.h1,
      ...content.headings.h2,
      ...content.headings.h3,
    ].map(h => h.split(' ')).flat().filter(w => w.length > 2);
    
    // Generate some related keywords based on content
    const relatedKeywords = [
      `${domain} 서비스`,
      `${domain} 가격`,
      `${domain} 후기`,
      `${domain} 예약`,
      `${domain} 문의`,
    ];

    const keywordSet = new Set([...baseKeywords, ...domainKeywords, ...relatedKeywords]);
    const allKeywords = Array.from(keywordSet);
    return allKeywords.slice(0, 30); // Limit to 30 keywords for testing
  }

  private extractDomain(url: string): string {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: 'pending' | 'running' | 'completed' | 'failed', 
    errorMessage?: string,
    progress?: number,
    phase?: string
  ): Promise<void> {
    const job = mockJobs.get(jobId);
    if (!job) return;
    
    job.status = status;
    job.updatedAt = new Date();
    if (errorMessage) job.errorMessage = errorMessage;
    if (progress !== undefined) job.progress = progress;
    if (phase) job.currentPhase = phase;
    
    mockJobs.set(jobId, job);
  }

  private async updateJobProgress(
    jobId: string, 
    progress: number, 
    phase: string, 
    currentKeyword?: string
  ): Promise<void> {
    const job = mockJobs.get(jobId);
    if (!job) return;
    
    job.progress = progress;
    job.currentPhase = phase;
    job.updatedAt = new Date();
    if (currentKeyword) job.currentKeyword = currentKeyword;
    
    mockJobs.set(jobId, job);
  }

  private async addLog(
    jobId: string, 
    level: 'info' | 'warning' | 'error' | 'success', 
    message: string, 
    phase?: string
  ): Promise<void> {
    const logs = mockLogs.get(jobId) || [];
    const log: LogEntry = {
      id: `log-${jobId}-${logs.length}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      phase,
    };
    
    logs.push(log);
    mockLogs.set(jobId, logs);
  }

  async getJobStatus(jobId: string): Promise<AnalysisJob | null> {
    return mockJobs.get(jobId) || null;
  }

  async getJobResults(jobId: string): Promise<KeywordResult[]> {
    return mockResults.get(jobId) || [];
  }

  async getJobLogs(jobId: string): Promise<LogEntry[]> {
    return mockLogs.get(jobId) || [];
  }
}

export const testAnalysisService = new TestAnalysisService();