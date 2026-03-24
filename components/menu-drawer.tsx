'use client'

import { useRef, useState } from 'react'
import { X, Download, Upload, Trash2, Info, User, Type, Heart } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import type { FontSize } from '@/lib/types'

interface MenuDrawerProps {
  open: boolean
  onClose: () => void
  onViewSelf: () => void
  showToast: (message: string) => void
}

export function MenuDrawer({ open, onClose, onViewSelf, showToast }: MenuDrawerProps) {
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { members, settings, exportData, importData, clearAllData, setFontSize } = useNasabStore()
  const self = members.find(m => m.isSelf)
  const fontSize = settings.fontSize || 'medium'

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Kecil' },
    { value: 'medium', label: 'Sedang' },
    { value: 'large', label: 'Besar' },
  ]

  const handleExport = () => {
    const data = exportData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nasab-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Data berhasil diunduh!')
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.members && Array.isArray(data.members) && typeof data.nextId === 'number') {
          // Ensure settings exists
          if (!data.settings) {
            data.settings = { darkMode: false }
          }
          importData(data)
          showToast('Data berhasil diimpor!')
          setShowImport(false)
          onClose()
        } else {
          showToast('Format file tidak valid')
        }
      } catch {
        showToast('Gagal membaca file')
      }
    }
    reader.readAsText(file)
    // Reset file input
    e.target.value = ''
  }

  const handleImportText = () => {
    try {
      const data = JSON.parse(importText)
      if (data.members && Array.isArray(data.members) && typeof data.nextId === 'number') {
        // Ensure settings exists
        if (!data.settings) {
          data.settings = { darkMode: false }
        }
        importData(data)
        showToast('Data berhasil diimpor!')
        setShowImport(false)
        setImportText('')
        onClose()
      } else {
        showToast('Format data tidak valid')
      }
    } catch {
      showToast('Format JSON tidak valid')
    }
  }

  const handleClearAll = () => {
    if (confirm('Hapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
      clearAllData()
      showToast('Semua data dihapus')
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-[280px] md:w-[320px] bg-card drawer-slide overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profil</h3>
            {self && (
              <button
                onClick={onViewSelf}
                className="w-full p-3 bg-muted rounded-lg flex items-center gap-3 hover:bg-muted/80 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-display font-semibold text-sm">{self.name}</p>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-gold/20 text-gold rounded mt-0.5">
                    Kamu
                  </span>
                </div>
              </button>
            )}
          </section>

          {/* Appearance Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tampilan</h3>
            {/* Font Size */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Type className="w-5 h-5" />
                <span className="text-sm font-medium">Ukuran Font</span>
              </div>
              <div className="flex gap-2">
                {fontSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFontSize(option.value)}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                      fontSize === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border hover:border-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Data Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Data</h3>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full p-3 bg-muted rounded-lg flex items-center gap-3 hover:bg-muted/80 active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Export Data</span>
              </button>

              <div>
                <button
                  onClick={() => setShowImport(!showImport)}
                  className="w-full p-3 bg-muted rounded-lg flex items-center gap-3 hover:bg-muted/80 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm font-medium">Import Data</span>
                </button>
                
                {showImport && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-2 text-xs font-medium border border-dashed border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                    >
                      Pilih File JSON
                    </button>
                    <div className="relative">
                      <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Atau tempel JSON di sini..."
                        className="w-full h-20 p-2 text-xs bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {importText && (
                      <button
                        onClick={handleImportText}
                        className="w-full p-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        Import
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleClearAll}
                className="w-full p-3 bg-muted rounded-lg flex items-center gap-3 hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">Hapus Semua Data</span>
              </button>
            </div>
          </section>

          {/* Info Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Info</h3>
            <div className="p-3 bg-muted rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Tentang NasabQ</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aplikasi silsilah keluarga untuk menyimpan dan mengenal akar keluargamu.
                </p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  Built with{' '}
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  {' '}by{' '}
                  <a 
                    href="https://alfindigital.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    @alfindigital
                  </a>
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">v1.0.0</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
