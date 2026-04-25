import { useState, useEffect } from 'react'
import api from '../utils/api'
import PageHeader from '../components/PageHeader'
import { Plus, Mail, Pencil, Trash2, X, Eye, AlertCircle } from 'lucide-react'

const diffColor = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' }
const catColors = ['bg-cyan-500/10 text-cyan-400', 'bg-purple-500/10 text-purple-400', 'bg-blue-500/10 text-blue-400', 'bg-orange-500/10 text-orange-400']

const defaultForm = { name: '', subject: '', sender_name: '', sender_email: '', html_body: '', text_body: '', category: 'IT Security', difficulty: 'medium' }

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [previewTab, setPreviewTab] = useState('html')

  const load = async () => { try { const r = await api.get('/api/templates/'); setTemplates(r.data) } catch {} setLoading(false) }
  useEffect(() => { load() }, [])

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/api/templates/${editing.id}`, form)
      else await api.post('/api/templates/', form)
      setShowForm(false); setEditing(null); setForm(defaultForm); load()
    } catch (e) { setError(e.response?.data?.detail || 'Save failed') }
  }

  const del = async (id) => {
    if (!confirm('Delete template?')) return
    await api.delete(`/api/templates/${id}`); load()
  }

  const startEdit = (t) => { setEditing(t); setForm({ name: t.name, subject: t.subject, sender_name: t.sender_name, sender_email: t.sender_email, html_body: t.html_body, text_body: t.text_body, category: t.category, difficulty: t.difficulty }); setShowForm(true) }

  return (
    <div className="space-y-5">
      <PageHeader title="Email Templates" description="Phishing simulation templates for awareness training"
        actions={<button onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm) }} className="btn-primary"><Plus className="w-4 h-4" />New Template</button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <div key={t.id} className="card-hover flex flex-col gap-3 animate-fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${catColors[i % catColors.length]}`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPreview(t)} className="p-1.5 text-gray-600 hover:text-cyan-400 transition-colors"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => startEdit(t)} className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(t.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-200 text-sm">{t.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{t.subject}</p>
                <p className="text-xs text-gray-600 mt-0.5">{t.sender_name} &lt;{t.sender_email}&gt;</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">{t.category}</span>
                <span className={`${diffColor[t.difficulty]} text-xs`}>{t.difficulty}</span>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full card text-center py-16">
              <Mail className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No templates yet. Create your first one.</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl shadow-2xl animate-slide-up my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-200">{editing ? 'Edit Template' : 'New Template'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Template Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Password Reset Attack" /></div>
                <div><label className="label">Category</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input" placeholder="IT Security" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Sender Name</label><input value={form.sender_name} onChange={e => setForm({...form, sender_name: e.target.value})} className="input" placeholder="IT Help Desk" /></div>
                <div><label className="label">Sender Email</label><input value={form.sender_email} onChange={e => setForm({...form, sender_email: e.target.value})} className="input" placeholder="helpdesk@it-support.net" /></div>
              </div>
              <div><label className="label">Subject Line *</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input" placeholder="Urgent: Your password expires today" /></div>
              <div>
                <label className="label">Difficulty</label>
                <div className="flex gap-2">
                  {['easy','medium','hard'].map(d => (
                    <button key={d} onClick={() => setForm({...form, difficulty: d})}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium capitalize border transition-all ${form.difficulty === d ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">HTML Body *</label>
                <textarea value={form.html_body} onChange={e => setForm({...form, html_body: e.target.value})}
                  className="input min-h-32 font-mono text-xs resize-none"
                  placeholder="<p>Your account requires attention. <a href='{{TRACKING_URL}}'>Click here</a></p>" />
                <p className="text-xs text-gray-600 mt-1">Use {'{{TRACKING_URL}}'} as the phishing link placeholder</p>
              </div>
              <div>
                <label className="label">Plain Text Body</label>
                <textarea value={form.text_body} onChange={e => setForm({...form, text_body: e.target.value})}
                  className="input min-h-16 font-mono text-xs resize-none" placeholder="Plain text version..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={save} disabled={!form.name || !form.subject || !form.html_body}
                className="btn-primary flex-1 justify-center disabled:opacity-40">
                {editing ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-200">Preview: {preview.name}</h3>
              <button onClick={() => setPreview(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-3 bg-gray-800 rounded-xl text-xs font-mono space-y-1 mb-3">
              <p><span className="text-gray-500">From:</span> <span className="text-cyan-400">{preview.sender_name} &lt;{preview.sender_email}&gt;</span></p>
              <p><span className="text-gray-500">Subject:</span> <span className="text-yellow-400">{preview.subject}</span></p>
            </div>
            <div className="flex gap-2 mb-3">
              {['html', 'text'].map(tab => (
                <button key={tab} onClick={() => setPreviewTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${previewTab === tab ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab === 'html' ? 'HTML' : 'Plain Text'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800">
              {previewTab === 'html' ? (
                <iframe srcDoc={preview.html_body.replace('{{TRACKING_URL}}', '#')} className="w-full h-64 bg-white rounded-xl" title="preview" sandbox="allow-scripts" />
              ) : (
                <pre className="p-4 text-xs text-gray-400 whitespace-pre-wrap">{preview.text_body}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
