'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { NasabLogo } from './nasab-logo'
import type { Gender } from '@/lib/types'

interface OnboardingPopupProps {
  open: boolean
  onComplete: (name: string) => void
}

export function OnboardingPopup({ open, onComplete }: OnboardingPopupProps) {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [birthYear, setBirthYear] = useState('')
  const [domicile, setDomicile] = useState('')
  const [isDeceased, setIsDeceased] = useState(false)
  const [deathYear, setDeathYear] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { addMember } = useNasabStore()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Nama lengkap harus diisi'
    }

    if (!gender) {
      newErrors.gender = 'Jenis kelamin harus dipilih'
    }

    if (birthYear) {
      const year = parseInt(birthYear)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        newErrors.birthYear = 'Tahun lahir tidak valid'
      }
    }

    if (isDeceased && deathYear) {
      const year = parseInt(deathYear)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        newErrors.deathYear = 'Tahun wafat tidak valid'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

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

    onComplete(nickname.trim() || name.trim().split(' ')[0])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-border">
          <NasabLogo size="md" showText textSize="md" />
          <p className="text-xs text-muted-foreground mt-1">Kenali Akar Keluargamu</p>
          <h2 className="font-display font-bold text-lg mt-4">Assalamu'alaikum!</h2>
          <p className="text-sm text-muted-foreground">Mulai dari kamu dulu</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nama Lengkap <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors(er => ({ ...er, name: '' }))
              }}
              placeholder="cth: Ahmad Fauzi"
              className={`w-full h-11 px-4 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                errors.name ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Nama Panggilan */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nama Panggilan
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="cth: Aji"
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Jenis Kelamin <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setGender('M')
                  if (errors.gender) setErrors(er => ({ ...er, gender: '' }))
                }}
                className={`h-11 rounded-lg text-sm font-medium transition-all ${
                  gender === 'M'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border hover:border-primary/50'
                }`}
              >
                Laki-laki
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender('F')
                  if (errors.gender) setErrors(er => ({ ...er, gender: '' }))
                }}
                className={`h-11 rounded-lg text-sm font-medium transition-all ${
                  gender === 'F'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border hover:border-primary/50'
                }`}
              >
                Perempuan
              </button>
            </div>
            {errors.gender && <p className="text-xs text-destructive mt-1">{errors.gender}</p>}
          </div>

          {/* Tahun Lahir & Domisili */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Tahun Lahir
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value)
                  if (errors.birthYear) setErrors(er => ({ ...er, birthYear: '' }))
                }}
                placeholder="cth: 1990"
                className={`w-full h-11 px-4 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                  errors.birthYear ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors.birthYear && <p className="text-xs text-destructive mt-1">{errors.birthYear}</p>}
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
                className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>

          {/* Meninggal */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDeceased}
                onChange={(e) => setIsDeceased(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm">Sudah meninggal</span>
            </label>
            {isDeceased && (
              <div className="mt-3 pl-6">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Tahun Wafat
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={deathYear}
                  onChange={(e) => setDeathYear(e.target.value)}
                  placeholder="cth: 2020"
                  className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Catatan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
              className="w-full px-4 py-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none"
            />
          </div>

          {/* Privacy Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>Data kamu akan disimpan secara lokal di device ini.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Mulai
          </button>
        </form>
      </div>
    </div>
  )
}
