// src/config/websocket.js
import WebSocketService from '../services/websocketService.js';

let webSocketService = null;

export function initializeWebSocket(wss, models) {
  if (!webSocketService) {
    webSocketService = new WebSocketService(wss, models);
    webSocketService.initialize();
  }
  return webSocketService;
}

export function getWebSocketService() {
  return webSocketService;
}