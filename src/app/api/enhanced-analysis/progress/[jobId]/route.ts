import { NextRequest } from 'next/server';
import { enhancedAnalysisService } from '@/lib/enhanced-analysis-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  if (!jobId) {
    return new Response('Job ID is required', { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const formattedData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formattedData));
      };

      // Send initial connection event
      sendEvent({ 
        type: 'connected', 
        jobId,
        timestamp: new Date().toISOString(),
      });

      // Polling function to check job status
      const checkProgress = async () => {
        try {
          const job = await enhancedAnalysisService.getJobStatus(jobId);
          
          if (!job) {
            sendEvent({ 
              type: 'error', 
              error: 'Job not found',
              timestamp: new Date().toISOString(),
            });
            controller.close();
            return;
          }

          // Send comprehensive progress update
          sendEvent({
            type: 'progress',
            timestamp: new Date().toISOString(),
            job: {
              id: job.id,
              status: job.status,
              overallProgress: job.overallProgress,
              currentPhase: job.currentPhase,
              phases: {
                phase1_scraping: {
                  name: job.phases.phase1_scraping.name,
                  description: job.phases.phase1_scraping.description,
                  progress: job.phases.phase1_scraping.progress,
                  completed: job.phases.phase1_scraping.completed,
                  details: job.phases.phase1_scraping.details,
                },
                phase2_ai_analysis: {
                  name: job.phases.phase2_ai_analysis.name,
                  description: job.phases.phase2_ai_analysis.description,
                  progress: job.phases.phase2_ai_analysis.progress,
                  completed: job.phases.phase2_ai_analysis.completed,
                  details: job.phases.phase2_ai_analysis.details,
                },
                phase3_search_volume: {
                  name: job.phases.phase3_search_volume.name,
                  description: job.phases.phase3_search_volume.description,
                  progress: job.phases.phase3_search_volume.progress,
                  completed: job.phases.phase3_search_volume.completed,
                  details: job.phases.phase3_search_volume.details,
                },
                phase4_ranking_check: {
                  name: job.phases.phase4_ranking_check.name,
                  description: job.phases.phase4_ranking_check.description,
                  progress: job.phases.phase4_ranking_check.progress,
                  completed: job.phases.phase4_ranking_check.completed,
                  details: job.phases.phase4_ranking_check.details,
                },
                phase5_data_save: {
                  name: job.phases.phase5_data_save.name,
                  description: job.phases.phase5_data_save.description,
                  progress: job.phases.phase5_data_save.progress,
                  completed: job.phases.phase5_data_save.completed,
                  details: job.phases.phase5_data_save.details,
                },
              },
              results: {
                finalStats: job.results.finalStats,
              },
              updatedAt: job.updatedAt.toISOString(),
            },
            // Include recent logs
            recentLogs: job.logs.slice(-5).map(log => ({
              timestamp: log.timestamp,
              level: log.level,
              message: log.message,
              phase: log.phase,
            })),
          });

          // If job is completed or failed, send final status and close
          if (job.status === 'completed' || job.status === 'failed') {
            sendEvent({ 
              type: 'finished', 
              status: job.status,
              timestamp: new Date().toISOString(),
              completedAt: job.completedAt?.toISOString(),
              errorMessage: job.errorMessage,
              finalResults: job.status === 'completed' ? {
                totalKeywords: job.results.finalStats.totalKeywords,
                primaryKeywords: job.results.finalStats.primaryKeywords,
                secondaryKeywords: job.results.finalStats.secondaryKeywords,
                longTailKeywords: job.results.finalStats.longTailKeywords,
                opportunityKeywords: job.results.finalStats.opportunityKeywords,
                avgSearchVolume: job.results.finalStats.avgSearchVolume,
                avgCPC: job.results.finalStats.avgCPC,
              } : undefined,
            });
            controller.close();
            return;
          }

          // Continue polling if job is still running
          if (job.status === 'running' || job.status === 'pending') {
            setTimeout(checkProgress, 1000); // Poll every 1 second
          }

        } catch (error) {
          sendEvent({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
          controller.close();
        }
      };

      // Start polling immediately
      checkProgress();
    },
    
    cancel() {
      // Cleanup when client disconnects
      console.log('Enhanced progress stream cancelled for job:', jobId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}