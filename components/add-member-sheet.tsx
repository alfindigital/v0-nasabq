'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import type { Gender } from '@/lib/types'

interface AddMemberSheetProps {
  open: boolean
  onClose: () => void
  context?: {
    targetId?: number
    relationshipType?: 'child' | 'parent' | 'spouse'
  } | null
  onAdded: (name: string) => void
}

export function AddMemberSheet({ open, onClose, context, onAdded }: AddMemberSheetProps) {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [birthYear, setBirthYear] = useState('')
  const [isDeceased, setIsDeceased] = useState(false)
  const [deathYear, setDeathYear] = useState('')
  const [deathPlace, setDeathPlace] = useState('')
  const [domicile, setDomicile] = useState('')
  const [notes, setNotes] = useState('')
  const [linkTo, setLinkTo] = useState<number | null>(null)
  const [linkType, setLinkType] = useState<'child' | 'parent' | 'spouse' | null>(null)
  const [showLinkDropdown, setShowLinkDropdown] = useState(false)
  const [linkSearch, setLinkSearch] = useState('')
  
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { members, addMember, addRelationship, getParents } = useNasabStore()

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      setName('')
      setNickname('')
      setGender(null)
      setBirthYear('')
      setIsDeceased(false)
      setDeathYear('')
      setDeathPlace('')
      setDomicile('')
      setNotes('')
      setLinkSearch('')
      setShowLinkDropdown(false)
      
      // Pre-fill from context
      if (context?.targetId) {
        setLinkTo(context.targetId)
        setLinkType(context.relationshipType || null)
      } else {
        setLinkTo(null)
        setLinkType(null)
      }
      
      // Focus name input
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [open, context])

  const targetMember = linkTo ? members.find(m => m.id === linkTo) : null
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(linkSearch.toLowerCase()) ||
    m.nickname?.toLowerCase().includes(linkSearch.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gender) return

    const newId = addMember({
      name: name.trim(),
      nickname: nickname.trim() || null,
      gender,
      birthYear: birthYear ? parseInt(birthYear) : null,
      birthPlace: null,
      isDeceased,
      deathYear: deathYear ? parseInt(deathYear) : null,
      deathPlace: deathPlace.trim() || null,
      address: domicile.trim() || null,
      notes: notes.trim() || null,
      isSelf: false,
    })

    // Add relationship if specified
    if (linkTo && linkType) {
      if (linkType === 'child') {
        // New member is child of target (target is parent)
        addRelationship(newId, linkTo, 'parent')
      } else if (linkType === 'parent') {
        // New member is parent of target (target is child)
        addRelationship(newId, linkTo, 'child')
      } else if (linkType === 'spouse') {
        addRelationship(newId, linkTo, 'spouse')
      }
    }

    onAdded(name.trim())
  }

  const isValid = name.trim() && gender

  const getRelationshipLabel = () => {
    if (!targetMember || !linkType) return ''
    const targetName = targetMember.nickname || targetMember.name.split(' ')[0]
    switch (linkType) {
      case 'child': return `adalah anak dari ${targetName}`
      case 'parent': return `adalah orang tua dari ${targetName}`
      case 'spouse': return `adalah pasangan dari ${targetName}`
      default: return ''
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[20px] sheet-up max-h-[90vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-display font-semibold text-[17px]">Tambah Anggota</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Pre-filled relationship context */}
          {targetMember && linkType && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary font-medium">
                Hubungkan dengan: <span className="font-semibold">{targetMember.name}</span>
              </p>
              <p className="text-xs text-primary/70 mt-0.5">
                {name || '[Nama baru]'} {getRelationshipLabel()}
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nama Lengkap <span className="text-destructive">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Ahmad Fauzi"
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nama Panggilan <span className="text-muted-foreground/60">(opsional)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="cth: Mas Mad"
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
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
                    : 'bg-background border border-border hover:border-primary/50'
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
                    : 'bg-background border border-border hover:border-primary/50'
                }`}
              >
                Perempuan
              </button>
            </div>
          </div>

          {/* Birth year */}
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
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
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
              <div className="mt-3 pl-8 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Tahun Wafat
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={deathYear}
                    onChange={(e) => setDeathYear(e.target.value)}
                    placeholder="cth: 2020"
                    className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Tempat Wafat
                  </label>
                  <input
                    type="text"
                    value={deathPlace}
                    onChange={(e) => setDeathPlace(e.target.value)}
                    placeholder="cth: Jakarta"
                    className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Domicile */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Domisili
            </label>
            <input
              type="text"
              value={domicile}
              onChange={(e) => setDomicile(e.target.value)}
              placeholder="cth: Jakarta Selatan"
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Catatan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pekerjaan, info tambahan..."
              rows={2}
              className="w-full px-4 py-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Link to existing member (only if no context) */}
          {!context?.targetId && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Hubungkan dengan
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                  className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg flex items-center justify-between text-left"
                >
                  <span className={targetMember ? 'text-foreground' : 'text-muted-foreground'}>
                    {targetMember?.name || 'Pilih anggota...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>

                {showLinkDropdown && (
                  <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={linkSearch}
                          onChange={(e) => setLinkSearch(e.target.value)}
                          placeholder="Cari..."
                          className="w-full h-8 pl-8 pr-3 text-sm bg-background border border-border rounded focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setLinkTo(null)
                          setLinkType(null)
                          setShowLinkDropdown(false)
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted"
                      >
                        Tidak ada
                      </button>
                      {filteredMembers.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setLinkTo(m.id)
                            setShowLinkDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                        >
                          <span>{m.name}</span>
                          {m.isSelf && (
                            <span className="px-1 py-0.5 text-[9px] font-semibold bg-gold/20 text-gold rounded">
                              Kamu
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Relationship type - simplified to 3 options */}
              {linkTo && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Jenis Hubungan:</p>
                  {(['child', 'parent', 'spouse'] as const).map(type => {
                    const labels = {
                      child: `Anak`,
                      parent: `Orang Tua`,
                      spouse: `Pasangan`,
                    }
                    const descriptions = {
                      child: `${name || '[Nama baru]'} adalah anak dari ${targetMember?.name}`,
                      parent: `${name || '[Nama baru]'} adalah orang tua dari ${targetMember?.name}`,
                      spouse: `${name || '[Nama baru]'} adalah pasangan dari ${targetMember?.name}`,
                    }
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLinkType(type)}
                        className={`w-full p-3 text-sm text-left rounded-lg border transition-colors ${
                          linkType === type
                            ? 'bg-primary/10 border-primary text-foreground'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        <span className="font-medium">{labels[type]}</span>
                        <p className="text-xs mt-0.5 opacity-70">{descriptions[type]}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            Simpan
          </button>
        </form>
      </div>
    </div>
  )
}
