'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member, NasabData, Gender, RelationshipType } from './types'

interface NasabStore extends NasabData {
  // Actions
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'relationships'>) => number
  updateMember: (id: number, updates: Partial<Member>) => void
  deleteMember: (id: number) => void
  addRelationship: (memberId: number, targetId: number, type: RelationshipType) => void
  removeRelationship: (memberId: number, targetId: number) => void
  toggleDarkMode: () => void
  getSelf: () => Member | undefined
  getMember: (id: number) => Member | undefined
  getParents: (id: number) => Member[]
  getChildren: (id: number) => Member[]
  getSpouses: (id: number) => Member[]
  getSiblings: (id: number) => Member[]
  clearAllData: () => void
  importData: (data: NasabData) => void
  exportData: () => NasabData
}

const initialData: NasabData = {
  members: [],
  nextId: 1,
  settings: {
    darkMode: false,
  },
}

export const useNasabStore = create<NasabStore>()(
  persist(
    (set, get) => ({
      ...initialData,

      addMember: (memberData) => {
        const id = get().nextId
        const newMember: Member = {
          ...memberData,
          id,
          relationships: [],
          createdAt: Date.now(),
        }
        set((state) => ({
          members: [...state.members, newMember],
          nextId: state.nextId + 1,
        }))
        return id
      },

      updateMember: (id, updates) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }))
      },

      deleteMember: (id) => {
        set((state) => ({
          members: state.members
            .filter((m) => m.id !== id)
            .map((m) => ({
              ...m,
              relationships: m.relationships.filter((r) => r.targetId !== id),
            })),
        }))
      },

      addRelationship: (memberId, targetId, type) => {
        const reverseType: RelationshipType = 
          type === 'parent' ? 'child' : 
          type === 'child' ? 'parent' : 
          'spouse'
        
        set((state) => ({
          members: state.members.map((m) => {
            if (m.id === memberId) {
              // Remove any existing relationship with target
              const filtered = m.relationships.filter((r) => r.targetId !== targetId)
              return { ...m, relationships: [...filtered, { type, targetId }] }
            }
            if (m.id === targetId) {
              // Add reverse relationship
              const filtered = m.relationships.filter((r) => r.targetId !== memberId)
              return { ...m, relationships: [...filtered, { type: reverseType, targetId: memberId }] }
            }
            return m
          }),
        }))
      },

      removeRelationship: (memberId, targetId) => {
        set((state) => ({
          members: state.members.map((m) => {
            if (m.id === memberId || m.id === targetId) {
              return {
                ...m,
                relationships: m.relationships.filter(
                  (r) => r.targetId !== (m.id === memberId ? targetId : memberId)
                ),
              }
            }
            return m
          }),
        }))
      },

      toggleDarkMode: () => {
        set((state) => ({
          settings: { ...state.settings, darkMode: !state.settings.darkMode },
        }))
      },

      getSelf: () => get().members.find((m) => m.isSelf),

      getMember: (id) => get().members.find((m) => m.id === id),

      getParents: (id) => {
        const member = get().getMember(id)
        if (!member) return []
        return member.relationships
          .filter((r) => r.type === 'parent')
          .map((r) => get().getMember(r.targetId))
          .filter((m): m is Member => m !== undefined)
      },

      getChildren: (id) => {
        const member = get().getMember(id)
        if (!member) return []
        return member.relationships
          .filter((r) => r.type === 'child')
          .map((r) => get().getMember(r.targetId))
          .filter((m): m is Member => m !== undefined)
      },

      getSpouses: (id) => {
        const member = get().getMember(id)
        if (!member) return []
        return member.relationships
          .filter((r) => r.type === 'spouse')
          .map((r) => get().getMember(r.targetId))
          .filter((m): m is Member => m !== undefined)
      },

      getSiblings: (id) => {
        const parents = get().getParents(id)
        if (parents.length === 0) return []
        
        const siblingIds = new Set<number>()
        parents.forEach((parent) => {
          get().getChildren(parent.id).forEach((child) => {
            if (child.id !== id) siblingIds.add(child.id)
          })
        })
        
        return Array.from(siblingIds)
          .map((sibId) => get().getMember(sibId))
          .filter((m): m is Member => m !== undefined)
      },

      clearAllData: () => {
        set(initialData)
      },

      importData: (data) => {
        set(data)
      },

      exportData: () => ({
        members: get().members,
        nextId: get().nextId,
        settings: get().settings,
      }),
    }),
    {
      name: 'nasab-data',
    }
  )
)
