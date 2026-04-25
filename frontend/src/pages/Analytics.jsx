import { useState, useEffect } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { BarChart3, MousePointerClick, Flag, AlertTriangle, Monitor, Smartphone, Globe } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const COLORS = ['#00b8f5','#3b82f6','#8b5cf6','#f59e0b','#10b981','#f97316','#ec4899']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/analytics/dashboard').then(r => { setData(r.data); setLoading(false) })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>

  const k = data?.kpis || {}

  const trendChart = {
    labels: data?.campaign_trend?.map(d => d.month) || [],
    datasets: [{
      label: 'Campaigns Launched',
      data: data?.campaign_trend?.map(d => d.campaigns) || [],
      borderColor: '#00b8f5', backgroundColor: 'rgba(0,184,245,0.1)',
      fill: true, tension: 0.4, pointBackgroundColor: '#00b8f5', pointRadius: 5
    }]
  }

  const funnelData = {
    labels: ['Sent', 'Opened', 'Clicked', 'Submitted', 'Reported'],
    datasets: [{
      data: [k.total_sent, Math.round(k.total_sent * 0.62), k.total_clicked, k.total_submitted, k.total_reported],
      backgroundColor: ['#00b8f5', '#3b82f6', '#ef4444', '#f97316', '#10b981'],
      borderWidth: 0, borderRadius: 4
    }]
  }

  const browserChart = {
    labels: data?.browser_breakdown?.map(b => b.browser) || [],
    datasets: [{ data: data?.browser_breakdown?.map(b => b.count) || [], backgroundColor: COLORS, borderWidth: 0 }]
  }

  const deviceChart = {
    labels: data?.device_breakdown?.map(d => d.device) || [],
    datasets: [{ data: data?.device_breakdown?.map(d => d.count) || [], backgroundColor: ['#00b8f5','#f59e0b','#10b981'], borderWidth: 0 }]
  }

  const noScaleOpts = { plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 } } } }, scales: undefined }
  const lineOpts = {
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } }, y: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } } },
    elements: { line: { borderWidth: 2 } }
  }
  const barOpts = {
    ...lineOpts,
    plugins: { legend: { display: false } },
    indexAxis: 'y'
  }

  const rates = [
    { label: 'Click Rate', value: k.click_rate, color: 'bg-red-500', icon: MousePointerClick },
    { label: 'Report Rate', value: k.report_rate, color: 'bg-emerald-500', icon: Flag },
    { label: 'Submission Rate', value: k.submission_rate, color: 'bg-orange-500', icon: AlertTriangle },
    { label: 'Training Completion', value: k.completion_rate, color: 'bg-blue-500', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Comprehensive phishing simulation analytics and insights" />

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Click Rate" value={`${k.click_rate}%`} sub={`${k.total_clicked} of ${k.total_sent} sent`} icon={MousePointerClick} color="red" />
        <StatCard title="Report Rate" value={`${k.report_rate}%`} sub="Users who reported" icon={Flag} color="emerald" />
        <StatCard title="Submission Rate" value={`${k.submission_rate}%`} sub="Credentials entered" icon={AlertTriangle} color="yellow" />
        <StatCard title="Training Rate" value={`${k.completion_rate}%`} sub="Completed training" icon={BarChart3} color="blue" />
      </div>

      {/* Rate bars */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-5">Campaign Performance Rates</h3>
        <div className="space-y-4">
          {rates.map(({ label, value, color, icon: Icon }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Icon className="w-3.5 h-3.5" />{label}
                </div>
                <span className="text-sm font-mono font-semibold text-gray-200">{value}%</span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(value || 0, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Campaign Launch Trend</h3>
          <Line data={trendChart} options={lineOpts} height={120} />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Phishing Funnel</h3>
          <Bar data={funnelData} options={{ ...lineOpts, indexAxis: 'y', plugins: { legend: { display: false } } }} height={120} />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />Browser Breakdown
          </h3>
          {browserChart.labels.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-40 flex-shrink-0">
                <Doughnut data={browserChart} options={{ ...noScaleOpts, cutout: '60%' }} />
              </div>
              <div className="flex-1 space-y-2">
                {browserChart.labels.map((label, i) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-gray-400">{label}</span>
                    </div>
                    <span className="font-mono text-gray-300">{browserChart.datasets[0].data[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-gray-600 text-sm text-center py-10">No click data yet</p>}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />Device Breakdown
          </h3>
          {deviceChart.labels.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-40 flex-shrink-0">
                <Doughnut data={deviceChart} options={{ ...noScaleOpts, cutout: '60%' }} />
              </div>
              <div className="flex-1 space-y-2">
                {deviceChart.labels.map((label, i) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#00b8f5','#f59e0b','#10b981'][i] }} />
                      <span className="text-gray-400">{label}</span>
                    </div>
                    <span className="font-mono text-gray-300">{deviceChart.datasets[0].data[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-gray-600 text-sm text-center py-10">No device data yet</p>}
        </div>
      </div>

      {/* Top templates */}
      {data?.top_templates?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Performing Templates (by Click Rate)</h3>
          <div className="space-y-3">
            {data.top_templates.map((t, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs font-mono text-gray-600 w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300 truncate">{t.name}</span>
                    <span className="text-sm font-mono text-red-400 ml-2 flex-shrink-0">{t.click_rate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full" style={{ width: `${Math.min(t.click_rate, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
