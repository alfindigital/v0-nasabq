'use client'

import { useState } from 'react'
import { useNasabStore } from '@/lib/store'
import type { Gender } from '@/lib/types'
import { Moon } from 'lucide-react'

interface OnboardingProps {
  onComplete: (name: string) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [birthYear, setBirthYear] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const addMember = useNasabStore((state) => state.addMember)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gender || isSubmitting) return
    
    setIsSubmitting(true)
    
    addMember({
      name: name.trim(),
      nickname: null,
      gender,
      birthYear: birthYear ? parseInt(birthYear) : null,
      birthPlace: null,
      isDeceased: false,
      deathYear: null,
      deathPlace: null,
      address: null,
      notes: null,
      isSelf: true,
    })
    
    onComplete(name.trim())
  }

  const isValid = name.trim() && gender

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto">
              <Moon className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-[22px] text-foreground mb-2">
            Assalamu&apos;alaikum!
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Mulai dari kamu dulu.
          </p>

          {/* Form */}
          <div className="space-y-5 text-left">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                autoFocus
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Ahmad Fauzi"
                className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('M')}
                  className={`h-11 rounded-lg text-sm font-medium transition-all ${
                    gender === 'M'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`h-11 rounded-lg text-sm font-medium transition-all ${
                    gender === 'F'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>

            {/* Birth Year */}
            <div>
              <label htmlFor="birthYear" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Tahun Lahir <span className="text-muted-foreground/60">(opsional)</span>
              </label>
              <input
                id="birthYear"
                type="number"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="cth: 1990"
                className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full h-12 mt-8 bg-primary text-primary-foreground font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            {isSubmitting ? 'Memulai...' : 'Mulai'}
          </button>
        </form>

        {/* Branding */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2">
            {/* NasabQ Logo */}
            <svg 
              viewBox="0 0 24 24" 
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="6" x2="12" y2="18" />
              <line x1="12" y1="6" x2="6" y2="3" />
              <line x1="12" y1="6" x2="18" y2="3" />
              <line x1="12" y1="18" x2="7" y2="21" />
              <line x1="12" y1="18" x2="17" y2="21" />
            </svg>
            <h2 className="font-display font-extrabold text-xl tracking-[2px] text-primary">NASABQ</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Kenali Akar Keluargamu</p>
        </div>
      </div>
    </div>
  )
}
