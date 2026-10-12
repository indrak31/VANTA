import { useEffect, useState } from 'react'
import type { ViewKey } from '../types'
import './workspace-loader.css'

interface WorkspaceLoaderProps {
  targetView: ViewKey
  workspaceName?: string
  onComplete: () => void
}

const STAGES = [
  {
    threshold: 28,
    label: 'ESTABLISHING PROTOCOL',
    detail: 'Secure handshake verified with Edge Signal Bus (latency: 12ms)...',
  },
  {
    threshold: 58,
    label: 'INGESTING FEEDBACK VECTORS',
    detail: 'Streaming 1,280 customer mentions & multi-channel telemetry...',
  },
  {
    threshold: 88,
    label: 'CALIBRATING COUNTERFACTUAL MODELS',
    detail: 'Calculating issue urgency weights and churn elasticity curves...',
  },
  {
    threshold: 100,
    label: 'WORKSPACE SYNCHRONIZED',
    detail: 'Mounting executive intelligence console and real-time dashboards...',
  },
]

const VIEW_TITLES: Record<ViewKey, string> = {
  overview: 'Executive Overview',
  feedback: 'Feedback Explorer',
  radar: 'Issue Radar',
  recommendations: 'Decision Engine',
  simulator: 'Counterfactual Simulator',
  adaptation: 'Adaption Lab',
  reports: 'Intelligence Reports',
}

export function WorkspaceLoader({ targetView, workspaceName = 'Northstar Product', onComplete }: WorkspaceLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const viewTitle = VIEW_TITLES[targetView] || 'Executive Workspace'

  // Determine current active stage
  const currentStage = STAGES.find((s) => progress <= s.threshold) || STAGES[STAGES.length - 1]

  useEffect(() => {
    let current = 0
    const startTime = performance.now()
    const targetDuration = 1100 // 1.1s total smooth cinematic launch

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime
      const rawProgress = Math.min(100, Math.floor((elapsed / targetDuration) * 100))

      // Exponential ease-in-out feel
      current = rawProgress
      setProgress(current)

      if (current >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setIsFadingOut(true)
          setTimeout(() => {
            onComplete()
          }, 350)
        }, 150)
      }
    }, 24)

    return () => clearInterval(interval)
  }, [onComplete])

  const handleSkip = () => {
    setIsFadingOut(true)
    setTimeout(() => {
      onComplete()
    }, 150)
  }

  return (
    <div
      className={`workspace-loader-backdrop ${isFadingOut ? 'fade-out' : ''}`}
      onClick={handleSkip}
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
    >
      {/* Ambient background glows */}
      <div className="loader-ambient-glow" />
      <div className="loader-ambient-grid" />

      {/* Main card / center stack */}
      <div className="loader-card">
        {/* Top telemetry indicator */}
        <div className="loader-top-pill">
          <span className="live-dot" />
          <span className="mono-text">SECURE SIGNAL BUS</span>
          <span className="pill-divider">·</span>
          <span className="mono-sub">ENCRYPTED TLS 1.3</span>
        </div>

        {/* Brand Centerpiece with radar ripple */}
        <div className="loader-brand-container">
          <div className="loader-radar-ring outer" />
          <div className="loader-radar-ring inner" />
          <div className="loader-brand-frame">
            <img src="/vanta-brand.png" alt="VANTA" className="loader-logo-img" />
            <div className="loader-sheen-sweep" />
          </div>
        </div>

        {/* Target module badge */}
        <div className="loader-target-badge">
          <span className="badge-tag">DESTINATION</span>
          <strong className="badge-name">{viewTitle}</strong>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="loader-progress-wrap">
          <div className="loader-bar-header">
            <span className="stage-title">{currentStage.label}</span>
            <span className="stage-percent">{progress.toString().padStart(2, '0')}%</span>
          </div>

          <div className="loader-track">
            <div
              className="loader-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="stage-log">{currentStage.detail}</p>
        </div>

        {/* Bottom Metadata & Telemetry Specs */}
        <div className="loader-specs-grid">
          <div className="spec-item">
            <span>WORKSPACE</span>
            <strong>{workspaceName}</strong>
          </div>
          <div className="spec-item">
            <span>PIPELINE</span>
            <strong>1,280 SIGNALS</strong>
          </div>
          <div className="spec-item">
            <span>INFERENCE</span>
            <strong>0.014s LATENCY</strong>
          </div>
        </div>

        {/* Subtle skip prompt */}
        <div className="loader-hint">
          <span>Click anywhere to bypass</span>
        </div>
      </div>
    </div>
  )
}
