import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { EnhancedAnalysisJob, EnhancedKeywordResult } from './enhanced-analysis-service';
import type { CompetitorAnalysis } from './google-places';

export interface ReportOptions {
  includeCharts: boolean;
  includeCompetitorAnalysis: boolean;
  includeKeywordDetails: boolean;
  language: 'ko' | 'en';
  format: 'pdf' | 'excel' | 'both';
}

export interface GeneratedReport {
  id: string;
  type: 'comprehensive' | 'competitor' | 'keyword-priority';
  format: 'pdf' | 'excel';
  filename: string;
  downloadUrl: string;
  size: number;
  generatedAt: Date;
  expiresAt: Date;
}

export class ReportGenerator {
  async generateComprehensiveReport(
    job: EnhancedAnalysisJob,
    keywords: EnhancedKeywordResult[],
    options: ReportOptions = {
      includeCharts: true,
      includeCompetitorAnalysis: true,
      includeKeywordDetails: true,
      language: 'ko',
      format: 'both',
    }
  ): Promise<GeneratedReport[]> {
    const reports: GeneratedReport[] = [];

    if (options.format === 'pdf' || options.format === 'both') {
      const pdfReport = await this.generatePDFReport(job, keywords, options);
      reports.push(pdfReport);
    }

    if (options.format === 'excel' || options.format === 'both') {
      const excelReport = await this.generateExcelReport(job, keywords, options);
      reports.push(excelReport);
    }

    return reports;
  }

