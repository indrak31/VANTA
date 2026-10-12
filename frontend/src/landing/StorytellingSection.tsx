import { useState } from 'react'
import {
  Check,
  Database,
} from 'lucide-react'

// Section A: Semantic Clusters
const clusters = [
  {
    id: 'c-auth',
    name: 'Authentication & Session Integrity',
    count: 31,
    similarity: '94.8% semantic match',
    snippets: [
      'SAML SSO redirect loop upon session expiration',
      'Okta authentication failing for multi-tenant users',
      'Need persistent session timeout warnings',
    ],
  },
  {
    id: 'c-search',
    name: 'Search Retrieval Precision',
    count: 26,
    similarity: '91.2% semantic match',
    snippets: [
      'Search matches the document title but skips transcript body',
      'Cannot filter search results by customer segment or tier',
      'Takes 4 clicks to jump to audio recording timestamp',
    ],
  },
  {
    id: 'c-perf',
    name: 'Workspace Latency & Run States',
    count: 22,
    similarity: '89.6% semantic match',
    snippets: [
      'No loading indicator when multi-agent analysis runs',
      'Query times out when processing past 30-day window',
      'Need visible run state to verify background execution',
    ],
  },
  {
    id: 'c-gov',
    name: 'Enterprise Governance & Filtering',
    count: 14,
    similarity: '86.4% semantic match',
    snippets: [
      'Restricted customer notes mixed with general product signal',
      'Compliance requires HIPAA PII redaction before clustering',
      'Need role-based permissions on raw feedback exports',
    ],
  },
]

// Section B: Issues to Decisions
const decisionIssues = [
  {
    id: 'REC-01',
    issueTitle: 'Slow and opaque response states',
    recommendation: 'Deploy persistent progress rail with time-to-result estimation',
    sourceQuote: '“The workspace is powerful, but we lose confidence when an answer takes more than a few seconds. A visible run state would help our team understand what is happening.”',
    account: 'Northstar Health · VP Operations',
    channel: 'Executive Customer Interview',
    impact: 'Protects enterprise adoption & trust',
    confidence: '89% verified evidence',
  },
  {
    id: 'REC-02',
    issueTitle: 'Search misses transcript context',
    recommendation: 'Index passage-level transcripts with highlighted matching context',
    sourceQuote: '“Search finds the title but not the useful sentence inside a transcript. We still open four records to find one detail.”',
    account: 'Pine & Co · Customer Success Lead',
    channel: 'Zendesk Ticket #1038',
    impact: 'Cuts evidence gathering time by 45%',
    confidence: '86% verified evidence',
  },
  {
    id: 'REC-03',
    issueTitle: 'Onboarding guidance fades too early',
    recommendation: 'Keep dismissible workspace checklist persistent in navigation rail',
    sourceQuote: '“I understand the initial setup, but the first-run checklist disappears too quickly. New teammates need a more deliberate introduction.”',
    account: 'Atelier Commerce · Head of CX',
    channel: 'Community Feedback',
    impact: 'Increases second-seat activation by 32%',
    confidence: '82% verified evidence',
  },
]

