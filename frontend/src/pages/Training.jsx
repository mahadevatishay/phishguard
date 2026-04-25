import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Shield, CheckCircle2, BookOpen, ChevronRight, ChevronDown, Award, AlertTriangle } from 'lucide-react'

const lessons = [
  {
    id: 1, icon: '🎣', title: 'Recognizing Phishing Emails',
    content: `Phishing emails are designed to trick you into revealing sensitive information or clicking malicious links. Here's what to look for:

**Suspicious Sender Domains**: The email may look like it's from "Microsoft" but the address is microsoft-support@helpdesk-alerts.net. Always check the actual domain — legitimate companies use their own domain.

**Urgency & Fear Tactics**: Phrases like "Your account will be suspended in 24 hours" or "Immediate action required" are designed to make you panic and act without thinking.

**Generic Greetings**: "Dear Customer" or "Dear User" instead of your actual name indicates a mass phishing campaign.

**Suspicious Links**: Hover over any link before clicking. The displayed text may say "Click here to login" but the actual URL points elsewhere.

**Unexpected Attachments**: Legitimate companies rarely send unsolicited attachments, especially .exe, .zip, or Office files with macros.`,
    tips: ['Hover over links before clicking', 'Check the sender\'s full email domain', 'When in doubt, go directly to the website', 'Call the sender to verify unusual requests']
  },
  {
    id: 2, icon: '🔐', title: 'Password Security',
    content: `Strong passwords are your first line of defense. Here are the key principles:

**Use Long, Unique Passwords**: A 16-character passphrase like "coffee-mountain-river-7!" is far stronger than "P@ssw0rd". Length matters more than complexity.

**Never Reuse Passwords**: If one site is breached, attackers try your credentials everywhere. Use a password manager to maintain unique passwords for every account.

**Enable Multi-Factor Authentication (MFA)**: Even if your password is stolen, MFA prevents attackers from logging in without your second factor (phone, authenticator app, or hardware key).

**Password Managers**: Tools like Bitwarden, 1Password, or KeePass generate and store complex passwords securely. You only need to remember one master password.`,
    tips: ['Use a password manager', 'Enable MFA on all critical accounts', 'Never share passwords via email', 'Change passwords after any breach notification']
  },
  {
    id: 3, icon: '🧠', title: 'Social Engineering',
    content: `Social engineering exploits human psychology rather than technical vulnerabilities. Attackers manipulate people into breaking security procedures.

**Pretexting**: An attacker poses as someone with authority (IT admin, HR, CEO) to extract information or credentials. Always verify identity through a separate channel.

**Business Email Compromise (BEC)**: Attackers spoof or compromise executive email accounts to authorize wire transfers or sensitive data sharing. Any unusual financial request should be verified by phone.

**Vishing (Voice Phishing)**: Phone calls claiming to be tech support, banks, or government agencies. Legitimate organizations won't ask for passwords or OTP codes over the phone.

**Tailgating**: Physically following authorized personnel into secure areas. Always challenge unfamiliar people and don't hold doors open for strangers in secure areas.`,
    tips: ['Verify identity through a second channel', 'Never give passwords over the phone', 'Report suspicious requests to security', 'Trust your instincts — if it feels wrong, it probably is']
  },
  {
    id: 4, icon: '🛡️', title: 'What To Do If You Clicked',
    content: `If you clicked a phishing link or submitted credentials, act fast:

**Step 1 — Don't Panic**: Quick action can minimize the damage. Panicking leads to poor decisions.

**Step 2 — Disconnect**: If you downloaded anything or suspect malware, disconnect your device from the network immediately.

**Step 3 — Change Passwords**: Immediately change the password for any account you may have entered credentials for. Start with email and banking.

**Step 4 — Enable MFA**: If not already enabled, turn on MFA for the affected account right now.

**Step 5 — Report It**: Tell your IT/security team immediately. Early reporting is crucial for incident response. You will NOT be punished for honest mistakes — only for hiding them.

**Step 6 — Monitor Accounts**: Watch for unusual activity in the following days and weeks.`,
    tips: ['Report immediately — never hide incidents', 'Change affected passwords right away', 'Enable MFA on compromised accounts', 'Monitor bank/email for suspicious activity']
  },
]