  private async generatePDFReport(
    job: EnhancedAnalysisJob,
    keywords: EnhancedKeywordResult[],
    options: ReportOptions
  ): Promise<GeneratedReport> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number = 20) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const maxWidth = options.maxWidth || pageWidth - 2 * margin;
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (options.lineHeight || 7);
    };

    try {
      // 1. Title Page
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      yPosition += 30;
      doc.text('SEO 키워드 분석 보고서', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 40;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(`분석 대상: ${job.targetUrl}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;
      doc.setFontSize(12);
      doc.text(`분석 일시: ${job.createdAt.toLocaleDateString('ko-KR')}`, pageWidth / 2, yPosition, { align: 'center' });
      doc.text(`도메인: ${job.domain}`, pageWidth / 2, yPosition + 15, { align: 'center' });

      // 2. Executive Summary
      doc.addPage();
      yPosition = margin;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('분석 요약', margin, yPosition);
      yPosition += 20;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      const summaryData = [
        `총 키워드 수: ${job.results.finalStats.totalKeywords}개`,
        `주요 키워드: ${job.results.finalStats.primaryKeywords}개`,
        `보조 키워드: ${job.results.finalStats.secondaryKeywords}개`,
        `롱테일 키워드: ${job.results.finalStats.longTailKeywords}개`,
        `기회 키워드: ${job.results.finalStats.opportunityKeywords}개`,
        `평균 검색량: ${job.results.finalStats.avgSearchVolume.toLocaleString()}회/월`,
        `평균 CPC: ${job.results.finalStats.avgCPC.toLocaleString()}원`,
      ];

      summaryData.forEach(item => {
        yPosition += addText(item, margin, yPosition) + 5;
      });

      // 3. Content Analysis
      checkPageBreak(100);
      yPosition += 20;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('콘텐츠 분석', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      if (job.results.aiAnalysis) {
        const contentAnalysis = job.results.aiAnalysis.contentAnalysis;
        yPosition += addText(`주제: ${contentAnalysis.topic}`, margin, yPosition) + 5;
        yPosition += addText(`업종: ${contentAnalysis.industry}`, margin, yPosition) + 5;
        yPosition += addText(`톤앤매너: ${contentAnalysis.tone}`, margin, yPosition) + 5;
        yPosition += addText(`타겟 고객: ${contentAnalysis.targetAudience}`, margin, yPosition) + 5;
        yPosition += addText(`콘텐츠 품질 점수: ${contentAnalysis.contentQuality}/100`, margin, yPosition) + 5;
        yPosition += addText(`SEO 최적화 점수: ${contentAnalysis.seoOptimization}/100`, margin, yPosition) + 5;
      }

      // 4. Top Keywords Table
      checkPageBreak(150);
      yPosition += 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('상위 키워드 목록', margin, yPosition);
      yPosition += 15;

      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const headers = ['키워드', '카테고리', '검색량', '경쟁도', 'CPC', '순위'];
      const colWidths = [60, 25, 25, 25, 25, 20];
      let xPosition = margin;

      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });

      yPosition += 10;

      // Draw header line
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Table rows
      doc.setFont('helvetica', 'normal');
      const topKeywords = keywords
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 20);

      topKeywords.forEach(keyword => {
        checkPageBreak(15);
        
        xPosition = margin;
        const rowData = [
          keyword.keyword.length > 15 ? keyword.keyword.substring(0, 12) + '...' : keyword.keyword,
          keyword.category,
          keyword.estimatedSearchVolume.toLocaleString(),
          keyword.competitionLevel,
          keyword.estimatedCPC.toLocaleString(),
          keyword.currentRanking?.toString() || '-',
        ];

        rowData.forEach((data, index) => {
          doc.text(data, xPosition, yPosition);
          xPosition += colWidths[index];
        });

        yPosition += 12;
      });

      // 5. Competitor Analysis (if available)
      if (options.includeCompetitorAnalysis && job.results.competitorAnalysis) {
        checkPageBreak(100);
        yPosition += 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('경쟁사 분석', margin, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        const competitor = job.results.competitorAnalysis;
        yPosition += addText(`총 경쟁사 수: ${competitor.analysis.totalCompetitors}개`, margin, yPosition) + 5;
        yPosition += addText(`평균 평점: ${competitor.analysis.averageRating}/5.0`, margin, yPosition) + 5;
        yPosition += addText(`평균 리뷰 수: ${competitor.analysis.averageReviewCount.toLocaleString()}개`, margin, yPosition) + 5;

        if (competitor.competitors.length > 0) {
          yPosition += 15;
          doc.setFont('helvetica', 'bold');
          doc.text('주요 경쟁사 목록:', margin, yPosition);
          yPosition += 10;

          doc.setFont('helvetica', 'normal');
          competitor.competitors.slice(0, 5).forEach(comp => {
            yPosition += addText(`• ${comp.name} (평점: ${comp.rating}, 리뷰: ${comp.userRatingsTotal}개)`, margin + 5, yPosition) + 5;
          });
        }
      }

      // 6. Recommendations
      checkPageBreak(100);
      yPosition += 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SEO 개선 권장사항', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      const recommendations = [
        '1. 주요 키워드를 페이지 제목과 메타 설명에 최적화하세요.',
        '2. 롱테일 키워드를 활용한 블로그 콘텐츠를 제작하세요.',
        '3. 기회 키워드에 대한 새로운 페이지를 생성하세요.',
        '4. 경쟁사 대비 부족한 키워드 영역을 강화하세요.',
        '5. 모바일 최적화를 통해 검색 순위를 개선하세요.',
      ];

      recommendations.forEach(rec => {
        yPosition += addText(rec, margin, yPosition, { maxWidth: pageWidth - 2 * margin }) + 8;
      });

      // Generate download info
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filename = `seo-analysis-${job.domain}-${Date.now()}.pdf`;
      
      // Save PDF (in real implementation, save to storage service)
      const pdfBlob = doc.output('blob');
      const downloadUrl = URL.createObjectURL(pdfBlob);

      return {
        id: reportId,
        type: 'comprehensive',
        format: 'pdf',
        filename,
        downloadUrl,
        size: pdfBlob.size,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

    } catch (error) {
      throw new Error(`PDF 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateExcelReport(
    job: EnhancedAnalysisJob,
    keywords: EnhancedKeywordResult[],
    options: ReportOptions
  ): Promise<GeneratedReport> {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Summary Sheet
      const summaryData = [
        ['SEO 키워드 분석 보고서'],
        [''],
        ['분석 대상', job.targetUrl],
        ['도메인', job.domain],
        ['분석 일시', job.createdAt.toLocaleDateString('ko-KR')],
        [''],
        ['분석 결과 요약'],
        ['총 키워드 수', job.results.finalStats.totalKeywords],
        ['주요 키워드', job.results.finalStats.primaryKeywords],
        ['보조 키워드', job.results.finalStats.secondaryKeywords],
        ['롱테일 키워드', job.results.finalStats.longTailKeywords],
        ['기회 키워드', job.results.finalStats.opportunityKeywords],
        ['평균 검색량', job.results.finalStats.avgSearchVolume],
        ['평균 CPC', job.results.finalStats.avgCPC],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, '분석 요약');

      // 2. Keywords Sheet
      const keywordData = [
        [
          '키워드',
          '관련성',
          '카테고리',
          '검색 의도',
          '예상 검색량',
          '경쟁도',
          '예상 CPC',
          '현재 순위',
          '계절성',
          '관련 키워드',
          '발견일시',
        ],
        ...keywords.map(keyword => [
          keyword.keyword,
          keyword.relevance,
          keyword.category,
          keyword.searchIntent,
          keyword.estimatedSearchVolume,
          keyword.competitionLevel,
          keyword.estimatedCPC,
          keyword.currentRanking || '-',
          keyword.seasonality,
          keyword.relatedKeywords.join(', '),
          keyword.discovered.toLocaleDateString('ko-KR'),
        ]),
      ];

      const keywordSheet = XLSX.utils.aoa_to_sheet(keywordData);
      
      // Set column widths
      keywordSheet['!cols'] = [
        { width: 20 }, // 키워드
        { width: 8 },  // 관련성
        { width: 12 }, // 카테고리
        { width: 15 }, // 검색 의도
        { width: 12 }, // 검색량
        { width: 10 }, // 경쟁도
        { width: 10 }, // CPC
        { width: 10 }, // 순위
        { width: 10 }, // 계절성
        { width: 30 }, // 관련 키워드
        { width: 12 }, // 발견일시
      ];

      XLSX.utils.book_append_sheet(workbook, keywordSheet, '키워드 목록');

      // 3. Primary Keywords Sheet
      const primaryKeywords = keywords.filter(k => k.category === 'primary');
      const primaryData = [
        ['주요 키워드 상세 분석'],
        [''],
        ['키워드', '관련성', '예상 검색량', '경쟁도', '예상 CPC', '현재 순위', '관련 키워드'],
        ...primaryKeywords.map(keyword => [
          keyword.keyword,
          keyword.relevance,
          keyword.estimatedSearchVolume,
          keyword.competitionLevel,
          keyword.estimatedCPC,
          keyword.currentRanking || '-',
          keyword.relatedKeywords.join(', '),
        ]),
      ];

      const primarySheet = XLSX.utils.aoa_to_sheet(primaryData);
      XLSX.utils.book_append_sheet(workbook, primarySheet, '주요 키워드');

      // 4. Opportunity Keywords Sheet
      const opportunityKeywords = keywords.filter(
        k => k.competitionLevel === 'low' && k.estimatedSearchVolume > 500
      );
      
      const opportunityData = [
        ['기회 키워드 (낮은 경쟁도 + 높은 검색량)'],
        [''],
        ['키워드', '검색량', '경쟁도', 'CPC', '예상 순위 상승 가능성'],
        ...opportunityKeywords.map(keyword => [
          keyword.keyword,
          keyword.estimatedSearchVolume,
          keyword.competitionLevel,
          keyword.estimatedCPC,
          '높음',
        ]),
      ];

      const opportunitySheet = XLSX.utils.aoa_to_sheet(opportunityData);
      XLSX.utils.book_append_sheet(workbook, opportunitySheet, '기회 키워드');

      // 5. Competitor Analysis Sheet (if available)
      if (options.includeCompetitorAnalysis && job.results.competitorAnalysis) {
        const competitor = job.results.competitorAnalysis;
        const competitorData = [
          ['경쟁사 분석'],
          [''],
          ['총 경쟁사 수', competitor.analysis.totalCompetitors],
          ['평균 평점', competitor.analysis.averageRating],
          ['평균 리뷰 수', competitor.analysis.averageReviewCount],
          [''],
          ['경쟁사 목록'],
          ['업체명', '주소', '평점', '리뷰수', '웹사이트', '전화번호'],
          ...competitor.competitors.slice(0, 15).map(comp => [
            comp.name,
            comp.address,
            comp.rating,
            comp.userRatingsTotal,
            comp.website || '-',
            comp.phoneNumber || '-',
          ]),
        ];

        const competitorSheet = XLSX.utils.aoa_to_sheet(competitorData);
        XLSX.utils.book_append_sheet(workbook, competitorSheet, '경쟁사 분석');
      }

      // 6. Content Analysis Sheet
      if (job.results.aiAnalysis) {
        const contentAnalysis = job.results.aiAnalysis.contentAnalysis;
        const marketInsights = job.results.aiAnalysis.marketInsights;
        
        const contentData = [
          ['콘텐츠 및 시장 분석'],
          [''],
          ['콘텐츠 분석'],
          ['주제', contentAnalysis.topic],
          ['업종', contentAnalysis.industry],
          ['톤앤매너', contentAnalysis.tone],
          ['타겟 고객', contentAnalysis.targetAudience],
          ['콘텐츠 품질 점수', contentAnalysis.contentQuality],
          ['SEO 최적화 점수', contentAnalysis.seoOptimization],
          [''],
          ['시장 인사이트'],
          ['시장 규모', marketInsights.totalMarketSize],
          ['경쟁 수준', marketInsights.competitionLevel],
          ['시장 트렌드', marketInsights.marketTrends.join(', ')],
          ['기회 요소', marketInsights.opportunities.join(', ')],
        ];

        const contentSheet = XLSX.utils.aoa_to_sheet(contentData);
        XLSX.utils.book_append_sheet(workbook, contentSheet, '콘텐츠 분석');
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const excelBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filename = `seo-analysis-${job.domain}-${Date.now()}.xlsx`;
      const downloadUrl = URL.createObjectURL(excelBlob);

      return {
        id: reportId,
        type: 'comprehensive',
        format: 'excel',
        filename,
        downloadUrl,
        size: excelBlob.size,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

    } catch (error) {
      throw new Error(`Excel 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCompetitorReport(
    competitorAnalysis: CompetitorAnalysis,
    options: ReportOptions = {
      includeCharts: false,
      includeCompetitorAnalysis: true,
      includeKeywordDetails: false,
      language: 'ko',
      format: 'both',
    }
  ): Promise<GeneratedReport[]> {
    const reports: GeneratedReport[] = [];

    if (options.format === 'excel' || options.format === 'both') {
      const workbook = XLSX.utils.book_new();

      // Competitor Analysis Sheet
      const competitorData = [
        ['경쟁사 분석 보고서'],
        [''],
        ['타겟 비즈니스', competitorAnalysis.targetBusiness.name],
        ['주소', competitorAnalysis.targetBusiness.address],
        [''],
        ['분석 결과'],
        ['총 경쟁사 수', competitorAnalysis.analysis.totalCompetitors],
        ['평균 평점', competitorAnalysis.analysis.averageRating],
        ['평균 리뷰 수', competitorAnalysis.analysis.averageReviewCount],
        [''],
        ['지리적 분포'],
        ['1km 내', competitorAnalysis.analysis.geographicDistribution.within1km],
        ['2km 내', competitorAnalysis.analysis.geographicDistribution.within2km],
        ['3km 내', competitorAnalysis.analysis.geographicDistribution.within3km],
        [''],
        ['경쟁사 상세 목록'],
        ['업체명', '주소', '평점', '리뷰수', '웹사이트', '전화번호', '영업상태'],
        ...competitorAnalysis.competitors.map(comp => [
          comp.name,
          comp.address,
          comp.rating,
          comp.userRatingsTotal,
          comp.website || '-',
          comp.phoneNumber || '-',
          comp.businessStatus,
        ]),
      ];

      const competitorSheet = XLSX.utils.aoa_to_sheet(competitorData);
      XLSX.utils.book_append_sheet(workbook, competitorSheet, '경쟁사 분석');

      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const excelBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const reportId = `competitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filename = `competitor-analysis-${Date.now()}.xlsx`;
      const downloadUrl = URL.createObjectURL(excelBlob);

      reports.push({
        id: reportId,
        type: 'competitor',
        format: 'excel',
        filename,
        downloadUrl,
        size: excelBlob.size,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    return reports;
  }

  async generateKeywordPriorityReport(
    keywords: EnhancedKeywordResult[],
    options: ReportOptions = {
      includeCharts: false,
      includeCompetitorAnalysis: false,
      includeKeywordDetails: true,
      language: 'ko',
      format: 'excel',
    }
  ): Promise<GeneratedReport[]> {
    const workbook = XLSX.utils.book_new();

    // Calculate priority scores
    const prioritizedKeywords = keywords.map(keyword => ({
      ...keyword,
      priorityScore: this.calculatePriorityScore(keyword),
    })).sort((a, b) => b.priorityScore - a.priorityScore);

    const priorityData = [
      ['키워드 우선순위 보고서'],
      [''],
      ['키워드', '우선순위 점수', '검색량', '경쟁도', 'CPC', '현재 순위', '카테고리', '검색 의도'],
      ...prioritizedKeywords.map(keyword => [
        keyword.keyword,
        keyword.priorityScore,
        keyword.estimatedSearchVolume,
        keyword.competitionLevel,
        keyword.estimatedCPC,
        keyword.currentRanking || '-',
        keyword.category,
        keyword.searchIntent,
      ]),
    ];

    const prioritySheet = XLSX.utils.aoa_to_sheet(priorityData);
    XLSX.utils.book_append_sheet(workbook, prioritySheet, '키워드 우선순위');

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const excelBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const reportId = `priority_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `keyword-priority-${Date.now()}.xlsx`;
    const downloadUrl = URL.createObjectURL(excelBlob);

    return [{
      id: reportId,
      type: 'keyword-priority',
      format: 'excel',
      filename,
      downloadUrl,
      size: excelBlob.size,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }];
  }

  private calculatePriorityScore(keyword: EnhancedKeywordResult): number {
    let score = 0;

    // Search volume weight (40%)
    score += (keyword.estimatedSearchVolume / 10000) * 40;

    // Competition weight (30% - inverse)
    const competitionScore = keyword.competitionLevel === 'low' ? 30 : 
                           keyword.competitionLevel === 'medium' ? 20 : 10;
    score += competitionScore;

    // Relevance weight (20%)
    score += (keyword.relevance / 100) * 20;

    // Category weight (10%)
    const categoryScore = keyword.category === 'primary' ? 10 : 
                         keyword.category === 'secondary' ? 7 : 5;
    score += categoryScore;

    return Math.round(score * 10) / 10;
  }
}

export const reportGenerator = new ReportGenerator();