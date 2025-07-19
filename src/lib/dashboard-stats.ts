import { supabase } from './supabase';

export interface DashboardStats {
  totalKeywords: number;
  totalAnalyses: number;
  averageRanking: number;
  topRankingKeywords: number;
  recentAnalyses: Array<{
    id: string;
    targetUrl: string;
    domain: string;
    createdAt: string;
    status: string;
    keywordsFound: number;
  }>;
  keywordsByCategory: {
    primary: number;
    secondary: number;
    longTail: number;
  };
  searchVolumeDistribution: {
    high: number; // >5000
    medium: number; // 1000-5000
    low: number; // <1000
  };
  competitionDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  topKeywords: Array<{
    keyword: string;
    domain: string;
    searchVolume: number;
    ranking: number | null;
    category: string;
  }>;
  performanceMetrics: {
    avgAnalysisTime: number; // in minutes
    successRate: number; // percentage
    totalProcessingTime: number; // in hours
  };
}

export class DashboardStatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get all analysis jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      // Get all keyword results
      const { data: keywords, error: keywordsError } = await supabase
        .from('keyword_results')
        .select('*');

      if (keywordsError) {
        console.error('Error fetching keywords:', keywordsError);
      }

      // Calculate stats from real data
      const totalKeywords = keywords?.length || 0;
      const totalAnalyses = jobs?.length || 0;
      
      // Calculate average ranking (excluding null values)
      const rankedKeywords = keywords?.filter(k => k.current_ranking) || [];
      const averageRanking = rankedKeywords.length > 0 
        ? rankedKeywords.reduce((sum, k) => sum + (k.current_ranking || 0), 0) / rankedKeywords.length
        : 0;

      // Count top 10 ranking keywords
      const topRankingKeywords = keywords?.filter(k => k.current_ranking && k.current_ranking <= 10).length || 0;

      // Recent analyses (last 10)
      const recentAnalyses = (jobs || []).slice(0, 10).map(job => ({
        id: job.id,
        targetUrl: job.target_url,
        domain: job.domain,
        createdAt: job.created_at,
        status: job.status,
        keywordsFound: job.results?.finalStats?.totalKeywords || 0,
      }));

      // Keywords by category
      const keywordsByCategory = {
        primary: keywords?.filter(k => k.category === 'primary').length || 0,
        secondary: keywords?.filter(k => k.category === 'secondary').length || 0,
        longTail: keywords?.filter(k => k.category === 'long-tail').length || 0,
      };

      // Search volume distribution
      const searchVolumeDistribution = {
        high: keywords?.filter(k => k.estimated_search_volume > 5000).length || 0,
        medium: keywords?.filter(k => k.estimated_search_volume >= 1000 && k.estimated_search_volume <= 5000).length || 0,
        low: keywords?.filter(k => k.estimated_search_volume < 1000).length || 0,
      };

      // Competition distribution
      const competitionDistribution = {
        low: keywords?.filter(k => k.competition_level === 'low').length || 0,
        medium: keywords?.filter(k => k.competition_level === 'medium').length || 0,
        high: keywords?.filter(k => k.competition_level === 'high').length || 0,
      };

      // Top keywords (highest search volume with ranking)
      const topKeywords = (keywords || [])
        .filter(k => k.estimated_search_volume > 0)
        .sort((a, b) => b.estimated_search_volume - a.estimated_search_volume)
        .slice(0, 10)
        .map(k => {
          // Find the job for this keyword to get domain
          const job = jobs?.find(j => j.id === k.job_id);
          return {
            keyword: k.keyword,
            domain: job?.domain || 'Unknown',
            searchVolume: k.estimated_search_volume,
            ranking: k.current_ranking,
            category: k.category,
          };
        });

      // Performance metrics
      const completedJobs = jobs?.filter(j => j.status === 'completed') || [];
      const failedJobs = jobs?.filter(j => j.status === 'failed') || [];
      
      const successRate = totalAnalyses > 0 
        ? (completedJobs.length / totalAnalyses) * 100 
        : 100;

      // Calculate average analysis time for completed jobs
      const analysisTimesInMs = completedJobs
        .filter(job => job.created_at && job.completed_at)
        .map(job => {
          const start = new Date(job.created_at).getTime();
          const end = new Date(job.completed_at).getTime();
          return end - start;
        });

      const avgAnalysisTime = analysisTimesInMs.length > 0
        ? analysisTimesInMs.reduce((sum, time) => sum + time, 0) / analysisTimesInMs.length / 60000 // Convert to minutes
        : 0;

      const totalProcessingTime = analysisTimesInMs.reduce((sum, time) => sum + time, 0) / 3600000; // Convert to hours

      const performanceMetrics = {
        avgAnalysisTime: Math.round(avgAnalysisTime * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
        totalProcessingTime: Math.round(totalProcessingTime * 10) / 10,
      };

      return {
        totalKeywords,
        totalAnalyses,
        averageRanking: Math.round(averageRanking * 10) / 10,
        topRankingKeywords,
        recentAnalyses,
        keywordsByCategory,
        searchVolumeDistribution,
        competitionDistribution,
        topKeywords,
        performanceMetrics,
      };

    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      
      // Return fallback stats if database is not available
      return this.getFallbackStats();
    }
  }

  private getFallbackStats(): DashboardStats {
    return {
      totalKeywords: 0,
      totalAnalyses: 0,
      averageRanking: 0,
      topRankingKeywords: 0,
      recentAnalyses: [],
      keywordsByCategory: {
        primary: 0,
        secondary: 0,
        longTail: 0,
      },
      searchVolumeDistribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
      competitionDistribution: {
        low: 0,
        medium: 0,
        high: 0,
      },
      topKeywords: [],
      performanceMetrics: {
        avgAnalysisTime: 0,
        successRate: 100,
        totalProcessingTime: 0,
      },
    };
  }

  async getAnalysisHistory(limit: number = 50): Promise<Array<{
    id: string;
    targetUrl: string;
    domain: string;
    analyzedAt: string;
    status: 'completed' | 'failed' | 'partial';
    keywordsFound: number;
    averageRanking: number;
    duration: number; // in minutes
    tags: string[];
  }>> {
    try {
      const { data: jobs, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching analysis history:', error);
        return [];
      }

      return (jobs || []).map(job => {
        const duration = job.created_at && job.completed_at
          ? (new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 60000
          : 0;

        const status = job.status === 'completed' ? 'completed' : 
                      job.status === 'failed' ? 'failed' : 'partial';

        // Generate tags based on analysis results
        const tags: string[] = [];
        if (job.results?.finalStats?.opportunityKeywords > 0) tags.push('기회 키워드');
        if (job.results?.finalStats?.primaryKeywords > 10) tags.push('높은 키워드 수');
        if (job.results?.competitorAnalysis) tags.push('경쟁사 분석');
        if (job.results?.finalStats?.avgCPC > 1000) tags.push('높은 CPC');

        return {
          id: job.id,
          targetUrl: job.target_url,
          domain: job.domain,
          analyzedAt: job.created_at,
          status,
          keywordsFound: job.results?.finalStats?.totalKeywords || 0,
          averageRanking: 0, // Would need to calculate from keyword results
          duration: Math.round(duration * 10) / 10,
          tags,
        };
      });

    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }

  async getCompetitorProfiles(): Promise<Array<{
    id: string;
    domain: string;
    name: string;
    description: string;
    website: string;
    addedAt: string;
    lastAnalyzed?: string;
    metrics: {
      totalKeywords: number;
      averageRanking: number;
      commonKeywords: number;
      uniqueKeywords: number;
    };
  }>> {
    try {
      // Get unique competitors from analysis results
      const { data: jobs, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .not('results->competitorAnalysis', 'is', null);

      if (error) {
        console.error('Error fetching competitor data:', error);
        return [];
      }

      const competitorMap = new Map();

      (jobs || []).forEach(job => {
        const competitors = job.results?.competitorAnalysis?.competitors || [];
        competitors.forEach((comp: any) => {
          if (!competitorMap.has(comp.name)) {
            competitorMap.set(comp.name, {
              id: `comp_${comp.name.replace(/\s+/g, '_').toLowerCase()}`,
              domain: comp.website ? new URL(comp.website).hostname : 'unknown',
              name: comp.name,
              description: comp.types?.join(', ') || 'Business',
              website: comp.website || '',
              addedAt: job.created_at,
              lastAnalyzed: job.created_at,
              metrics: {
                totalKeywords: 0,
                averageRanking: comp.rating || 0,
                commonKeywords: 0,
                uniqueKeywords: 0,
              },
            });
          }
        });
      });

      return Array.from(competitorMap.values()).slice(0, 20);

    } catch (error) {
      console.error('Error fetching competitor profiles:', error);
      return [];
    }
  }

  async getRecentAnalyses(limit: number = 10): Promise<Array<{
    id: string;
    targetUrl: string;
    domain: string;
    analyzedAt: string;
    status: 'completed' | 'failed' | 'partial';
    keywordsFound: number;
  }>> {
    try {
      const { data: jobs, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent analyses:', error);
        return [];
      }

      return (jobs || []).map(job => ({
        id: job.id,
        targetUrl: job.target_url,
        domain: job.domain,
        analyzedAt: job.created_at,
        status: job.status === 'completed' ? 'completed' : 
                job.status === 'failed' ? 'failed' : 'partial',
        keywordsFound: job.results?.finalStats?.totalKeywords || 0,
      }));

    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      return [];
    }
  }
}

export const dashboardStatsService = new DashboardStatsService();