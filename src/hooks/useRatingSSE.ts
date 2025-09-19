import { useEffect, useState } from 'react';

interface RatingEvent {
  type: string;
  data?: any;
  timestamp?: number;
  message?: string;
}

export function useRatingSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RatingEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/sse/rating');
        
        eventSource.onopen = () => {
          console.log('Rating SSE connected');
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Rating SSE event received:', data);
            setLastEvent(data);
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error('Rating SSE error:', error);
          setIsConnected(false);
          setError('Connection error');
          
          // Attempt to reconnect after 3 seconds
          if (eventSource?.readyState === EventSource.CLOSED) {
            reconnectTimeout = setTimeout(() => {
              console.log('Attempting to reconnect Rating SSE...');
              connect();
            }, 3000);
          }
        };

      } catch (error) {
        console.error('Error creating Rating SSE connection:', error);
        setError('Failed to connect');
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return { isConnected, lastEvent, error };
}