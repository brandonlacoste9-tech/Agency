// AgentSwarmDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import dynamic from 'next/dynamic';
import './AgentSwarmDashboard.css';

// Dynamic imports to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

/*
  AgentSwarmDashboard
  - ApexCharts: line, donut, heatmap
  - ECharts: scatter for lat/lon
  - Simulates realtime updates; replace with WebSocket/SSE for production
*/

interface Agent {
  id: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  processingRate: number;
  lat: number;
  lon: number;
  series: number[];
}

interface Point {
  id: string;
  lat: number;
  lon: number;
  processingRate: number;
}

/* ---------- Small helpers ---------- */
const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const makeAgents = (n: number = 60): Agent[] =>
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
    )
  }));

/* ---------- Components ---------- */

interface AgentPerformanceChartProps {
  series: { name: string; data: number[] }[];
  categories: string[];
  theme?: 'dark' | 'light';
}

function AgentPerformanceChart({ series, categories, theme = "dark" }: AgentPerformanceChartProps) {
  const options = {
    chart: {
      id: "agent-performance",
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout" as const,
        speed: 700,
        dynamicAnimation: { enabled: true, speed: 300 }
      }
    },
    stroke: { curve: "smooth" as const, width: 3 },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { style: { colors: theme === "dark" ? "#9AA7B2" : "#374151" } }
    },
    yaxis: {
      labels: { style: { colors: theme === "dark" ? "#9AA7B2" : "#374151" } }
    },
    theme: { mode: theme },
    colors: ["#38bdf8"],
    tooltip: { theme },
    grid: { borderColor: theme === "dark" ? "#2D3748" : "#E5E7EB" }
  };

  return (
    <div className="card">
      <h3 className="card-title">Aggregate Processing Rate</h3>
      {typeof window !== 'undefined' && (
        <ReactApexChart options={options} series={series} type="line" height={360} />
      )}
    </div>
  );
}

interface AgentHealthDonutProps {
  counts: number[];
  theme?: 'dark' | 'light';
}

function AgentHealthDonut({ counts, theme = "dark" }: AgentHealthDonutProps) {
  const labels = ["Active", "Idle", "Error", "Offline"];
  const options = {
    labels,
    legend: { position: "bottom" as const, labels: { colors: theme === "dark" ? "#9AA7B2" : "#374151" } },
    theme: { mode: theme },
    colors: ["#10B981", "#60A5FA", "#F97316", "#6B7280"]
  };

  return (
    <div className="card small-card">
      <h3 className="card-title">Agent States</h3>
      {typeof window !== 'undefined' && (
        <ReactApexChart options={options} series={counts} type="donut" height={260} />
      )}
    </div>
  );
}

interface HeatmapSeriesData {
  name: string;
  data: { x: string; y: number }[];
}

interface AgentActivityHeatmapProps {
  heatmapSeries: HeatmapSeriesData[];
  xCategories: string[];
  theme?: 'dark' | 'light';
}

function AgentActivityHeatmap({ heatmapSeries, xCategories, theme = "dark" }: AgentActivityHeatmapProps) {
  const options = {
    chart: { type: "heatmap" as const, toolbar: { show: false } },
    plotOptions: { heatmap: { shadeIntensity: 0.6 } },
    dataLabels: { enabled: false },
    xaxis: { categories: xCategories, labels: { style: { colors: theme === "dark" ? "#9AA7B2" : "#374151" } } },
    theme: { mode: theme },
    colors: ["#fef08a", "#f97316", "#ef4444"]
  };

  return (
    <div className="card">
      <h3 className="card-title">Agent Activity Heatmap (Recent Slots)</h3>
      {typeof window !== 'undefined' && (
        <ReactApexChart options={options} series={heatmapSeries} type="heatmap" height={300} />
      )}
    </div>
  );
}

interface AgentLocationScatterProps {
  points: Point[];
}

function AgentLocationScatter({ points }: AgentLocationScatterProps) {
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      formatter: (params: any) =>
        `${params.data[2]}<br/>lat: ${params.data[1].toFixed(2)}, lon: ${params.data[0].toFixed(2)}`
    },
    xAxis: {
      name: "Longitude",
      type: "value" as const,
      axisLabel: { formatter: (v: number) => v.toFixed(0) },
      splitLine: { show: false }
    },
    yAxis: {
      name: "Latitude",
      type: "value" as const,
      axisLabel: { formatter: (v: number) => v.toFixed(0) },
      splitLine: { show: false }
    },
    series: [
      {
        name: "Agents",
        type: "scatter",
        symbolSize: (val: number[]) => Math.max(6, Math.min(18, val[3] / 6)),
        itemStyle: { color: "#60A5FA" },
        data: points.map((p) => [p.lon, p.lat, p.id, p.processingRate])
      }
    ],
    grid: { left: 40, right: 20, bottom: 40, top: 40 }
  };

  return (
    <div className="card">
      <h3 className="card-title">Agent Locations (lat / lon)</h3>
      {typeof window !== 'undefined' && (
        <ReactECharts option={option} style={{ height: 360 }} />
      )}
    </div>
  );
}

