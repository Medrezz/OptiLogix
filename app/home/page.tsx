'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const AuraBackground = dynamic(() => import('@/components/AuraBackground'), { ssr: false })

const FEATURES = [
  { icon: '🧠', title: 'Omniscient Brain', desc: 'Kimi K2 — the most powerful reasoning model. Complex math, code, research, writing. All in one place.' },
  { icon: '👁', title: 'Vision Scanner', desc: 'Upload any image, screenshot, or document. Extract text (OCR), analyze layouts, understand visuals.' },
  { icon: '🎨', title: 'Creative Canvas', desc: 'Type a description, get stunning AI-generated images powered by DALL-E 3 in seconds.' },
  { icon: '🔑', title: 'Developer API', desc: 'Build your own products with our branded API. Full access to all models under your keys.' },
  { icon: '🪙', title: 'Coin-Based Pricing', desc: 'No surprise subscriptions. Buy coins, spend them only when you need. Full transparency.' },
  { icon: '🛡️', title: 'Privacy First', desc: 'Your data stays yours. Built for MENA users with regional compliance in mind.' },
]

const COMPARE = [
  { feature: 'Reasoning AI (Kimi K2)', us: true, gpt: false, gemini: false },
  { feature: 'Image Generation built-in', us: true, gpt: true, gemini: false },
  { feature: 'Vision + OCR', us: true, gpt: true, gemini: true },
  { feature: 'Developer API w/ own brand', us: true, gpt: false, gemini: false },
  { feature: 'Pay-as-you-go coins', us: true, gpt: false, gemini: false },
  { feature: 'MENA-optimized', us: true, gpt: false, gemini: false },
  { feature: 'No forced subscription', us: true, gpt: false, gemini: false },
]

const PRICING = [
  { id:'starter', coins:500,  sar:5,  usd:'1.33', label:'Starter', color:'from-blue-500/20 to-violet-500/20', border:'border-blue-400/20',   popular:false, perks:['500 coins','~250 chat messages','10 image generations','API access'] },
  { id:'pro',     coins:1500, sar:15, usd:'4.00', label:'Pro',     color:'from-violet-500/25 to-purple-500/25', border:'border-violet-400/40', popular:true,  perks:['1,500 coins','~750 chat messages','30 image generations','Priority API','Usage analytics'] },
  { id:'elite',   coins:5000, sar:40, usd:'10.67',label:'Elite',   color:'from-amber-500/20 to-orange-500/20', border:'border-amber-400/20',   popular:false, perks:['5,000 coins','~2,500 chat messages','100 image generations','Priority support','Custom branding'] },
]

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref)
  return (
    <section ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      {children}
    </section>
  )
}

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-[#03030a] noise relative">
      <AuraBackground state="idle" />

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <Link href="/home" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="OptiLogix" width={32} height={32} className="rounded-xl" />
          <span className="font-bold text-white">optilogix<span className="grad-text">X</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#compare" className="hover:text-white transition-colors">Why Us</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#developer" className="hover:text-white transition-colors">Developers</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Sign In</Link>
          <Link href="/auth?tab=register" className="grad-btn px-4 py-2 text-sm text-white rounded-xl font-medium">Get Started Free</Link>
        </div>
        <button className="md:hidden text-white/60" onClick={() => setMobileMenu(!mobileMenu)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="fixed inset-x-0 top-16 z-50 glass-strong border-b border-white/10 p-6 flex flex-col gap-4 md:hidden">
          {['features','compare','pricing','developer'].map(s => (
            <a key={s} href={`#${s}`} onClick={() => setMobileMenu(false)} className="text-white/70 hover:text-white capitalize">{s}</a>
          ))}
          <Link href="/auth" className="grad-btn text-center py-2 rounded-xl text-sm font-medium text-white">Get Started</Link>
        </div>
      )}

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="absolute inset-0 grid-bg" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-violet-300 mb-8 animate-fadeInUp">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Powered by Kimi K2 + DALL-E 3
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fadeInUp" style={{animationDelay:'0.1s',animationFillMode:'both'}}>
            The AI Workspace<br />
            <span className="grad-text">That Thinks Different</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 animate-fadeInUp" style={{animationDelay:'0.2s',animationFillMode:'both'}}>
            One platform for chat, vision analysis, and image generation. Powered by the world's most capable reasoning AI — Moonshot Kimi K2.
            <span className="text-violet-300"> Chat free forever
