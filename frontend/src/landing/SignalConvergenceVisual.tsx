import { useState, useEffect } from 'react'
import {
  Sparkles,
  RefreshCw,
  Shield,
  Activity,
  Layers,
  Zap,
} from 'lucide-react'

interface SignalSnippet {
  id: string
  source: string
  severity: 'critical' | 'high' | 'medium'
  channel: string
  text: string
  cluster: string
  score: number
  action: string
  metrics: { volume: string; risk: string; confidence: string }
}

const snippets: SignalSnippet[] = [
  {
    id: 'sig-01',
    source: 'Zendesk #492',
    channel: 'Enterprise Support',
    severity: 'critical',
    text: 'SAML SSO redirect loop occurs repeatedly for Okta enterprise users upon token refresh.',
    cluster: 'Authentication & Session Integrity',
    score: 94.2,
    action: 'Patch OAuth redirect callback handler & hotfix build 3.14.2 immediately.',
    metrics: { volume: '31 mentions', risk: 'High ($420k ARR)', confidence: '96% confidence' },
  },
  {
    id: 'sig-02',
    source: 'App Store (iOS)',
    channel: 'Mobile Review',
    severity: 'high',
    text: 'Checkout crash occurs on iOS 18 when attempting biometric Apple Pay authorization.',
    cluster: 'Mobile Checkout Flow',
    score: 88.5,
    action: 'Align PassKit PKPaymentAuthorizationController with iOS 18 runtime delegate.',
    metrics: { volume: '24 mentions', risk: 'Medium (App Rating)', confidence: '92% confidence' },
  },
  {
    id: 'sig-03',
    source: 'Intercom Chat',
    channel: 'Customer Success',
    severity: 'medium',
    text: 'Exported billing invoices in PDF format lack statutory VAT breakdown line items.',
    cluster: 'Billing & Compliance Exports',
    score: 76.1,
    action: 'Update invoice PDF generator template with localized VAT tax schemas.',
    metrics: { volume: '14 mentions', risk: 'Medium (EU Accounts)', confidence: '88% confidence' },
  },
  {
    id: 'sig-04',
    source: 'Discord Community',
    channel: 'Developer Feedback',
    severity: 'medium',
    text: 'Need batch CSV export endpoint for security compliance audit log verification.',
    cluster: 'Audit Logging & APIs',
    score: 71.4,
    action: 'Expose /v1/audit/logs/export with streaming CSV download format.',
    metrics: { volume: '11 mentions', risk: 'Low (Dev Tier)', confidence: '85% confidence' },
  },
]

export function SignalConvergenceVisual() {
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0)
  const [processingState, setProcessingState] = useState<'converging' | 'processing' | 'resolved'>('resolved')
  const [replayKey, setReplayKey] = useState(0)

  const activeSnippet = snippets[activeSnippetIndex]

  const triggerReplay = () => {
    setProcessingState('converging')
    setReplayKey((prev) => prev + 1)
    setTimeout(() => {
      setProcessingState('processing')
    }, 900)
    setTimeout(() => {
      setProcessingState('resolved')
    }, 1800)
  }

  // Automatic gentle rotation if untouched
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSnippetIndex((prev) => (prev + 1) % snippets.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [replayKey])

  return (
    <div className="convergence-wrapper" id="signal-convergence">
      <div className="convergence-header">
        <div className="convergence-title-group">
          <Sparkles size={16} color="#A78BFA" />
          <span className="convergence-title">Active Signal Convergence</span>
          <span className="convergence-status-pill">
            <span className="status-dot-active" />
            {processingState === 'converging'
              ? 'Ingesting 4 channels...'
              : processingState === 'processing'
              ? 'Clustering & Scoring...'
              : 'Live Intelligence Synced'}
          </span>
        </div>
        <div className="convergence-actions">
          <button className="convergence-replay-btn" onClick={triggerReplay} title="Replay signal convergence flow">
            <RefreshCw size={12} className={processingState !== 'resolved' ? 'spin-icon' : ''} />
            Replay Flow
          </button>
        </div>
      </div>

      <div className="convergence-canvas">
        {/* Left: Interactive Snippets */}
        <div className="convergence-snippets-column">
          {snippets.map((snip, index) => {
            const isActive = index === activeSnippetIndex
            return (
              <div
                key={snip.id}
                className={`snippet-card ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveSnippetIndex(index)
                  setProcessingState('processing')
                  setTimeout(() => setProcessingState('resolved'), 500)
                }}
              >
                <div className="snippet-top">
                  <span className="snippet-source">{snip.source}</span>
                  <span className={`snippet-severity severity-${snip.severity}`}>
                    {snip.severity}
                  </span>
                </div>
                <p className="snippet-text">{snip.text}</p>
                <span className="snippet-target-dot" />
              </div>
            )
          })}
        </div>

        {/* Middle: Luminous Animated SVG Flow */}
        <svg className="svg-flow-container" viewBox="0 0 140 480">
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#C084FC" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="idleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.25)" />
            </linearGradient>
          </defs>

          {/* Paths connecting each of the 4 cards (approx y: 50, 160, 270, 380) to center node (x: 130, y: 240) */}
          {[
            { y: 55, idx: 0 },
            { y: 165, idx: 1 },
            { y: 275, idx: 2 },
            { y: 385, idx: 3 },
          ].map(({ y, idx }) => {
            const isCardActive = idx === activeSnippetIndex
            return (
              <path
                key={idx}
                d={`M 0,${y} C 70,${y} 80,240 140,240`}
                className={`flow-path ${isCardActive ? 'flow-path-active' : ''}`}
              />
            )
          })}
        </svg>

        {/* Right: Central Intelligence Node & Dashboard Preview */}
        <div className="convergence-stage-column">
          <div className="intelligence-node">
            <div className="node-pulse-ring" />
            <div className="node-pulse-ring-outer" />
            <div className="node-core" title="Vanta Intelligence Processing Core">
              <Zap size={22} />
            </div>
          </div>

          <div className="convergence-output-card">
            <div className="output-tag">
              <Layers size={12} />
              Semantic Cluster Identified
            </div>
            <div className="output-issue-title">{activeSnippet.cluster}</div>

            <div className="output-metrics-row">
              <div className="output-metric-item">
                <small>Priority Score</small>
                <strong style={{ color: activeSnippet.score > 90 ? '#F87171' : '#38BDF8' }}>
                  {activeSnippet.score}/100
                </strong>
              </div>
              <div className="output-metric-item">
                <small>Signal Volume</small>
                <strong>{activeSnippet.metrics.volume}</strong>
              </div>
              <div className="output-metric-item">
                <small>Confidence</small>
                <strong style={{ color: '#34D399' }}>{activeSnippet.metrics.confidence}</strong>
              </div>
            </div>

            <div className="output-action">
              <strong style={{ color: '#F5F5F7', display: 'block', marginBottom: 2 }}>
                Deterministic Action:
              </strong>
              {activeSnippet.action}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
