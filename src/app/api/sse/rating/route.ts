import { NextRequest } from 'next/server';
import { ratingEmitter } from '@/lib/rating-emitter';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialData = JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
        message: 'Connected to rating updates'
      });
      
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Create sender function for this client
      const sendEvent = (data: any) => {
        try {
          const eventData = JSON.stringify({
            ...data,
            timestamp: Date.now()
          });
          controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
        } catch (error) {
          console.error('Error encoding SSE data:', error);
        }
      };

      // Add client to emitter
      ratingEmitter.addClient(sendEvent);

      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now()
          });
          controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
        } catch (error) {
          clearInterval(heartbeat);
          ratingEmitter.removeClient(sendEvent);
        }
      }, 30000); // Every 30 seconds

      // Handle client disconnect
      request.signal?.addEventListener('abort', () => {
        clearInterval(heartbeat);
        ratingEmitter.removeClient(sendEvent);
        try {
          controller.close();
        } catch (error) {
          // Controller already closed
        }
      });
    },
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