import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Layers,
  Terminal,
  Activity,
  Cpu,
} from 'lucide-react'

interface SignalSnippet {
  id: string
  source: string
  channel: string
  severity: 'critical' | 'high' | 'medium'
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
    }, 700)
    setTimeout(() => {
      setProcessingState('resolved')
    }, 1500)
  }

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
          <Terminal size={14} color="#94A3B8" />
          <span className="convergence-title">Active Signal Pipeline</span>
          <span className="convergence-status-pill">
            <span className="status-dot-active" />
            {processingState === 'converging'
              ? 'Routing 4 Ingestion Feeds'
              : processingState === 'processing'
              ? 'Vector Clustering...'
              : 'Pipeline Live · 100% Deterministic'}
          </span>
        </div>
        <div className="convergence-actions">
          <button className="convergence-replay-btn" onClick={triggerReplay} title="Replay signal routing sequence">
            <RefreshCw size={11} className={processingState !== 'resolved' ? 'spin-icon' : ''} />
            Replay Stream
          </button>
        </div>
      </div>

      <div className="convergence-canvas">
        {/* Left: Input Feed Snippets */}
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
                  setTimeout(() => setProcessingState('resolved'), 400)
                }}
              >
                <div className="snippet-top">
                  <span className="snippet-source">{snip.source}</span>
                  <span className={`snippet-severity severity-${snip.severity}`}>
                    {snip.severity.toUpperCase()}
                  </span>
                </div>
                <p className="snippet-text">{snip.text}</p>
                <span className="snippet-target-dot" />
              </div>
            )
          })}
        </div>

        {/* Middle: Clean High-Precision Technical SVG Bus */}
        <svg className="svg-flow-container" viewBox="0 0 130 460">
          {[
            { y: 50, idx: 0 },
            { y: 155, idx: 1 },
            { y: 260, idx: 2 },
            { y: 365, idx: 3 },
          ].map(({ y, idx }) => {
            const isCardActive = idx === activeSnippetIndex
            return (
              <path
                key={idx}
                d={`M 0,${y} C 65,${y} 75,230 130,230`}
                className={`flow-path ${isCardActive ? 'flow-path-active' : ''}`}
              />
            )
          })}
        </svg>

        {/* Right: Decision Routing Core & Output */}
        <div className="convergence-stage-column">
          <div className="intelligence-node">
            <div className="node-pulse-ring" />
            <div className="node-core" title="Vanta Decision Matrix Engine">
              <Cpu size={20} />
            </div>
          </div>

          <div className="convergence-output-card">
            <div className="output-tag">
              <Layers size={11} />
              Semantic Cluster Identified
            </div>
            <div className="output-issue-title">{activeSnippet.cluster}</div>

            <div className="output-metrics-row">
              <div className="output-metric-item">
                <small>Priority Score</small>
                <strong style={{ color: activeSnippet.score > 90 ? '#EF4444' : '#FFFFFF' }}>
                  {activeSnippet.score}/100
                </strong>
              </div>
              <div className="output-metric-item">
                <small>Signal Volume</small>
                <strong>{activeSnippet.metrics.volume}</strong>
              </div>
              <div className="output-metric-item">
                <small>Confidence</small>
                <strong style={{ color: '#10B981' }}>{activeSnippet.metrics.confidence}</strong>
              </div>
            </div>

            <div className="output-action">
              <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: 2 }}>
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
