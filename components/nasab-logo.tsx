'use client'

export interface NasabLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  textSize?: 'sm' | 'md' | 'lg'
}

export function NasabLogo({ 
  size = 'md', 
  showText = false,
  textSize = 'md'
}: NasabLogoProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  }
  
  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-2">
      {/* NasabQ Logo - Simplified tree symbolizing lineage */}
      <svg 
        viewBox="0 0 24 24" 
        className="text-primary flex-shrink-0"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Trunk */}
        <line x1="12" y1="6" x2="12" y2="18" />
        {/* Top branches */}
        <line x1="12" y1="6" x2="6" y2="3" />
        <line x1="12" y1="6" x2="18" y2="3" />
        {/* Bottom roots */}
        <line x1="12" y1="18" x2="7" y2="21" />
        <line x1="12" y1="18" x2="17" y2="21" />
      </svg>
      
      {showText && (
        <h1 className={`font-display font-extrabold tracking-[2px] text-primary select-none ${textSizeMap[textSize]}`}>
          NASABQ
        </h1>
      )}
    </div>
  )
}
