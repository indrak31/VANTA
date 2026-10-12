import { useEffect, useState } from 'react'
import type { ViewKey } from '../types'
import './workspace-loader.css'

interface WorkspaceLoaderProps {
  targetView?: ViewKey
  workspaceName?: string
  onComplete: () => void
}

export function WorkspaceLoader({ onComplete }: WorkspaceLoaderProps) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Refined, snappy 650ms transition matching Linear/Vercel startup
    const timer = setTimeout(() => {
      setFading(true)
      setTimeout(onComplete, 240)
    }, 650)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className={`vanta-loader-screen ${fading ? 'fade-out' : ''}`}
      onClick={() => {
        setFading(true)
        setTimeout(onComplete, 100)
      }}
      role="status"
      aria-label="Loading workspace"
    >
      <div className="vanta-loader-content">
        <div className="vanta-loader-logo-wrap">
          <img src="/vanta-brand.png" alt="VANTA" className="vanta-loader-logo" />
        </div>

        <div className="vanta-loader-bar-track">
          <div className="vanta-loader-bar-fill" />
        </div>

        <span className="vanta-loader-caption">Signal OS</span>
      </div>
    </div>
  )
}
