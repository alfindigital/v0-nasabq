'use client'

import { useState } from 'react'
import { useNasabStore } from '@/lib/store'
import type { Gender } from '@/lib/types'

interface OnboardingProps {
  onComplete: (name: string) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [birthYear, setBirthYear] = useState('')
  const [domicile, setDomicile] = useState('')
  const [isDeceased, setIsDeceased] = useState(false)
  const [deathYear, setDeathYear] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const addMember = useNasabStore((state) => state.addMember)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gender || isSubmitting) return
    
    setIsSubmitting(true)
    
    addMember({
      name: name.trim(),
      nickname: nickname.trim() || null,
      gender,
      birthYear: birthYear ? parseInt(birthYear) : null,
      birthPlace: null,
      isDeceased,
      deathYear: deathYear ? parseInt(deathYear) : null,
      address: domicile.trim() || null,
      notes: notes.trim() || null,
      isSelf: true,
    })
    
    onComplete(name.trim())
  }

  const isValid = name.trim() && gender

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          {/* Branding */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
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
            <p className="text-[10px] text-muted-foreground">Kenali Akar Keluargamu</p>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="font-display font-bold text-[22px] text-foreground mb-1">
              Assalamu&apos;alaikum!
            </h1>
            <p className="text-muted-foreground text-sm">
              Mulai dari kamu dulu.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4 text-left">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                autoFocus
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Ahmad Fauzi"
                className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="cth: Mas Mad"
                className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Jenis Kelamin <span className="text-destructive">*</span>
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

            {/* Birth Year & Domicile */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Tahun Lahir
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="cth: 1990"
                  className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Domisili
                </label>
                <input
                  type="text"
                  value={domicile}
                  onChange={(e) => setDomicile(e.target.value)}
                  placeholder="cth: Jakarta"
                  className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Deceased toggle */}
            <div>
              <button
                type="button"
                onClick={() => setIsDeceased(!isDeceased)}
                className="flex items-center gap-3"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isDeceased ? 'bg-primary border-primary' : 'border-border'}`}>
                  {isDeceased && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">Sudah meninggal?</span>
              </button>

              {isDeceased && (
                <div className="mt-3 pl-8">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Tahun Wafat
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={deathYear}
                    onChange={(e) => setDeathYear(e.target.value)}
                    placeholder="cth: 2020"
                    className="w-full h-10 px-3 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Catatan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                className="w-full px-4 py-2.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full h-12 mt-6 bg-primary text-primary-foreground font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            {isSubmitting ? 'Memulai...' : 'Mulai'}
          </button>
        </form>
      </div>
    </div>
  )
}
