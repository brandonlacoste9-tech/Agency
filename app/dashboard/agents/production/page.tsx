// app/dashboard/agents/production/page.tsx
"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const AgentSwarmDashboardProduction = dynamic(
  () => import('@/app/components/AgentSwarmDashboardProduction'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Agent Dashboard...</p>
        </div>
      </div>
    )
  }
);

export default function ProductionAgentsPage() {
  // Get WebSocket URL from environment or configuration
  const wsUrl = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'ws://localhost:8080/agents';
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing Dashboard...</p>
          </div>
        </div>
      }>
        <AgentSwarmDashboardProduction 
          wsUrl={wsUrl}
          initialAgentCount={60}
          enableSimulation={true} // Falls back to simulation if WebSocket fails
        />
      </Suspense>
    </div>
  );
}
