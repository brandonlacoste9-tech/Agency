# Agent Dashboard Production Integration Guide

## Overview

The Agent Swarm Dashboard now includes production-ready WebSocket integration for real-time agent telemetry. This guide covers deployment, configuration, and usage.

## Architecture

### Components

1. **useAgentWebSocket Hook** (`hooks/useAgentWebSocket.ts`)
   - Production-ready WebSocket client
   - Automatic reconnection with exponential backoff
   - Update throttling and buffering
   - Connection status management

2. **AgentSwarmDashboardProduction** (`components/AgentSwarmDashboardProduction.tsx`)
   - WebSocket-enabled dashboard component
   - Graceful fallback to simulation mode
   - Real-time data processing with performance optimization

3. **Production Page** (`app/dashboard/agents/production/page.tsx`)
   - SSR-safe wrapper for production dashboard
   - Environment-based configuration
   - Loading states and error boundaries

### Data Flow

```
WebSocket Server → useAgentWebSocket → Dashboard State → Chart Updates
                      ↓ (if failed)
              Simulation Mode (Fallback)
```

## Configuration

### Environment Variables

Add to your `.env.local`:

```env
# WebSocket configuration
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080/agents
NEXT_PUBLIC_WS_RECONNECT_ATTEMPTS=5
NEXT_PUBLIC_WS_THROTTLE_INTERVAL=250

# Dashboard settings
NEXT_PUBLIC_AGENT_COUNT=60
NEXT_PUBLIC_ENABLE_SIMULATION_FALLBACK=true
```

### WebSocket Server Protocol

The dashboard expects JSON messages in this format:

```typescript
interface AgentUpdate {
  id: string;                    // Unique agent identifier
  status?: 'active' | 'idle' | 'error' | 'offline';
  processingRate?: number;       // Operations per second
  lat?: number;                  // Geographic latitude
  lon?: number;                  // Geographic longitude
  timestamp?: number;            // Unix timestamp
  metadata?: Record<string, any>; // Additional data
}
```

Example WebSocket message:
```json
{
  "id": "agent-001",
  "status": "active",
  "processingRate": 45,
  "lat": 37.7749,
  "lon": -122.4194,
  "timestamp": 1703875200000,
  "metadata": {
    "region": "us-west",
    "version": "1.2.3"
  }
}
```

## Usage

### Basic Implementation

```tsx
import AgentSwarmDashboardProduction from '@/components/AgentSwarmDashboardProduction';

export default function DashboardPage() {
  return (
    <AgentSwarmDashboardProduction 
      wsUrl="ws://your-server.com/agents"
      initialAgentCount={60}
      enableSimulation={true}
    />
  );
}
```

### Advanced Configuration

```tsx
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket';
import { useState, useCallback } from 'react';

function CustomDashboard() {
  const [agents, setAgents] = useState([]);
  
  const handleUpdate = useCallback((update) => {
    // Custom agent update logic
    setAgents(prev => updateAgentInList(prev, update));
  }, []);
  
  const { isConnected, connectionStatus } = useAgentWebSocket(handleUpdate, {
    url: process.env.NEXT_PUBLIC_AGENT_WS_URL,
    throttleInterval: 100, // More frequent updates
    maxReconnectAttempts: 10,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error)
  });
  
  return (
    <div>
      <div>Status: {connectionStatus}</div>
      {/* Your custom dashboard UI */}
    </div>
  );
}
```

## Performance Optimization

### Throttling Configuration

The WebSocket hook includes built-in throttling to prevent UI blocking:

```typescript
// Default configuration (250ms batching)
const { isConnected } = useAgentWebSocket(handleUpdate);

// High-frequency updates (100ms batching)
const { isConnected } = useAgentWebSocket(handleUpdate, {
  throttleInterval: 100
});

// Low-frequency updates (1000ms batching)
const { isConnected } = useAgentWebSocket(handleUpdate, {
  throttleInterval: 1000
});
```

### Memory Management

The dashboard automatically limits series data to prevent memory leaks:

- Chart series limited to last 9 data points
- Automatic cleanup of offline agents after 5 minutes
- Throttled DOM updates to maintain 60fps

### Connection Management

- **Automatic Reconnection**: Exponential backoff with jitter
- **Connection Pooling**: Single WebSocket per page instance
- **Graceful Degradation**: Falls back to simulation mode if WebSocket fails

