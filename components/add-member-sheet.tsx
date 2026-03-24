'use client'

import { useState, useEffect } from 'react'
import { X, Search, User, Plus, ChevronRight, ChevronDown, Trash2 } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import type { Gender } from '@/lib/types'

interface RelationshipLink {
  memberId: number
  type: 'child' | 'parent' | 'spouse'
}

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
  
  // Multiple relationships
  const [relationships, setRelationships] = useState<RelationshipLink[]>([])
  const [showAddRelation, setShowAddRelation] = useState(false)
  const [newRelMemberId, setNewRelMemberId] = useState<number | null>(null)
  const [newRelType, setNewRelType] = useState<'child' | 'parent' | 'spouse' | null>(null)
  const [relSearch, setRelSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
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
      setRelSearch('')
      setShowAddRelation(false)
      setNewRelMemberId(null)
      setNewRelType(null)
      
      if (context?.targetId && context.relationshipType) {
        setRelationships([{ memberId: context.targetId, type: context.relationshipType }])
        // Show list view if we have context and other members
        setShowNewForm(members.length <= 1)
      } else {
        setRelationships([])
        setShowNewForm(true)
      }
    }
  }, [open, context, members.length])

  const targetMember = context?.targetId ? members.find(m => m.id === context.targetId) : null
  
  // Filter existing members for selection
  const existingMembers = members.filter(m => {
    if (context?.targetId && m.id === context.targetId) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.nickname?.toLowerCase().includes(q)
    }
    return true
  })
  
  // Members available for adding relationships (exclude already linked)
  const availableForRelation = members.filter(m => 
    !relationships.some(r => r.memberId === m.id) &&
    (m.name.toLowerCase().includes(relSearch.toLowerCase()) ||
    m.nickname?.toLowerCase().includes(relSearch.toLowerCase()))
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

  const handleAddRelation = () => {
    if (!newRelMemberId || !newRelType) return
    setRelationships([...relationships, { memberId: newRelMemberId, type: newRelType }])
    setNewRelMemberId(null)
    setNewRelType(null)
    setShowAddRelation(false)
    setRelSearch('')
  }

  const handleRemoveRelation = (index: number) => {
    setRelationships(relationships.filter((_, i) => i !== index))
  }

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

    const newId = addMember({
      name: name.trim(),
      nickname: nickname.trim() || null,
      gender,
      birthYear: birthYear ? parseInt(birthYear) : null,
      birthPlace: null,
      isDeceased,
      deathYear: deathYear ? parseInt(deathYear) : null,
      address: domicile.trim() || null,
      notes: notes.trim() || null,
      isSelf: false,
    })

    // Add all relationships
    relationships.forEach(rel => {
      if (rel.type === 'child') {
        addRelationship(newId, rel.memberId, 'parent')
      } else if (rel.type === 'parent') {
        addRelationship(newId, rel.memberId, 'child')
      } else if (rel.type === 'spouse') {
        addRelationship(newId, rel.memberId, 'spouse')
      }
    })

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

  const getRelationLabel = (type: 'child' | 'parent' | 'spouse') => {
    switch (type) {
      case 'child': return 'Anak'
      case 'parent': return 'Orang Tua'
      case 'spouse': return 'Pasangan'
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
                        member.isDeceased 
                          ? 'bg-muted-foreground/20' 
                          : member.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                      }`}>
                        <User className={`w-4 h-4 ${
                          member.isDeceased 
                            ? 'text-muted-foreground' 
                            : member.gender === 'M' ? 'text-primary' : 'text-female-accent'
                        }`} />
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
                    onChange={(e) => {
                      setBirthYear(e.target.value)
                      if (errors.birthYear) setErrors(er => ({ ...er, birthYear: '' }))
                    }}
                    placeholder="cth: 1990"
                    className={`w-full h-11 px-4 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
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
              </div>

              {/* Relationships */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Hubungkan dengan
                </label>
                
                {/* Existing relationships */}
                {relationships.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {relationships.map((rel, idx) => {
                      const member = getMember(rel.memberId)
                      if (!member) return null
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.nickname || member.name}</p>
                            <p className="text-xs text-muted-foreground">{getRelationLabel(rel.type)}</p>
                          </div>
                          {!(context?.targetId === rel.memberId) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRelation(idx)}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-background"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add relationship UI */}
                {!showAddRelation ? (
                  <button
                    type="button"
                    onClick={() => setShowAddRelation(true)}
                    className="w-full p-2.5 text-sm text-primary bg-primary/5 border border-dashed border-primary/30 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Hubungan
                  </button>
                ) : (
                  <div className="p-3 bg-muted rounded-lg space-y-3">
                    {/* Member selector */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={relSearch}
                        onChange={(e) => setRelSearch(e.target.value)}
                        placeholder="Cari anggota..."
                        className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    
                    {availableForRelation.length > 0 ? (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {availableForRelation.slice(0, 5).map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setNewRelMemberId(m.id)}
                            className={`w-full p-2 text-sm text-left rounded flex items-center gap-2 transition-colors ${
                              newRelMemberId === m.id ? 'bg-primary/10 text-primary' : 'hover:bg-background'
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate">{m.nickname || m.name}</span>
                            {m.isSelf && <span className="text-[9px] px-1 bg-gold/20 text-gold rounded">Kamu</span>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">Tidak ada anggota tersedia</p>
                    )}

                    {/* Relation type */}
                    {newRelMemberId && (
                      <div className="flex gap-2">
                        {(['child', 'parent', 'spouse'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewRelType(type)}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                              newRelType === type
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border border-border hover:border-primary/30'
                            }`}
                          >
                            {getRelationLabel(type)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddRelation(false)
                          setNewRelMemberId(null)
                          setNewRelType(null)
                          setRelSearch('')
                        }}
                        className="flex-1 py-2 text-xs font-medium bg-background border border-border rounded-lg hover:bg-muted"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleAddRelation}
                        disabled={!newRelMemberId || !newRelType}
                        className="flex-1 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50"
                      >
                        Tambah
                      </button>
                    </div>
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
