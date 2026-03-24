'use client'

import { useMemo } from 'react'
import { ChevronRight, User, Users, Heart, UserCheck, Calendar, MapPin } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { getRelationToSelf } from '@/lib/relationship'
import type { Member } from '@/lib/types'

interface MemberListProps {
  onViewMember: (member: Member) => void
  onAddMember: () => void
}

export function MemberList({ onViewMember, onAddMember }: MemberListProps) {
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Statistics
  const stats = useMemo(() => {
    const maleCount = members.filter(m => m.gender === 'M').length
    const femaleCount = members.filter(m => m.gender === 'F').length
    const deceasedCount = members.filter(m => m.isDeceased).length
    const spousePairs = Math.floor(members.reduce((acc, m) => 
      acc + m.relationships.filter(r => r.type === 'spouse').length, 0
    ) / 2)
    
    // Calculate generations
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

    return { maleCount, femaleCount, deceasedCount, spousePairs, generations, total: members.length }
  }, [members, self])

  // Sort members by generation (ancestors first), then alphabetically
  const sortedMembers = useMemo(() => {
    const getGeneration = (id: number, visited = new Set<number>()): number => {
      if (visited.has(id)) return 0
      visited.add(id)
      const parents = getParents(id)
      if (parents.length === 0) return 0
      return 1 + Math.max(...parents.map(p => getGeneration(p.id, new Set(visited))))
    }

    return [...members].sort((a, b) => {
      if (a.isSelf) return -1
      if (b.isSelf) return 1
      const genA = getGeneration(a.id)
      const genB = getGeneration(b.id)
      if (genA !== genB) return genA - genB
      return a.name.localeCompare(b.name)
    })
  }, [members, getParents])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Stats Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
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
      </div>

      {/* Table Header */}
      <div className="sticky top-[76px] z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
        <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <div className="col-span-4">Nama</div>
          <div className="col-span-2 text-center">L/P</div>
          <div className="col-span-2 text-center">Lahir</div>
          <div className="col-span-3">Hubungan</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      {/* Member Table List */}
      <div className="flex-1 overflow-y-auto">
        {sortedMembers.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Belum ada anggota keluarga.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {sortedMembers.map(member => {
              const relationLabel = self && !member.isSelf
                ? getRelationToSelf(member.id, self.id, members, getParents, getChildren, getSpouses)
                : ''
              const parents = getParents(member.id)
              const spouses = getSpouses(member.id)
              const children = getChildren(member.id)

              return (
                <button
                  key={member.id}
                  onClick={() => onViewMember(member)}
                  className="w-full grid grid-cols-12 gap-1 px-3 py-2.5 items-center hover:bg-muted/50 active:bg-muted transition-colors text-left"
                >
                  {/* Name Column */}
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
                    {relationLabel ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-medium bg-primary/10 text-primary rounded truncate block">
                        {relationLabel}
                      </span>
                    ) : member.isSelf ? (
                      <span className="text-[9px] text-muted-foreground">-</span>
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

      {/* Add Member FAB */}
      <div className="sticky bottom-20 flex justify-end p-4 pointer-events-none">
        <button
          onClick={onAddMember}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover active:scale-95 transition-all pointer-events-auto"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      </div>
    </div>
  )
}
