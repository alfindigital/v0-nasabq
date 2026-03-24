'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, User } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { getRelationshipLabel } from '@/lib/relationship'
import type { Member } from '@/lib/types'

interface RelationshipExplorerProps {
  onViewMember: (member: Member) => void
}

type Mode = 'who-is' | 'between' | 'map'

export function RelationshipExplorer({ onViewMember }: RelationshipExplorerProps) {
  const [mode, setMode] = useState<Mode>('who-is')
  const [selectedMember1, setSelectedMember1] = useState<number | null>(null)
  const [selectedMember2, setSelectedMember2] = useState<number | null>(null)
  const [showDropdown1, setShowDropdown1] = useState(false)
  const [showDropdown2, setShowDropdown2] = useState(false)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')

  const { members, getParents, getChildren, getSpouses, getSiblings } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Filter members for dropdowns
  const filterMembers = (search: string, excludeId?: number) => {
    return members.filter(m => {
      if (excludeId && m.id === excludeId) return false
      if (mode === 'who-is' && m.isSelf) return false
      const query = search.toLowerCase()
      return m.name.toLowerCase().includes(query) || 
             m.nickname?.toLowerCase().includes(query)
    })
  }

  const filteredMembers1 = filterMembers(search1, mode === 'between' ? selectedMember2 || undefined : undefined)
  const filteredMembers2 = filterMembers(search2, selectedMember1 || undefined)

  const member1 = selectedMember1 ? members.find(m => m.id === selectedMember1) : null
  const member2 = selectedMember2 ? members.find(m => m.id === selectedMember2) : null

  // Calculate relationship result
  const result = useMemo(() => {
    if (mode === 'who-is' && selectedMember1 && self) {
      return getRelationshipLabel(self.id, selectedMember1, members, getParents, getChildren, getSpouses)
    }
    if (mode === 'between' && selectedMember1 && selectedMember2) {
      return getRelationshipLabel(selectedMember2, selectedMember1, members, getParents, getChildren, getSpouses)
    }
    return null
  }, [mode, selectedMember1, selectedMember2, self, members, getParents, getChildren, getSpouses])

  // Family map data
  const familyMap = useMemo(() => {
    if (mode !== 'map' || !self) return null

    const categories: { label: string; members: { member: Member; relation: string }[] }[] = []

    // Direct relationships
    const parents = getParents(self.id)
    if (parents.length > 0) {
      categories.push({
        label: 'Orang Tua',
        members: parents.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Ayah' : 'Ibu' 
        }))
      })
    }

    const spouses = getSpouses(self.id)
    if (spouses.length > 0) {
      categories.push({
        label: 'Pasangan',
        members: spouses.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Suami' : 'Istri' 
        }))
      })
    }

    const children = getChildren(self.id)
    if (children.length > 0) {
      categories.push({
        label: 'Anak',
        members: children.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Anak laki-laki' : 'Anak perempuan' 
        }))
      })
    }

    const siblings = getSiblings(self.id)
    if (siblings.length > 0) {
      categories.push({
        label: 'Saudara',
        members: siblings.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Saudara laki-laki' : 'Saudara perempuan' 
        }))
      })
    }

    // Extended family
    const grandparents: Member[] = []
    parents.forEach(p => {
      getParents(p.id).forEach(gp => {
        if (!grandparents.some(g => g.id === gp.id)) grandparents.push(gp)
      })
    })
    if (grandparents.length > 0) {
      categories.push({
        label: 'Kakek/Nenek',
        members: grandparents.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Kakek' : 'Nenek' 
        }))
      })
    }

    const grandchildren: Member[] = []
    children.forEach(c => {
      getChildren(c.id).forEach(gc => {
        if (!grandchildren.some(g => g.id === gc.id)) grandchildren.push(gc)
      })
    })
    if (grandchildren.length > 0) {
      categories.push({
        label: 'Cucu',
        members: grandchildren.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Cucu laki-laki' : 'Cucu perempuan' 
        }))
      })
    }

    const inLawParents: Member[] = []
    spouses.forEach(s => {
      getParents(s.id).forEach(p => {
        if (!inLawParents.some(i => i.id === p.id)) inLawParents.push(p)
      })
    })
    if (inLawParents.length > 0) {
      categories.push({
        label: 'Mertua',
        members: inLawParents.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Ayah mertua' : 'Ibu mertua' 
        }))
      })
    }

    const childSpouses: Member[] = []
    children.forEach(c => {
      getSpouses(c.id).forEach(s => {
        if (!childSpouses.some(cs => cs.id === s.id)) childSpouses.push(s)
      })
    })
    if (childSpouses.length > 0) {
      categories.push({
        label: 'Menantu',
        members: childSpouses.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Menantu laki-laki' : 'Menantu perempuan' 
        }))
      })
    }

    const siblingInLaws: Member[] = []
    spouses.forEach(s => {
      getSiblings(s.id).forEach(sib => {
        if (!siblingInLaws.some(i => i.id === sib.id)) siblingInLaws.push(sib)
      })
    })
    siblings.forEach(sib => {
      getSpouses(sib.id).forEach(s => {
        if (!siblingInLaws.some(i => i.id === s.id)) siblingInLaws.push(s)
      })
    })
    if (siblingInLaws.length > 0) {
      categories.push({
        label: 'Ipar',
        members: siblingInLaws.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Ipar laki-laki' : 'Ipar perempuan' 
        }))
      })
    }

    const unclesAunts: Member[] = []
    parents.forEach(p => {
      getSiblings(p.id).forEach(sib => {
        if (!unclesAunts.some(ua => ua.id === sib.id)) unclesAunts.push(sib)
      })
    })
    if (unclesAunts.length > 0) {
      categories.push({
        label: 'Paman/Bibi',
        members: unclesAunts.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Paman' : 'Bibi' 
        }))
      })
    }

    const nephews: Member[] = []
    siblings.forEach(sib => {
      getChildren(sib.id).forEach(c => {
        if (!nephews.some(n => n.id === c.id)) nephews.push(c)
      })
    })
    if (nephews.length > 0) {
      categories.push({
        label: 'Keponakan',
        members: nephews.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Keponakan laki-laki' : 'Keponakan perempuan' 
        }))
      })
    }

    const cousins: Member[] = []
    unclesAunts.forEach(ua => {
      getChildren(ua.id).forEach(c => {
        if (!cousins.some(co => co.id === c.id)) cousins.push(c)
      })
    })
    if (cousins.length > 0) {
      categories.push({
        label: 'Sepupu',
        members: cousins.map(m => ({ 
          member: m, 
          relation: m.gender === 'M' ? 'Sepupu laki-laki' : 'Sepupu perempuan' 
        }))
      })
    }

    return categories
  }, [mode, self, getParents, getChildren, getSpouses, getSiblings])

  const MemberDropdown = ({
    value,
    onChange,
    showDropdown,
    setShowDropdown,
    search,
    setSearch,
    filteredMembers,
    placeholder,
  }: {
    value: Member | null
    onChange: (id: number | null) => void
    showDropdown: boolean
    setShowDropdown: (v: boolean) => void
    search: string
    setSearch: (v: string) => void
    filteredMembers: Member[]
    placeholder: string
  }) => (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full h-11 px-4 text-sm bg-card border border-border rounded-lg flex items-center justify-between"
      >
        <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {value?.name || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      
      {showDropdown && (
        <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-20 max-h-56 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama..."
                className="w-full h-8 pl-8 pr-3 text-sm bg-background border border-border rounded focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {value && (
              <button
                onClick={() => {
                  onChange(null)
                  setShowDropdown(false)
                  setSearch('')
                }}
                className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted"
              >
                Hapus pilihan
              </button>
            )}
            {filteredMembers.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Tidak ditemukan</p>
            ) : (
              filteredMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    onChange(m.id)
                    setShowDropdown(false)
                    setSearch('')
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Mode selector */}
      <div className="p-4 pb-2">
        <div className="flex rounded-lg bg-muted p-1">
          {[
            { id: 'who-is' as const, label: 'Siapa dia bagiku?' },
            { id: 'between' as const, label: 'Antara dua orang' },
            { id: 'map' as const, label: 'Peta keluargaku' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id)
                setSelectedMember1(null)
                setSelectedMember2(null)
              }}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${
                mode === m.id 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on mode */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {mode === 'who-is' && (
          <div className="space-y-4 pt-2">
            <MemberDropdown
              value={member1}
              onChange={setSelectedMember1}
              showDropdown={showDropdown1}
              setShowDropdown={setShowDropdown1}
              search={search1}
              setSearch={setSearch1}
              filteredMembers={filteredMembers1}
              placeholder="Pilih anggota keluarga..."
            />

            {result && member1 && (
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center space-y-3">
                  <p className="font-display font-bold text-2xl text-foreground">{member1.name}</p>
                  <p className="font-display font-bold text-3xl text-primary">{result.label}mu</p>
                </div>
              </div>
            )}

            {selectedMember1 && !result && (
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Belum terhubung.</p>
                <p className="text-xs text-muted-foreground mt-1">Tambahkan data penghubung.</p>
              </div>
            )}

            {members.length < 2 && (
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Minimal 2 orang untuk melihat hubungan.</p>
              </div>
            )}
          </div>
        )}

        {mode === 'between' && (
          <div className="space-y-4 pt-2">
            <MemberDropdown
              value={member1}
              onChange={setSelectedMember1}
              showDropdown={showDropdown1}
              setShowDropdown={(v) => {
                setShowDropdown1(v)
                if (v) setShowDropdown2(false)
              }}
              search={search1}
              setSearch={setSearch1}
              filteredMembers={filteredMembers1}
              placeholder="Orang pertama..."
            />

            <MemberDropdown
              value={member2}
              onChange={setSelectedMember2}
              showDropdown={showDropdown2}
              setShowDropdown={(v) => {
                setShowDropdown2(v)
                if (v) setShowDropdown1(false)
              }}
              search={search2}
              setSearch={setSearch2}
              filteredMembers={filteredMembers2}
              placeholder="Orang kedua..."
            />

            {result && member1 && member2 && (
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center space-y-3">
                  <p className="font-display font-bold text-xl text-foreground">{member1.name}</p>
                  <p className="font-display font-bold text-2xl text-primary">{result.label}</p>
                  <p className="text-sm text-muted-foreground">dari <span className="font-medium text-foreground">{member2.name}</span></p>
                </div>
              </div>
            )}

            {selectedMember1 && selectedMember2 && !result && (
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Belum terhubung.</p>
              </div>
            )}
          </div>
        )}

        {mode === 'map' && self && (
          <div className="space-y-4 pt-2">
            {/* Self card */}
            <div className="p-4 bg-gradient-to-br from-gold/20 to-gold/10 rounded-xl border border-gold/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-display font-bold">{self.name}</p>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gold/30 text-gold rounded">
                    Kamu
                  </span>
                </div>
              </div>
            </div>

            {/* Family categories */}
            {familyMap && familyMap.length > 0 ? (
              familyMap.map(category => (
                <div key={category.label}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {category.label}
                  </h3>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    {category.members.map(({ member: m, relation }) => (
                      <button
                        key={m.id}
                        onClick={() => onViewMember(m)}
                        className="flex-shrink-0 p-3 bg-card border border-border rounded-xl hover:border-primary/30 active:scale-[0.98] transition-all"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                          m.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                        } ${m.isDeceased ? 'grayscale opacity-70' : ''}`}>
                          <User className={`w-5 h-5 ${m.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
                        </div>
                        <p className="text-sm font-medium text-center mt-2 whitespace-nowrap max-w-[80px] truncate">
                          {m.nickname || m.name.split(' ')[0]}
                        </p>
                        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                          {relation}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Belum ada hubungan keluarga.</p>
                <p className="text-xs text-muted-foreground mt-1">Tambahkan anggota keluarga untuk melihat peta.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
