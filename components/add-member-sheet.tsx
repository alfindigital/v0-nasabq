'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, User, Plus, ChevronRight, ChevronDown } from 'lucide-react'
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
  const [showNewForm, setShowNewForm] = useState(false)
  const [search, setSearch] = useState('')
  
  // Form states
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [birthYear, setBirthYear] = useState('')
  const [isDeceased, setIsDeceased] = useState(false)
  const [deathYear, setDeathYear] = useState('')
  const [domicile, setDomicile] = useState('')
  const [notes, setNotes] = useState('')
  const [linkTo, setLinkTo] = useState<number | null>(null)
  const [linkType, setLinkType] = useState<'child' | 'parent' | 'spouse' | null>(null)
  const [showLinkDropdown, setShowLinkDropdown] = useState(false)
  const [linkSearch, setLinkSearch] = useState('')
  
  const { members, addMember, addRelationship, getMember } = useNasabStore()

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      setName('')
      setNickname('')
      setGender(null)
      setBirthYear('')
      setIsDeceased(false)
      setDeathYear('')
      setDomicile('')
      setNotes('')
      setSearch('')
      setLinkSearch('')
      setShowLinkDropdown(false)
      
      if (context?.targetId) {
        setLinkTo(context.targetId)
        setLinkType(context.relationshipType || null)
        // Show list view if we have context and other members
        setShowNewForm(members.length <= 1)
      } else {
        setLinkTo(null)
        setLinkType(null)
        setShowNewForm(true)
      }
    }
  }, [open, context, members.length])

  const targetMember = linkTo ? members.find(m => m.id === linkTo) : null
  
  // Filter existing members for selection
  const existingMembers = members.filter(m => {
    if (context?.targetId && m.id === context.targetId) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.nickname?.toLowerCase().includes(q)
    }
    return true
  })
  
  const filteredLinkMembers = members.filter(m => 
    m.name.toLowerCase().includes(linkSearch.toLowerCase()) ||
    m.nickname?.toLowerCase().includes(linkSearch.toLowerCase())
  )

  // Handle selecting existing member
  const handleSelectExisting = (memberId: number) => {
    if (!context?.targetId || !context.relationshipType) return
    
    const selected = getMember(memberId)
    if (!selected) return

    if (context.relationshipType === 'child') {
      addRelationship(memberId, context.targetId, 'parent')
    } else if (context.relationshipType === 'parent') {
      addRelationship(memberId, context.targetId, 'child')
    } else if (context.relationshipType === 'spouse') {
      addRelationship(memberId, context.targetId, 'spouse')
    }

    onAdded(selected.name)
  }

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
      deathPlace: null,
      address: domicile.trim() || null,
      notes: notes.trim() || null,
      isSelf: false,
    })

    if (linkTo && linkType) {
      if (linkType === 'child') {
        addRelationship(newId, linkTo, 'parent')
      } else if (linkType === 'parent') {
        addRelationship(newId, linkTo, 'child')
      } else if (linkType === 'spouse') {
        addRelationship(newId, linkTo, 'spouse')
      }
    }

    onAdded(name.trim())
  }

  const isValid = name.trim() && gender

  const getContextLabel = () => {
    if (!targetMember || !context?.relationshipType) return 'Tambah Anggota'
    switch (context.relationshipType) {
      case 'child': return `Tambah Anak dari ${targetMember.nickname || targetMember.name.split(' ')[0]}`
      case 'parent': return `Tambah Orang Tua dari ${targetMember.nickname || targetMember.name.split(' ')[0]}`
      case 'spouse': return `Tambah Pasangan dari ${targetMember.nickname || targetMember.name.split(' ')[0]}`
      default: return 'Tambah Anggota'
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[20px] sheet-up max-h-[90vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-border">
          <div>
            <h2 className="font-display font-semibold text-[17px]">{getContextLabel()}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!showNewForm && context ? (
            // Member selection list
            <div className="p-5 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama..."
                  className="w-full h-10 pl-10 pr-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Member list */}
              {existingMembers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    {search ? 'Tidak ditemukan' : 'Belum ada anggota lain'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {existingMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectExisting(member.id)}
                      className="w-full p-3 bg-background border border-border rounded-xl flex items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        member.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                      } ${member.isDeceased ? 'grayscale opacity-60' : ''}`}>
                        <User className={`w-4 h-4 ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.gender === 'M' ? 'L' : 'P'}
                          {member.birthYear && ` · ${member.birthYear}`}
                          {member.isSelf && ' · Kamu'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {/* Create new button at bottom */}
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-3 hover:bg-primary/20 transition-colors mt-4"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">Buat Anggota Baru</span>
              </button>
            </div>
          ) : (
            // New member form
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Back button if came from list */}
              {context && members.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  ← Kembali ke daftar
                </button>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Nama Lengkap <span className="text-destructive">*</span>
                </label>
                <input
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
                  Nama Panggilan
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

              {/* Birth year & Domicile */}
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
                    className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
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
                    className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
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
                      className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Link to member (when no context) */}
              {!context?.targetId && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Hubungkan dengan
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                      className="w-full h-11 px-4 text-sm bg-background border border-border rounded-lg flex items-center justify-between"
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
                        <div className="max-h-36 overflow-y-auto">
                          {targetMember && (
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
                          )}
                          {filteredLinkMembers.map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setLinkTo(m.id)
                                setShowLinkDropdown(false)
                                setLinkSearch('')
                              }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                            >
                              <span className="truncate">{m.name}</span>
                              {m.isSelf && (
                                <span className="px-1 py-0.5 text-[9px] font-semibold bg-gold/20 text-gold rounded flex-shrink-0">
                                  Kamu
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Relationship type selector */}
                  {linkTo && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Jenis Hubungan:</p>
                      {[
                        { type: 'child' as const, label: `${name || 'Orang ini'} anak dari ${targetMember?.nickname || targetMember?.name.split(' ')[0]}` },
                        { type: 'parent' as const, label: `${name || 'Orang ini'} orang tua dari ${targetMember?.nickname || targetMember?.name.split(' ')[0]}` },
                        { type: 'spouse' as const, label: `${name || 'Orang ini'} pasangan dari ${targetMember?.nickname || targetMember?.name.split(' ')[0]}` },
                      ].map(opt => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setLinkType(opt.type)}
                          className={`w-full p-3 text-sm text-left rounded-lg border transition-all ${
                            linkType === opt.type
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

              {/* Submit buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
