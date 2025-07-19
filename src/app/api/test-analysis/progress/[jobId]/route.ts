import { NextRequest } from 'next/server';
import { testAnalysisService } from '@/lib/test-analysis-service';

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
      sendEvent({ type: 'connected', jobId });

      // Polling function to check job status
      const checkProgress = async () => {
        try {
          const job = await testAnalysisService.getJobStatus(jobId);
          
          if (!job) {
            sendEvent({ type: 'error', error: 'Job not found' });
            controller.close();
            return;
          }

          // Send progress update
          sendEvent({
            type: 'progress',
            job: {
              id: job.id,
              status: job.status,
              progress: job.progress,
              currentPhase: job.currentPhase,
              keywordsFound: job.keywordsFound,
              processedKeywords: job.processedKeywords,
              totalKeywords: job.totalKeywords,
              currentKeyword: job.currentKeyword,
              updatedAt: job.updatedAt.toISOString(),
            },
          });

          // If job is completed or failed, close the connection
          if (job.status === 'completed' || job.status === 'failed') {
            sendEvent({ 
              type: 'finished', 
              status: job.status,
              errorMessage: job.errorMessage,
            });
            controller.close();
            return;
          }

          // Continue polling if job is still running
          if (job.status === 'running' || job.status === 'pending') {
            setTimeout(checkProgress, 1000); // Poll every 1 second for testing
          }
        } catch (error) {
          sendEvent({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          controller.close();
        }
      };

      // Start polling
      checkProgress();
    },
    
    cancel() {
      // Cleanup when client disconnects
      console.log('Progress stream cancelled for job:', jobId);
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