import { supabaseAdmin } from './supabase';
import { webScraper, type ScrapedContent } from './scraper';
import { googleAI, type KeywordAnalysis } from './google-ai';
import { searchRanking, type RankingResult } from './search-ranking';
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

export class AnalysisService {
  private jobs = new Map<string, AnalysisJob>();

  async startAnalysis(targetUrl: string, options: AnalysisOptions): Promise<string> {
    try {
      // Validate URL and extract domain
      const domain = this.extractDomain(targetUrl);
      
      // Create analysis job in database
      const { data: job, error } = await supabaseAdmin
        .from('analysis_jobs')
        .insert({
          target_url: targetUrl,
          domain: domain,
          status: 'pending',
          progress: 0,
          current_phase: 'initializing',
          keywords_found: 0,
          processed_keywords: 0,
          total_keywords: 0,
          analysis_options: options,
        })
        .select()
        .single();

      if (error || !job) {
        throw new Error('Failed to create analysis job');
      }

      // Start the analysis process (don't await - run in background)
      this.runAnalysis(job.id, targetUrl, domain, options).catch(error => {
        console.error('Analysis failed:', error);
        this.updateJobStatus(job.id, 'failed', error.message);
      });

      return job.id;
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

      // Phase 2: AI keyword analysis
      await this.updateJobProgress(jobId, 30, 'expanding', 'Analyzing content with AI...');
      const keywordAnalysis = await googleAI.analyzeKeywords(scrapedContent, domain);
      
      // Combine all keywords from AI analysis
      const allKeywords = this.combineKeywords(keywordAnalysis);
      await this.addLog(jobId, 'success', `AI analysis completed. Generated ${allKeywords.length} keywords`, 'expanding');

      // Update total keywords count
      await this.updateJobData(jobId, {
        total_keywords: allKeywords.length,
        keywords_found: allKeywords.length,
      });

      // Phase 3: Check search rankings
      await this.updateJobProgress(jobId, 50, 'crawling', 'Checking search rankings...');
      
      const rankingResults: RankingResult[] = [];
      const keywordResults: KeywordResult[] = [];
      
      // Process keywords in batches to avoid overwhelming APIs
      const batchSize = 5;
      for (let i = 0; i < allKeywords.length; i += batchSize) {
        const batch = allKeywords.slice(i, i + batchSize);
        const batchResults = await searchRanking.batchCheckRankings(
          batch,
          domain,
          options.searchEngine,
          options.maxPages,
          (completed, total, currentKeyword) => {
            const overallProgress = 50 + ((i + completed) / allKeywords.length) * 30;
            this.updateJobProgress(jobId, overallProgress, 'crawling', `Checking rankings: ${currentKeyword}`);
          }
        );
        
        rankingResults.push(...batchResults);
        
        // Convert ranking results to keyword results
        for (const rankingResult of batchResults) {
          for (const result of rankingResult.results) {
            keywordResults.push({
              id: `${jobId}-${rankingResult.keyword}-${result.position}`,
              keyword: rankingResult.keyword,
              position: result.position,
              page: result.page,
              type: result.type,
              url: result.url,
              title: result.title,
              snippet: result.snippet,
              searchVolume: searchRanking.estimateSearchVolume(rankingResult.keyword),
              competition: this.determineCompetition(rankingResult.keyword),
              estimatedCPC: this.estimateCPC(rankingResult.keyword),
              previousPosition: undefined,
              discovered: new Date(),
            });
          }
        }

        await this.addLog(jobId, 'info', `Processed ${Math.min(i + batchSize, allKeywords.length)} of ${allKeywords.length} keywords`, 'crawling');
      }

      // Phase 4: Save results to database
      await this.updateJobProgress(jobId, 85, 'processing', 'Saving results to database...');
      
      if (keywordResults.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('keyword_results')
          .insert(keywordResults);

        if (insertError) {
          throw new Error(`Failed to save keyword results: ${insertError.message}`);
        }
      }

      await this.addLog(jobId, 'success', `Saved ${keywordResults.length} keyword results to database`, 'processing');

      // Phase 5: Complete analysis
      await this.updateJobProgress(jobId, 100, 'completing', 'Analysis completed');
      await this.updateJobStatus(jobId, 'completed');
      await this.updateJobData(jobId, {
        processed_keywords: allKeywords.length,
        completed_at: new Date().toISOString(),
      });
      
      await this.addLog(jobId, 'success', 'Analysis completed successfully', 'completing');

    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      await this.addLog(jobId, 'error', `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private combineKeywords(analysis: KeywordAnalysis): string[] {
    const allKeywords = new Set<string>();
    
    analysis.primaryKeywords.forEach(k => allKeywords.add(k.keyword));
    analysis.secondaryKeywords.forEach(k => allKeywords.add(k.keyword));
    analysis.longTailKeywords.forEach(k => allKeywords.add(k.keyword));
    analysis.competitorKeywords.forEach(k => allKeywords.add(k.keyword));
    
    return Array.from(allKeywords);
  }

  private determineCompetition(keyword: string): 'low' | 'medium' | 'high' {
    // Simple heuristic - in production, use actual competition data
    if (keyword.length > 20) return 'low';
    if (keyword.includes('가격') || keyword.includes('비용')) return 'high';
    return 'medium';
  }

  private estimateCPC(keyword: string): number {
    // Simple estimation - in production, use actual CPC data
    const basePrice = Math.random() * 5000 + 100;
    if (keyword.includes('가격') || keyword.includes('비용')) return basePrice * 1.5;
    if (keyword.length > 20) return basePrice * 0.5;
    return basePrice;
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
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (errorMessage) updateData.error_message = errorMessage;
    if (progress !== undefined) updateData.progress = progress;
    if (phase) updateData.current_phase = phase;

    const { error } = await supabaseAdmin
      .from('analysis_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('Failed to update job status:', error);
    }
  }

  private async updateJobProgress(
    jobId: string, 
    progress: number, 
    phase: string, 
    currentKeyword?: string
  ): Promise<void> {
    const updateData: any = {
      progress,
      current_phase: phase,
      updated_at: new Date().toISOString(),
    };
    
    if (currentKeyword) updateData.current_keyword = currentKeyword;

    const { error } = await supabaseAdmin
      .from('analysis_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('Failed to update job progress:', error);
    }
  }

  private async updateJobData(jobId: string, data: any): Promise<void> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('analysis_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('Failed to update job data:', error);
    }
  }

  private async addLog(
    jobId: string, 
    level: 'info' | 'warning' | 'error' | 'success', 
    message: string, 
    phase?: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('analysis_logs')
      .insert({
        job_id: jobId,
        level,
        message,
        phase,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to add log:', error);
    }
  }

  async getJobStatus(jobId: string): Promise<AnalysisJob | null> {
    const { data, error } = await supabaseAdmin
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      targetUrl: data.target_url,
      domain: data.domain,
      status: data.status,
      progress: data.progress,
      currentPhase: data.current_phase,
      keywordsFound: data.keywords_found,
      processedKeywords: data.processed_keywords,
      totalKeywords: data.total_keywords,
      currentKeyword: data.current_keyword,
      analysisOptions: data.analysis_options,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errorMessage: data.error_message,
    };
  }

  async getJobResults(jobId: string): Promise<KeywordResult[]> {
    const { data, error } = await supabaseAdmin
      .from('keyword_results')
      .select('*')
      .eq('job_id', jobId)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Failed to get job results: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      keyword: row.keyword,
      position: row.position,
      page: row.page,
      type: row.type,
      url: row.url,
      title: row.title,
      snippet: row.snippet,
      searchVolume: row.search_volume,
      competition: row.competition,
      estimatedCPC: row.estimated_cpc,
      previousPosition: row.previous_position,
      discovered: new Date(row.discovered_at),
    }));
  }

  async getJobLogs(jobId: string): Promise<LogEntry[]> {
    const { data, error } = await supabaseAdmin
      .from('analysis_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to get job logs: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level,
      message: row.message,
      phase: row.phase,
    }));
  }
}

export const analysisService = new AnalysisService();