import { useState, useEffect } from 'react'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { FileText, Download, Filter, FileDown, Loader2 } from 'lucide-react'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [pdfLoading, setPdfLoading] = useState(null)

  useEffect(() => {
    api.get('/api/reports/summary').then(r => { setReports(r.data); setLoading(false) })
  }, [])

  const exportCSV = async (campaignId = null) => {
    const url = `/api/reports/export/csv${campaignId ? `?campaign_id=${campaignId}` : ''}`
    const r = await api.get(url, { responseType: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(r.data)
    a.download = `phishguard_report${campaignId ? `_campaign_${campaignId}` : ''}.csv`
    a.click()
  }

  const exportPDF = async (campaignId = null) => {
    setPdfLoading(campaignId || 'all')
    try {
      const url = `/api/reports/export/pdf${campaignId ? `?campaign_id=${campaignId}` : ''}`
      const r = await api.get(url, { responseType: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      a.download = `phishguard_report${campaignId ? `_campaign_${campaignId}` : '_full'}.pdf`
      a.click()
    } catch (e) { alert('PDF generation failed') }
    setPdfLoading(null)
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
          <div className="flex gap-2">
            <button onClick={() => exportCSV()} className="btn-secondary">
              <Download className="w-4 h-4" />Export All CSV
            </button>
            <button onClick={() => exportPDF()} disabled={pdfLoading === 'all'}
              className="btn-primary">
              {pdfLoading === 'all'
                ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                : <><FileDown className="w-4 h-4" />Export Full PDF</>}
            </button>
          </div>
        }
      />

      {/* Summary boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Campaigns', value: reports.length, color: 'text-cyan-400' },
          { label: 'Total Sent', value: totals.sent.toLocaleString(), color: 'text-blue-400' },
          { label: 'Total Clicked', value: totals.clicked, color: 'text-red-400' },
          { label: 'Total Reported', value: totals.reported, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
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

      {/* Table */}
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
                <th className="table-header text-center">Export</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="table-cell text-center py-12 text-gray-600">Loading...</td></tr>
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
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => exportCSV(r.id)}
                        className="p-1.5 text-gray-600 hover:text-cyan-400 transition-colors" title="Export CSV">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => exportPDF(r.id)} disabled={pdfLoading === r.id}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors" title="Export PDF">
                        {pdfLoading === r.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          : <FileDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
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
