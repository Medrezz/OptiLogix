'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SplashPage() {
  const router = useRouter()
  const [phase, setPhase] = useState(0) // 0=black, 1=logo, 2=text, 3=tagline, 4=fade-out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 900)
    const t3 = setTimeout(() => setPhase(3), 1500)
    const t4 = setTimeout(() => setPhase(4), 2800)
    const t5 = setTimeout(() => router.push('/home'), 3500)
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout)
  }, [router])

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center bg-[#03030a] transition-opacity duration-700 ${phase === 4 ? 'opacity-0' : 'opacity-100'}`}>
      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg opacity-50" />

      {/* Glow orb */}
      <div className="absolute w-[600px] h-[600px] rounded-full"
        style={{background:'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)'}} />

      {/* Logo */}
      <div className={`relative transition-all duration-700 ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl animate-pulse-glow" style={{background:'rgba(124,58,237,0.15)'}} />
          <Image src="/logo.png" alt="OptiLogix" fill className="object-contain rounded-3xl p-1" priority />
        </div>
      </div>

      {/* Brand name */}
      <div className={`transition-all duration-700 delay-100 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          optilogix<span className="grad-text">X</span>
        </h1>
      </div>

      {/* Tagline */}
      <div className={`mt-3 transition-all duration-700 delay-200 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="text-sm text-white/40 tracking-widest uppercase">Multimodal AI Workspace</p>
      </div>

      {/* Loading bar */}
      <div className={`absolute bottom-12 w-48 h-0.5 bg-white/5 rounded-full overflow-hidden transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
          style={{width: phase >= 3 ? '100%' : phase >= 2 ? '60%' : '20%', transition:'width 1.2s ease'}} />
      </div>
    </div>
  )
}
