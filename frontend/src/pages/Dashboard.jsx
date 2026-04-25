import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import api from '../utils/api'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import RiskBadge from '../components/RiskBadge'
import { BarChart3, Users, Target, MousePointerClick, Flag, AlertTriangle, Shield, RefreshCw, TrendingUp, Monitor } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const chartDefaults = {
  plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 } } } },
  scales: { x: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } }, y: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } } }
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await api.get('/api/analytics/dashboard')
      setData(res.data)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { const t = setInterval(() => load(true), 30000); return () => clearInterval(t) }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const k = data?.kpis || {}

  const barData = {
    labels: data?.campaign_trend?.map(d => d.month) || [],
    datasets: [{
      label: 'Campaigns',
      data: data?.campaign_trend?.map(d => d.campaigns) || [],
      backgroundColor: 'rgba(0,184,245,0.25)',
      borderColor: '#00b8f5',
      borderWidth: 2, borderRadius: 4,
    }]
  }

  const doughnutData = {
    labels: data?.browser_breakdown?.map(b => b.browser) || [],
    datasets: [{ data: data?.browser_breakdown?.map(b => b.count) || [],
      backgroundColor: ['#00b8f5','#3b82f6','#8b5cf6','#f59e0b','#10b981'],
      borderWidth: 0, hoverOffset: 4 }]
  }

  const deviceData = {
    labels: data?.device_breakdown?.map(d => d.device) || [],
    datasets: [{ data: data?.device_breakdown?.map(d => d.count) || [],
      backgroundColor: ['#00b8f5','#f59e0b','#10b981'],
      borderWidth: 0, hoverOffset: 4 }]
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Security Dashboard" description="Real-time phishing simulation overview"
        actions={
          <button onClick={() => load(true)} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <StatCard title="Total Campaigns" value={k.total_campaigns} sub={`${k.active_campaigns} running`} icon={Target} color="cyan" />
        <StatCard title="Users Tracked" value={k.total_users} sub="Active targets" icon={Users} color="blue" />
        <StatCard title="Emails Sent" value={k.total_sent?.toLocaleString()} sub="Mock delivery" icon={Shield} color="purple" />
        <StatCard title="Links Clicked" value={k.total_clicked} sub={`${k.click_rate}% click rate`} icon={MousePointerClick} color="red" />
        <StatCard title="Reported" value={k.total_reported} sub={`${k.report_rate}% report rate`} icon={Flag} color="emerald" />
        <StatCard title="Creds Submitted" value={k.total_submitted} sub={`${k.submission_rate}% rate`} icon={AlertTriangle} color="yellow" />
        <StatCard title="Training Done" value={k.total_trained} sub={`${k.completion_rate}% completion`} icon={BarChart3} color="cyan" />
        <StatCard title="Active Now" value={k.active_campaigns} sub="Running campaigns" icon={TrendingUp} color="emerald" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Campaign Trend
          </h3>
          <Bar data={barData} options={{ ...chartDefaults, responsive: true, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} height={90} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" /> Browser Split
          </h3>
          {doughnutData.labels.length > 0 ? (
            <Doughnut data={doughnutData} options={{ ...chartDefaults, cutout: '65%', scales: undefined }} />
          ) : <p className="text-gray-600 text-sm text-center py-10">No click data yet</p>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top risky users */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> High Risk Users
          </h3>
          <div className="space-y-2">
            {data?.top_risky_users?.length > 0 ? data.top_risky_users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-2.5 bg-gray-800/40 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.department}</p>
                  </div>
                </div>
                <RiskBadge score={u.risk_score} />
              </div>
            )) : <p className="text-gray-600 text-sm text-center py-6">No risk data yet</p>}
          </div>
        </div>

        {/* Top templates */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-400" /> Most Clicked Templates
          </h3>
          <div className="space-y-2">
            {data?.top_templates?.length > 0 ? data.top_templates.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-800/40 rounded-lg">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-xs font-mono font-bold text-red-400">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full" style={{ width: `${Math.min(t.click_rate, 100)}%` }} />
                    </div>
                    <span className="text-xs font-mono text-red-400 flex-shrink-0">{t.click_rate}%</span>
                  </div>
                </div>
              </div>
            )) : <p className="text-gray-600 text-sm text-center py-6">No template data yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
