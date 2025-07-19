import { NextRequest, NextResponse } from 'next/server';
import { productionAnalysisService } from '@/lib/production-analysis-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job status first
    const job = await productionAnalysisService.getJobStatus(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get results and logs
    const [results, logs] = await Promise.all([
      productionAnalysisService.getJobResults(jobId),
      productionAnalysisService.getJobLogs(jobId),
    ]);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        targetUrl: job.targetUrl,
        domain: job.domain,
        status: job.status,
        progress: job.progress,
        keywordsFound: job.keywordsFound,
        completedAt: job.completedAt?.toISOString(),
        errorMessage: job.errorMessage,
      },
      results: results.map(result => ({
        id: result.id,
        keyword: result.keyword,
        position: result.position,
        page: result.page,
        type: result.type,
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        searchVolume: result.searchVolume,
        competition: result.competition,
        estimatedCPC: result.estimatedCPC,
        previousPosition: result.previousPosition,
        discovered: result.discovered.toISOString(),
      })),
      logs: logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        phase: log.phase,
      })),
    });
  } catch (error) {
    console.error('Get job results error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get job results',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}