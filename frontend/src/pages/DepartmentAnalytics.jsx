import { useState, useEffect } from 'react'
import { Bar, Radar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import { Building2, Users, MousePointerClick, Flag, AlertTriangle, TrendingUp, ShieldAlert, BookOpen } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const COLORS = ['#00b8f5','#3b82f6','#8b5cf6','#f59e0b','#10b981','#f97316','#ec4899','#06b6d4']

const riskColor = (score) => {
  if (score >= 70) return 'text-red-400'
  if (score >= 40) return 'text-yellow-400'
  if (score > 0) return 'text-blue-400'
  return 'text-emerald-400'
}

const riskBg = (score) => {
  if (score >= 70) return 'bg-red-500/10 border-red-500/20'
  if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/20'
  if (score > 0) return 'bg-blue-500/10 border-blue-500/20'
  return 'bg-emerald-500/10 border-emerald-500/20'
}

export default function DepartmentAnalytics() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [metric, setMetric] = useState('click_rate')

  useEffect(() => {
    api.get('/api/reports/department-stats').then(r => {
      setData(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const labels = data.map(d => d.department)

  const barChart = {
    labels,
    datasets: [
      {
        label: 'Click Rate %',
        data: data.map(d => d.click_rate),
        backgroundColor: 'rgba(239,68,68,0.7)',
        borderColor: '#ef4444', borderWidth: 1, borderRadius: 4,
      },
      {
        label: 'Report Rate %',
        data: data.map(d => d.report_rate),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderColor: '#10b981', borderWidth: 1, borderRadius: 4,
      },
      {
        label: 'Submission Rate %',
        data: data.map(d => d.submission_rate),
        backgroundColor: 'rgba(249,115,22,0.7)',
        borderColor: '#f97316', borderWidth: 1, borderRadius: 4,
      },
    ]
  }

  const riskChart = {
    labels,
    datasets: [{
      label: 'Avg Risk Score',
      data: data.map(d => d.avg_risk_score),
      backgroundColor: data.map(d =>
        d.avg_risk_score >= 70 ? 'rgba(239,68,68,0.7)' :
        d.avg_risk_score >= 40 ? 'rgba(245,158,11,0.7)' : 'rgba(0,184,245,0.7)'
      ),
      borderColor: data.map(d =>
        d.avg_risk_score >= 70 ? '#ef4444' :
        d.avg_risk_score >= 40 ? '#f59e0b' : '#00b8f5'
      ),
      borderWidth: 1, borderRadius: 4,
    }]
  }

  const radarChart = selected ? {
    labels: ['Click Rate', 'Report Rate', 'Submission Rate', 'Training Done', 'Avg Risk'],
    datasets: [{
      label: selected.department,
      data: [
        selected.click_rate,
        selected.report_rate,
        selected.submission_rate,
        selected.total_sent > 0 ? round(selected.total_trained / selected.total_sent * 100, 1) : 0,
        selected.avg_risk_score,
      ],
      backgroundColor: 'rgba(0,184,245,0.15)',
      borderColor: '#00b8f5',
      pointBackgroundColor: '#00b8f5',
      borderWidth: 2,
    }]
  } : null

  function round(v, d) { return Math.round(v * 10**d) / 10**d }

  const chartOpts = {
    responsive: true,
    plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } }
    }
  }

  const radarOpts = {
    responsive: true,
    plugins: { legend: { labels: { color: '#9ca3af' } } },
    scales: {
      r: {
        ticks: { color: '#6b7280', backdropColor: 'transparent' },
        grid: { color: '#1f2937' },
        pointLabels: { color: '#9ca3af', font: { size: 10 } },
        suggestedMin: 0, suggestedMax: 100
      }
    }
  }

  // Summary stats
  const totalUsers = data.reduce((a, d) => a + d.total_users, 0)
  const mostRisky = [...data].sort((a, b) => b.avg_risk_score - a.avg_risk_score)[0]
  const mostClicks = [...data].sort((a, b) => b.click_rate - a.click_rate)[0]
  const bestReporter = [...data].sort((a, b) => b.report_rate - a.report_rate)[0]

  return (
    <div className="space-y-6">
      <PageHeader title="Department Analytics"
        description="Security awareness breakdown by department" />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Departments</p>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <p className="stat-num text-cyan-400 mt-2">{data.length}</p>
          <p className="text-xs text-gray-500">{totalUsers} total users</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Most Clicks</p>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="stat-num text-red-400 mt-2">{mostClicks?.department || '—'}</p>
          <p className="text-xs text-gray-500">{mostClicks?.click_rate}% click rate</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Most Risky</p>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <p className="stat-num text-orange-400 mt-2">{mostRisky?.department || '—'}</p>
          <p className="text-xs text-gray-500">Avg risk: {mostRisky?.avg_risk_score}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Best Reporter</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Flag className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="stat-num text-emerald-400 mt-2">{bestReporter?.department || '—'}</p>
          <p className="text-xs text-gray-500">{bestReporter?.report_rate}% report rate</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-red-400" />Click / Report / Submission by Department
          </h3>
          <Bar data={barChart} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { labels: { color: '#9ca3af', font: { size: 10 } } } } }} height={140} />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" />Average Risk Score by Department
          </h3>
          <Bar data={riskChart} options={{ ...chartOpts, plugins: { legend: { display: false } } }} height={140} />
        </div>
      </div>

      {/* Department cards grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />All Departments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.map((dept, i) => (
            <button key={dept.department} onClick={() => setSelected(dept)}
              className={`card-hover text-left transition-all ${selected?.department === dept.department ? 'border-cyan-500/50 bg-cyan-500/5' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: COLORS[i % COLORS.length] + '30', border: `1px solid ${COLORS[i % COLORS.length]}40`, color: COLORS[i % COLORS.length] }}>
                    {dept.department[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{dept.department}</p>
                    <p className="text-xs text-gray-500">{dept.total_users} users</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold ${riskBg(dept.avg_risk_score)} ${riskColor(dept.avg_risk_score)}`}>
                  {dept.avg_risk_score}
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-red-400">{dept.click_rate}%</p>
                  <p className="text-xs text-gray-600 mt-0.5">Clicks</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-emerald-400">{dept.report_rate}%</p>
                  <p className="text-xs text-gray-600 mt-0.5">Reports</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-orange-400">{dept.submission_rate}%</p>
                  <p className="text-xs text-gray-600 mt-0.5">Submitted</p>
                </div>
              </div>

              {/* Risk bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${dept.avg_risk_score >= 70 ? 'bg-red-500' : dept.avg_risk_score >= 40 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                    style={{ width: `${Math.min(dept.avg_risk_score, 100)}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected dept radar + detail */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />{selected.department} — Radar Profile
            </h3>
            {radarChart && <Radar data={radarChart} options={radarOpts} />}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />{selected.department} — Full Stats
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Total Users', value: selected.total_users, icon: Users, color: 'text-cyan-400' },
                { label: 'Emails Sent', value: selected.total_sent, icon: Flag, color: 'text-blue-400' },
                { label: 'Links Clicked', value: `${selected.total_clicked} (${selected.click_rate}%)`, icon: MousePointerClick, color: 'text-red-400' },
                { label: 'Reported Phishing', value: `${selected.total_reported} (${selected.report_rate}%)`, icon: Flag, color: 'text-emerald-400' },
                { label: 'Creds Submitted', value: `${selected.total_submitted} (${selected.submission_rate}%)`, icon: AlertTriangle, color: 'text-orange-400' },
                { label: 'Training Complete', value: selected.total_trained, icon: BookOpen, color: 'text-purple-400' },
                { label: 'Avg Risk Score', value: selected.avg_risk_score, icon: ShieldAlert, color: riskColor(selected.avg_risk_score) },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between p-2.5 bg-gray-800/40 rounded-xl">
                  <div className="flex items-center gap-2.5 text-sm text-gray-400">
                    <Icon className={`w-4 h-4 ${color}`} />{label}
                  </div>
                  <span className={`font-mono font-semibold text-sm ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className={`mt-4 p-3 rounded-xl border text-xs ${
              selected.avg_risk_score >= 70 ? 'bg-red-500/5 border-red-500/20 text-red-300' :
              selected.avg_risk_score >= 40 ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300' :
              'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
            }`}>
              <p className="font-semibold mb-1">
                {selected.avg_risk_score >= 70 ? '🔴 High Priority — Immediate Action Required' :
                 selected.avg_risk_score >= 40 ? '🟡 Medium Priority — Schedule Training Soon' :
                 '✅ Low Risk — Maintain Awareness Programs'}
              </p>
              <p className="text-gray-400">
                {selected.avg_risk_score >= 70
                  ? `${selected.department} has a high average risk score. Schedule immediate phishing awareness training for the entire department.`
                  : selected.avg_risk_score >= 40
                  ? `${selected.department} shows moderate risk. Consider targeted training sessions focusing on credential security.`
                  : `${selected.department} is performing well. Continue regular awareness campaigns to maintain security posture.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
