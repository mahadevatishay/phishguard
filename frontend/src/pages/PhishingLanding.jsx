import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShieldAlert, AlertTriangle, Eye, ArrowRight, Lock } from 'lucide-react'

export default function PhishingLanding() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [phase, setPhase] = useState('fake') // fake | reveal | submit
  const [submitting, setSubmitting] = useState(false)
  const [creds, setCreds] = useState({ email: '', password: '' })

  // Auto-reveal after short delay to simulate credential harvest then educate
  const handleFakeSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    // Log the submission event
    if (token) {
      try { await axios.post(`/track/submit/${token}`) } catch {}
    }
    setTimeout(() => { setSubmitting(false); setPhase('reveal') }, 1200)
  }

  if (phase === 'reveal') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full animate-slide-up">
        {/* Big warning */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500/15 border-2 border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse-slow">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">⚠️ You Were Phished!</h1>
          <p className="text-gray-400">This was a <strong className="text-gray-200">simulated phishing test</strong> run by your organization's security team.</p>
        </div>

        {/* What happened */}
        <div className="card border-red-500/20 mb-4">
          <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-red-400" />What Just Happened
          </h3>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li className="flex gap-2.5">
              <span className="text-red-400 flex-shrink-0">✗</span>
              You clicked a link in a simulated phishing email
            </li>
            <li className="flex gap-2.5">
              <span className="text-red-400 flex-shrink-0">✗</span>
              You entered credentials on a fake login page
            </li>
            <li className="flex gap-2.5">
              <span className="text-yellow-400 flex-shrink-0">!</span>
              In a real attack, your credentials would now be compromised
            </li>
          </ul>
        </div>

        {/* Red flags they missed */}
        <div className="card border-yellow-500/20 mb-4">
          <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />Red Flags You May Have Missed
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {[
              'Sender email domain didn\'t match the real company',
              'Urgent language designed to pressure quick action',
              'Login page URL was not the official domain',
              'No personalization — used "Dear User" not your name',
              'You weren\'t expecting this email or request',
            ].map((flag, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-yellow-400 flex-shrink-0">⚠</span>{flag}
              </li>
            ))}
          </ul>
        </div>

        {/* No harm done */}
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm text-emerald-300/80 mb-5">
          <strong className="text-emerald-400">✓ No harm done.</strong> This was a safe simulation. No real credentials were captured or stored. Your organization uses these tests to help protect everyone.
        </div>

        <button onClick={() => navigate(`/training?token=${token || ''}`)}
          className="btn-primary w-full justify-center py-3 text-base">
          <ArrowRight className="w-5 h-5" />Complete Security Training (Required)
        </button>
      </div>
    </div>
  )

  // Fake login page (phase === 'fake')
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Fake Microsoft-style login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1">Use your organizational account</p>
          </div>

          <form onSubmit={handleFakeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or username</label>
              <input type="email" value={creds.email} onChange={e => setCreds({...creds, email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="someone@company.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Password" required />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</> : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">© 2024 Contoso Corp. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