export function StorytellingSection() {
  const [activeCluster, setActiveCluster] = useState(clusters[0])
  const [activeDecision, setActiveDecision] = useState(decisionIssues[0])
  const [lifecycleMode, setLifecycleMode] = useState<'measured' | 'counterfactual'>('measured')

  return (
    <div className="landing-section" id="use-cases">
      <div className="story-narrative-container">
        {/* ============================================================ */}
        {/* SECTION A: From feedback to patterns */}
        {/* ============================================================ */}
        <div className="story-block">
          <div className="story-text-col">
            <span className="story-step-badge">Section 01 · Semantic Ingestion</span>
            <h3 className="story-heading">From scattered noise to unified patterns.</h3>
            <p className="story-copy">
              Customer feedback arrives in fragments: angry tweets, hurried support tickets, sales call transcripts, and quiet survey ratings. Vanta’s semantic engine continuously embeds and groups related customer intent into coherent, quantifiable friction clusters.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#FFFFFF' }}>
                <Check size={14} color="#10B981" /> 0% keyword reliance
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#94A3B8' }}>
                <Check size={14} color="#10B981" /> Vector semantic clustering
              </div>
            </div>
          </div>

          <div className="story-visual-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                Friction Clusters (Click to Inspect)
              </span>
              <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{activeCluster.similarity}</span>
            </div>

            <div className="clusters-grid">
              {clusters.map((c) => {
                const isSelected = c.id === activeCluster.id
                return (
                  <div
                    key={c.id}
                    className={`cluster-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveCluster(c)}
                  >
                    <div className="cluster-header">
                      <span className="cluster-name">{c.name}</span>
                      <span className="cluster-count">{c.count} signals</span>
                    </div>
                    <div className="cluster-quotes-list">
                      {c.snippets.slice(0, isSelected ? 3 : 1).map((snip, i) => (
                        <div key={i} className="cluster-quote-item">
                          "{snip}"
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION B: From patterns to decisions */}
        {/* ============================================================ */}
        <div className="story-block reversed">
          <div className="story-visual-box">
            <div className="evidence-inspector">
              <div className="evidence-header">
                <span className="evidence-source-tag">Verbatim Customer Audit Trail</span>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600, fontFamily: 'monospace' }}>
                  {activeDecision.confidence}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                {decisionIssues.map((d) => (
                  <button
                    key={d.id}
                    className={`preview-filter-btn ${d.id === activeDecision.id ? 'active' : ''}`}
                    onClick={() => setActiveDecision(d)}
                  >
                    {d.id}
                  </button>
                ))}
              </div>

              <div className="evidence-quote-box">
                {activeDecision.sourceQuote}
              </div>

              <div className="evidence-meta-row">
                <span>Account: <strong style={{ color: '#FFFFFF' }}>{activeDecision.account}</strong></span>
                <span>Channel: <strong style={{ color: '#FFFFFF' }}>{activeDecision.channel}</strong></span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--vanta-border)', borderRadius: 5, padding: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 2, fontFamily: 'monospace' }}>
                  Deterministic Recommendation
                </span>
                <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>
                  {activeDecision.recommendation}
                </span>
                <small style={{ display: 'block', color: '#10B981', marginTop: 4 }}>
                  Expected Impact: {activeDecision.impact}
                </small>
              </div>
            </div>
          </div>

          <div className="story-text-col">
            <span className="story-step-badge">Section 02 · Evidence Citation</span>
            <h3 className="story-heading">From patterns to verified decisions.</h3>
            <p className="story-copy">
              Recommendations in Vanta are never synthesized out of thin air. Every proposed product decision links directly to the exact verbatim customer interviews, support tickets, and telemetry records that triggered it.
            </p>
            <p className="story-copy" style={{ color: '#64748B' }}>
              Product leaders can walk into planning meetings with irrefutable proof: what customer said it, how many accounts share the problem, and the quantifiable ARR impact of fixing it.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION C: From decisions to outcomes */}
        {/* ============================================================ */}
        <div className="story-block">
          <div className="story-text-col">
            <span className="story-step-badge">Section 03 · Closed-Loop Lifecycle</span>
            <h3 className="story-heading">Track the complete signal lifecycle.</h3>
            <p className="story-copy">
              Prioritizing an issue is only step one. Vanta tracks issues as they transition into development, measure deployment impact against customer feedback, and verify whether subsequent mentions decrease.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Model projection:</span>
              <button
                className={`preview-filter-btn ${lifecycleMode === 'measured' ? 'active' : ''}`}
                onClick={() => setLifecycleMode('measured')}
              >
                Actual Measured Reality
              </button>
              <button
                className={`preview-filter-btn ${lifecycleMode === 'counterfactual' ? 'active' : ''}`}
                onClick={() => setLifecycleMode('counterfactual')}
              >
                Counterfactual Scenario
              </button>
            </div>
          </div>

          <div className="story-visual-box">
            <div className="lifecycle-timeline">
              <div className="lifecycle-step completed">
                <span className="step-num">Stage 01</span>
                <span className="step-title">Detect & Cluster</span>
                <span className="step-sub">31 mentions grouped into #AUTH-01</span>
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>Completed</span>
              </div>

              <div className="lifecycle-step completed">
                <span className="step-num">Stage 02</span>
                <span className="step-title">Prioritize & Assign</span>
                <span className="step-sub">Rank #1 · Priority 94.2/100 · Maya Chen</span>
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>Completed</span>
              </div>

              <div className="lifecycle-step active">
                <span className="step-num">Stage 03</span>
                <span className="step-title">Deploy Patch</span>
                <span className="step-sub">v3.14.2 OAuth token refresh fix shipped</span>
                <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 600 }}>Active</span>
              </div>

              <div className="lifecycle-step">
                <span className="step-num">Stage 04</span>
                <span className="step-title">Measure Signal Delta</span>
                <span className="step-sub">
                  {lifecycleMode === 'measured'
                    ? 'Subsequent SSO tickets dropped by 84%'
                    : 'Projected -75% ticket volume reduction'}
                </span>
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                  {lifecycleMode === 'measured' ? 'Verified in Oct' : 'Simulated Forecast'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION D: Adaption Integration */}
        {/* ============================================================ */}
        <div className="story-block reversed" id="adaption">
          <div className="story-visual-box">
            <div className="adaption-dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Database size={15} color="#94A3B8" />
                  <strong style={{ fontSize: 13, color: '#FFFFFF' }}>Adaption Engine Architecture</strong>
                </div>
                <span className="convergence-status-pill">
                  <span className="status-dot-active" />
                  PIPELINE READY
                </span>
              </div>

              <div className="adaption-meta-grid">
                <div className="adaption-meta-item">
                  <small>Active Dataset</small>
                  <strong>ds_vanta_signals_2026</strong>
                </div>
                <div className="adaption-meta-item">
                  <small>Execution Run ID</small>
                  <strong>run_adapt_vanta_q4</strong>
                </div>
                <div className="adaption-meta-item">
                  <small>Clustering Precision</small>
                  <strong style={{ color: '#10B981' }}>94.2% (+18.4%)</strong>
                </div>
                <div className="adaption-meta-item">
                  <small>Citation Grounding</small>
                  <strong style={{ color: '#FFFFFF' }}>99.1% Verbatim</strong>
                </div>
              </div>

              <div className="adaption-pipeline-preview">
                <div>$ adaption pipeline --dataset ds_vanta_signals_2026 --op semantic_cluster</div>
                <div style={{ color: '#10B981' }}>[✓] Extracted 1,482 customer signal embeddings (cosine threshold: 0.88)</div>
                <div style={{ color: '#FFFFFF' }}>[✓] Calibrated multi-factor priority weights against historical churn logs</div>
                <div style={{ color: '#94A3B8' }}>[✓] Evaluation completed: 0 hallucinations detected across 100% of citations</div>
              </div>
            </div>
          </div>

          <div className="story-text-col">
            <span className="story-step-badge">Section 04 · Adaption Pipeline</span>
            <h3 className="story-heading">Domain fine-tuning with genuine Adaption.</h3>
            <p className="story-copy">
              Generic LLMs guess user priorities based on web text. Vanta integrates with Adaption to fine-tune semantic understanding directly on your organization’s genuine customer vernacular, acronyms, and product architecture.
            </p>
            <p className="story-copy" style={{ color: '#64748B' }}>
              Runs execute reproducibly with documented evaluation benchmarks, preventing hallucinated customer quotes and ensuring strict citation fidelity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
