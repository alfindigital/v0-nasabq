'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

export function InstallBanner() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('nasab-install-dismissed')
    if (dismissed) return

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    
    // For iOS, show banner after delay
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      setTimeout(() => setShow(true), 2000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('nasab-install-dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Download className="w-4 h-4 flex-shrink-0" />
        <p className="text-xs font-medium truncate">Pasang NasabQ di Home Screen</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1 text-xs font-semibold bg-primary-foreground text-primary rounded-full hover:opacity-90 active:scale-95 transition-all"
        >
          Pasang
        </button>
        <button
          onClick={handleDismiss}
          className="w-6 h-6 flex items-center justify-center hover:bg-primary-foreground/20 rounded-full transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Type declaration for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
