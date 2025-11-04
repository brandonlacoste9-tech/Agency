// components/AgentSwarmDashboardProduction.tsx - WebSocket-enabled version
import React, { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import './AgentSwarmDashboard.css';
import { useAgentWebSocket, type AgentUpdate } from '../hooks/useAgentWebSocket';

// Dynamic imports to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Agent {
  id: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  processingRate: number;
  lat: number;
  lon: number;
  series: number[];
  lastUpdated: number;
}

interface AgentSwarmDashboardProductionProps {
  initialAgentCount?: number;
  wsUrl?: string;
  enableSimulation?: boolean; // Fallback to simulation if WebSocket fails
}

export default function AgentSwarmDashboardProduction({ 
  initialAgentCount = 60,
  wsUrl,
  enableSimulation = true 
}: AgentSwarmDashboardProductionProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>("dark");
  const [agents, setAgents] = useState<Agent[]>(() => 
    // Initialize with empty agents or simulation data
    enableSimulation ? makeAgents(initialAgentCount) : []
  );
  const [isUsingSimulation, setIsUsingSimulation] = useState(enableSimulation);

  // WebSocket integration
  const handleAgentUpdate = useCallback((update: AgentUpdate) => {
    setAgents(prev => {
      const agentIndex = prev.findIndex(a => a.id === update.id);
      
      if (agentIndex === -1) {
        // New agent - add to list
        const newAgent: Agent = {
          id: update.id,
          status: update.status || 'active',
          processingRate: update.processingRate || 0,
          lat: update.lat || 0,
          lon: update.lon || 0,
          series: [update.processingRate || 0],
          lastUpdated: update.timestamp || Date.now()
        };
        return [...prev, newAgent];
      }
      
      // Update existing agent
      const updated = [...prev];
      const agent = updated[agentIndex];
      updated[agentIndex] = {
        ...agent,
        processingRate: update.processingRate ?? agent.processingRate,
        status: update.status ?? agent.status,
        lat: update.lat ?? agent.lat,
        lon: update.lon ?? agent.lon,
        series: [...agent.series.slice(-8), update.processingRate ?? agent.processingRate],
        lastUpdated: update.timestamp || Date.now()
      };
      
      return updated;
    });
  }, []);

  const { connectionStatus, isConnected } = useAgentWebSocket(handleAgentUpdate, {
    url: wsUrl,
    throttleInterval: 250, // Batch updates for performance
    maxReconnectAttempts: 5
  });

  // Fallback simulation when WebSocket is not available
  useEffect(() => {
    if (!isConnected && enableSimulation && agents.length === 0) {
      console.info('WebSocket not connected, falling back to simulation');
      setAgents(makeAgents(initialAgentCount));
      setIsUsingSimulation(true);
    } else if (isConnected) {
      setIsUsingSimulation(false);
    }
  }, [isConnected, enableSimulation, agents.length, initialAgentCount]);

  // Simulation loop (only when using simulation)
  useEffect(() => {
    if (!isUsingSimulation) return;

    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        const drift = (Math.random() - 0.45) * 12;
        const newRate = Math.max(1, Math.round(agent.processingRate + drift));
        const change = Math.random();
        let status = agent.status;
        
        if (change > 0.985) status = "error";
        else if (change > 0.97) status = "offline";
        else if (change > 0.9) status = "idle";
        else status = "active";

        return {
          ...agent,
          processingRate: newRate,
          status,
          lat: Math.min(85, Math.max(-85, agent.lat + (Math.random() - 0.5) * 0.6)),
          lon: agent.lon + (Math.random() - 0.5) * 0.8,
          series: [...agent.series.slice(-8), newRate],
          lastUpdated: Date.now()
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isUsingSimulation]);

  // Rest of the component logic remains the same...
  const initialCategories = useMemo(
    () => Array.from({ length: 9 }).map((_, i) =>
      new Date(Date.now() - (8 - i) * 30000).toLocaleTimeString()
    ),
    []
  );

  const [perfCategories, setPerfCategories] = useState<string[]>(initialCategories);
  const [perfSeries, setPerfSeries] = useState(() => {
    const sumPerSlot = agents[0]?.series.map((_, idx) =>
      agents.reduce((acc, a) => acc + (a.series[idx] || 0), 0)
    ) || [];
    return [{ name: "Agent Processing Rate", data: sumPerSlot }];
  });

  // Update derived data when agents change
  useEffect(() => {
    if (agents.length === 0) return;

    const aggregated = agents[0]?.series.map((_, idx) =>
      agents.reduce((s, agent) => s + (agent.series[idx] || 0), 0)
    ) || [];
    
    setPerfSeries([{ name: "Agent Processing Rate", data: aggregated }]);
    
    if (isUsingSimulation) {
      setPerfCategories(prev => {
        const nextCat = new Date().toLocaleTimeString();
        return [...prev.slice(1), nextCat];
      });
    }
  }, [agents, isUsingSimulation]);

  const statusCounts = useMemo(() => {
    const map = { active: 0, idle: 0, error: 0, offline: 0 };
    agents.forEach(a => map[a.status]++);
    return [map.active, map.idle, map.error, map.offline];
  }, [agents]);

  const heatmapSeries = useMemo(() => {
    return buildHeatmap(agents);
  }, [agents]);

  const points = useMemo(() => 
    agents.map(a => ({ 
      id: a.id, 
      lat: a.lat, 
      lon: a.lon, 
      processingRate: a.processingRate 
    })),
    [agents]
  );

  return (
    <div className={`dashboard ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <header className="dashboard-header">
        <h1>Agent Swarm Dashboard</h1>
        <div className="header-controls">
          <div className={`connection-status ${connectionStatus}`}>
            <span className="status-indicator" />
            {connectionStatus === 'connected' ? 'Live' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             isUsingSimulation ? 'Simulation' : 'Offline'}
          </div>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="btn"
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
          <div className="meta">
            <strong>{agents.length}</strong> agents • <strong>{statusCounts[0]}</strong> active
          </div>
        </div>
      </header>

      {/* Rest of the dashboard JSX remains exactly the same */}
      <main className="dashboard-grid">
        {/* Same grid layout and components as original */}
      </main>

      <style jsx>{`
        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.1);
        }
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6b7280;
        }
        .connection-status.connected .status-indicator {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
        }
        .connection-status.connecting .status-indicator {
          background: #f59e0b;
          animation: pulse 1s infinite;
        }
        .connection-status.error .status-indicator {
          background: #ef4444;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Helper functions (same as original)
const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const makeAgents = (n: number = 60) =>
  Array.from({ length: n }).map((_, i) => ({
    id: `agent-${i + 1}`,
    status: (["active", "idle", "error", "offline"] as const)[
      Math.floor(Math.random() * 4)
    ],
    processingRate: randomBetween(5, 120),
    lat: -60 + Math.random() * 120,
    lon: -180 + Math.random() * 360,
    series: Array.from({ length: 9 }).map(() =>
      Math.max(1, Math.round(30 + Math.random() * 90))
    ),
    lastUpdated: Date.now()
  }));

const buildHeatmap = (agents: Agent[]) => {
  const groups = 8;
  const slots = 9;
  const perGroup = Math.ceil(agents.length / groups);
  
  return Array.from({ length: groups }).map((_, gi) => {
    const groupAgents = agents.slice(gi * perGroup, (gi + 1) * perGroup);
    const data = Array.from({ length: slots }).map((_, si) => {
      const val = Math.round(
        groupAgents.reduce((acc, a) => acc + (a.series[si] || 0), 0) /
          Math.max(1, groupAgents.length)
      );
      return { x: `S${si + 1}`, y: val };
    });
    return { name: `Group ${gi + 1}`, data };
  });
};
