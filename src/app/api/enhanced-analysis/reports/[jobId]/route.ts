import { NextRequest, NextResponse } from 'next/server';
import { enhancedAnalysisService } from '@/lib/enhanced-analysis-service';
import { reportGenerator, type ReportOptions } from '@/lib/simple-report-generator';
import type { KeywordResult } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body = await request.json();
    
    const reportOptions = {
      includeCharts: body.includeCharts ?? true,
      includeCompetitorAnalysis: body.includeCompetitorAnalysis ?? true,
      includeKeywordDetails: body.includeKeywordDetails ?? true,
      language: body.language || 'ko',
      format: body.format || 'pdf',
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

    // Transform data for simple report generator
    const reportData = {
      jobId: job.id,
      targetUrl: job.targetUrl,
      domain: job.domain,
      keywords: keywordResults.map(k => ({
        id: k.id,
        keyword: k.keyword,
        position: k.currentRanking || 999,
        page: 1,
        type: k.searchIntent === 'transactional' ? 'ad' : 'organic',
        url: job.targetUrl,
        title: k.keyword,
        searchVolume: k.estimatedSearchVolume,
        competition: k.competitionLevel,
        estimatedCPC: k.estimatedCPC,
        discovered: k.discovered,
      } as KeywordResult)),
      analysis: {
        totalKeywords: job.results.finalStats.totalKeywords,
        avgRanking: keywordResults.reduce((sum, k) => sum + (k.currentRanking || 999), 0) / keywordResults.length || 0,
        top10Keywords: keywordResults.filter(k => k.currentRanking && k.currentRanking <= 10).length,
        adOpportunities: keywordResults.filter(k => k.searchIntent === 'transactional').length,
        lowCompetitionKeywords: job.results.finalStats.opportunityKeywords,
      },
      generatedAt: new Date(),
    };

    // Default report options for simple generator
    const simpleReportOptions = {
      format: (reportOptions.format || 'pdf') as 'pdf' | 'excel' | 'html',
      sections: {
        summary: true,
        keywords: true,
        competitors: false,
        recommendations: true,
      },
      title: `SEO 분석 보고서 - ${job.domain}`,
    };

    // Generate report
    const report = await reportGenerator.generateReport(reportData, simpleReportOptions);

    return NextResponse.json({
      success: true,
      report: {
        downloadUrl: report.downloadUrl,
        fileName: report.fileName,
        fileSize: report.fileSize,
        format: simpleReportOptions.format,
        generatedAt: reportData.generatedAt.toISOString(),
      },
      message: 'Report generated successfully',
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

    // Transform data for simple report generator
    const reportData = {
      jobId: job.id,
      targetUrl: job.targetUrl,
      domain: job.domain,
      keywords: keywordResults.map(k => ({
        id: k.id,
        keyword: k.keyword,
        position: k.currentRanking || 999,
        page: 1,
        type: k.searchIntent === 'transactional' ? 'ad' : 'organic',
        url: job.targetUrl,
        title: k.keyword,
        searchVolume: k.estimatedSearchVolume,
        competition: k.competitionLevel,
        estimatedCPC: k.estimatedCPC,
        discovered: k.discovered,
      } as KeywordResult)),
      analysis: {
        totalKeywords: job.results.finalStats.totalKeywords,
        avgRanking: keywordResults.reduce((sum, k) => sum + (k.currentRanking || 999), 0) / keywordResults.length || 0,
        top10Keywords: keywordResults.filter(k => k.currentRanking && k.currentRanking <= 10).length,
        adOpportunities: keywordResults.filter(k => k.searchIntent === 'transactional').length,
        lowCompetitionKeywords: job.results.finalStats.opportunityKeywords,
      },
      generatedAt: new Date(),
    };

    // Simple report options (only one type supported now)
    const simpleReportOptions = {
      format: 'pdf' as const,
      sections: {
        summary: true,
        keywords: true,
        competitors: reportType === 'competitor',
        recommendations: true,
      },
      title: `SEO 분석 보고서 - ${job.domain}`,
    };

    // Generate report
    const report = await reportGenerator.generateReport(reportData, simpleReportOptions);
    const reports = [report]; // Wrap in array to match expected structure

    return NextResponse.json({
      success: true,
      reportType,
      report: {
        downloadUrl: report.downloadUrl,
        fileName: report.fileName,
        fileSize: report.fileSize,
        format: simpleReportOptions.format,
        generatedAt: reportData.generatedAt.toISOString(),
      },
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