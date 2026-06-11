'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'

type ApiKey = { id: number; key_name: string; api_key: string; requests_total: number; coins_used: number; is_active: number; created_at: string }

export default function DeveloperPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth') }, [status, router])

  useEffect(() => {
    if (!session?.backendToken) return
    api.keys.list(session.backendToken).then(d => { if (d.success) setKeys(d.keys) })
  }, [session])

  const createKey = async () => {
    if (!session?.backendToken || !newName.trim()) return
    setCreating(true)
    const res = await api.keys.create(session.backendToken, { name: newName })
    if (res.success) {
      setKeys(prev => [{ id: res.id, key_name: res.key_name, api_key: res.api_key, requests_total: 0, coins_used: 0, is_active: 1, created_at: new Date().toISOString() }, ...prev])
      setNewName('')
    }
    setCreating(false)
  }

  const revokeKey = async (id: number) => {
    if (!session?.backendToken) return
    await api.keys.revoke(session.backendToken, { id })
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: 0 } : k))
  }

  const copy = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (status === 'loading' || !session) return <div className="h-screen flex items-center justify-center bg-[#03030a]"><div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#03030a] flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/5 p-4 glass">
        <Link href="/home" className="flex items-center gap-2.5 mb-8 px-2">
          <Image src="/logo.png" alt="OptiLogix" width={32} height={32} className="rounded-xl" />
          <span className="font-bold text-white">optilogix<span className="grad-text">X</span></span>
        </Link>
        <nav className="flex-1 space-y-1">
          {[{href:'/dashboard',icon:'🏠',label:'Overview'},{href:'/workspace',icon:'🧠',label:'Workspace'},{href:'/dashboard/developer',icon:'⚡',label:'Developer',active:true}].map(m => (
            <Link key={m.href} href={m.href} className={`sidebar-item ${m.active ? 'active' : ''}`}><span>{m.icon}</span><span>{m.label}</span></Link>
          ))}
        </nav>
        <div className="glass rounded-xl p-3">
          <div className="text-xs text-white/40 mb-1">Balance</div>
          <div className="coin-badge">🪙 {session.user.coinBalance ?? 0}</div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Developer API</h1>
          <p className="text-white/40 mb-8">Build with OptiLogix. Integrate our AI under your brand.</p>

          {/* Create key */}
          <div className="glass-strong rounded-3xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Create New API Key</h2>
            <div className="flex gap-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Key name (e.g. My App)"
                className="glass-input flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30" />
              <button onClick={createKey} disabled={creating || !newName.trim()} className="grad-btn px-6 py-3 rounded-xl text-sm text-white font-medium disabled:opacity-40">
                {creating ? '...' : '+ Create'}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-3">Maximum 5 active keys. Keys start with <code className="text-violet-300">ol-</code></p>
          </div>

          {/* Keys list */}
          <div className="space-y-4 mb-8">
            {keys.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-white/30">No API keys yet. Create one above.</div>
            ) : keys.map(key => (
              <div key={key.id} className={`glass rounded-2xl p-5 ${!key.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-white">{key.key_name}</span>
                      {!key.is_active && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Revoked</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-violet-300 font-mono bg-violet-500/10 px-3 py-1.5 rounded-lg truncate max-w-xs">
                        {revealed[key.id] ? key.api_key : key.api_key.slice(0,12) + '•'.repeat(20)}
                      </code>
                      <button onClick={() => setRevealed(p => ({...p, [key.id]: !p[key.id]}))} className="text-white/30 hover:text-white transition-colors text-xs">{revealed[key.id] ? '🙈' : '👁'}</button>
                      <button onClick={() => copy(key.api_key, key.id)} className="text-white/30 hover:text-violet-400 transition-colors text-xs">{copied === key.id ? '✓ Copied' : '📋'}</button>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-white/30">
                      <span>📊 {key.requests_total} requests</span>
                      <span>🪙 {key.coins_used} coins used</span>
                      <span>📅 {new Date(key.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {key.is_active ? (
                    <button onClick={() => revokeKey(key.id)} className="flex-shrink-0 text-xs text-red-400/60 hover:text-red-400 transition-colors">Revoke</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Docs */}
          <div className="glass-strong rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Reference</h2>
            <div className="space-y-4">
              {[
                { method: 'POST', path: '/v1/chat', desc: 'Send a chat message', body: '{"message": "Hello", "model": "moonshot-v1-8k"}' },
                { method: 'POST', path: '/v1/vision', desc: 'Analyze an image', body: '{"message": "Describe this", "image_base64": "..."}' },
                { method: 'POST', path: '/v1/imagine', desc: 'Generate an image', body: '{"prompt": "A neon city at night"}' },
              ].map((ep) => (
                <div key={ep.path} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded font-mono">{ep.method}</span>
                    <code className="text-xs text-white/60 font-mono">{ep.path}</code>
                    <span className="text-xs text-white/30">— {ep.desc}</span>
                  </div>
                  <pre className="text-xs text-white/40 font-mono bg-black/20 p-3 rounded-lg overflow-x-auto">{`curl https://api.optilogix.ai${ep.path} \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${ep.body}'`}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
