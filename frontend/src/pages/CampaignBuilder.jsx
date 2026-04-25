import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import { ArrowLeft, Target, Users, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

const steps = ['Details', 'Template', 'Targets', 'Review']

export default function CampaignBuilder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [templates, setTemplates] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', description: '', template_id: null, target_user_ids: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectAll, setSelectAll] = useState(true)

  useEffect(() => {
    api.get('/api/templates/').then(r => setTemplates(r.data))
    api.get('/api/users/').then(r => setUsers(r.data))
  }, [])

  const diffColor = { easy: 'text-emerald-400 bg-emerald-500/10', medium: 'text-yellow-400 bg-yellow-500/10', hard: 'text-red-400 bg-red-500/10' }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const payload = { ...form, target_user_ids: selectAll ? [] : form.target_user_ids }
      const res = await api.post('/api/campaigns/', payload)
      navigate(`/campaigns/${res.data.id}`)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create campaign')
    }
    setLoading(false)
  }

  const selectedTemplate = templates.find(t => t.id === form.template_id)

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="New Campaign" description="Configure and launch a phishing simulation"
        actions={<button onClick={() => navigate('/campaigns')} className="btn-secondary"><ArrowLeft className="w-4 h-4" />Back</button>}
      />

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${i === step ? 'text-cyan-400' : i < step ? 'text-gray-400 cursor-pointer hover:text-gray-200' : 'text-gray-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${i === step ? 'bg-cyan-500 border-cyan-500 text-gray-950' : i < step ? 'border-cyan-500/40 text-cyan-400' : 'border-gray-700 text-gray-600'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {s}
            </button>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? 'bg-cyan-500/40' : 'bg-gray-800'}`} />}
          </div>
        ))}
      </div>

      <div className="card">
        {/* Step 0: Details */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-semibold text-gray-200">Campaign Details</h3>
            <div>
              <label className="label">Campaign Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input" placeholder="e.g. Q4 2024 Security Awareness" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="input min-h-20 resize-none" placeholder="Optional description..." />
            </div>
            <button onClick={() => form.name && setStep(1)} disabled={!form.name}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Template →
            </button>
          </div>
        )}

        {/* Step 1: Template */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-semibold text-gray-200">Select Phishing Template</h3>
            <div className="grid gap-3">
              {templates.map(t => (
                <button key={t.id} onClick={() => setForm({ ...form, template_id: t.id })}
                  className={`text-left p-4 rounded-xl border transition-all ${form.template_id === t.id ? 'border-cyan-500/60 bg-cyan-500/5' : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {form.template_id === t.id && <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                      <span className="font-medium text-sm text-gray-200">{t.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">{t.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${diffColor[t.difficulty]}`}>{t.difficulty}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 font-mono">Subject: {t.subject}</p>
                  <p className="text-xs text-gray-600 mt-0.5">From: {t.sender_name} &lt;{t.sender_email}&gt;</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
              <button onClick={() => form.template_id && setStep(2)} disabled={!form.template_id}
                className="btn-primary disabled:opacity-40">
                Continue to Targets →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Targets */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-semibold text-gray-200">Select Target Users</h3>
            <label className="flex items-center gap-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl cursor-pointer">
              <input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} className="w-4 h-4 accent-cyan-500" />
              <div>
                <p className="text-sm font-medium text-cyan-400">Target all active users ({users.length})</p>
                <p className="text-xs text-gray-500">Recommended for organization-wide campaigns</p>
              </div>
            </label>

            {!selectAll && (
              <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-800 rounded-xl p-2">
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-800/40 rounded-lg cursor-pointer">
                    <input type="checkbox"
                      checked={form.target_user_ids.includes(u.id)}
                      onChange={e => {
                        const ids = e.target.checked ? [...form.target_user_ids, u.id] : form.target_user_ids.filter(i => i !== u.id)
                        setForm({ ...form, target_user_ids: ids })
                      }}
                      className="w-4 h-4 accent-cyan-500" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-200">{u.first_name} {u.last_name}</span>
                      <span className="text-xs text-gray-500 ml-2">{u.email}</span>
                    </div>
                    <span className="text-xs text-gray-600">{u.department}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
              <button onClick={() => setStep(3)} className="btn-primary">Review Campaign →</button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-semibold text-gray-200">Review & Create</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/40 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Campaign</p>
                <p className="font-semibold text-gray-200">{form.name}</p>
                {form.description && <p className="text-xs text-gray-500 mt-1">{form.description}</p>}
              </div>
              <div className="p-3 bg-gray-800/40 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Template</p>
                <p className="font-semibold text-gray-200">{selectedTemplate?.name || 'None selected'}</p>
                {selectedTemplate && <p className="text-xs text-gray-500 mt-0.5 font-mono">{selectedTemplate.subject}</p>}
              </div>
              <div className="p-3 bg-gray-800/40 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Targets</p>
                <p className="font-semibold text-gray-200">
                  {selectAll ? `All active users (${users.length})` : `${form.target_user_ids.length} selected users`}
                </p>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300/80">This is a <strong>simulated</strong> campaign. No real emails will be sent. All activity is for security awareness training only.</p>
            </div>

            {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
              <button onClick={submit} disabled={loading} className="btn-primary">
                {loading ? <><div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />Creating...</> : <><Target className="w-4 h-4" />Create Campaign</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
