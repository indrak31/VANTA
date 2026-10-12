import { useState, useMemo } from 'react'
import {
  SlidersHorizontal,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react'

interface SimIssue {
  id: string
  title: string
  area: string
  owner: string
  // Factor scores 0-100
  frequency: number
  severity: number
  growth: number
  recency: number
  businessImpact: number
  baselineRank: number
  affectedAccounts: number
  evidenceQuote: string
}

const initialIssues: SimIssue[] = [
  {
    id: 'AUTH-01',
    title: 'SAML SSO redirect loop upon token expiration',
    area: 'Security & Auth',
    owner: 'Maya Chen',
    frequency: 68,
    severity: 98,
    growth: 82,
    recency: 94,
    businessImpact: 96, // Huge enterprise ARR
    baselineRank: 1,
    affectedAccounts: 22,
    evidenceQuote: 'Okta enterprise login loops infinitely for our 1,400 employees when sessions expire.',
  },
  {
    id: 'PERF-02',
    title: 'Workspace query timeout on datasets > 50k rows',
    area: 'Core Workspace',
    owner: 'Ibrahim Shah',
    frequency: 92, // Very frequent
    severity: 78,
    growth: 65,
    recency: 70,
    businessImpact: 84,
    baselineRank: 2,
    affectedAccounts: 38,
    evidenceQuote: 'Queries take 14+ seconds and occasionally time out when running Q3 cohort comparisons.',
  },
  {
    id: 'UX-03',
    title: 'Transcript search misses inline conversational quotes',
    area: 'Search Engine',
    owner: 'Sofia Alvarez',
    frequency: 85,
    severity: 64,
    growth: 52,
    recency: 60,
    businessImpact: 72,
    baselineRank: 3,
    affectedAccounts: 29,
    evidenceQuote: 'We find the recording title easily, but can never jump to the timestamp where the customer mentioned pricing.',
  },
  {
    id: 'COMP-04',
    title: 'Missing statutory VAT tax breakdown in PDF invoices',
    area: 'Billing & Compliance',
    owner: 'Maya Chen',
    frequency: 45,
    severity: 70,
    growth: 90, // Fast growing recently
    recency: 88,
    businessImpact: 89,
    baselineRank: 4,
    affectedAccounts: 14,
    evidenceQuote: 'European accounting teams rejected the monthly invoice because line-item VAT isn’t separated.',
  },
  {
    id: 'ONB-05',
    title: 'First-run onboarding checklist disappears prematurely',
    area: 'Activation Flow',
    owner: 'Sofia Alvarez',
    frequency: 72,
    severity: 42,
    growth: 38,
    recency: 44,
    businessImpact: 50,
    baselineRank: 5,
    affectedAccounts: 18,
    evidenceQuote: 'New team members cannot locate the setup steps once they dismiss the initial modal.',
  },
]

export function PrioritizationSimulatorSection() {
  const [wFrequency, setWFrequency] = useState(25)
  const [wSeverity, setWSeverity] = useState(30)
  const [wGrowth, setWGrowth] = useState(15)
  const [wRecency, setWRecency] = useState(15)
  const [wBusinessImpact, setWBusinessImpact] = useState(15)

  const [activeIssueId, setActiveIssueId] = useState(initialIssues[0].id)

  const rankedIssues = useMemo(() => {
    const totalWeight = wFrequency + wSeverity + wGrowth + wRecency + wBusinessImpact || 1

    const scored = initialIssues.map((issue) => {
      const score = Math.round(
        (issue.frequency * wFrequency +
          issue.severity * wSeverity +
          issue.growth * wGrowth +
          issue.recency * wRecency +
          issue.businessImpact * wBusinessImpact) /
          totalWeight
      )
      return { ...issue, currentScore: score }
    })

    scored.sort((a, b) => b.currentScore - a.currentScore)

    return scored.map((item, index) => {
      const currentRank = index + 1
      const delta = item.baselineRank - currentRank // positive means climbed up
      return {
        ...item,
        currentRank,
        rankDelta: delta,
      }
    })
  }, [wFrequency, wSeverity, wGrowth, wRecency, wBusinessImpact])

  const explanation = useMemo(() => {
    if (wBusinessImpact >= 35) {
      return 'Prioritizing Business Impact ARR elevates enterprise-tier blockers (like SAML SSO and EU Billing Compliance) over raw mention frequency.'
    }
    if (wSeverity >= 35) {
      return 'Prioritizing Severity pushes critical failure modes to the top, safeguarding core customer uptime and trust.'
    }
    if (wFrequency >= 35) {
      return 'Prioritizing Frequency highlights widespread operational friction affecting the largest number of day-to-day users.'
    }
    if (wGrowth >= 25) {
      return 'Prioritizing Growth Velocity detects emerging issues early before they scale into systemic enterprise complaints.'
    }
    return 'Balanced multi-factor weighting distributes priority objectively across urgency, reach, and financial risk.'
  }, [wFrequency, wSeverity, wGrowth, wRecency, wBusinessImpact])

  const selectedIssue = rankedIssues.find((i) => i.id === activeIssueId) || rankedIssues[0]

  return (
    <section className="landing-section" id="how-it-works">
      <div className="section-header">
        <span className="section-eyebrow">Deterministic Decision Engine</span>
        <h2 className="section-title">See what matters. Change what happens next.</h2>
        <p className="section-subtitle">
          Customer priorities shouldn’t be a black box. Adjust the decision weights below to recalibrate issue rankings in real-time using our verifiable, multi-factor priority algorithm.
        </p>
      </div>

      <div className="simulator-container">
        <div className="simulator-layout">
          {/* Controls Panel */}
          <div className="simulator-controls-panel">
            <div className="simulator-formula-box">
              <span>PRIORITY = ∑(factor × weight) ÷ ∑(weights)</span>
              <span style={{ color: '#38BDF8' }}>100% REPRODUCIBLE</span>
            </div>

            {/* Slider 1: Frequency */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span>Occurrence Frequency</span>
                <span className="slider-weight-badge">{wFrequency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={wFrequency}
                onChange={(e) => setWFrequency(Number(e.target.value))}
                className="vanta-range-input"
              />
              <p className="slider-desc">How often the friction appears across tickets, surveys, and chats.</p>
            </div>

            {/* Slider 2: Severity */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span>Friction Severity</span>
                <span className="slider-weight-badge">{wSeverity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={wSeverity}
                onChange={(e) => setWSeverity(Number(e.target.value))}
                className="vanta-range-input"
              />
              <p className="slider-desc">Direct customer workflow disruption, downtime, and frustration index.</p>
            </div>

            {/* Slider 3: Growth Velocity */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span>Growth Velocity</span>
                <span className="slider-weight-badge">{wGrowth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={wGrowth}
                onChange={(e) => setWGrowth(Number(e.target.value))}
                className="vanta-range-input"
              />
              <p className="slider-desc">Week-over-week acceleration of new customer mentions.</p>
            </div>

            {/* Slider 4: Recency */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span>Recency Weight</span>
                <span className="slider-weight-badge">{wRecency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={wRecency}
                onChange={(e) => setWRecency(Number(e.target.value))}
                className="vanta-range-input"
              />
              <p className="slider-desc">Heavier weighting for signals logged within the past 7 days.</p>
            </div>

            {/* Slider 5: Business Impact */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span>Enterprise Business Impact</span>
                <span className="slider-weight-badge">{wBusinessImpact}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={wBusinessImpact}
                onChange={(e) => setWBusinessImpact(Number(e.target.value))}
                className="vanta-range-input"
              />
              <p className="slider-desc">Customer contract value (ARR at risk) and account tier weighting.</p>
            </div>

            <button
              className="vanta-btn-secondary"
              onClick={() => {
                setWFrequency(25)
                setWSeverity(30)
                setWGrowth(15)
                setWRecency(15)
                setWBusinessImpact(15)
              }}
              style={{ justifyContent: 'center', marginTop: 4 }}
            >
              Reset to Recommended Baseline
            </button>
          </div>

          {/* Results Panel */}
          <div className="simulator-results-panel">
            <div className="simulator-meta-notice">
              <Info size={16} color="#A78BFA" style={{ flexShrink: 0 }} />
              <span>{explanation}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rankedIssues.map((iss) => {
                const isActive = iss.id === selectedIssue.id
                return (
                  <div
                    key={iss.id}
                    className={`simulated-issue-row ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveIssueId(iss.id)}
                  >
                    <div className="sim-rank-box">
                      <span className="sim-rank-num">#{iss.currentRank}</span>
                      {iss.rankDelta > 0 && (
                        <span className="sim-rank-delta" style={{ color: '#34D399' }}>
                          ▲ +{iss.rankDelta}
                        </span>
                      )}
                      {iss.rankDelta < 0 && (
                        <span className="sim-rank-delta" style={{ color: '#F87171' }}>
                          ▼ {iss.rankDelta}
                        </span>
                      )}
                      {iss.rankDelta === 0 && (
                        <span className="sim-rank-delta" style={{ color: '#8A8F98' }}>
                          —
                        </span>
                      )}
                    </div>

                    <div className="sim-issue-body">
                      <div className="sim-issue-title">{iss.title}</div>
                      <div className="sim-issue-rationale">
                        {iss.affectedAccounts} accounts affected · Area: {iss.area}
                      </div>
                    </div>

                    <div className="sim-score-box">
                      <span className="sim-score-val">{iss.currentScore}</span>
                      <span className="sim-score-label">Priority Score</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Issue Verbatim Citation Card */}
            <div
              style={{
                background: '#131620',
                border: '1px solid var(--vanta-border-accent)',
                borderRadius: 8,
                padding: 16,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#A78BFA',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Selected Issue Verbatim Evidence ({selectedIssue.id})
                </span>
                <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 600 }}>
                  Owner: {selectedIssue.owner}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: '#F5F5F7',
                  fontStyle: 'italic',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                "{selectedIssue.evidenceQuote}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