export default function Training() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [openLesson, setOpenLesson] = useState(0)
  const [completed, setCompleted] = useState([])
  const [finished, setFinished] = useState(false)
  const [modules, setModules] = useState([])

  useEffect(() => {
    axios.get('/api/settings/training-modules').then(r => setModules(r.data)).catch(() => {})
  }, [])

  const markComplete = (id) => {
    if (!completed.includes(id)) setCompleted([...completed, id])
  }

  const finishTraining = async () => {
    if (token) {
      try { await axios.post(`/track/training-complete/${token}`) } catch {}
    }
    setFinished(true)
  }

  const allDone = completed.length >= lessons.length

  if (finished) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Training Complete!</h1>
        <p className="text-gray-400 mb-6">You've completed the phishing awareness training. You're now better equipped to identify and respond to phishing attacks.</p>
        <div className="card mb-6 text-left">
          <p className="text-sm font-semibold text-gray-300 mb-3">Key Takeaways</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />Always verify sender domains before clicking links</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />Use MFA and a password manager</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />Report suspicious emails immediately</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />Verify unusual requests through a second channel</li>
          </ul>
        </div>
        <button onClick={() => window.close()} className="btn-primary w-full justify-center py-3">
          <CheckCircle2 className="w-4 h-4" /> Close Training
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pt-4">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100">Security Awareness Training</h1>
            <p className="text-xs text-gray-500">Complete all modules to finish training</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">{completed.length}/{lessons.length} complete</p>
            <div className="h-1.5 w-24 bg-gray-800 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(completed.length/lessons.length)*100}%` }} />
            </div>
          </div>
        </div>

        {/* Lessons */}
        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const isOpen = openLesson === idx
            const isDone = completed.includes(lesson.id)
            return (
              <div key={lesson.id} className={`card transition-all ${isDone ? 'border-emerald-500/20' : isOpen ? 'border-cyan-500/30' : ''}`}>
                <button onClick={() => setOpenLesson(isOpen ? -1 : idx)}
                  className="w-full flex items-center gap-3 text-left">
                  <span className="text-2xl">{lesson.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-200">{lesson.title}</p>
                    {isDone && <p className="text-xs text-emerald-400 mt-0.5">✓ Completed</p>}
                  </div>
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> :
                    isOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-800 animate-fade-in">
                    <div className="prose prose-sm text-gray-400 whitespace-pre-line text-sm leading-relaxed">
                      {lesson.content.split('\n\n').map((para, i) => (
                        <p key={i} className="mb-3" dangerouslySetInnerHTML={{
                          __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-200">$1</strong>')
                        }} />
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                      <p className="text-xs font-semibold text-cyan-400 mb-2">💡 Quick Tips</p>
                      <ul className="space-y-1.5">
                        {lesson.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-gray-400 flex gap-2">
                            <span className="text-cyan-500 flex-shrink-0">→</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!isDone && (
                      <button onClick={() => { markComplete(lesson.id); setOpenLesson(idx + 1) }}
                        className="btn-primary mt-4 w-full justify-center">
                        <CheckCircle2 className="w-4 h-4" />Mark as Complete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Finish */}
        {allDone && (
          <div className="mt-6 animate-slide-up">
            <button onClick={finishTraining} className="btn-primary w-full justify-center py-3 text-base">
              <Award className="w-5 h-5" />Complete Training & Get Certificate
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-700 mt-8 pb-4">
          PhishGuard Security Awareness Platform — For educational use only
        </p>
      </div>
    </div>
  )
}
