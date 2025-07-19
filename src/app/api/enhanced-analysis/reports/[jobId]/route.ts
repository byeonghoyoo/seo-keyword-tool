import { NextRequest, NextResponse } from 'next/server';
import { enhancedAnalysisService } from '@/lib/enhanced-analysis-service';
import { reportGenerator, type ReportOptions } from '@/lib/report-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body = await request.json();
    
    const reportOptions: ReportOptions = {
      includeCharts: body.includeCharts ?? true,
      includeCompetitorAnalysis: body.includeCompetitorAnalysis ?? true,
      includeKeywordDetails: body.includeKeywordDetails ?? true,
      language: body.language || 'ko',
      format: body.format || 'both',
    };

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job and results
    const [job, keywordResults] = await Promise.all([
      enhancedAnalysisService.getJobStatus(jobId),
      enhancedAnalysisService.getJobResults(jobId),
    ]);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Analysis not yet completed' },
        { status: 400 }
      );
    }

    // Generate comprehensive report
    const reports = await reportGenerator.generateComprehensiveReport(
      job,
      keywordResults,
      reportOptions
    );

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        id: report.id,
        type: report.type,
        format: report.format,
        filename: report.filename,
        downloadUrl: report.downloadUrl,
        size: report.size,
        generatedAt: report.generatedAt.toISOString(),
        expiresAt: report.expiresAt.toISOString(),
      })),
      message: `${reports.length} report(s) generated successfully`,
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate reports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'comprehensive';

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job and results
    const [job, keywordResults] = await Promise.all([
      enhancedAnalysisService.getJobStatus(jobId),
      enhancedAnalysisService.getJobResults(jobId),
    ]);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Analysis not yet completed' },
        { status: 400 }
      );
    }

    let reports = [];

    switch (reportType) {
      case 'comprehensive':
        reports = await reportGenerator.generateComprehensiveReport(job, keywordResults);
        break;
      
      case 'competitor':
        if (job.results.competitorAnalysis) {
          reports = await reportGenerator.generateCompetitorReport(job.results.competitorAnalysis);
        } else {
          return NextResponse.json(
            { error: 'Competitor analysis not available for this job' },
            { status: 400 }
          );
        }
        break;
      
      case 'keyword-priority':
        reports = await reportGenerator.generateKeywordPriorityReport(keywordResults);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: comprehensive, competitor, or keyword-priority' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      reportType,
      reports: reports.map(report => ({
        id: report.id,
        type: report.type,
        format: report.format,
        filename: report.filename,
        downloadUrl: report.downloadUrl,
        size: report.size,
        generatedAt: report.generatedAt.toISOString(),
        expiresAt: report.expiresAt.toISOString(),
      })),
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}