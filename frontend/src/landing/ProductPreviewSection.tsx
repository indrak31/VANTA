import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import {
  Filter,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Layers,
} from 'lucide-react'

type TimeRange = '7d' | '30d' | '90d'
type ChannelFilter = 'all' | 'support' | 'surveys' | 'interviews'

interface DatasetPoint {
  date: string
  mentions: number
  sentiment: number
  resolved: number
}

const timeSeriesData: Record<TimeRange, DatasetPoint[]> = {
  '7d': [
    { date: 'Mon', mentions: 18, sentiment: 48, resolved: 12 },
    { date: 'Tue', mentions: 24, sentiment: 52, resolved: 16 },
    { date: 'Wed', mentions: 32, sentiment: 61, resolved: 22 },
    { date: 'Thu', mentions: 28, sentiment: 59, resolved: 20 },
    { date: 'Fri', mentions: 41, sentiment: 68, resolved: 31 },
    { date: 'Sat', mentions: 15, sentiment: 72, resolved: 14 },
    { date: 'Sun', mentions: 19, sentiment: 75, resolved: 17 },
  ],
  '30d': [
    { date: 'W1', mentions: 124, sentiment: 42, resolved: 85 },
    { date: 'W2', mentions: 158, sentiment: 51, resolved: 110 },
    { date: 'W3', mentions: 192, sentiment: 64, resolved: 145 },
    { date: 'W4', mentions: 168, sentiment: 71, resolved: 138 },
  ],
  '90d': [
    { date: 'Aug', mentions: 490, sentiment: 38, resolved: 340 },
    { date: 'Sep', mentions: 610, sentiment: 54, resolved: 480 },
    { date: 'Oct', mentions: 780, sentiment: 69, resolved: 650 },
  ],
}

const themeDistributions: Record<ChannelFilter, { name: string; count: number; color: string }[]> = {
  all: [
    { name: 'Response Latency', count: 48, color: '#8B5CF6' },
    { name: 'Search Precision', count: 36, color: '#38BDF8' },
    { name: 'Onboarding Flow', count: 28, color: '#A78BFA' },
    { name: 'Data Governance', count: 22, color: '#60A5FA' },
    { name: 'Export Formatting', count: 18, color: '#818CF8' },
  ],
  support: [
    { name: 'Response Latency', count: 34, color: '#8B5CF6' },
    { name: 'Search Precision', count: 29, color: '#38BDF8' },
    { name: 'Data Governance', count: 18, color: '#60A5FA' },
    { name: 'Export Formatting', count: 12, color: '#818CF8' },
  ],
  surveys: [
    { name: 'Onboarding Flow', count: 22, color: '#A78BFA' },
    { name: 'Response Latency', count: 14, color: '#8B5CF6' },
    { name: 'Export Formatting', count: 10, color: '#818CF8' },
  ],
  interviews: [
    { name: 'Data Governance', count: 16, color: '#60A5FA' },
    { name: 'Response Latency', count: 14, color: '#8B5CF6' },
    { name: 'Search Precision', count: 12, color: '#38BDF8' },
  ],
}

const sampleIssues = [
  {
    id: 'ISSUE-01',
    title: 'Slow and opaque response states',
    area: 'Workspace',
    priority: 91,
    severity: 'Critical',
    affected: 18,
    owner: 'Maya Chen',
    quote: '"We lose confidence when an answer takes more than a few seconds without progress."',
  },
  {
    id: 'ISSUE-02',
    title: 'Search misses transcript context',
    area: 'Search Retrieval',
    priority: 84,
    severity: 'High',
    affected: 15,
    owner: 'Ibrahim Shah',
    quote: '"Search finds the title but not the useful sentence inside the interview transcript."',
  },
  {
    id: 'ISSUE-03',
    title: 'Onboarding guidance fades too early',
    area: 'Onboarding',
    priority: 76,
    severity: 'Medium',
    affected: 11,
    owner: 'Sofia Alvarez',
    quote: '"The first-run checklist disappears before new teammates finish workspace setup."',
  },
]

