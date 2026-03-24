'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, ChevronRight } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { getRelationToSelf } from '@/lib/relationship'
import type { Member } from '@/lib/types'

interface SearchOverlayProps {
  onSelectMember: (member: Member) => void
}

type Filter = 'all' | 'male' | 'female' | 'deceased'

export function SearchOverlay({ onSelectMember }: SearchOverlayProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  useEffect(() => {
    // Focus input when component mounts
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const filteredMembers = members.filter(m => {
    const query = search.toLowerCase()
    const matchesSearch = !search || 
      m.name.toLowerCase().includes(query) || 
      m.nickname?.toLowerCase().includes(query)
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'male' && m.gender === 'M') ||
      (filter === 'female' && m.gender === 'F') ||
      (filter === 'deceased' && m.isDeceased)
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-3 space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all' as const, label: 'Semua' },
              { id: 'male' as const, label: 'Laki-laki' },
              { id: 'female' as const, label: 'Perempuan' },
              { id: 'deceased' as const, label: 'Almarhum/ah' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  filter === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="sticky top-[106px] z-10 bg-muted/80 border-b border-border">
        <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <div className="col-span-4">Nama</div>
          <div className="col-span-2 text-center">L/P</div>
          <div className="col-span-2 text-center">Lahir</div>
          <div className="col-span-3">Hubungan</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">
              {search ? 'Tidak ditemukan.' : 'Tidak ada anggota.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredMembers.map(member => {
              const relationLabel = self && !member.isSelf
                ? getRelationToSelf(member.id, self.id, members, getParents, getChildren, getSpouses)
                : ''

              return (
                <button
                  key={member.id}
                  onClick={() => onSelectMember(member)}
                  className="w-full grid grid-cols-12 gap-1 px-3 py-2.5 items-center hover:bg-muted/50 active:bg-muted transition-colors text-left"
                >
                  {/* Name */}
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      member.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                    } ${member.isDeceased ? 'grayscale opacity-60' : ''}`}>
                      <User className={`w-3.5 h-3.5 ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate ${member.isDeceased ? 'text-muted-foreground' : ''}`}>
                        {member.nickname || member.name.split(' ')[0]}
                      </p>
                      {member.isSelf && (
                        <span className="px-1 py-0.5 text-[8px] font-semibold bg-gold/20 text-gold rounded">
                          Kamu
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="col-span-2 text-center">
                    <span className={`text-xs font-medium ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`}>
                      {member.gender === 'M' ? 'L' : 'P'}
                    </span>
                    {member.isDeceased && (
                      <span className="text-[9px] text-muted-foreground block">{member.gender === 'M' ? 'Alm' : 'Almh'}</span>
                    )}
                  </div>

                  {/* Birth Year */}
                  <div className="col-span-2 text-center">
                    <span className="text-xs text-muted-foreground">
                      {member.birthYear || '-'}
                    </span>
                  </div>

                  {/* Relationship */}
                  <div className="col-span-3">
                    {member.isSelf ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-gold/20 text-gold rounded">
                        Kamu
                      </span>
                    ) : relationLabel ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-medium bg-primary/10 text-primary rounded truncate block">
                        {relationLabel}
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/50">-</span>
                    )}
                  </div>

                  {/* Chevron */}
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
