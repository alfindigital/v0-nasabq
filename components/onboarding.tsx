'use client'

import { useState } from 'react'
import { useNasabStore } from '@/lib/store'
import { NasabLogo } from './nasab-logo'
import type { Gender } from '@/lib/types'

interface OnboardingProps {
  onComplete: (name: string) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { addMember } = useNasabStore()
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [birthYear, setBirthYear] = useState('')
  const [domicile, setDomicile] = useState('')
  const [isDeceased, setIsDeceased] = useState(false)
  const [deathYear, setDeathYear] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!validateForm()) return

    const newId = addMember({
      name: name.trim(),
      nickname: nickname.trim() || null,
      gender: gender as Gender,
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
          <div className="mt-12 text-center mb-8">
            <NasabLogo size="md" showText textSize="md" />
            <p className="text-[10px] text-muted-foreground mt-1">Kenali Akar Keluargamu</p>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-[22px] text-foreground mb-1">
              Assalamu&apos;alaikum!
            </h1>
            <p className="text-muted-foreground text-sm">
              Mulai dari kamu dulu.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
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
                className={`w-full h-11 px-4 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                  errors.name ? 'border-destructive focus:ring-destructive/30' : 'border-border'
                }`}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
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
                placeholder="cth: Fauzi"
                className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Gender */}
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

            {/* Birth Year and Domicile */}
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
                  className={`w-full h-10 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    errors.birthYear ? 'border-destructive focus:ring-destructive/30' : 'border-border'
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
                  onChange={(e) => {
                    setDomicile(e.target.value)
                    if (errors.domicile) setErrors(er => ({ ...er, domicile: '' }))
                  }}
                  placeholder="cth: Jakarta"
                  className={`w-full h-10 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    errors.domicile ? 'border-destructive focus:ring-destructive/30' : 'border-border'
                  }`}
                />
                {errors.domicile && <p className="text-xs text-destructive mt-1">{errors.domicile}</p>}
              </div>
            </div>

            {/* Deceased Status */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <input
                type="checkbox"
                id="deceased"
                checked={isDeceased}
                onChange={(e) => setIsDeceased(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="deceased" className="text-sm font-medium cursor-pointer flex-1">
                Sudah meninggal
              </label>
            </div>

            {/* Death Year */}
            {isDeceased && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Tahun Wafat <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={deathYear}
                  onChange={(e) => {
                    setDeathYear(e.target.value)
                    if (errors.deathYear) setErrors(er => ({ ...er, deathYear: '' }))
                  }}
                  placeholder="cth: 2020"
                  className={`w-full h-10 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    errors.deathYear ? 'border-destructive focus:ring-destructive/30' : 'border-border'
                  }`}
                />
                {errors.deathYear && <p className="text-xs text-destructive mt-1">{errors.deathYear}</p>}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Catatan
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  if (errors.notes) setErrors(er => ({ ...er, notes: '' }))
                }}
                placeholder="Catatan tambahan..."
                rows={3}
                className={`w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none ${
                  errors.notes ? 'border-destructive focus:ring-destructive/30' : 'border-border'
                }`}
              />
              {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid}
            className="w-full h-12 mt-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Mulai
          </button>

          {/* Footer */}
          <p className="text-center text-[10px] text-muted-foreground mt-6">
            Data kamu akan disimpan secara lokal di device ini.
          </p>
        </form>
      </div>
    </div>
  )
}
