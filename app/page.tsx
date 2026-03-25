'use client'

import { useEffect, useState } from 'react'
import { useNasabStore } from '@/lib/store'
import { OnboardingPopup } from '@/components/onboarding-popup'
import { NasabLogo } from '@/components/nasab-logo'
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
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  const { members, settings, toggleDarkMode } = useNasabStore()
  const self = members.find(m => m.isSelf)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show onboarding popup if no self member exists
  useEffect(() => {
    if (mounted && !self) {
      setShowOnboarding(true)
    }
  }, [mounted, self])

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

  // Apply font size
  useEffect(() => {
    const fontSize = settings.fontSize || 'medium'
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large')
    document.documentElement.classList.add(`font-${fontSize}`)
    
    // Apply zoom scaling for arbitrary pixel values
    const appContainer = document.getElementById('app-container')
    if (appContainer) {
      const scale = fontSize === 'small' ? '0.92' : fontSize === 'large' ? '1.08' : '1'
      appContainer.style.zoom = scale
    }
  }, [settings.fontSize])

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
        <div className="flex flex-col items-center text-center">
          <NasabLogo size="lg" showText textSize="lg" />
          <p className="text-sm text-muted-foreground mt-2">Kenali Akar Keluargamu</p>
        </div>
      </div>
    )
  }

  return (
    <div id="app-container" className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <Header darkMode={settings.darkMode} onToggleDarkMode={toggleDarkMode} />
      
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
          // If opened from member detail (has context with targetId), return to detail sheet
          if (addContext?.targetId && selectedMember) {
            setDetailSheetOpen(true)
          }
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

      {/* Onboarding popup - mandatory when no self exists */}
      <OnboardingPopup
        open={showOnboarding}
        onComplete={(name) => {
          setShowOnboarding(false)
          showToast(`Ahlan, ${name}!`)
        }}
      />
    </div>
  )
}
