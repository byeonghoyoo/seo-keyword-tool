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

    const job = await productionAnalysisService.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        targetUrl: job.targetUrl,
        domain: job.domain,
        status: job.status,
        progress: job.progress,
        currentPhase: job.currentPhase,
        keywordsFound: job.keywordsFound,
        processedKeywords: job.processedKeywords,
        totalKeywords: job.totalKeywords,
        currentKeyword: job.currentKeyword,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        errorMessage: job.errorMessage,
      },
    });
  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}