import { useState, useEffect } from 'react'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon, Save, Shield, Mail, Building, AlertCircle, CheckCircle2, Users, Plus, X } from 'lucide-react'

export default function Settings() {
  const { admin } = useAuth()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ email: '', username: '', password: '', role: 'admin' })
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    Promise.all([
      api.get('/api/settings/').then(r => { setSettings(r.data); setLoading(false) }),
      api.get('/api/auth/audit-logs').then(r => setAuditLogs(r.data)).catch(() => {})
    ])
  }, [])

  const save = async () => {
    setSaving(true)
    try { await api.post('/api/settings/', settings); setSuccess(true); setTimeout(() => setSuccess(false), 3000) } catch {}
    setSaving(false)
  }

  const createAdmin = async () => {
    setAdminError('')
    try {
      await api.post('/api/auth/create-admin', newAdmin)
      setShowAddAdmin(false)
      setNewAdmin({ email: '', username: '', password: '', role: 'admin' })
    } catch (e) { setAdminError(e.response?.data?.detail || 'Failed to create admin') }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'email', label: 'Email Config', icon: Mail },
    { id: 'risk', label: 'Risk Scoring', icon: Shield },
    ...(admin?.role === 'super_admin' ? [{ id: 'admins', label: 'Admins', icon: Users }] : []),
    ...(admin?.role === 'super_admin' ? [{ id: 'audit', label: 'Audit Logs', icon: SettingsIcon }] : []),
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Settings" description="Platform configuration and administration" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="card space-y-4 animate-fade-in">
          {/* General */}
          {activeTab === 'general' && (<>
            <h3 className="font-semibold text-gray-200 flex items-center gap-2"><Building className="w-4 h-4 text-cyan-400" />Organization</h3>
            <div><label className="label">Organization Name</label><input value={settings.org_name || ''} onChange={e => setSettings({...settings, org_name: e.target.value})} className="input" /></div>
            <div>
              <label className="label">Default Campaign Status</label>
              <select value={settings.default_campaign_status || 'draft'} onChange={e => setSettings({...settings, default_campaign_status: e.target.value})} className="input">
                <option value="draft">Draft</option><option value="running">Running</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-200">Mock Email Mode</p>
                <p className="text-xs text-gray-500">Simulate email sending without SMTP (recommended)</p>
              </div>
              <button onClick={() => setSettings({...settings, mock_email: settings.mock_email === 'true' ? 'false' : 'true'})}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.mock_email === 'true' ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.mock_email === 'true' ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </>)}

          {/* Email Config */}
          {activeTab === 'email' && (<>
            <h3 className="font-semibold text-gray-200 flex items-center gap-2"><Mail className="w-4 h-4 text-cyan-400" />Email Configuration</h3>
            <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex gap-2 text-xs text-yellow-300/80">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />Only used when Mock Email Mode is disabled. For demo purposes, keep mock mode on.
            </div>
            {[['Sender Email', 'sender_email', 'email'], ['Sender Name', 'sender_name', 'text']].map(([label, key, type]) => (
              <div key={key}><label className="label">{label}</label><input type={type} value={settings[key] || ''} onChange={e => setSettings({...settings, [key]: e.target.value})} className="input" /></div>
            ))}
          </>)}

          {/* Risk Scoring */}
          {activeTab === 'risk' && (<>
            <h3 className="font-semibold text-gray-200 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" />Risk Scoring Thresholds</h3>
            <div className="space-y-4">
              {[['High Risk Threshold', 'risk_threshold_high', 'text-red-400'], ['Medium Risk Threshold', 'risk_threshold_medium', 'text-yellow-400']].map(([label, key, color]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <label className="label mb-0">{label}</label>
                    <span className={`text-sm font-mono font-bold ${color}`}>{settings[key] || 0}</span>
                  </div>
                  <input type="range" min="0" max="100" value={settings[key] || 0}
                    onChange={e => setSettings({...settings, [key]: e.target.value})}
                    className="w-full accent-cyan-500" />
                </div>
              ))}
            </div>
            <div className="p-3 bg-gray-800/40 rounded-xl text-xs text-gray-500">
              <p>Risk score increases by +15 on link click, +25 on credential submission</p>
              <p className="mt-1">Risk score decreases by -10 when a user reports a phishing email</p>
            </div>
          </>)}

          {/* Admins */}
          {activeTab === 'admins' && admin?.role === 'super_admin' && (<>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-200 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" />Admin Accounts</h3>
              <button onClick={() => setShowAddAdmin(!showAddAdmin)} className="btn-primary py-1.5 px-3 text-xs"><Plus className="w-3.5 h-3.5" />Add Admin</button>
            </div>
            {showAddAdmin && (
              <div className="p-4 border border-cyan-500/20 rounded-xl bg-cyan-500/5 space-y-3">
                {adminError && <div className="text-red-400 text-xs">{adminError}</div>}
                {[['Email', 'email', 'email'], ['Username', 'username', 'text'], ['Password', 'password', 'password']].map(([label, key, type]) => (
                  <div key={key}><label className="label">{label}</label><input type={type} value={newAdmin[key]} onChange={e => setNewAdmin({...newAdmin, [key]: e.target.value})} className="input" /></div>
                ))}
                <div><label className="label">Role</label>
                  <select value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value})} className="input">
                    <option value="admin">Admin</option><option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-2"><button onClick={() => setShowAddAdmin(false)} className="btn-secondary flex-1 justify-center">Cancel</button><button onClick={createAdmin} className="btn-primary flex-1 justify-center">Create Admin</button></div>
              </div>
            )}
          </>)}

          {/* Audit Logs */}
          {activeTab === 'audit' && admin?.role === 'super_admin' && (<>
            <h3 className="font-semibold text-gray-200">Recent Audit Logs</h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg text-xs">
                  <span className="font-mono text-cyan-400 flex-shrink-0">{log.action}</span>
                  <span className="text-gray-500 truncate">{log.details}</span>
                  <span className="text-gray-600 flex-shrink-0 font-mono">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="text-gray-600 text-sm text-center py-6">No audit logs yet</p>}
            </div>
          </>)}

          {/* Save button */}
          {['general', 'email', 'risk'].includes(activeTab) && (
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? <><div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />Saving...</> :
                success ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Settings</>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
