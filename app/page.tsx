'use client'

import { useEffect, useState } from 'react'
import { useNasabStore } from '@/lib/store'
import { Onboarding } from '@/components/onboarding'
import { Header } from '@/components/header'
import { BottomNav } from '@/components/bottom-nav'
import { TreeCanvas } from '@/components/tree-canvas'
import { MemberList } from '@/components/member-list'
import { RelationshipExplorer } from '@/components/relationship-explorer'
import { MenuDrawer } from '@/components/menu-drawer'
import { AddMemberSheet } from '@/components/add-member-sheet'
import { MemberDetailSheet } from '@/components/member-detail-sheet'
import { Toast } from '@/components/toast'
import { InstallBanner } from '@/components/install-banner'
import type { ViewType, Member } from '@/lib/types'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>('tree')
  const [menuOpen, setMenuOpen] = useState(false)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [addContext, setAddContext] = useState<{
    targetId?: number
    relationshipType?: 'child' | 'parent' | 'spouse'
  } | null>(null)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  
  const { members, settings, toggleDarkMode } = useNasabStore()
  const self = members.find(m => m.isSelf)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addSheetOpen) setAddSheetOpen(false)
        else if (detailSheetOpen) setDetailSheetOpen(false)
        else if (menuOpen) setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addSheetOpen, detailSheetOpen, menuOpen])

  const showToast = (message: string) => {
    setToast({ message })
    setTimeout(() => setToast(null), 2500)
  }

  const handleAddMember = (context?: typeof addContext) => {
    setAddContext(context || null)
    setAddSheetOpen(true)
  }

  const handleViewMember = (member: Member) => {
    setSelectedMember(member)
    setDetailSheetOpen(true)
  }

  const handleMemberAdded = (name: string) => {
    setAddSheetOpen(false)
    setAddContext(null)
    showToast(`${name} ditambahkan!`)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display font-extrabold text-2xl tracking-[3px] text-primary">NASAB</h1>
        </div>
      </div>
    )
  }

  // Show onboarding if no self member exists
  if (!self) {
    return (
      <Onboarding 
        onComplete={(name) => showToast(`Ahlan, ${name}!`)} 
      />
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-hidden relative">
        {activeView === 'tree' && (
          <TreeCanvas 
            onViewMember={handleViewMember}
            onAddRelative={handleAddMember}
          />
        )}
        {activeView === 'list' && (
          <MemberList 
            onViewMember={handleViewMember}
            onAddMember={() => handleAddMember()}
          />
        )}
        {activeView === 'relationship' && (
          <RelationshipExplorer 
            onViewMember={handleViewMember}
          />
        )}
      </main>

      <BottomNav 
        activeView={activeView}
        onViewChange={setActiveView}
        onAddClick={() => handleAddMember()}
        onMenuClick={() => setMenuOpen(true)}
      />

      {/* Overlays and Sheets */}
      <MenuDrawer 
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        darkMode={settings.darkMode}
        onToggleDarkMode={toggleDarkMode}
        onViewSelf={() => {
          setMenuOpen(false)
          if (self) handleViewMember(self)
        }}
        showToast={showToast}
      />

      <AddMemberSheet
        open={addSheetOpen}
        onClose={() => {
          setAddSheetOpen(false)
          setAddContext(null)
        }}
        context={addContext}
        onAdded={handleMemberAdded}
      />

      <MemberDetailSheet
        open={detailSheetOpen}
        onClose={() => {
          setDetailSheetOpen(false)
          setSelectedMember(null)
        }}
        member={selectedMember}
        onViewMember={handleViewMember}
        onAddRelative={handleAddMember}
        showToast={showToast}
      />

      {toast && <Toast message={toast.message} />}
      <InstallBanner />
    </div>
  )
}