</span>Images start at 5 SAR.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp" style={{animationDelay:'0.3s',animationFillMode:'both'}}>
            <Link href="/workspace" className="grad-btn px-8 py-4 rounded-2xl text-white font-semibold text-lg flex items-center justify-center gap-2 animate-pulse-glow">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Start for Free
            </Link>
            <Link href="#pricing" className="glass px-8 py-4 rounded-2xl text-white/70 font-medium text-lg hover:text-white hover:border-white/20 transition-all">
              View Pricing →
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fadeInUp" style={{animationDelay:'0.5s',animationFillMode:'both'}}>
            {[['∞', 'Free Chat Messages'], ['3', 'Free Image Generations'], ['500+', 'Coins from 5 SAR'], ['API', 'Developer Access']].map(([v,l]) => (
              <div key={l} className="text-center">
                <div className="text-3xl font-bold grad-text">{v}</div>
                <div className="text-xs text-white/40 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating cards */}
        <div className="absolute left-8 top-1/3 hidden xl:block animate-float" style={{animationDelay:'0s'}}>
          <div className="glass rounded-2xl p-4 w-48">
            <div className="text-xs text-white/40 mb-2">Brain Mode</div>
            <div className="text-sm text-white/70">"Solve this integral for me..."</div>
            <div className="mt-2 text-xs text-violet-300">✓ Answered in 1.2s</div>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 hidden xl:block animate-float" style={{animationDelay:'1.5s'}}>
          <div className="glass rounded-2xl p-4 w-52">
            <div className="text-xs text-white/40 mb-2">Canvas Mode</div>
            <div className="w-full h-20 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
            <div className="mt-2 text-xs text-emerald-300">✓ Image generated</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <Section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-white/40 text-lg">Six powerful capabilities. One seamless workspace.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-6 group" style={{animationDelay:`${i*0.1}s`}}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* COMPARE */}
      <Section id="compare" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why OptiLogix?</h2>
            <p className="text-white/40 text-lg">See how we compare to the alternatives.</p>
          </div>
          <div className="glass-strong rounded-3xl overflow-hidden">
            <div className="grid grid-cols-4 bg-white/5 px-6 py-4 text-sm font-semibold">
              <div className="text-white/40">Feature</div>
              <div className="text-center grad-text">OptiLogix</div>
              <div className="text-center text-white/30">ChatGPT</div>
              <div className="text-center text-white/30">Gemini</div>
            </div>
            {COMPARE.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 px-6 py-4 text-sm ${i%2===0?'bg-white/[0.02]':''}`}>
                <div className="text-white/60">{row.feature}</div>
                <div className="text-center">{row.us ? <span className="text-emerald-400 text-lg">✓</span> : <span className="text-red-400/50">✗</span>}</div>
                <div className="text-center">{row.gpt ? <span className="text-white/40 text-lg">✓</span> : <span className="text-red-400/30">✗</span>}</div>
                <div className="text-center">{row.gemini ? <span className="text-white/40 text-lg">✓</span> : <span className="text-red-400/30">✗</span>}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* PRICING */}
      <Section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple Coin Pricing</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">No subscriptions. No surprises. Buy coins, use them whenever you want. <span className="text-violet-300">Chat is always free.</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((pkg) => (
              <div key={pkg.id} className={`relative glass-strong rounded-3xl p-8 bg-gradient-to-br ${pkg.color} border ${pkg.border} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="grad-btn px-4 py-1 rounded-full text-xs text-white font-bold">Most Popular</div>
                  </div>
                )}
                <div className="text-lg font-bold text-white mb-1">{pkg.label}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">{pkg.sar}</span>
                  <span className="text-white/50 mb-1">SAR</span>
                </div>
                <div className="text-xs text-white/30 mb-6">≈ ${pkg.usd} USD</div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-3xl">🪙</span>
                  <span className="text-2xl font-bold grad-text">{pkg.coins.toLocaleString()}</span>
                  <span className="text-white/40 text-sm">coins</span>
                </div>
                <ul className="space-y-2 mb-8">
                  {pkg.perks.map((p,i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <span className="text-emerald-400 flex-shrink-0">✓</span>{p}
                    </li>
                  ))}
                </ul>
                <Link href="/auth" className={`w-full block text-center py-3 rounded-xl font-semibold text-sm transition-all ${pkg.popular ? 'grad-btn text-white' : 'glass text-white/70 hover:text-white hover:border-white/20'}`}>
                  Get {pkg.label}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-white/30 text-sm mt-8">💬 Text chat is always free — no coins needed.</p>
        </div>
      </Section>

      {/* DEVELOPER */}
      <Section id="developer" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0" style={{background:'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)'}} />
            <div className="relative z-10">
              <div className="text-5xl mb-6">⚡</div>
              <h2 className="text-3xl font-bold text-white mb-4">Built for Developers</h2>
              <p className="text-white/50 mb-8 max-w-xl mx-auto">Generate API keys, integrate OptiLogix into your own products under your brand. Full documentation and SDKs included.</p>
              <div className="glass rounded-2xl p-4 mb-8 text-left max-w-md mx-auto">
                <div className="text-xs text-white/30 mb-2 font-mono">Example Request</div>
                <pre className="text-xs text-violet-300 font-mono overflow-x-auto">{`curl https://api.optilogix.ai/v1/chat \\
  -H "Authorization: Bearer ol-xxx" \\
  -d '{"message": "Hello!"}'`}</pre>
              </div>
              <Link href="/auth" className="grad-btn inline-block px-8 py-3 rounded-xl text-white font-semibold">Get API Access</Link>
            </div>
          </div>
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Think Smarter?</h2>
          <p className="text-white/40 mb-8">Start with unlimited free chat. No credit card needed.</p>
          <Link href="/workspace" className="grad-btn inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-lg animate-pulse-glow">
            Launch Workspace →
          </Link>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={20} height={20} className="rounded-lg" />
            <span>OptiLogix © 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <span>Made by <span className="text-white/50 font-medium">Khaled</span> in <span className="text-violet-400 font-medium">Medrezz Group</span></span>
        </div>
      </footer>
    </div>
  )
}
