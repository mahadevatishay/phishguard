import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { Plus, Search, Target, MousePointerClick, Flag, Eye, Play, Pause, Trash2, ChevronRight } from 'lucide-react'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const load = async () => {
    try {
      const res = await api.get('/api/campaigns/')
      setCampaigns(res.data)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const launch = async (id, e) => {
    e.preventDefault(); e.stopPropagation()
    await api.post(`/api/campaigns/${id}/launch`)
    load()
  }

  const updateStatus = async (id, status, e) => {
    e.preventDefault(); e.stopPropagation()
    await api.patch(`/api/campaigns/${id}`, { status })
    load()
  }

  const deleteCampaign = async (id, e) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Delete this campaign?')) return
    await api.delete(`/api/campaigns/${id}`)
    load()
  }

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Campaigns" description="Manage phishing simulation campaigns"
        actions={<Link to="/campaigns/new" className="btn-primary"><Plus className="w-4 h-4" />New Campaign</Link>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9" placeholder="Search campaigns..." />
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {['all','draft','running','paused','completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Target className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No campaigns found</p>
          <Link to="/campaigns/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" />Create First Campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <Link key={c.id} to={`/campaigns/${c.id}`}
              className="card-hover group cursor-pointer block animate-slide-up">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-100 text-sm truncate">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{c.description || 'No description'}</p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-gray-200">{c.stats.total}</p>
                    <p className="text-xs text-gray-600">Targets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-cyan-400">{c.stats.sent}</p>
                    <p className="text-xs text-gray-600">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-red-400">{c.stats.click_rate}%</p>
                    <p className="text-xs text-gray-600">Click Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-emerald-400">{c.stats.reported}</p>
                    <p className="text-xs text-gray-600">Reported</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.status === 'draft' && (
                    <button onClick={e => launch(c.id, e)} className="btn-primary py-1.5 px-3 text-xs">
                      <Play className="w-3.5 h-3.5" />Launch
                    </button>
                  )}
                  {c.status === 'running' && (
                    <button onClick={e => updateStatus(c.id, 'paused', e)} className="btn-secondary py-1.5 px-3 text-xs">
                      <Pause className="w-3.5 h-3.5" />Pause
                    </button>
                  )}
                  {c.status === 'paused' && (
                    <button onClick={e => updateStatus(c.id, 'running', e)} className="btn-secondary py-1.5 px-3 text-xs">
                      <Play className="w-3.5 h-3.5" />Resume
                    </button>
                  )}
                  <button onClick={e => deleteCampaign(c.id, e)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
              </div>

              {/* Progress bar */}
              {c.stats.sent > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800/60">
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-800">
                    <div style={{ width: `${(c.stats.clicked/c.stats.sent*100)||0}%` }} className="bg-red-500" />
                    <div style={{ width: `${(c.stats.reported/c.stats.sent*100)||0}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${Math.max(0,(c.stats.sent-c.stats.clicked-c.stats.reported)/c.stats.sent*100)||0}%` }} className="bg-gray-700" />
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><span className="w-2 h-1.5 bg-red-500 rounded inline-block" />Clicked</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-1.5 bg-emerald-500 rounded inline-block" />Reported</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-1.5 bg-gray-700 rounded inline-block" />Safe</span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
