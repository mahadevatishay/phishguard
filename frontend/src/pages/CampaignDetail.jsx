import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'
import { ArrowLeft, Users, MousePointerClick, Flag, AlertTriangle, BookOpen, Mail, Clock, Play, Pause, CheckCircle2, XCircle } from 'lucide-react'

export default function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const res = await api.get(`/api/campaigns/${id}`)
      setCampaign(res.data)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const updateStatus = async (status) => {
    await api.patch(`/api/campaigns/${id}`, { status })
    load()
  }

  const launch = async () => {
    await api.post(`/api/campaigns/${id}/launch`)
    load()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!campaign) return <div className="card text-center py-16 text-gray-500">Campaign not found</div>

  const s = campaign.stats
  const filteredTargets = campaign.targets?.filter(t =>
    t.user_name.toLowerCase().includes(search.toLowerCase()) ||
    t.user_email.toLowerCase().includes(search.toLowerCase()) ||
    (t.department || '').toLowerCase().includes(search.toLowerCase())
  ) || []

  const statPill = (label, value, color) => (
    <div className="flex flex-col items-center p-3 bg-gray-800/50 rounded-xl">
      <span className={`text-xl font-bold font-mono ${color}`}>{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/campaigns" className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-100">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{campaign.description}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'draft' && <button onClick={launch} className="btn-primary"><Play className="w-4 h-4" />Launch</button>}
          {campaign.status === 'running' && <button onClick={() => updateStatus('paused')} className="btn-secondary"><Pause className="w-4 h-4" />Pause</button>}
          {campaign.status === 'paused' && <button onClick={() => updateStatus('running')} className="btn-secondary"><Play className="w-4 h-4" />Resume</button>}
          {campaign.status !== 'completed' && campaign.status !== 'draft' &&
            <button onClick={() => updateStatus('completed')} className="btn-secondary"><CheckCircle2 className="w-4 h-4" />Complete</button>}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statPill('Total', s.total, 'text-gray-200')}
        {statPill('Sent', s.sent, 'text-cyan-400')}
        {statPill('Clicked', s.clicked, 'text-red-400')}
        {statPill('Submitted', s.submitted, 'text-orange-400')}
        {statPill('Reported', s.reported, 'text-emerald-400')}
        {statPill('Trained', campaign.targets?.filter(t => t.training_completed).length || 0, 'text-blue-400')}
      </div>

      {/* Rate indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Click Rate', value: s.click_rate, color: 'bg-red-500', textColor: 'text-red-400' },
          { label: 'Report Rate', value: s.report_rate, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
          { label: 'Submission Rate', value: s.submission_rate, color: 'bg-orange-500', textColor: 'text-orange-400' },
        ].map(({ label, value, color, textColor }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-lg font-bold font-mono ${textColor}`}>{value}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Targets table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />Target Users ({s.total})
          </h3>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input max-w-xs" placeholder="Search targets..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header">User</th>
                <th className="table-header">Dept</th>
                <th className="table-header text-center">Sent</th>
                <th className="table-header text-center">Clicked</th>
                <th className="table-header text-center">Submitted</th>
                <th className="table-header text-center">Reported</th>
                <th className="table-header text-center">Trained</th>
                <th className="table-header">Clicked At</th>
              </tr>
            </thead>
            <tbody>
              {filteredTargets.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-200 text-sm">{t.user_name}</p>
                      <p className="text-xs text-gray-500">{t.user_email}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs text-gray-400">{t.department || '—'}</span>
                  </td>
                  {[t.email_sent, t.link_clicked, t.credentials_submitted, t.reported, t.training_completed].map((val, i) => (
                    <td key={i} className="table-cell text-center">
                      {val
                        ? <CheckCircle2 className={`w-4 h-4 mx-auto ${i === 1 || i === 2 ? 'text-red-400' : i === 3 ? 'text-emerald-400' : 'text-cyan-400'}`} />
                        : <XCircle className="w-4 h-4 mx-auto text-gray-700" />}
                    </td>
                  ))}
                  <td className="table-cell">
                    <span className="text-xs text-gray-500 font-mono">
                      {t.clicked_at ? new Date(t.clicked_at).toLocaleDateString() : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTargets.length === 0 && (
                <tr><td colSpan={8} className="table-cell text-center text-gray-600 py-8">No targets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
