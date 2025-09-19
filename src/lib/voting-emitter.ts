// Global event emitter for server-sent events
class VotingEventEmitter {
  private static instance: VotingEventEmitter;
  private clients: Set<(data: any) => void> = new Set();

  static getInstance(): VotingEventEmitter {
    if (!VotingEventEmitter.instance) {
      VotingEventEmitter.instance = new VotingEventEmitter();
    }
    return VotingEventEmitter.instance;
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

export const votingEmitter = VotingEventEmitter.getInstance();