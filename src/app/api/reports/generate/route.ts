import { NextRequest, NextResponse } from 'next/server';
import { productionAnalysisService } from '@/lib/production-analysis-service';
import { reportGenerator } from '@/lib/simple-report-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, options } = body;

    // Validate input
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job data
    const job = await productionAnalysisService.getJobStatus(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Analysis must be completed before generating report' },
        { status: 400 }
      );
    }

    // Get keywords
    const keywords = await productionAnalysisService.getJobResults(jobId);
    
    // Prepare report data
    const reportData = {
      jobId: job.id,
      targetUrl: job.targetUrl,
      domain: job.domain,
      keywords,
      analysis: {
        totalKeywords: keywords.length,
        avgRanking: keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length || 0,
        top10Keywords: keywords.filter(k => k.position <= 10).length,
        adOpportunities: keywords.filter(k => k.type === 'ad').length,
        lowCompetitionKeywords: keywords.filter(k => k.competition === 'low').length,
      },
      generatedAt: new Date(),
    };

    // Default report options
    const reportOptions = {
      format: options?.format || 'pdf',
      sections: {
        summary: options?.sections?.summary ?? true,
        keywords: options?.sections?.keywords ?? true,
        competitors: options?.sections?.competitors ?? false,
        recommendations: options?.sections?.recommendations ?? true,
      },
      title: options?.title || `SEO 분석 보고서 - ${reportData.domain}`,
    };

    // Generate report
    const report = await reportGenerator.generateReport(reportData, reportOptions);

    return NextResponse.json({
      success: true,
      report: {
        downloadUrl: report.downloadUrl,
        fileName: report.fileName,
        fileSize: report.fileSize,
        format: reportOptions.format,
        generatedAt: reportData.generatedAt.toISOString(),
      },
      message: 'Report generated successfully',
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