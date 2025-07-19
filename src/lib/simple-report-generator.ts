import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { KeywordResult } from '@/types';
import { supabaseAdmin } from './supabase';

export interface ReportData {
  jobId: string;
  targetUrl: string;
  domain: string;
  keywords: KeywordResult[];
  analysis: {
    totalKeywords: number;
    avgRanking: number;
    top10Keywords: number;
    adOpportunities: number;
    lowCompetitionKeywords: number;
  };
  generatedAt: Date;
}

export interface ReportOptions {
  format: 'pdf' | 'excel' | 'html';
  sections: {
    summary: boolean;
    keywords: boolean;
    competitors: boolean;
    recommendations: boolean;
  };
  title?: string;
}

class SimpleReportGenerator {
  async generateReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ downloadUrl: string; fileName: string; fileSize: number }> {
    try {
      let fileName: string;
      let buffer: Buffer;
      let mimeType: string;

      switch (options.format) {
        case 'pdf':
          ({ buffer, fileName } = await this.generatePDFReport(reportData, options));
          mimeType = 'application/pdf';
          break;
        case 'excel':
          ({ buffer, fileName } = await this.generateExcelReport(reportData, options));
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'html':
          ({ buffer, fileName } = await this.generateHTMLReport(reportData, options));
          mimeType = 'text/html';
          break;
        default:
          throw new Error('Unsupported report format');
      }

      // Store report in database
      await this.storeReport(reportData, options, fileName, buffer.length);

      // Create data URL for download
      const base64Data = buffer.toString('base64');
      const downloadUrl = `data:${mimeType};base64,${base64Data}`;

      return {
        downloadUrl,
        fileName,
        fileSize: buffer.length,
      };

    } catch (error) {
      console.error('Report generation error:', error);
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generatePDFReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text(options.title || 'SEO 키워드 분석 보고서', 20, yPosition);
    yPosition += 20;

    // Basic Info
    doc.setFontSize(12);
    doc.text(`분석 대상: ${reportData.targetUrl}`, 20, yPosition);
    yPosition += 10;
    doc.text(`도메인: ${reportData.domain}`, 20, yPosition);
    yPosition += 10;
    doc.text(`생성일: ${reportData.generatedAt.toLocaleDateString('ko-KR')}`, 20, yPosition);
    yPosition += 20;

    // Summary Section
    if (options.sections.summary) {
      doc.setFontSize(16);
      doc.text('📊 분석 요약', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.text(`총 키워드: ${reportData.analysis.totalKeywords}개`, 20, yPosition);
      yPosition += 8;
      doc.text(`평균 순위: ${reportData.analysis.avgRanking.toFixed(1)}위`, 20, yPosition);
      yPosition += 8;
      doc.text(`상위 10위 키워드: ${reportData.analysis.top10Keywords}개`, 20, yPosition);
      yPosition += 8;
      doc.text(`광고 기회: ${reportData.analysis.adOpportunities}개`, 20, yPosition);
      yPosition += 8;
      doc.text(`낮은 경쟁 키워드: ${reportData.analysis.lowCompetitionKeywords}개`, 20, yPosition);
      yPosition += 20;
    }

    // Keywords Section
    if (options.sections.keywords) {
      doc.setFontSize(16);
      doc.text('🔍 주요 키워드', 20, yPosition);
      yPosition += 15;

      // Top 20 keywords table
      const topKeywords = reportData.keywords
        .sort((a, b) => a.position - b.position)
        .slice(0, 20);

      doc.setFontSize(10);
      doc.text('키워드', 20, yPosition);
      doc.text('순위', 80, yPosition);
      doc.text('검색량', 120, yPosition);
      doc.text('경쟁도', 160, yPosition);
      yPosition += 8;

      // Add line
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 8;

      topKeywords.forEach((keyword, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(keyword.keyword.slice(0, 25) + (keyword.keyword.length > 25 ? '...' : ''), 20, yPosition);
        doc.text(keyword.position.toString(), 80, yPosition);
        doc.text((keyword.searchVolume || 0).toLocaleString(), 120, yPosition);
        doc.text(keyword.competition || 'N/A', 160, yPosition);
        yPosition += 6;
      });
    }

    // Recommendations Section
    if (options.sections.recommendations) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('💡 개선 권장사항', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      const recommendations = this.generateRecommendations(reportData);
      
      recommendations.forEach((rec, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${index + 1}. ${rec}`, 20, yPosition);
        yPosition += 10;
      });
    }

    const fileName = `seo-report-${reportData.domain}-${Date.now()}.pdf`;
    const pdfOutput = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfOutput);

    return { buffer, fileName };
  }

  private async generateExcelReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    if (options.sections.summary) {
      const summaryData = [
        ['SEO 키워드 분석 보고서'],
        [''],
        ['분석 대상', reportData.targetUrl],
        ['도메인', reportData.domain],
        ['생성일', reportData.generatedAt.toLocaleDateString('ko-KR')],
        [''],
        ['분석 요약'],
        ['총 키워드', reportData.analysis.totalKeywords.toString()],
        ['평균 순위', reportData.analysis.avgRanking.toFixed(1)],
        ['상위 10위 키워드', reportData.analysis.top10Keywords.toString()],
        ['광고 기회', reportData.analysis.adOpportunities.toString()],
        ['낮은 경쟁 키워드', reportData.analysis.lowCompetitionKeywords.toString()],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, '요약');
    }

    // Keywords Sheet
    if (options.sections.keywords) {
      const keywordData = [
        ['키워드', '순위', '페이지', '타입', '검색량', '경쟁도', 'CPC', 'URL']
      ];

      reportData.keywords.forEach(keyword => {
        keywordData.push([
          keyword.keyword,
          keyword.position.toString(),
          keyword.page.toString(),
          keyword.type,
          (keyword.searchVolume || 0).toString(),
          keyword.competition || '',
          (keyword.estimatedCPC || 0).toString(),
          keyword.url,
        ]);
      });

      const keywordSheet = XLSX.utils.aoa_to_sheet(keywordData);
      XLSX.utils.book_append_sheet(workbook, keywordSheet, '키워드 목록');
    }

    // Recommendations Sheet
    if (options.sections.recommendations) {
      const recommendations = this.generateRecommendations(reportData);
      const recData = [
        ['개선 권장사항'],
        [''],
        ...recommendations.map((rec, index) => [`${index + 1}. ${rec}`])
      ];

      const recSheet = XLSX.utils.aoa_to_sheet(recData);
      XLSX.utils.book_append_sheet(workbook, recSheet, '권장사항');
    }

    const fileName = `seo-report-${reportData.domain}-${Date.now()}.xlsx`;
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return { buffer: Buffer.from(buffer), fileName };
  }

  private async generateHTMLReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ buffer: Buffer; fileName: string }> {
    let html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO 키워드 분석 보고서</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 40px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
        .metric-label { color: #64748b; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 SEO 키워드 분석 보고서</h1>
        <p><strong>분석 대상:</strong> ${reportData.targetUrl}</p>
        <p><strong>도메인:</strong> ${reportData.domain}</p>
        <p><strong>생성일:</strong> ${reportData.generatedAt.toLocaleDateString('ko-KR')}</p>
    </div>
`;

    if (options.sections.summary) {
      html += `
    <div class="section">
        <h2>📊 분석 요약</h2>
        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-value">${reportData.analysis.totalKeywords}</div>
                <div class="metric-label">총 키워드</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.analysis.avgRanking.toFixed(1)}</div>
                <div class="metric-label">평균 순위</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.analysis.top10Keywords}</div>
                <div class="metric-label">상위 10위 키워드</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.analysis.adOpportunities}</div>
                <div class="metric-label">광고 기회</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.analysis.lowCompetitionKeywords}</div>
                <div class="metric-label">낮은 경쟁 키워드</div>
            </div>
        </div>
    </div>
`;
    }

    if (options.sections.keywords) {
      const topKeywords = reportData.keywords
        .sort((a, b) => a.position - b.position)
        .slice(0, 50);

      html += `
    <div class="section">
        <h2>🔍 키워드 상세 분석</h2>
        <table>
            <thead>
                <tr>
                    <th>키워드</th>
                    <th>순위</th>
                    <th>타입</th>
                    <th>검색량</th>
                    <th>경쟁도</th>
                    <th>예상 CPC</th>
                </tr>
            </thead>
            <tbody>`;

      topKeywords.forEach(keyword => {
        html += `
                <tr>
                    <td><strong>${keyword.keyword}</strong></td>
                    <td>${keyword.position}위</td>
                    <td>${keyword.type}</td>
                    <td>${(keyword.searchVolume || 0).toLocaleString()}</td>
                    <td>${keyword.competition || 'N/A'}</td>
                    <td>₩${(keyword.estimatedCPC || 0).toLocaleString()}</td>
                </tr>`;
      });

      html += `
            </tbody>
        </table>
    </div>
`;
    }

    if (options.sections.recommendations) {
      const recommendations = this.generateRecommendations(reportData);
      html += `
    <div class="section">
        <h2>💡 개선 권장사항</h2>
        <ol>`;

      recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
      });

      html += `
        </ol>
    </div>
`;
    }

    html += `
</body>
</html>
`;

    const fileName = `seo-report-${reportData.domain}-${Date.now()}.html`;
    const buffer = Buffer.from(html, 'utf-8');

    return { buffer, fileName };
  }

  private generateRecommendations(reportData: ReportData): string[] {
    const recommendations: string[] = [];

    if (reportData.analysis.avgRanking > 20) {
      recommendations.push('평균 순위가 20위 이하입니다. 상위 랭킹 키워드에 대한 콘텐츠 최적화를 우선적으로 진행하세요.');
    }

    if (reportData.analysis.top10Keywords < reportData.analysis.totalKeywords * 0.1) {
      recommendations.push('상위 10위 키워드 비율이 낮습니다. 롱테일 키워드보다는 핵심 키워드 순위 향상에 집중하세요.');
    }

    if (reportData.analysis.lowCompetitionKeywords > 0) {
      recommendations.push(`${reportData.analysis.lowCompetitionKeywords}개의 낮은 경쟁 키워드를 발견했습니다. 이들 키워드에 대한 콘텐츠를 우선 작성하세요.`);
    }

    if (reportData.analysis.adOpportunities > 0) {
      recommendations.push(`${reportData.analysis.adOpportunities}개의 광고 기회가 있습니다. 유료 광고 캠페인을 고려해보세요.`);
    }

    // Add general recommendations
    recommendations.push('정기적인 키워드 순위 모니터링을 통해 순위 변동을 추적하세요.');
    recommendations.push('경쟁사의 키워드 전략을 분석하여 새로운 기회를 찾아보세요.');
    recommendations.push('모바일 검색 최적화를 위해 페이지 로딩 속도를 개선하세요.');

    return recommendations;
  }

  private async storeReport(
    reportData: ReportData,
    options: ReportOptions,
    fileName: string,
    fileSize: number
  ): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('generated_reports')
        .insert({
          job_id: reportData.jobId,
          title: options.title || 'SEO 키워드 분석 보고서',
          report_type: 'seo_analysis',
          format: options.format,
          status: 'completed',
          file_path: fileName,
          file_size: fileSize,
          sections: options.sections,
          insights: {
            keyFindings: [
              `총 ${reportData.analysis.totalKeywords}개 키워드 분석`,
              `평균 순위 ${reportData.analysis.avgRanking.toFixed(1)}위`,
              `상위 10위 키워드 ${reportData.analysis.top10Keywords}개`,
            ],
            recommendations: this.generateRecommendations(reportData).slice(0, 3),
            alerts: reportData.analysis.avgRanking > 50 ? ['평균 순위가 매우 낮습니다'] : [],
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to store report:', error);
      }

      return data;
    } catch (error) {
      console.error('Report storage error:', error);
      return null;
    }
  }
}

export const reportGenerator = new SimpleReportGenerator();