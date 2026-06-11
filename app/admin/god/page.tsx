'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'

type Overview = {
  total_revenue: number
  monthly_revenue: number
  total_users: number
  total_admins: number
  total_api_keys: number
  coins_in_circulation: number
  recent_transactions: { id: number; name: string; phone: string; coins: number; amount_sar: number; status: string; created_at: string }[]
}
type Admin = { id: number; name: string; phone: string; email: string; role: string; is_active: number; created_at: string }

export default function GodAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [promoteId, setPromoteId] = useState('')
  const [promoteRole, setPromoteRole] = useState('admin')
  const [tab, setTab] = useState<'overview'|'admins'|'promote'>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth')
    if (status === 'authenticated' && session?.user?.role !== 'god') router.push('/admin')
  }, [status, session, router])

  const loadData = useCallback(async () => {
    if (!session?.backendToken) return
    const [o, a] = await Promise.all([
      api.admin.godOverview(session.backendToken),
      api.admin.godAdmins(session.backendToken),
    ])
    if (o.success) setOverview(o)
    if (a.success) setAdmins(a.admins)
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  const promoteUser = async () => {
    if (!session?.backendToken || !promoteId) return
    await api.admin.manageUser(session.backendToken, { user_id: parseInt(promoteId), action: 'set_role', role: promoteRole })
    await loadData()
    setPromoteId('')
  }

  if (status === 'loading' || !session) return <div className="h-screen flex items-center justify-center bg-[#03030a]"><div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#03030a] flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-amber-400/10 p-4 flex flex-col" style={{background:'rgba(120,53,15,0.08)'}}>
        <Link href="/home" className="flex items-center gap-2.5 mb-6 px-2">
          <Image src="/logo.png" alt="OptiLogix" width={32} height={32} className="rounded-xl" />
          <div>
            <div className="font-bold text-white text-sm">optilogix<span className="grad-text-gold">X</span></div>
            <div className="text-[10px] text-amber-400 uppercase tracking-widest">God Mode</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1">
          {[
            { href:'/admin/god', icon:'👑', label:'God Overview', active: tab==='overview', onClick:()=>setTab('overview') },
            { href:'/admin/god', icon:'🛡️', label:'Manage Admins', active: tab==='admins', onClick:()=>setTab('admins') },
            { href:'/admin/god', icon:'⬆️', label:'Promote User', active: tab==='promote', onClick:()=>setTab('promote') },
            { href:'/admin', icon:'📊', label:'Admin Panel', active: false, onClick: undefined },
          ].map(n => (
            <Link key={n.label} href={n.href} onClick={n.onClick}
              className={`sidebar-item ${n.active ? 'active' : ''}`} style={n.active ? {background:'rgba(180,83,9,0.2)',borderColor:'rgba(180,83,9,0.4)',color:'#fbbf24'} : {}}>
              <span>{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs text-amber-300">👑</div>
          <div className="flex-1 text-sm text-amber-300">{session.user.name}</div>
          <button onClick={() => signOut({ callbackUrl: '/home' })} className="text-white/30 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">👑</span>
            <h1 className="text-3xl font-bold text-white">God Admin Console</h1>
          </div>
          <p className="text-amber-400/60 mb-8 text-sm">Full platform control. You hold the highest authority.</p>

          {tab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Revenue cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label:'Total Revenue', value:`${Number(overview.total_revenue).toFixed(0)} SAR`, icon:'💰', color:'text-amber-400' },
                  { label:'This Month', value:`${Number(overview.monthly_revenue).toFixed(0)} SAR`, icon:'📅', color:'text-emerald-400' },
                  { label:'Total Users', value: overview.total_users, icon:'👥', color:'text-blue-400' },
                  { label:'Admins', value: overview.total_admins, icon:'🛡️', color:'text-violet-400' },
                  { label:'API Keys', value: overview.total_api_keys, icon:'🔑', color:'text-cyan-400' },
                  { label:'Coins in Circulation', value: overview.coins_in_circulation, icon:'🪙', color:'text-amber-300' },
                ].map(c => (
                  <div key={c.label} className="glass rounded-2xl p-5 border border-amber-400/10">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className={`text-2xl font-bold ${c.color}`}>{String(c.value)}</div>
                    <div className="text-xs text-white/40 mt-1">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent transactions */}
              <div className="glass-strong rounded-3xl p-6 border border-amber-400/10">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {overview.recent_transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-sm text-white/70">{tx.name || tx.phone || `User #${tx.id}`}</div>
                        <div className="text-xs text-white/30">{new Date(tx.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-amber-400">+{tx.coins} 🪙</div>
                        <div className={`text-xs ${tx.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'}`}>{tx.amount_sar} SAR · {tx.status}</div>
                      </div>
                    </div>
                  ))}
                  {overview.recent_transactions.length === 0 && <p className="text-white/30 text-sm text-center py-4">No transactions yet.</p>}
                </div>
              </div>
            </div>
          )}

          {tab === 'admins' && (
            <div className="glass-strong rounded-3xl overflow-hidden border border-amber-400/10">
              <div className="px-6 py-4 bg-amber-400/5">
                <h3 className="text-lg font-semibold text-white">Admin & God Accounts</h3>
              </div>
              <div className="divide-y divide-white/5">
                {admins.map(a => (
                  <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/80">{a.name || '—'}</div>
                      <div className="text-xs text-white/30">{a.phone || a.email || '—'}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${a.role === 'god' ? 'bg-amber-400/20 text-amber-400' : 'bg-violet-400/20 text-violet-400'}`}>{a.role}</span>
                      {a.role !== 'god' && (
                        <button onClick={async () => { if (!session?.backendToken) return; await api.admin.manageUser(session.backendToken, {user_id:a.id,action:'set_role',role:'client'}); loadData() }}
                          className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Demote</button>
                      )}
                    </div>
                  </div>
                ))}
                {admins.length === 0 && <div className="px-6 py-8 text-center text-white/30">No admin accounts found.</div>}
              </div>
            </div>
          )}

          {tab === 'promote' && (
            <div className="max-w-md glass-strong rounded-3xl p-8 border border-amber-400/10">
              <h3 className="text-xl font-semibold text-white mb-2">Promote a User</h3>
              <p className="text-white/40 text-sm mb-6">Enter a user ID to change their role. Only god can promote to god.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/50 mb-2">User ID</label>
                  <input value={promoteId} onChange={e => setPromoteId(e.target.value)} placeholder="e.g. 42"
                    className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30" />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">New Role</label>
                  <select value={promoteRole} onChange={e => setPromoteRole(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white bg-transparent">
                    <option value="client" className="bg-[#1a1a2e]">Client</option>
                    <option value="admin" className="bg-[#1a1a2e]">Admin</option>
                    <option value="god" className="bg-[#1a1a2e]">God</option>
                  </select>
                </div>
                <button onClick={promoteUser} className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                  style={{background:'linear-gradient(135deg,#b45309,#92400e)'}}>
                  Confirm Role Change
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
