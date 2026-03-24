'use client'

import { useMemo } from 'react'
import { ChevronRight, User, Users, Heart, UserCheck } from 'lucide-react'
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
      // Self first
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
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-card rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="font-display font-bold text-lg text-primary">{stats.total}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Anggota</p>
            </div>
            <div className="p-2 bg-card rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="font-display font-bold text-sm">{stats.maleCount}/{stats.femaleCount}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">L / P</p>
            </div>
            <div className="p-2 bg-card rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 text-female-accent" />
                <span className="font-display font-bold text-sm">{stats.spousePairs}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Keluarga</p>
            </div>
            <div className="p-2 bg-card rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-gold" />
                <span className="font-display font-bold text-sm">{stats.generations}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Generasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Table List */}
      <div className="flex-1 overflow-y-auto">
        {sortedMembers.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Belum ada anggota keluarga.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
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
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    member.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                  } ${member.isDeceased ? 'grayscale opacity-60' : ''}`}>
                    <User className={`w-5 h-5 ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm truncate">
                        {member.name}
                      </span>
                      {member.isSelf && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gold/20 text-gold rounded flex-shrink-0">
                          Kamu
                        </span>
                      )}
                    </div>
                    
                    {/* Details row */}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{member.gender === 'M' ? 'L' : 'P'}</span>
                      {member.birthYear && (
                        <>
                          <span className="text-border">|</span>
                          <span>{member.birthYear}</span>
                        </>
                      )}
                      {member.address && (
                        <>
                          <span className="text-border">|</span>
                          <span className="truncate max-w-[80px]">{member.address}</span>
                        </>
                      )}
                      {member.isDeceased && (
                        <>
                          <span className="text-border">|</span>
                          <span className="text-muted-foreground/60">{member.gender === 'M' ? 'Alm' : 'Almh'}</span>
                        </>
                      )}
                    </div>

                    {/* Relationship info */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {relationLabel && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                          {relationLabel}
                        </span>
                      )}
                      {parents.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {parents.length === 1 ? `Anak ${parents[0].nickname || parents[0].name.split(' ')[0]}` : `Anak ${parents[0].nickname || parents[0].name.split(' ')[0]} & ${parents[1].nickname || parents[1].name.split(' ')[0]}`}
                        </span>
                      )}
                      {spouses.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {spouses[0].gender === 'M' ? 'Istri' : 'Suami'} {spouses[0].nickname || spouses[0].name.split(' ')[0]}
                        </span>
                      )}
                      {children.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {children.length} anak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