export function ProductPreviewSection({ onExploreApp }: { onExploreApp: () => void }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [channel, setChannel] = useState<ChannelFilter>('all')
  const [selectedIssue, setSelectedIssue] = useState(sampleIssues[0])

  const chartSeries = useMemo(() => timeSeriesData[timeRange], [timeRange])
  const themeData = useMemo(() => themeDistributions[channel], [channel])

  const totalMentions = useMemo(() => {
    return chartSeries.reduce((acc, curr) => acc + curr.mentions, 0)
  }, [chartSeries])

  const avgSentiment = useMemo(() => {
    const sum = chartSeries.reduce((acc, curr) => acc + curr.sentiment, 0)
    return Math.round(sum / chartSeries.length)
  }, [chartSeries])

  return (
    <section className="landing-section" id="product">
      <div className="section-header">
        <span className="section-eyebrow">Interactive Product Intelligence</span>
        <h2 className="section-title">The full fidelity of customer signal</h2>
        <p className="section-subtitle">
          Explore a live interactive preview of the Vanta Signal OS. Change the time horizon or ingestion channel to see instant recalculations across volume, sentiment trends, and prioritized actions.
        </p>
      </div>

      <div className="preview-board">
        {/* Toolbar with active filters */}
        <div className="preview-toolbar">
          <div className="preview-pill-notice">
            ILLUSTRATIVE DEMO DATA · SYNTHETIC WORKSPACE
          </div>

          <div className="preview-filters-group">
            {/* Time horizon */}
            {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                className={`preview-filter-btn ${timeRange === r ? 'active' : ''}`}
                onClick={() => setTimeRange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

            {/* Channels */}
            {(['all', 'support', 'surveys', 'interviews'] as ChannelFilter[]).map((ch) => (
              <button
                key={ch}
                className={`preview-filter-btn ${channel === ch ? 'active' : ''}`}
                onClick={() => setChannel(ch)}
              >
                {ch === 'all'
                  ? 'All Channels'
                  : ch.charAt(0).toUpperCase() + ch.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="preview-stats-grid">
          <div className="preview-stat-card">
            <div className="stat-card-title">Total Signals Analyzed</div>
            <div className="stat-card-val">
              {totalMentions.toLocaleString()}
              <span className="stat-card-delta delta-pos">+18.4%</span>
            </div>
          </div>

          <div className="preview-stat-card">
            <div className="stat-card-title">Net Customer Sentiment</div>
            <div className="stat-card-val">
              {avgSentiment}%
              <span className="stat-card-delta delta-pos">+12 pts</span>
            </div>
          </div>

          <div className="preview-stat-card">
            <div className="stat-card-title">Active Critical Issues</div>
            <div className="stat-card-val">
              {channel === 'all' ? 3 : 2}
              <span className="stat-card-delta delta-neg">Urgent</span>
            </div>
          </div>

          <div className="preview-stat-card">
            <div className="stat-card-title">Evidence Confidence</div>
            <div className="stat-card-val">
              91.8%
              <span className="stat-card-delta delta-pos">Verified</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="preview-charts-grid">
          {/* Signal Volume & Sentiment Trend Area Chart */}
          <div className="preview-chart-box">
            <div className="preview-chart-header">
              <h4>Signal Momentum & Resolution Velocity</h4>
              <span style={{ fontSize: 11, color: '#8A8F98' }}>Window: {timeRange}</span>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mentionsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="sentimentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#646873" fontSize={11} tickLine={false} />
                  <YAxis stroke="#646873" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0E1017',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#F5F5F7',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mentions"
                    name="Signal Ingested"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#mentionsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sentiment"
                    name="Resolution %"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#sentimentGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Theme Breakdown Bar Chart */}
          <div className="preview-chart-box">
            <div className="preview-chart-header">
              <h4>Top Recurring Friction Themes</h4>
              <span style={{ fontSize: 11, color: '#8A8F98' }}>Channel: {channel}</span>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={themeData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#646873" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#8A8F98" fontSize={11} tickLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0E1017',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#F5F5F7',
                    }}
                  />
                  <Bar dataKey="count" name="Mention Frequency" radius={[0, 4, 4, 0]}>
                    {themeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Interactive Issues Table & Action Drawer */}
        <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <div style={{ background: '#131620', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7' }}>Prioritized Issues (Deterministic Rank)</span>
              <span style={{ fontSize: 11, color: '#8A8F98' }}>Click row to inspect citation</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sampleIssues.map((iss) => {
                const isSelected = selectedIssue.id === iss.id
                return (
                  <div
                    key={iss.id}
                    onClick={() => setSelectedIssue(iss)}
                    style={{
                      background: isSelected ? '#181C28' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 6,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all .15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>{iss.id}</span>
                        <strong style={{ fontSize: 13, color: '#F5F5F7' }}>{iss.title}</strong>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: iss.severity === 'Critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: iss.severity === 'Critical' ? '#F87171' : '#FBBF24',
                          }}
                        >
                          {iss.severity}
                        </span>
                      </div>
                      <small style={{ color: '#8A8F98', fontSize: 11 }}>
                        {iss.affected} enterprise accounts affected · Assigned to {iss.owner}
                      </small>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#38BDF8' }}>{iss.priority}</span>
                      <small style={{ display: 'block', fontSize: 9.5, color: '#646873', textTransform: 'uppercase' }}>Score</small>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Evidence Citation Inspector Card */}
          <div style={{ background: '#131620', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                <Sparkles size={13} />
                Verbatim Customer Evidence
              </div>
              <h5 style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F7', margin: '0 0 10px' }}>
                {selectedIssue.title}
              </h5>
              <p style={{ fontSize: 13, color: '#8A8F98', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid #8B5CF6', padding: '10px 12px', borderRadius: '0 6px 6px 0', margin: 0 }}>
                {selectedIssue.quote}
              </p>

              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 11.5 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 4 }}>
                  <span style={{ color: '#646873', display: 'block' }}>Impact Area</span>
                  <strong style={{ color: '#F5F5F7' }}>{selectedIssue.area}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 4 }}>
                  <span style={{ color: '#646873', display: 'block' }}>Deterministic Action</span>
                  <strong style={{ color: '#34D399' }}>Deploy Progress Rail</strong>
                </div>
              </div>
            </div>

            <button
              className="vanta-btn-secondary"
              onClick={onExploreApp}
              style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
            >
              Open Full Analysis in Workspace <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
