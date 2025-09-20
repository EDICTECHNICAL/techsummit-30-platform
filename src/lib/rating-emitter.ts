// Global event emitter for server-sent events
class RatingEventEmitter {
  private static instance: RatingEventEmitter;
  private clients: Set<(data: any) => void> = new Set();

  static getInstance(): RatingEventEmitter {
    if (!RatingEventEmitter.instance) {
      RatingEventEmitter.instance = new RatingEventEmitter();
    }
    return RatingEventEmitter.instance;
  }

  addClient(sendEvent: (data: any) => void) {
    this.clients.add(sendEvent);
    console.log(`SSE Rating: Client connected. Active connections: ${this.clients.size}`);
  }

  removeClient(sendEvent: (data: any) => void) {
    this.clients.delete(sendEvent);
    console.log(`SSE Rating: Client disconnected. Active connections: ${this.clients.size}`);
  }

  broadcast(data: any) {
    const clientCount = this.clients.size;
    console.log(`SSE Rating: Broadcasting to ${clientCount} clients:`, data.type || 'unknown');
    
    let successCount = 0;
    let errorCount = 0;
    
    this.clients.forEach(client => {
      try {
        client(data);
        successCount++;
      } catch (error) {
        console.error('SSE Rating: Error sending event to client:', error);
        this.clients.delete(client);
        errorCount++;
      }
    });
    
    if (errorCount > 0) {
      console.log(`SSE Rating: Broadcast completed. Success: ${successCount}, Errors: ${errorCount}, Remaining: ${this.clients.size}`);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  // Health check method for monitoring
  getHealthStats() {
    return {
      activeConnections: this.clients.size,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage()
    };
  }
}

export const ratingEmitter = RatingEventEmitter.getInstance();