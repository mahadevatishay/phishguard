import { useState, useEffect } from 'react'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { FileText, Download, Filter } from 'lucide-react'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { api.get('/api/reports/summary').then(r => { setReports(r.data); setLoading(false) }) }, [])

  const exportCSV = async (campaignId = null) => {
    const url = `/api/reports/export/csv${campaignId ? `?campaign_id=${campaignId}` : ''}`
    const r = await api.get(url, { responseType: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(r.data)
    a.download = `phishguard_report${campaignId ? `_campaign_${campaignId}` : ''}.csv`
    a.click()
  }

  const filtered = filterStatus === 'all' ? reports : reports.filter(r => r.status === filterStatus)

  const totals = reports.reduce((acc, r) => ({
    sent: acc.sent + r.sent, clicked: acc.clicked + r.clicked,
    reported: acc.reported + r.reported, submitted: acc.submitted + r.submitted
  }), { sent: 0, clicked: 0, reported: 0, submitted: 0 })

  return (
    <div className="space-y-5">
      <PageHeader title="Reports & Export" description="Campaign performance reports and data export"
        actions={
          <button onClick={() => exportCSV()} className="btn-primary">
            <Download className="w-4 h-4" />Export All CSV
          </button>
        }
      />

      {/* Summary boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Campaigns', value: reports.length },
          { label: 'Total Sent', value: totals.sent.toLocaleString() },
          { label: 'Total Clicked', value: totals.clicked },
          { label: 'Total Reported', value: totals.reported },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold font-mono text-gray-200">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {['all', 'draft', 'running', 'paused', 'completed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-500 hover:text-gray-300 border border-gray-700'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Reports table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header">Campaign</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Targets</th>
                <th className="table-header text-right">Sent</th>
                <th className="table-header text-right">Clicked</th>
                <th className="table-header text-right">Click%</th>
                <th className="table-header text-right">Submitted</th>
                <th className="table-header text-right">Reported</th>
                <th className="table-header text-right">Report%</th>
                <th className="table-header">Launch Date</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="table-cell text-center py-12 text-gray-600">Loading reports...</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell">
                    <p className="text-sm font-medium text-gray-200">{r.name}</p>
                  </td>
                  <td className="table-cell"><StatusBadge status={r.status} /></td>
                  <td className="table-cell text-right font-mono text-sm text-gray-400">{r.total_targets}</td>
                  <td className="table-cell text-right font-mono text-sm text-gray-400">{r.sent}</td>
                  <td className="table-cell text-right font-mono text-sm text-red-400">{r.clicked}</td>
                  <td className="table-cell text-right">
                    <span className={`font-mono text-sm font-semibold ${r.click_rate > 30 ? 'text-red-400' : r.click_rate > 15 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {r.click_rate}%
                    </span>
                  </td>
                  <td className="table-cell text-right font-mono text-sm text-orange-400">{r.submitted}</td>
                  <td className="table-cell text-right font-mono text-sm text-emerald-400">{r.reported}</td>
                  <td className="table-cell text-right font-mono text-sm text-gray-400">{r.report_rate}%</td>
                  <td className="table-cell">
                    <span className="text-xs text-gray-500">{r.launch_date ? new Date(r.launch_date).toLocaleDateString() : '—'}</span>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => exportCSV(r.id)} className="p-1.5 text-gray-600 hover:text-cyan-400 transition-colors" title="Export CSV">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={11} className="table-cell text-center py-12 text-gray-600">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-700" />No reports found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
