'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, User, Search, X, SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import type { Member } from '@/lib/types'

type SortOption = 'name' | 'birthYear' | 'createdAt' | 'generation'
type GenderFilter = 'all' | 'M' | 'F'
type StatusFilter = 'all' | 'alive' | 'deceased'

interface MemberListProps {
  onViewMember: (member: Member) => void
}

export function MemberList({ onViewMember }: MemberListProps) {
  const { members, getParents } = useNasabStore()
  const self = members.find(m => m.isSelf)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [generationFilter, setGenerationFilter] = useState<number | 'all'>('all')
  const [domicileFilter, setDomicileFilter] = useState<string>('all')
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('generation')
  const [sortAsc, setSortAsc] = useState(true)

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

  // Get unique domiciles for filter dropdown
  const uniqueDomiciles = useMemo(() => {
    const domiciles = members
      .map(m => m.address)
      .filter((addr): addr is string => !!addr && addr.trim() !== '')
    return [...new Set(domiciles)].sort()
  }, [members])

  // Generation calculation helper
  const getGeneration = useMemo(() => {
    const cache = new Map<number, number>()
    const calculate = (id: number, visited = new Set<number>()): number => {
      if (visited.has(id)) return 0
      if (cache.has(id)) return cache.get(id)!
      visited.add(id)
      const parents = getParents(id)
      if (parents.length === 0) {
        cache.set(id, 0)
        return 0
      }
      const gen = 1 + Math.max(...parents.map(p => calculate(p.id, new Set(visited))))
      cache.set(id, gen)
      return gen
    }
    return calculate
  }, [getParents])

  // Get max generation for filter
  const maxGeneration = useMemo(() => {
    return Math.max(...members.map(m => getGeneration(m.id)), 0)
  }, [members, getGeneration])

  // Check if any filter is active
  const hasActiveFilters = genderFilter !== 'all' || statusFilter !== 'all' || generationFilter !== 'all' || domicileFilter !== 'all'

  // Sort and filter members
  const filteredMembers = useMemo(() => {
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

    // Filter by gender
    if (genderFilter !== 'all') {
      result = result.filter(m => m.gender === genderFilter)
    }

    // Filter by status (alive/deceased)
    if (statusFilter !== 'all') {
      result = result.filter(m => statusFilter === 'deceased' ? m.isDeceased : !m.isDeceased)
    }

    // Filter by generation
    if (generationFilter !== 'all') {
      result = result.filter(m => getGeneration(m.id) === generationFilter)
    }

    // Filter by domicile
    if (domicileFilter !== 'all') {
      result = result.filter(m => m.address === domicileFilter)
    }

    // Sort
    return result.sort((a, b) => {
      // Self always first
      if (a.isSelf) return -1
      if (b.isSelf) return 1

      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'birthYear':
          const yearA = a.birthYear || 9999
          const yearB = b.birthYear || 9999
          comparison = yearA - yearB
          break
        case 'createdAt':
          comparison = (a.createdAt || 0) - (b.createdAt || 0)
          break
        case 'generation':
        default:
          const genA = getGeneration(a.id)
          const genB = getGeneration(b.id)
          if (genA !== genB) {
            comparison = genA - genB
          } else {
            comparison = a.name.localeCompare(b.name)
          }
          break
      }
      return sortAsc ? comparison : -comparison
    })
  }, [members, getGeneration, searchQuery, genderFilter, statusFilter, generationFilter, domicileFilter, sortBy, sortAsc])

  // Reset all filters
  const resetFilters = () => {
    setGenderFilter('all')
    setStatusFilter('all')
    setGenerationFilter('all')
    setDomicileFilter('all')
    setSortBy('generation')
    setSortAsc(true)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Stats Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-3">
          {/* Row 1: Total and Gender breakdown */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="p-2.5 bg-card rounded-lg text-center min-h-[60px] flex flex-col justify-center">
              <span className="font-display font-bold text-lg text-primary">{stats.total}</span>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="p-2.5 bg-card rounded-lg text-center min-h-[60px] flex flex-col justify-center">
              <span className="font-display font-bold text-lg text-foreground">{stats.maleCount}</span>
              <p className="text-[10px] text-muted-foreground">Laki-laki</p>
            </div>
            <div className="p-2.5 bg-card rounded-lg text-center min-h-[60px] flex flex-col justify-center">
              <span className="font-display font-bold text-lg text-female-accent">{stats.femaleCount}</span>
              <p className="text-[10px] text-muted-foreground">Perempuan</p>
            </div>
          </div>
          {/* Row 2: Families and Generations */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-card rounded-lg text-center min-h-[60px] flex flex-col justify-center">
              <span className="font-display font-bold text-lg">{stats.spousePairs}</span>
              <p className="text-[10px] text-muted-foreground">Keluarga</p>
            </div>
            <div className="p-2.5 bg-card rounded-lg text-center min-h-[60px] flex flex-col justify-center">
              <span className="font-display font-bold text-lg text-gold">{stats.generations}</span>
              <p className="text-[10px] text-muted-foreground">Generasi</p>
            </div>
          </div>
        </div>

        {/* Search Bar + Filter Toggle */}
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari anggota..."
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Sort Panel */}
        {showFilters && (
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            {/* Sort Options */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Urutkan
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full h-9 pl-3 pr-8 bg-card border border-border rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="generation">Generasi</option>
                    <option value="name">Nama</option>
                    <option value="birthYear">Tahun Lahir</option>
                    <option value="createdAt">Tanggal Ditambahkan</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  title={sortAsc ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown className={`w-4 h-4 text-muted-foreground ${!sortAsc ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter by Gender */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Jenis Kelamin
              </label>
              <div className="flex gap-1.5">
                {[
                  { value: 'all', label: 'Semua' },
                  { value: 'M', label: 'Laki-laki' },
                  { value: 'F', label: 'Perempuan' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGenderFilter(opt.value as GenderFilter)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      genderFilter === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Status
              </label>
              <div className="flex gap-1.5">
                {[
                  { value: 'all', label: 'Semua' },
                  { value: 'alive', label: 'Hidup' },
                  { value: 'deceased', label: 'Wafat' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value as StatusFilter)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      statusFilter === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Generation */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Generasi
              </label>
              <div className="relative">
                <select
                  value={generationFilter}
                  onChange={(e) => setGenerationFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="w-full h-9 pl-3 pr-8 bg-card border border-border rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="all">Semua Generasi</option>
                  {Array.from({ length: maxGeneration + 1 }, (_, i) => (
                    <option key={i} value={i}>Generasi {i === 0 ? '0 (Tertua)' : i}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Filter by Domicile */}
            {uniqueDomiciles.length > 0 && (
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Domisili
                </label>
                <div className="relative">
                  <select
                    value={domicileFilter}
                    onChange={(e) => setDomicileFilter(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 bg-card border border-border rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="all">Semua Domisili</option>
                    {uniqueDomiciles.map(dom => (
                      <option key={dom} value={dom}>{dom}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count indicator */}
      {(hasActiveFilters || searchQuery) && (
        <div className="px-3 py-2 bg-muted/50 border-b border-border">
          <p className="text-xs text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{filteredMembers.length}</span> dari {members.length} anggota
          </p>
        </div>
      )}

      {/* Table with unified horizontal scroll - no visible scrollbar */}
      <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredMembers.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Tidak ditemukan.' : 'Belum ada anggota keluarga.'}
            </p>
          </div>
        ) : (
          <div className="min-w-[600px]">
            {/* Table Header */}
            <div className="sticky top-0 z-[5] bg-muted/95 border-b border-border">
              <div className="grid grid-cols-[minmax(120px,1.5fr)_60px_60px_minmax(100px,1fr)_minmax(120px,1.5fr)_40px] gap-2 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                <div>Nama</div>
                <div className="text-center">L/P</div>
                <div className="text-center">Lahir</div>
                <div>Domisili</div>
                <div>Catatan</div>
                <div></div>
              </div>
            </div>
            {/* Table Body */}
            <div className="divide-y divide-border/50">
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => onViewMember(member)}
                className="w-full grid grid-cols-[minmax(120px,1.5fr)_60px_60px_minmax(100px,1fr)_minmax(120px,1.5fr)_40px] gap-2 px-3 py-2.5 items-center hover:bg-muted/50 active:bg-muted transition-colors text-left"
              >
                {/* Name */}
                <div className="flex items-center gap-2 min-w-0">
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
                <div className="text-center">
                  <span className={`text-xs font-medium ${member.isDeceased ? 'text-muted-foreground' : member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`}>
                    {member.gender === 'M' ? 'L' : 'P'}
                  </span>
                </div>

                {/* Birth Year */}
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">
                    {member.birthYear || '-'}
                  </span>
                </div>

                {/* Domisili */}
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground truncate block">
                    {member.address || '-'}
                  </span>
                </div>

                {/* Catatan */}
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground truncate block">
                    {member.notes || '-'}
                  </span>
                </div>

                {/* Chevron */}
                <div className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