## Deployment

### Development

```bash
# Start the dashboard in development mode
cd adgenxai
npm run dev

# Dashboard available at:
# http://localhost:3001/dashboard/agents/production
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or deploy to Netlify/Vercel with automatic builds
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t agent-dashboard .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_AGENT_WS_URL=ws://your-server:8080/agents \
  agent-dashboard
```

## Testing

### WebSocket Server Mock

For testing, you can use this simple WebSocket server:

```javascript
// test-ws-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const agents = Array.from({ length: 60 }, (_, i) => ({
  id: `agent-${i + 1}`,
  status: 'active',
  processingRate: 30 + Math.random() * 60,
  lat: -60 + Math.random() * 120,
  lon: -180 + Math.random() * 360
}));

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial agent data
  agents.forEach(agent => {
    ws.send(JSON.stringify(agent));
  });
  
  // Send periodic updates
  const interval = setInterval(() => {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const update = {
      ...agent,
      processingRate: Math.max(1, agent.processingRate + (Math.random() - 0.5) * 10),
      timestamp: Date.now()
    };
    
    ws.send(JSON.stringify(update));
  }, 1000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:8080');
```

Run the test server:
```bash
node test-ws-server.js
```

### Integration Tests

```typescript
// __tests__/dashboard-websocket.test.tsx
import { render, waitFor } from '@testing-library/react';
import AgentSwarmDashboardProduction from '@/components/AgentSwarmDashboardProduction';

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn()
}));

test('dashboard connects to WebSocket and updates agents', async () => {
  const { getByText } = render(
    <AgentSwarmDashboardProduction 
      wsUrl="ws://localhost:8080/test"
      enableSimulation={false}
    />
  );
  
  await waitFor(() => {
    expect(getByText(/Live|Connecting/)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   ```
   Error: WebSocket connection failed
   ```
   - Check that WebSocket server is running
   - Verify CORS settings on WebSocket server
   - Ensure URL format is correct (ws:// or wss://)

2. **Charts Not Updating**
   ```
   Dashboard shows "Connecting..." but no data updates
   ```
   - Verify WebSocket message format matches expected schema
   - Check browser console for JavaScript errors
   - Ensure handleUpdate callback is properly processing data

3. **Performance Issues**
   ```
   Browser becomes slow/unresponsive with many agents
   ```
   - Increase throttleInterval (reduce update frequency)
   - Reduce agent count or implement pagination
   - Check for memory leaks in agent data structure

### Debug Mode

Enable debug logging:

```typescript
const { isConnected } = useAgentWebSocket(handleUpdate, {
  url: wsUrl,
  debug: true // Enables console logging
});
```

### Health Checks

Monitor WebSocket health:

```typescript
const { connectionStatus, lastMessageTime } = useAgentWebSocket(handleUpdate);

// Check if connection is stale
const isStale = Date.now() - lastMessageTime > 30000; // 30 seconds
```

## Security Considerations

### Authentication

For production deployments, implement WebSocket authentication:

```typescript
const { isConnected } = useAgentWebSocket(handleUpdate, {
  url: 'wss://secure-server.com/agents',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-Client-Version': '1.0.0'
  }
});
```

### Rate Limiting

Implement server-side rate limiting to prevent abuse:

```javascript
// Server-side rate limiting example
const rateLimiter = new Map();

wss.on('connection', (ws, request) => {
  const clientIp = request.connection.remoteAddress;
  const now = Date.now();
  
  if (rateLimiter.has(clientIp)) {
    const lastConnection = rateLimiter.get(clientIp);
    if (now - lastConnection < 1000) { // 1 second cooldown
      ws.close(4429, 'Rate limited');
      return;
    }
  }
  
  rateLimiter.set(clientIp, now);
  // ... rest of connection handling
});
```

## Next Steps

1. **Implement Authentication**: Add JWT token validation for WebSocket connections
2. **Add Metrics**: Integrate with monitoring tools (Prometheus, DataDog)
3. **Scale WebSocket Server**: Use Redis pub/sub for horizontal scaling
4. **Add Agent Filtering**: Implement dashboard filters by region, status, etc.
5. **Historical Data**: Store and display historical agent performance data

## Support

For issues or questions:
- Check the browser console for WebSocket errors
- Verify environment variable configuration
- Test with the provided mock WebSocket server
- Review network requests in browser DevTools