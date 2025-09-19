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
  }

  removeClient(sendEvent: (data: any) => void) {
    this.clients.delete(sendEvent);
  }

  broadcast(data: any) {
    this.clients.forEach(client => {
      try {
        client(data);
      } catch (error) {
        console.error('Error sending SSE event:', error);
        this.clients.delete(client);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const ratingEmitter = RatingEventEmitter.getInstance();