// src/services/websocketService.js
export class WebSocketService {
  constructor(wss, models) {
    this.wss = wss;
    this.models = models;
    this.subscriptions = new Map(); // pollId -> Set of client connections
  }

  /**
   * Initialize WebSocket server with event handlers
   */
  initialize() {
    this.wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection established');
      
      // Initialize client state
      ws.subscriptions = new Set();
      
      ws.on('message', async (message) => {
        await this.handleMessage(ws, message);
      });
      
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Add broadcast methods to the WebSocket server instance
    this.wss.broadcastToPoll = this.broadcastToPoll.bind(this);
    this.wss.broadcastToUser = this.broadcastToUser.bind(this);
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(ws, message) {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 Received WebSocket message:', data);
      
      switch (data.type) {
        case 'subscribe_to_poll':
          await this.handleSubscribeToPoll(ws, data);
          break;
          
        case 'unsubscribe_from_poll':
          this.handleUnsubscribeFromPoll(ws, data);
          break;
          
        case 'subscribe_to_user':
          await this.handleSubscribeToUser(ws, data);
          break;
          
        case 'unsubscribe_from_user':
          this.handleUnsubscribeFromUser(ws, data);
          break;
          
        case 'ping':
          this.send(ws, { type: 'pong', timestamp: Date.now() });
          break;
          
        default:
          console.log('Unknown message type:', data.type);
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  /**
   * Handle client subscription to a poll
   */
  async handleSubscribeToPoll(ws, data) {
    const { pollId } = data;
    
    if (!pollId) {
      this.sendError(ws, 'Poll ID is required');
      return;
    }

    // Verify poll exists and is published
    try {
      const poll = await this.models.Poll.find(pollId);
      if (!poll) {
        this.sendError(ws, 'Poll not found');
        return;
      }

      if (!poll.isPublished) {
        this.sendError(ws, 'Cannot subscribe to unpublished poll');
        return;
      }

      // Add subscription
      if (!this.subscriptions.has(pollId)) {
        this.subscriptions.set(pollId, new Set());
      }
      this.subscriptions.get(pollId).add(ws);
      ws.subscriptions.add(`poll:${pollId}`);

      console.log(`👥 Client subscribed to poll: ${pollId}`);
      this.send(ws, { 
        type: 'subscription_confirmed', 
        pollId, 
        message: 'Subscribed to poll updates' 
      });

    } catch (error) {
      console.error('Error subscribing to poll:', error);
      this.sendError(ws, 'Failed to subscribe to poll');
    }
  }

  /**
   * Handle client unsubscription from a poll
   */
  handleUnsubscribeFromPoll(ws, data) {
    const { pollId } = data;
    
    if (pollId && this.subscriptions.has(pollId)) {
      this.subscriptions.get(pollId).delete(ws);
      ws.subscriptions.delete(`poll:${pollId}`);
      
      // Clean up empty sets
      if (this.subscriptions.get(pollId).size === 0) {
        this.subscriptions.delete(pollId);
      }
      
      console.log(`👋 Client unsubscribed from poll: ${pollId}`);
      this.send(ws, { 
        type: 'unsubscription_confirmed', 
        pollId, 
        message: 'Unsubscribed from poll updates' 
      });
    }
  }

  /**
   * Handle client subscription to user-specific events
   */
  async handleSubscribeToUser(ws, data) {
    const { userId } = data;
    
    if (!userId) {
      this.sendError(ws, 'User ID is required');
      return;
    }

    // Store user subscription
    ws.userId = userId;
    console.log(`👤 Client subscribed to user events: ${userId}`);
    
    this.send(ws, { 
      type: 'subscription_confirmed', 
      userId, 
      message: 'Subscribed to user events' 
    });
  }

  /**
   * Handle client unsubscription from user events
   */
  handleUnsubscribeFromUser(ws, data) {
    ws.userId = null;
    console.log('👋 Client unsubscribed from user events');
    
    this.send(ws, { 
      type: 'unsubscription_confirmed', 
      message: 'Unsubscribed from user events' 
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(ws) {
    console.log('🔌 WebSocket connection closed');
    
    // Clean up all subscriptions
    if (ws.subscriptions) {
      for (const subscription of ws.subscriptions) {
        const [type, id] = subscription.split(':');
        if (type === 'poll' && this.subscriptions.has(id)) {
          this.subscriptions.get(id).delete(ws);
          
          // Clean up empty sets
          if (this.subscriptions.get(id).size === 0) {
            this.subscriptions.delete(id);
          }
        }
      }
    }
  }

  /**
   * Broadcast message to all clients subscribed to a poll
   */
  broadcastToPoll(pollId, data) {
    if (!this.subscriptions.has(pollId)) {
      return;
    }

    const message = JSON.stringify({
      type: 'poll_update',
      pollId,
      data,
      timestamp: new Date().toISOString()
    });

    this.subscriptions.get(pollId).forEach(client => {
      if (client.readyState === 1) { // 1 = OPEN
        client.send(message);
      }
    });
  }

  /**
   * Broadcast message to a specific user
   */
  broadcastToUser(userId, data) {
    const message = JSON.stringify({
      type: 'user_update',
      userId,
      data,
      timestamp: new Date().toISOString()
    });

    this.wss.clients.forEach(client => {
      if (client.readyState === 1 && client.userId === userId) {
        client.send(message);
      }
    });
  }

  /**
   * Send message to a specific client
   */
  send(ws, data) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send error message to client
   */
  sendError(ws, message) {
    this.send(ws, {
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get subscription statistics
   */
  getStats() {
    return {
      totalClients: this.wss.clients.size,
      pollSubscriptions: Array.from(this.subscriptions.entries()).map(([pollId, clients]) => ({
        pollId,
        subscriberCount: clients.size
      }))
    };
  }
}

export default WebSocketService;