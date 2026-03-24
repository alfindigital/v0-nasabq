'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, User, Users, Heart, Search, X } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { getRelationToSelf } from '@/lib/relationship'
import type { Member } from '@/lib/types'

interface MemberListProps {
  onViewMember: (member: Member) => void
}

export function MemberList({ onViewMember }: MemberListProps) {
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)
  const [searchQuery, setSearchQuery] = useState('')

  // Statistics
  const stats = useMemo(() => {
    const maleCount = members.filter(m => m.gender === 'M').length
    const femaleCount = members.filter(m => m.gender === 'F').length
    const spousePairs = Math.floor(members.reduce((acc, m) => 
      acc + m.relationships.filter(r => r.type === 'spouse').length, 0
    ) / 2)
    
    const getGeneration = (memberId: number, visited = new Set<number>()): number => {
      if (visited.has(memberId)) return 0
      visited.add(memberId)
      const member = members.find(m => m.id === memberId)
      if (!member) return 0
      const parents = member.relationships.filter(r => r.type === 'parent')
      if (parents.length === 0) return 1
      return 1 + Math.max(...parents.map(p => getGeneration(p.targetId, visited)))
    }
    const generations = self ? getGeneration(self.id) : 1

    return { maleCount, femaleCount, spousePairs, generations, total: members.length }
  }, [members, self])

  // Sort and filter members
  const filteredMembers = useMemo(() => {
    const getGeneration = (id: number, visited = new Set<number>()): number => {
      if (visited.has(id)) return 0
      visited.add(id)
      const parents = getParents(id)
      if (parents.length === 0) return 0
      return 1 + Math.max(...parents.map(p => getGeneration(p.id, new Set(visited))))
    }

    let result = [...members]
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) ||
        (m.nickname && m.nickname.toLowerCase().includes(query)) ||
        (m.address && m.address.toLowerCase().includes(query))
      )
    }

    // Sort
    return result.sort((a, b) => {
      if (a.isSelf) return -1
      if (b.isSelf) return 1
      const genA = getGeneration(a.id)
      const genB = getGeneration(b.id)
      if (genA !== genB) return genA - genB
      return a.name.localeCompare(b.name)
    })
  }, [members, getParents, searchQuery])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Stats Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-3">
          <div className="grid grid-cols-5 gap-1.5">
            <div className="p-2 bg-card rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-primary" />
                <span className="font-display font-bold text-base text-primary">{stats.total}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">Total</p>
            </div>
            <div className="p-2 bg-card rounded-lg text-center">
              <span className="font-display font-bold text-sm text-foreground">{stats.maleCount}</span>
              <p className="text-[9px] text-muted-foreground">Laki-laki</p>
            </div>
            <div className="p-2 bg-card rounded-lg text-center">
              <span className="font-display font-bold text-sm text-female-accent">{stats.femaleCount}</span>
              <p className="text-[9px] text-muted-foreground">Perempuan</p>
            </div>
            <div className="p-2 bg-card rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Heart className="w-3 h-3 text-female-accent" />
                <span className="font-display font-bold text-sm">{stats.spousePairs}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">Keluarga</p>
            </div>
            <div className="p-2 bg-card rounded-lg text-center">
              <span className="font-display font-bold text-sm text-gold">{stats.generations}</span>
              <p className="text-[9px] text-muted-foreground">Generasi</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari anggota keluarga..."
              className="w-full h-10 pl-9 pr-9 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="sticky top-[140px] z-10 bg-muted/80 border-b border-border">
        <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <div className="col-span-4">Nama</div>
          <div className="col-span-2 text-center">Jenis</div>
          <div className="col-span-2 text-center">Lahir</div>
          <div className="col-span-3">Hubungan</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Tidak ditemukan.' : 'Belum ada anggota keluarga.'}
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
                  onClick={() => onViewMember(member)}
                  className="w-full grid grid-cols-12 gap-1 px-3 py-2.5 items-center hover:bg-muted/50 active:bg-muted transition-colors text-left"
                >
                  {/* Name */}
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      member.isDeceased 
                        ? 'bg-muted-foreground/20' 
                        : member.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                    }`}>
                      <User className={`w-3.5 h-3.5 ${
                        member.isDeceased 
                          ? 'text-muted-foreground' 
                          : member.gender === 'M' ? 'text-primary' : 'text-female-accent'
                      }`} />
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
                    <span className={`text-[10px] font-medium ${member.isDeceased ? 'text-muted-foreground' : member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`}>
                      {member.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>

                  {/* Birth Year */}
                  <div className="col-span-2 text-center">
                    <span className="text-xs text-muted-foreground">
                      {member.birthYear || '-'}
                    </span>
                  </div>

                  {/* Relationship */}
                  <div className="col-span-3">
                    {relationLabel ? (
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