/* ---------- Main ---------- */

interface AgentSwarmDashboardProps {
  initialAgentCount?: number;
}

export default function AgentSwarmDashboard({ initialAgentCount = 60 }: AgentSwarmDashboardProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>("dark");
  const [agents, setAgents] = useState<Agent[]>(() => makeAgents(initialAgentCount));

  const initialCategories = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) =>
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

  const getStatusCounts = (arr: Agent[]): number[] => {
    const map = { active: 0, idle: 0, error: 0, offline: 0 };
    arr.forEach((a) => (map[a.status] = (map[a.status] || 0) + 1));
    return [map.active, map.idle, map.error, map.offline];
  };
  const [statusCounts, setStatusCounts] = useState<number[]>(() => getStatusCounts(agents));

  const buildHeatmap = (agentsArr: Agent[], groups: number = 8, slots: number = 9): HeatmapSeriesData[] => {
    const perGroup = Math.ceil(agentsArr.length / groups);
    const series = Array.from({ length: groups }).map((_, gi) => {
      const groupAgents = agentsArr.slice(gi * perGroup, (gi + 1) * perGroup);
      const data = Array.from({ length: slots }).map((_, si) => {
        const val = Math.round(
          groupAgents.reduce((acc, a) => acc + (a.series[si] || 0), 0) /
            Math.max(1, groupAgents.length)
        );
        return { x: `S${si + 1}`, y: val };
      });
      return { name: `Group ${gi + 1}`, data };
    });
    return series;
  };

  const [heatmapSeries, setHeatmapSeries] = useState<HeatmapSeriesData[]>(() => buildHeatmap(agents));
  const [points, setPoints] = useState<Point[]>(() =>
    agents.map((a) => ({ id: a.id, lat: a.lat, lon: a.lon, processingRate: a.processingRate }))
  );

  /* ---------- Realtime simulation (replace with real feed) ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) => {
        const next = prev.map((a) => {
          const drift = (Math.random() - 0.45) * 12;
          const newRate = Math.max(1, Math.round(a.processingRate + drift));
          const change = Math.random();
          let status = a.status;
          if (change > 0.985) status = "error";
          else if (change > 0.97) status = "offline";
          else if (change > 0.9) status = "idle";
          else status = "active";

          const lat = Math.min(85, Math.max(-85, a.lat + (Math.random() - 0.5) * 0.6));
          const lon = a.lon + (Math.random() - 0.5) * 0.8;
          const series = [...a.series.slice(-8), newRate];

          return { ...a, processingRate: newRate, status, lat, lon, series };
        });

        setStatusCounts(getStatusCounts(next));
        setHeatmapSeries(buildHeatmap(next));
        setPoints(next.map((a) => ({ id: a.id, lat: a.lat, lon: a.lon, processingRate: a.processingRate })));

        const aggregated = next[0]?.series.map((_, idx) =>
          next.reduce((s, agent) => s + (agent.series[idx] || 0), 0)
        ) || [];
        setPerfSeries([{ name: "Agent Processing Rate", data: aggregated }]);
        setPerfCategories((prevCats) => {
          const nextCat = new Date().toLocaleTimeString();
          const newCats = [...prevCats.slice(1), nextCat];
          return newCats;
        });

        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* Replace simulation with production websocket like:
     useEffect(() => {
       const ws = new WebSocket('wss://your-realtime-endpoint');
       ws.onmessage = (evt) => {
         const update = JSON.parse(evt.data); // agentId, rate, status, lat, lon
         setAgents(prev => {
           // immutably update the targeted agent and derived data
         });
       };
       return () => ws.close();
     }, []);
  */

  return (
    <div className={`dashboard ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <header className="dashboard-header">
        <h1>Agent Swarm Dashboard</h1>
        <div className="header-controls">
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

      <main className="dashboard-grid">
        <section className="col-span-2">
          <AgentPerformanceChart
            series={perfSeries}
            categories={perfCategories}
            theme={theme}
          />
        </section>

        <aside className="col-span-1 right-col">
          <AgentHealthDonut counts={statusCounts} theme={theme} />
          <div className="card small-card">
            <h3 className="card-title">Quick Stats</h3>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-value">{Math.round(perfSeries[0]?.data.slice(-1)[0] || 0)}</div>
                <div className="stat-label">Current Rate</div>
              </div>
              <div className="stat">
                <div className="stat-value">{statusCounts[2]}</div>
                <div className="stat-label">Errors</div>
              </div>
              <div className="stat">
                <div className="stat-value">{statusCounts[3]}</div>
                <div className="stat-label">Offline</div>
              </div>
            </div>
          </div>
        </aside>

        <section className="col-span-1">
          <AgentActivityHeatmap
            heatmapSeries={heatmapSeries}
            xCategories={Array.from({ length: 9 }).map((_, i) => `S${i + 1}`)}
            theme={theme}
          />
        </section>

        <section className="col-span-2">
          <AgentLocationScatter points={points} />
        </section>
      </main>
    </div>
  );
}
