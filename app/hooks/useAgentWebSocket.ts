// hooks/useAgentWebSocket.ts - Production WebSocket integration
import { useEffect, useRef, useState, useCallback } from 'react';

export interface AgentUpdate {
  id: string;
  processingRate?: number;
  status?: 'active' | 'idle' | 'error' | 'offline';
  lat?: number;
  lon?: number;
  timestamp?: number;
}

export interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  throttleInterval?: number;
}

export function useAgentWebSocket(
  onAgentUpdate: (update: AgentUpdate) => void,
  config: WebSocketConfig = {}
) {
  const {
    url = process.env.NEXT_PUBLIC_AGENT_WS || 'wss://your-realtime-endpoint',
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    throttleInterval = 250
  } = config;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateBufferRef = useRef<AgentUpdate[]>([]);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Throttled update processor
  const flushUpdates = useCallback(() => {
    if (updateBufferRef.current.length > 0) {
      const updates = [...updateBufferRef.current];
      updateBufferRef.current = [];
      
      // Process updates by agent ID, keeping only the latest for each agent
      const latestUpdates = new Map<string, AgentUpdate>();
      updates.forEach(update => {
        latestUpdates.set(update.id, update);
      });
      
      // Apply all updates
      latestUpdates.forEach(update => {
        onAgentUpdate(update);
      });
    }
  }, [onAgentUpdate]);

  // Buffer and throttle updates to prevent excessive re-renders
  const bufferUpdate = useCallback((update: AgentUpdate) => {
    updateBufferRef.current.push(update);
    
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = setTimeout(flushUpdates, throttleInterval);
  }, [flushUpdates, throttleInterval]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.info('Agent WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Send subscription message if needed
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          channel: 'agent-updates'
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          switch (data.type) {
            case 'agent-update':
              bufferUpdate(data.payload);
              break;
            case 'agent-batch':
              data.payload.forEach(bufferUpdate);
              break;
            case 'heartbeat':
              // Respond to heartbeat
              wsRef.current?.send(JSON.stringify({ type: 'pong' }));
              break;
            default:
              console.warn('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Invalid WebSocket payload:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      wsRef.current.onclose = (event) => {
        console.info('Agent WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.info(`Reconnecting WebSocket (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [url, maxReconnectAttempts, reconnectInterval, bufferUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);

  // Send data to server
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionStatus === 'connected'
  };
}
