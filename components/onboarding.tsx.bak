'use client'

import { useState } from 'react'
import { useNasabStore } from '@/lib/store'
import { NasabLogo } from './nasab-logo'
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const addMember = useNasabStore((state) => state.addMember)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Nama lengkap tidak boleh kosong'
    } else if (name.length > 100) {
      newErrors.name = 'Nama terlalu panjang (maksimal 100 karakter)'
    }

    if (!gender) {
      newErrors.gender = 'Jenis kelamin harus dipilih'
    }

    if (birthYear) {
      const year = parseInt(birthYear)
      if (isNaN(year)) {
        newErrors.birthYear = 'Tahun lahir harus berupa angka'
      } else if (year < 1900 || year > new Date().getFullYear()) {
        newErrors.birthYear = `Tahun lahir harus antara 1900 - ${new Date().getFullYear()}`
      }
    }

    if (isDeceased && deathYear) {
      const year = parseInt(deathYear)
      if (isNaN(year)) {
        newErrors.deathYear = 'Tahun wafat harus berupa angka'
      } else if (year < 1900 || year > new Date().getFullYear()) {
        newErrors.deathYear = `Tahun wafat harus antara 1900 - ${new Date().getFullYear()}`
      } else if (birthYear && parseInt(birthYear) > year) {
        newErrors.deathYear = 'Tahun wafat tidak boleh lebih awal dari tahun lahir'
      }
    } else if (isDeceased && !deathYear) {
      newErrors.deathYear = 'Tahun wafat harus diisi jika sudah meninggal'
    }

    if (domicile && domicile.length > 100) {
      newErrors.domicile = 'Domisili terlalu panjang (maksimal 100 karakter)'
    }

    if (notes && notes.length > 500) {
      newErrors.notes = 'Catatan terlalu panjang (maksimal 500 karakter)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) return
    
    setIsSubmitting(true)
    
    addMember({
      name: name.trim(),
      nickname: nickname.trim() || null,
      gender: gender!,
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

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mt-12 text-center">
            <NasabLogo size="md" showText textSize="md" />
            <p className="text-[10px] text-muted-foreground mt-1">Kenali Akar Keluargamu</p>
          </div>

          <div className="text-center">
            <h1 className="font-display font-bold text-[22px] text-foreground mb-1">Assalamu&apos;alaikum!</h1>
            <p className="text-muted-foreground text-sm">Mulai dari kamu dulu.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Lengkap <span className="text-destructive">*</span></label>
              <input
                type="text"
                autoFocus
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(er => ({ ...er, name: '' }))
                }}
                placeholder="cth: Ahmad Fauzi"
                className={`w-full h-11 px-4 text-sm bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60 ${errors.name ? 'border-destructive focus:ring-destructive/30' : 'border-border'}`}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Panggilan</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="cth: Mas Mad"
                className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jenis Kelamin <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setGender('M')
                    if (errors.gender) setErrors(er => ({ ...er, gender: '' }))
                  }}
                  className={`h-11 rounded-lg text-sm font-medium transition-all ${gender === 'M' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:border-primary/50'}`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGender('F')
                    if (errors.gender) setErrors(er => ({ ...err, gender: '' }))
                  }}
                  className={`h-11 rounded-lg text-sm font-medium transition-all ${gender === 'F' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:border-primary/50'}`}
                >
                  Perempuan
                </button>
              </div>
              {errors.gender && <p className="text-xs text-destructive mt-1">{errors.gender}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun Lahir</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => {
                    setBirthYear(e.target.value)
                    if (errors.birthYear) setErrors(er => ({ ...er, birthYear: '' }))
                  }}
                  placeholder="cth: 1990"
                  className={`w-full h-11 px-4 text-sm bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60 ${errors.birthYear ? 'border-destructive focus:ring-destructive/30' : 'border-border'}`}
                />
                {errors.birthYear && <p className="text-xs text-destructive mt-1">{errors.birthYear}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Domisili</label>
                <input
                  type="text"
                  value={domicile}
                  onChange={(e) => {
                    setDomicile(e.target.value)
                    if (errors.domicile) setErrors(er => ({ ...er, domicile: '' }))
                  }}
                  placeholder="cth: Jakarta"
                  className={`w-full h-11 px-4 text-sm bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60 ${errors.domicile ? 'border-destructive focus:ring-destructive/30' : 'border-border'}`}
                />
                {errors.domicile && <p className="text-xs text-destructive mt-1">{errors.domicile}</p>}
              </div>
            </div>

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
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun Wafat <span className="text-destructive">*</span></label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={deathYear}
                    onChange={(e) => {
                      setDeathYear(e.target.value)
                      if (errors.deathYear) setErrors(er => ({ ...er, deathYear: '' }))
                    }}
                    placeholder="cth: 2020"
                    className={`w-full h-10 px-3 text-sm bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60 ${errors.deathYear ? 'border-destructive focus:ring-destructive/30' : 'border-border'}`}
                  />
                  {errors.deathYear && <p className="text-xs text-destructive mt-1">{errors.deathYear}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  if (errors.notes) setErrors(er => ({ ...er, notes: '' }))
                }}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                className={`w-full px-4 py-2.5 text-sm bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/60 resize-none ${errors.notes ? 'border-destructive focus:ring-destructive/30' : 'border-border'}`}
              />
              {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary text-primary-foreground font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            {isSubmitting ? 'Memulai...' : 'Mulai'}
          </button>
        </form>
      </div>
    </div>
  )
}
