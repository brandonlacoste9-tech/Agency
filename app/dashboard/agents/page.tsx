'use client';

import dynamic from 'next/dynamic';

// Import the dashboard with SSR disabled for chart libraries
const AgentSwarmDashboard = dynamic(
  () => import('@/app/components/AgentSwarmDashboard'),
  { 
    ssr: false, // Disable server-side rendering for chart components
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg animate-pulse">Loading Agent Dashboard...</div>
      </div>
    )
  }
);

export default function AgentsPage() {
  return (
    <div className="min-h-screen">
      <AgentSwarmDashboard initialAgentCount={60} />
    </div>
  );
}
