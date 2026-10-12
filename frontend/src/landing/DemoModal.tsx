import { useState, useEffect } from 'react'
import { X, Play, ArrowRight, CheckCircle2, Sparkles, Layers, SlidersHorizontal, FileBarChart } from 'lucide-react'

interface DemoStep {
  time: string
  title: string
  description: string
  icon: typeof Sparkles
  previewHighlight: string
}

const demoSteps: DemoStep[] = [
  {
    time: '00:00',
    title: 'Multi-Channel Ingestion',
    description: 'Ingesting tickets from Zendesk, App Store reviews, Intercom chats, and survey forms via webhooks.',
    icon: Sparkles,
    previewHighlight: '1,482 unstructured records normalized into unified customer signal stream.',
  },
  {
    time: '00:15',
    title: 'Semantic Clustering',
    description: 'Vector embeddings group scattered comments into recurring friction themes without keyword bias.',
    icon: Layers,
    previewHighlight: 'Extracted cluster: #AUTH-01 "SAML SSO redirect loop on session expiry".',
  },
  {
    time: '00:30',
    title: 'Deterministic Prioritization',
    description: 'Multi-factor algorithm calculates reproducible 0-100 priority score based on frequency, severity, and ARR.',
    icon: SlidersHorizontal,
    previewHighlight: 'Priority 94.2/100 · Critical status · 22 enterprise accounts ($420k ARR) protected.',
  },
  {
    time: '00:45',
    title: 'Counterfactual Simulation',
    description: 'Adjust organizational decision sliders to forecast what-if priority shifts before allocating sprint capacity.',
    icon: SlidersHorizontal,
    previewHighlight: 'Simulation: +20% severity weighting highlights core checkout stability bugs.',
  },
  {
    time: '01:00',
    title: 'Verbatim Executive Readout',
    description: 'Generate polished leadership briefs with 100% traceable customer quotes and instant CSV/JSON exports.',
    icon: FileBarChart,
    previewHighlight: 'Export brief ready for Monday product leadership review.',
  },
]

export function DemoModal({
  isOpen,
  onClose,
  onLaunchApp,
}: {
  isOpen: boolean
  onClose: () => void
  onLaunchApp: () => void
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isOpen || !isPlaying) return
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % demoSteps.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isOpen, isPlaying])

  if (!isOpen) return null

  const step = demoSteps[activeStepIndex]
  const StepIcon = step.icon

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="demo-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 10px #8B5CF6' }} />
            <span className="demo-modal-title">Vanta Signal OS · Interactive Product Walkthrough</span>
          </div>
          <button className="demo-modal-close" onClick={onClose} aria-label="Close demo">
            <X size={20} />
          </button>
        </div>

        <div className="demo-modal-body">
          {/* Simulated Screen Preview */}
          <div className="demo-screen-preview">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38BDF8', fontSize: 12, fontWeight: 600 }}>
                <StepIcon size={16} />
                CHAPTER {activeStepIndex + 1} OF 5 · {step.time}
              </div>
              <button
                className="convergence-replay-btn"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Pause Autoplay' : 'Resume Play'}
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '24px 20px' }}>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#F5F5F7', margin: '0 0 12px' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 15, color: '#8A8F98', maxWidth: 540, margin: '0 auto 20px', lineHeight: 1.5 }}>
                {step.description}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '8px 16px',
                  borderRadius: 6,
                  color: '#A78BFA',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={16} color="#34D399" />
                {step.previewHighlight}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <span style={{ fontSize: 12, color: '#646873' }}>
                Press any step below to jump directly to that chapter
              </span>
              <button
                className="vanta-btn-primary"
                onClick={() => {
                  onClose()
                  onLaunchApp()
                }}
              >
                Open Live Workspace <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Timeline Steps */}
          <div className="demo-timeline-steps">
            {demoSteps.map((st, i) => {
              const isActive = i === activeStepIndex
              return (
                <button
                  key={i}
                  className={`demo-step-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveStepIndex(i)
                    setIsPlaying(false)
                  }}
                >
                  <span className="demo-step-time">{st.time}</span>
                  <span className="demo-step-label">{st.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
