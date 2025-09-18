// src/config/websocket.js
export function createWebSocketServer(wss, models) {
  wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 Received WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe_to_poll':
            // Store subscription info
            ws.pollId = data.pollId;
            console.log(`👥 Client subscribed to poll: ${data.pollId}`);
            break;
            
          case 'unsubscribe_from_poll':
            ws.pollId = null;
            console.log(`👋 Client unsubscribed from poll: ${data.pollId}`);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Function to broadcast poll updates to subscribed clients
  wss.broadcastToPoll = (pollId, data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.pollId === pollId) { // 1 = OPEN
        client.send(JSON.stringify({
          type: 'poll_update',
          pollId,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };
  
  return wss;
}