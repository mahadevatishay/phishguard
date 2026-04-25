import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import RiskBadge from '../components/RiskBadge'
import { Plus, Search, Upload, Trash2, Users as UsersIcon, X, Download } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', department: '', position: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef()

  const load = async () => {
    try { const r = await api.get(`/api/users/?search=${search}`); setUsers(r.data) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [search])

  const addUser = async () => {
    setError('')
    try {
      await api.post('/api/users/', form)
      setSuccess('User added successfully')
      setShowAdd(false)
      setForm({ email: '', first_name: '', last_name: '', department: '', position: '' })
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e.response?.data?.detail || 'Failed to add user') }
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    await api.delete(`/api/users/${id}`)
    load()
  }

  const uploadCSV = async (file) => {
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await api.post('/api/users/bulk-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSuccess(`Imported ${r.data.created} users (${r.data.skipped} skipped)`)
      load()
      setTimeout(() => setSuccess(''), 4000)
    } catch { setError('CSV upload failed') }
  }

  const downloadTemplate = () => {
    const csv = 'email,first_name,last_name,department,position\njohn.doe@company.com,John,Doe,Engineering,Software Engineer\njane.smith@company.com,Jane,Smith,Finance,Analyst\n'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'users_template.csv'; a.click()
  }

  const depts = [...new Set(users.map(u => u.department).filter(Boolean))]

  return (
    <div className="space-y-5">
      <PageHeader title="User Management" description={`${users.length} users tracked across campaigns`}
        actions={
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="btn-secondary">
              <Download className="w-4 h-4" />CSV Template
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-secondary">
              <Upload className="w-4 h-4" />Import CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => e.target.files[0] && uploadCSV(e.target.files[0])} />
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus className="w-4 h-4" />Add User
            </button>
          </div>
        }
      />

      {success && (
        <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search by name, email, department..." />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, color: 'text-cyan-400' },
          { label: 'High Risk', value: users.filter(u => u.risk_score >= 70).length, color: 'text-red-400' },
          { label: 'Departments', value: depts.length, color: 'text-blue-400' },
          { label: 'Avg Risk', value: users.length ? (users.reduce((a, u) => a + u.risk_score, 0) / users.length).toFixed(1) : '0.0', color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header">User</th>
                <th className="table-header">Department</th>
                <th className="table-header">Position</th>
                <th className="table-header text-center">Campaigns</th>
                <th className="table-header text-center">Clicks</th>
                <th className="table-header">Risk Score</th>
                <th className="table-header">Joined</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-cell text-center py-12 text-gray-600">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {u.first_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell"><span className="text-xs text-gray-400">{u.department || '—'}</span></td>
                  <td className="table-cell"><span className="text-xs text-gray-500">{u.position || '—'}</span></td>
                  <td className="table-cell text-center"><span className="font-mono text-sm text-gray-300">{u.campaigns_count}</span></td>
                  <td className="table-cell text-center"><span className="font-mono text-sm text-red-400">{u.click_count}</span></td>
                  <td className="table-cell"><RiskBadge score={u.risk_score} /></td>
                  <td className="table-cell"><span className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</span></td>
                  <td className="table-cell">
                    <button onClick={() => deleteUser(u.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr><td colSpan={8} className="table-cell text-center py-12 text-gray-600">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-700" />No users found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-200">Add New User</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
              {[['Email *', 'email', 'email'], ['First Name *', 'first_name', 'text'], ['Last Name *', 'last_name', 'text'], ['Department', 'department', 'text'], ['Position', 'position', 'text']].map(([label, key, type]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="input" placeholder={label.replace(' *', '')} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={addUser} disabled={!form.email || !form.first_name || !form.last_name}
                className="btn-primary flex-1 justify-center disabled:opacity-40">Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
