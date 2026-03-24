'use client'

import { useState, useEffect } from 'react'
import { X, User, MapPin, Calendar, FileText, Pencil, Trash2, Plus, ChevronRight } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { getRelationshipLabel } from '@/lib/relationship'
import type { Member, Gender } from '@/lib/types'

interface MemberDetailSheetProps {
  open: boolean
  onClose: () => void
  member: Member | null
  onViewMember: (member: Member) => void
  onAddRelative: (context: { targetId: number; relationshipType: 'child' | 'parent' | 'spouse' | 'sibling' }) => void
  showToast: (message: string) => void
}

export function MemberDetailSheet({ 
  open, 
  onClose, 
  member, 
  onViewMember,
  onAddRelative,
  showToast 
}: MemberDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Member>>({})
  
  const { 
    members, 
    updateMember, 
    deleteMember, 
    getParents, 
    getChildren, 
    getSpouses, 
    getSiblings,
    removeRelationship
  } = useNasabStore()

  // Reset state when opening
  useEffect(() => {
    if (open && member) {
      setIsEditing(false)
      setEditData({
        name: member.name,
        nickname: member.nickname,
        gender: member.gender,
        birthYear: member.birthYear,
        birthPlace: member.birthPlace,
        isDeceased: member.isDeceased,
        deathYear: member.deathYear,
        deathPlace: member.deathPlace,
        address: member.address,
        notes: member.notes,
      })
    }
  }, [open, member])

  if (!open || !member) return null

  const parents = getParents(member.id)
  const children = getChildren(member.id)
  const spouses = getSpouses(member.id)
  const siblings = getSiblings(member.id)
  const self = members.find(m => m.isSelf)

  // Get extended family through relationships
  const getInLaws = () => {
    const inLaws: { member: Member; label: string }[] = []
    
    // Spouse's parents (mertua)
    spouses.forEach(spouse => {
      getParents(spouse.id).forEach(p => {
        if (!inLaws.some(i => i.member.id === p.id)) {
          inLaws.push({ 
            member: p, 
            label: p.gender === 'M' ? 'Ayah mertua' : 'Ibu mertua' 
          })
        }
      })
    })
    
    // Spouse's siblings (ipar)
    spouses.forEach(spouse => {
      getSiblings(spouse.id).forEach(s => {
        if (!inLaws.some(i => i.member.id === s.id)) {
          inLaws.push({ 
            member: s, 
            label: s.gender === 'M' ? 'Ipar laki-laki' : 'Ipar perempuan' 
          })
        }
      })
    })

    // Sibling's spouses (also ipar)
    siblings.forEach(sib => {
      getSpouses(sib.id).forEach(s => {
        if (!inLaws.some(i => i.member.id === s.id)) {
          inLaws.push({ 
            member: s, 
            label: s.gender === 'M' ? 'Ipar laki-laki' : 'Ipar perempuan' 
          })
        }
      })
    })

    return inLaws
  }

  const inLaws = getInLaws()

  const handleSaveEdit = () => {
    if (!editData.name?.trim()) return
    
    updateMember(member.id, {
      name: editData.name.trim(),
      nickname: editData.nickname?.trim() || null,
      gender: editData.gender,
      birthYear: editData.birthYear,
      birthPlace: editData.birthPlace?.trim() || null,
      isDeceased: editData.isDeceased,
      deathYear: editData.deathYear,
      deathPlace: editData.deathPlace?.trim() || null,
      address: editData.address?.trim() || null,
      notes: editData.notes?.trim() || null,
    })
    
    setIsEditing(false)
    showToast('Perubahan disimpan')
  }

  const handleDelete = () => {
    if (member.isSelf) {
      showToast('Tidak bisa menghapus dirimu sendiri')
      return
    }
    
    if (confirm(`Hapus ${member.name}? Semua hubungan dengan anggota ini juga akan dihapus.`)) {
      deleteMember(member.id)
      showToast(`${member.name} dihapus`)
      onClose()
    }
  }

  const handleRemoveRelationship = (targetId: number, targetName: string) => {
    if (confirm(`Hapus hubungan dengan ${targetName}?`)) {
      removeRelationship(member.id, targetId)
      showToast('Hubungan dihapus')
    }
  }

  const RelatedMemberRow = ({ 
    relatedMember, 
    label, 
    canRemove = false 
  }: { 
    relatedMember: Member
    label: string
    canRemove?: boolean 
  }) => (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={() => {
          onClose()
          setTimeout(() => onViewMember(relatedMember), 100)
        }}
        className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className={`w-[26px] h-[26px] rounded-full bg-primary/10 flex items-center justify-center ${relatedMember.isDeceased ? 'grayscale opacity-70' : ''}`}>
          <User className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{relatedMember.name}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
      {canRemove && (
        <button
          onClick={() => handleRemoveRelationship(relatedMember.id, relatedMember.name)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )

  const AddRelativeButton = ({ 
    label, 
    type 
  }: { 
    label: string
    type: 'child' | 'parent' | 'spouse' | 'sibling' 
  }) => (
    <button
      onClick={() => {
        onClose()
        setTimeout(() => onAddRelative({ targetId: member.id, relationshipType: type }), 100)
      }}
      className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors py-1"
    >
      <Plus className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )

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
          <h2 className="font-display font-semibold text-[17px]">
            {isEditing ? 'Edit Anggota' : 'Detail Anggota'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isEditing ? (
            // Edit form
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData(d => ({ ...d, name: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Panggilan</label>
                <input
                  type="text"
                  value={editData.nickname || ''}
                  onChange={(e) => setEditData(d => ({ ...d, nickname: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['M', 'F'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditData(d => ({ ...d, gender: g }))}
                      className={`h-10 rounded-lg text-sm font-medium transition-all ${
                        editData.gender === g ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                      }`}
                    >
                      {g === 'M' ? 'Laki-laki' : 'Perempuan'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun Lahir</label>
                  <input
                    type="number"
                    value={editData.birthYear || ''}
                    onChange={(e) => setEditData(d => ({ ...d, birthYear: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tempat Lahir</label>
                  <input
                    type="text"
                    value={editData.birthPlace || ''}
                    onChange={(e) => setEditData(d => ({ ...d, birthPlace: e.target.value }))}
                    className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setEditData(d => ({ ...d, isDeceased: !d.isDeceased }))}
                  className="flex items-center gap-2"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${editData.isDeceased ? 'bg-primary border-primary' : 'border-border'}`}>
                    {editData.isDeceased && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Sudah meninggal</span>
                </button>
                {editData.isDeceased && (
                  <div className="mt-3 pl-7 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Tahun Wafat</label>
                      <input
                        type="number"
                        value={editData.deathYear || ''}
                        onChange={(e) => setEditData(d => ({ ...d, deathYear: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Tempat Wafat</label>
                      <input
                        type="text"
                        value={editData.deathPlace || ''}
                        onChange={(e) => setEditData(d => ({ ...d, deathPlace: e.target.value }))}
                        className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Alamat</label>
                <input
                  type="text"
                  value={editData.address || ''}
                  onChange={(e) => setEditData(d => ({ ...d, address: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData(d => ({ ...d, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          ) : (
            // View mode
            <div className="space-y-6">
              {/* Profile header */}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${member.isDeceased ? 'grayscale opacity-70' : ''}`}>
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-[17px]">{member.name}</h3>
                    {member.isSelf && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gold/20 text-gold rounded">
                        Kamu
                      </span>
                    )}
                    {member.isDeceased && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                        {member.gender === 'M' ? 'Almarhum' : 'Almarhumah'}
                      </span>
                    )}
                  </div>
                  {member.nickname && (
                    <p className="text-sm text-muted-foreground">&quot;{member.nickname}&quot;</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {member.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                    {member.birthYear && ` · Lahir ${member.birthYear}`}
                    {member.birthPlace && ` di ${member.birthPlace}`}
                  </p>
                  {member.isDeceased && (member.deathYear || member.deathPlace) && (
                    <p className="text-xs text-muted-foreground">
                      Wafat {member.deathYear}{member.deathPlace && ` di ${member.deathPlace}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Info details */}
              {(member.address || member.notes) && (
                <div className="space-y-3">
                  {member.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{member.address}</p>
                    </div>
                  )}
                  {member.notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-muted-foreground">{member.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Family relationships */}
              <div className="space-y-4">
                {/* Parents */}
                {(parents.length > 0 || parents.length < 2) && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Orang Tua</h4>
                    {parents.map(p => (
                      <RelatedMemberRow 
                        key={p.id} 
                        relatedMember={p} 
                        label={p.gender === 'M' ? 'Ayah' : 'Ibu'}
                        canRemove
                      />
                    ))}
                    {parents.length < 2 && (
                      <div className="mt-1">
                        {!parents.some(p => p.gender === 'M') && (
                          <AddRelativeButton label="+ Tambah Ayah" type="parent" />
                        )}
                        {!parents.some(p => p.gender === 'F') && (
                          <AddRelativeButton label="+ Tambah Ibu" type="parent" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Spouse */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pasangan</h4>
                  {spouses.map(s => (
                    <RelatedMemberRow 
                      key={s.id} 
                      relatedMember={s} 
                      label={s.gender === 'M' ? 'Suami' : 'Istri'}
                      canRemove
                    />
                  ))}
                  {spouses.length === 0 && (
                    <AddRelativeButton label="+ Tambah Pasangan" type="spouse" />
                  )}
                </div>

                {/* Children */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Anak</h4>
                  {children.map(c => (
                    <RelatedMemberRow 
                      key={c.id} 
                      relatedMember={c} 
                      label={c.gender === 'M' ? 'Anak laki-laki' : 'Anak perempuan'}
                      canRemove
                    />
                  ))}
                  <AddRelativeButton label="+ Tambah Anak" type="child" />
                </div>

                {/* Siblings */}
                {siblings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Saudara</h4>
                    {siblings.map(s => (
                      <RelatedMemberRow 
                        key={s.id} 
                        relatedMember={s} 
                        label={s.gender === 'M' ? 'Saudara laki-laki' : 'Saudara perempuan'}
                      />
                    ))}
                  </div>
                )}

                {/* In-laws */}
                {inLaws.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mertua & Ipar</h4>
                    {inLaws.map(({ member: m, label }) => (
                      <RelatedMemberRow 
                        key={m.id} 
                        relatedMember={m} 
                        label={label}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-border flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 h-11 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 h-11 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
              >
                Simpan
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 h-11 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              {!member.isSelf && (
                <button
                  onClick={handleDelete}
                  className="h-11 px-4 text-sm font-medium border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
