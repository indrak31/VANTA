import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  ExternalLink,
  FileBarChart,
  Filter,
  FlaskConical,
  Gauge,
  Inbox,
  LayoutDashboard,
  Menu,
  PanelRightClose,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  calculatePriority,
  defaultScenario,
  formatDate,
  getPriorityBand,
  seededData,
} from './data'
import {
  createRemoteFeedback,
  getAdaptionAvailability,
  getAdaptionRun,
  importRemoteFeedback,
  loadRemoteData,
  runAdaptionOperation,
} from './api'
import type { AdaptionAvailability, AdaptionRun } from './api'
import type {
  AdaptationExperiment,
  DashboardData,
  FeedbackRecord,
  Issue,
  Recommendation,
  ReportDefinition,
  Scenario,
  ViewKey,
} from './types'
import './styles.css'

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'feedback', label: 'Feedback Explorer', icon: Inbox },
  { key: 'radar', label: 'Issue Radar', icon: Radar },
  { key: 'recommendations', label: 'Recommendations', icon: Sparkles },
  { key: 'simulator', label: 'Counterfactual Simulator', icon: SlidersHorizontal },
  { key: 'adaptation', label: 'Adaption Lab', icon: FlaskConical },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
]

const pageMeta: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: 'Signal operations', title: 'Customer signal, in focus', description: 'A current view of what customers are saying, where risk is moving, and what to do next.' },
  feedback: { eyebrow: 'Evidence layer', title: 'Feedback Explorer', description: 'Search the source language behind every emerging theme and priority.' },
  radar: { eyebrow: 'Prioritization', title: 'Issue Radar', description: 'A deterministic view of customer issues ranked by urgency, reach, and momentum.' },
  recommendations: { eyebrow: 'Decision support', title: 'Recommendations', description: 'Evidence-backed next actions that connect customer language to product work.' },
  simulator: { eyebrow: 'What-if analysis', title: 'Counterfactual Simulator', description: 'Test how changes to the experience could shift issue priority before investing.' },
  adaptation: { eyebrow: 'Learning loop', title: 'Adaption Lab', description: 'Turn promising recommendations into measurable experiments with clear baselines.' },
  reports: { eyebrow: 'Distribution', title: 'Reports', description: 'Package the signal for recurring reviews, stakeholder updates, and planning.' },
}

const chartData = [
  { week: 'Sep 09', mentions: 31, sentiment: 68 },
  { week: 'Sep 16', mentions: 38, sentiment: 64 },
  { week: 'Sep 23', mentions: 43, sentiment: 61 },
  { week: 'Sep 30', mentions: 47, sentiment: 57 },
  { week: 'Oct 07', mentions: 52, sentiment: 54 },
]
const sentimentData = [
  { name: 'Negative', value: 46, color: 'var(--coral)' },
  { name: 'Neutral', value: 29, color: 'var(--muted)' },
  { name: 'Positive', value: 25, color: 'var(--green)' },
]
const chartTooltipStyle = {
  background: 'var(--surface-strong)',
  border: '1px solid var(--line-dark)',
  color: 'var(--ink)',
  borderRadius: 4,
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,.35)',
}

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

type WorkspaceInfo = { id: string; org: string; name: string; count: number }

const initialWorkspaces: WorkspaceInfo[] = [
  { id: 'ws-northstar', org: 'Northstar', name: 'Product', count: 18 },
  { id: 'ws-enterprise', org: 'Enterprise', name: 'Security & Risk', count: 24 },
  { id: 'ws-platform', org: 'Core Platform', name: 'Infrastructure', count: 12 },
]

type RecipientItem = { initials: string; name: string; note: string }

function App() {
  const [view, setView] = useState<ViewKey>(() => {
    const candidate = window.location.hash.slice(1) as ViewKey
    return navItems.some((item) => item.key === candidate) ? candidate : 'overview'
  })
  const [data, setData] = useState<DashboardData>(seededData)
  const [apiState, setApiState] = useState<'seeded' | 'connected'>('seeded')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [drawerIssue, setDrawerIssue] = useState<Issue | null>(null)
  const [toast, setToast] = useState('')
  const [savedIssues, setSavedIssues] = useState<string[]>(() => readStorage('ifn-saved-issues', []))
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>(() => readStorage('ifn-saved-scenarios', []))

  // Enterprise Interactive States
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>(initialWorkspaces)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceInfo>(initialWorkspaces[0])
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [recipientModalOpen, setRecipientModalOpen] = useState(false)
  const [reviewExperiment, setReviewExperiment] = useState<AdaptationExperiment | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [distributionRecipients, setDistributionRecipients] = useState<RecipientItem[]>([
    { initials: 'PL', name: 'Product leadership', note: 'Weekly signal brief' },
    { initials: 'CO', name: 'CX & operations', note: 'Enterprise friction review' },
  ])

  useEffect(() => {
    const onHash = () => {
      const candidate = window.location.hash.slice(1) as ViewKey
      if (navItems.some((item) => item.key === candidate)) setView(candidate)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const apiEndpoint = (import.meta.env.VITE_API_URL as string | undefined) || 'http://127.0.0.1:8000'

  useEffect(() => {
    if (!apiEndpoint) return
    loadRemoteData(apiEndpoint, seededData)
      .then((remote) => {
        setData(remote)
        setApiState('connected')
      })
      .catch(() => setApiState('seeded'))
  }, [apiEndpoint])

  useEffect(() => localStorage.setItem('ifn-saved-issues', JSON.stringify(savedIssues)), [savedIssues])
  useEffect(() => localStorage.setItem('ifn-saved-scenarios', JSON.stringify(savedScenarios)), [savedScenarios])

  useEffect(() => {
    if (!sidebarOpen) return
    const mobileViewport = window.matchMedia('(max-width: 1100px)')
    if (!mobileViewport.matches) {
      setSidebarOpen(false)
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const go = (next: ViewKey) => {
    window.location.hash = next
    setView(next)
    setSidebarOpen(false)
  }

  const handleSyncData = async () => {
    setIsSyncing(true)
    try {
      if (apiEndpoint) {
        const refreshed = await loadRemoteData(apiEndpoint, data)
        setData(refreshed)
        setApiState('connected')
        setToast(`Synchronized live data (${refreshed.feedback.length} records active)`)
      } else {
        setToast('Local workspace data synchronized')
      }
    } catch {
      setToast('Live sync completed with cached records')
    } finally {
      setIsSyncing(false)
    }
  }

  const toggleSavedIssue = (id: string) => {
    setSavedIssues((current) => current.includes(id) ? current.filter((saved) => saved !== id) : [...current, id])
    setToast(savedIssues.includes(id) ? 'Issue removed from saved list' : 'Issue saved for review')
  }

  const updateRecommendation = (id: string, status: Recommendation['status']) => {
    setData((current) => ({ ...current, recommendations: current.recommendations.map((item) => item.id === id ? { ...item, status } : item) }))
    setToast(`Recommendation moved to ${status.toLowerCase()}`)
  }

  const updateIssueStatus = async (issue: Issue, status: Issue['status']) => {
    try {
      if (apiEndpoint && apiState === 'connected' && issue.id.startsWith('api-')) {
        const backendStatus = status === 'In discovery' ? 'in_progress' : status === 'Monitoring' ? 'resolved' : status === 'Planned' ? 'ignored' : 'open'
        const response = await fetch(`${apiEndpoint.replace(/\/$/, '')}/api/issues/${issue.id.slice(4)}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: backendStatus }) })
        if (!response.ok) throw new Error('Issue status could not be saved')
      }
      setData((current) => ({ ...current, issues: current.issues.map((item) => item.id === issue.id ? { ...item, status } : item) }))
      setToast(`Issue marked ${status.toLowerCase()}`)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Issue status could not be saved')
    }
  }

  const submitFeedback = async (payload: { text: string; rating?: number; category?: string; source: string }) => {
    try {
      if (apiEndpoint && apiState === 'connected') {
        const record = await createRemoteFeedback(apiEndpoint, payload)
        setData((current) => ({ ...current, feedback: [record, ...current.feedback] }))
        setToast('Feedback submitted and analyzed')
        return
      }
      const localRecord: FeedbackRecord = {
        id: `local-${Date.now()}`,
        account: payload.source || 'Manual entry',
        initials: 'ME',
        role: 'Feedback contributor',
        segment: 'Scale',
        channel: 'Interview',
        date: new Date().toISOString().slice(0, 10),
        text: payload.text,
        sentiment: /slow|broken|confusing|missing|bad|frustrat/i.test(payload.text) ? 'negative' : 'neutral',
        themes: [payload.category || 'New signal'],
        productArea: payload.category || 'New signal',
        severity: payload.rating && payload.rating <= 2 ? 4 : 3,
        impact: payload.rating && payload.rating <= 2 ? 4 : 3,
        effort: 3,
        frequency: 1,
        sourceUrl: 'manual://workspace',
      }
      setData((current) => ({ ...current, feedback: [localRecord, ...current.feedback] }))
      setToast('Feedback added to this workspace')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Feedback could not be submitted')
    }
  }

  const importFeedback = async (file: File) => {
    try {
      if (!apiEndpoint || apiState !== 'connected') {
        setToast('Connect the API to import and persist CSV data')
        return
      }
      const result = await importRemoteFeedback(apiEndpoint, file)
      const refreshed = await loadRemoteData(apiEndpoint, data)
      setData(refreshed)
      setToast(`${result.imported} rows imported${result.rejected ? ` · ${result.rejected} rejected` : ''}`)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'CSV import failed')
    }
  }

  const downloadReport = (name: string, format: 'CSV' | 'JSON') => {
    const payload = format === 'JSON'
      ? JSON.stringify({ generatedAt: new Date().toISOString(), issues: data.issues, recommendations: data.recommendations }, null, 2)
      : ['Issue,Priority,Status,Owner,Mentions', ...data.issues.map((issue) => [issue.title, calculatePriority(issue), issue.status, issue.owner, issue.mentionCount].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([payload], { type: format === 'JSON' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${name.toLowerCase().replace(/\s+/g, '-')}.${format.toLowerCase()}`
    anchor.click()
    URL.revokeObjectURL(url)
    setToast(`${name} downloaded`)
  }

  const meta = pageMeta[view]
  return (
    <div className="app-shell">
      <aside id="primary-sidebar" className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="mobile-menu" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        <div className="brand">
          <div className="brand-logo-frame"><img src="/vanta-brand.png" alt="VANTA" /></div>
          <small className="brand-subtitle">Customer intelligence</small>
        </div>

        {/* Interactive Workspace Switcher */}
        <div
          className="workspace-switcher"
          role="button"
          tabIndex={0}
          onClick={() => setWorkspaceOpen((open) => !open)}
        >
          <span className="workspace-dot" />
          <div>
            <small>WORKSPACE</small>
            <strong>{activeWorkspace.org} · {activeWorkspace.name}</strong>
          </div>
          <ChevronRight size={14} style={{ color: '#889590', transform: workspaceOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />

          {workspaceOpen && (
            <div className="workspace-popover" onClick={(event) => event.stopPropagation()}>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className={`workspace-option ${ws.id === activeWorkspace.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveWorkspace(ws)
                    setWorkspaceOpen(false)
                    setToast(`Switched workspace to ${ws.org} · ${ws.name}`)
                  }}
                >
                  <div>
                    <strong>{ws.org} · {ws.name}</strong>
                    <small>{ws.count} active signals</small>
                  </div>
                  {ws.id === activeWorkspace.id && <Check size={14} />}
                </button>
              ))}
              <div className="workspace-divider" />
              <button
                className="workspace-create-btn"
                onClick={() => {
                  setWorkspaceOpen(false)
                  const newName = prompt('Enter new workspace name:', 'Growth · Core')
                  if (newName) {
                    const created: WorkspaceInfo = { id: `ws-${Date.now()}`, org: 'Vanta', name: newName, count: 0 }
                    setWorkspaces((prev) => [...prev, created])
                    setActiveWorkspace(created)
                    setToast(`Workspace "${newName}" created`)
                  }
                }}
              >
                <Plus size={13} />
                <span>Create new workspace</span>
              </button>
            </div>
          )}
        </div>

        <nav aria-label="Primary navigation">
          <div className="nav-label">WORKSPACE</div>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${view === key ? 'active' : ''}`} onClick={() => go(key)} aria-current={view === key ? 'page' : undefined}>
              <Icon size={17} strokeWidth={view === key ? 2.3 : 1.8} /><span>{label}</span>
              {key === 'radar' && <em>6</em>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={17} />
            <span>Settings</span>
          </button>

          {/* Interactive User Profile Menu */}
          <div
            className="user-chip"
            role="button"
            tabIndex={0}
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <div className="avatar">JD</div>
            <div>
              <strong>Jordan Davis</strong>
              <small>Product operations</small>
            </div>
            <button aria-label="Open profile menu" onClick={(e) => { e.stopPropagation(); setProfileMenuOpen((o) => !o) }}>
              <ChevronRight size={15} />
            </button>

            {profileMenuOpen && (
              <div className="profile-popover" onClick={(event) => event.stopPropagation()}>
                <div className="profile-popover-header">
                  <strong>Jordan Davis</strong>
                  <small>jordan.davis@vanta.io</small>
                </div>
                <button
                  className="profile-popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setSettingsOpen(true)
                  }}
                >
                  <Settings2 size={14} />
                  <span>Workspace settings</span>
                </button>
                <button
                  className="profile-popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setHelpOpen(true)
                  }}
                >
                  <CircleHelp size={14} />
                  <span>Platform guidance & shortcuts</span>
                </button>
                <button
                  className="profile-popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    downloadReport('vanta-workspace-backup', 'JSON')
                  }}
                >
                  <Download size={14} />
                  <span>Export workspace backup</span>
                </button>
                <button
                  className="profile-popover-item text-coral"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setToast('Session active · Single sign-on authenticated')
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'} aria-controls="primary-sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <div className="breadcrumbs">
            <span>{activeWorkspace.org} / {activeWorkspace.name}</span>
            <ChevronRight size={14} />
            <strong>{meta.title}</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Help" onClick={() => setHelpOpen(true)}>
              <CircleHelp size={18} />
            </button>
            <span className="topbar-divider" />
            <span className="sync-label">
              <span className="status-dot online" />
              Synced 8 min ago
            </span>
          </div>
        </header>

        <div className="page-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{meta.eyebrow}</div>
              <h1>{meta.title}</h1>
              <p>{meta.description}</p>
            </div>
            <div className="heading-actions">
              {view === 'overview' && (
                <button className="button button-secondary" onClick={handleSyncData} disabled={isSyncing}>
                  <RefreshCw size={15} className={isSyncing ? 'spinning' : ''} />
                  {isSyncing ? 'Syncing…' : 'Sync data'}
                </button>
              )}
              {view === 'reports' && (
                <button className="button button-primary" onClick={() => setReportModalOpen(true)}>
                  <Plus size={15} />
                  New report
                </button>
              )}
            </div>
          </div>

          {view === 'overview' && <Overview data={data} go={go} onIssue={setDrawerIssue} />}
          {view === 'feedback' && <><FeedbackActions onSubmit={submitFeedback} onImport={importFeedback} /><FeedbackExplorer feedback={data.feedback} /></>}
          {view === 'radar' && <IssueRadar issues={data.issues} savedIssues={savedIssues} onSave={toggleSavedIssue} onOpen={setDrawerIssue} />}
          {view === 'recommendations' && <Recommendations recommendations={data.recommendations} feedback={data.feedback} onStatus={updateRecommendation} onOpenIssue={(id) => setDrawerIssue(data.issues.find((issue) => issue.id === id) ?? null)} />}
          {view === 'simulator' && <Simulator issues={data.issues} savedScenarios={savedScenarios} onSave={(scenario) => { setSavedScenarios((current) => [...current, scenario]); setToast('Scenario saved locally') }} />}
          {view === 'adaptation' && <AdaptionLabConnected experiments={data.experiments} apiEndpoint={apiEndpoint} apiState={apiState} onToast={setToast} onReviewExperiment={setReviewExperiment} />}
          {view === 'reports' && (
            <Reports
              reports={data.reports}
              distribution={distributionRecipients}
              onDownload={downloadReport}
              onOpenReportModal={() => setReportModalOpen(true)}
              onOpenRecipientModal={() => setRecipientModalOpen(true)}
              onToast={setToast}
            />
          )}
        </div>
      </main>

      {drawerIssue && (
        <IssueDrawerTracked
          issue={drawerIssue}
          feedback={data.feedback}
          saved={savedIssues.includes(drawerIssue.id)}
          onSave={() => toggleSavedIssue(drawerIssue.id)}
          onStatus={(status) => void updateIssueStatus(drawerIssue, status)}
          onAssign={() => { setToast(`Follow-up queued for ${drawerIssue.owner}`); setDrawerIssue(null) }}
          onClose={() => setDrawerIssue(null)}
        />
      )}

      {/* Enterprise Interactive Modals */}
      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          apiEndpoint={apiEndpoint}
          apiState={apiState}
          onClose={() => setSettingsOpen(false)}
          onToast={setToast}
        />
      )}

      {helpOpen && <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />}

      {reportModalOpen && (
        <ReportCreateModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onSave={(report) => {
            setData((prev) => ({ ...prev, reports: [report, ...prev.reports] }))
            setToast(`Report "${report.name}" created and added to library`)
          }}
        />
      )}

      {recipientModalOpen && (
        <RecipientModal
          isOpen={recipientModalOpen}
          onClose={() => setRecipientModalOpen(false)}
          onAdd={(recipient) => {
            setDistributionRecipients((prev) => [...prev, recipient])
            setToast(`${recipient.name} added to distribution list`)
          }}
        />
      )}

      {reviewExperiment && (
        <ExperimentReviewModal
          experiment={reviewExperiment}
          onClose={() => setReviewExperiment(null)}
          onUpdateStatus={(id, status) => {
            setData((prev) => ({
              ...prev,
              experiments: prev.experiments.map((exp) => exp.id === id ? { ...exp, status } : exp),
            }))
            setToast(`Experiment status updated to ${status.toLowerCase()}`)
            setReviewExperiment(null)
          }}
        />
      )}

      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  )
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}

function Overview({ data, go, onIssue }: { data: DashboardData; go: (view: ViewKey) => void; onIssue: (issue: Issue) => void }) {
  const rankedIssues = [...data.issues].sort((a, b) => calculatePriority(b) - calculatePriority(a))
  const sentimentCounts = data.feedback.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.sentiment]: (counts[item.sentiment] || 0) + 1 }), {})
  const feedbackTotal = data.feedback.length
  const sentimentMix = [
    { name: 'Negative', value: feedbackTotal ? Math.round(((sentimentCounts.negative || 0) / feedbackTotal) * 100) : 0, color: 'var(--coral)' },
    { name: 'Neutral', value: feedbackTotal ? Math.round(((sentimentCounts.neutral || 0) / feedbackTotal) * 100) : 0, color: 'var(--muted)' },
    { name: 'Positive', value: feedbackTotal ? Math.round(((sentimentCounts.positive || 0) / feedbackTotal) * 100) : 0, color: 'var(--green)' },
  ]
  const currentChart = [...data.feedback].sort((a, b) => a.date.localeCompare(b.date)).reduce<Record<string, { week: string; mentions: number; sentimentTotal: number; sentimentCount: number }>>((weeks, item) => {
    const key = item.date.slice(0, 7)
    const current = weeks[key] || { week: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${item.date}T12:00:00`)), mentions: 0, sentimentTotal: 0, sentimentCount: 0 }
    current.mentions += 1
    current.sentimentTotal += item.sentiment === 'positive' ? 100 : item.sentiment === 'neutral' ? 50 : 0
    current.sentimentCount += 1
    weeks[key] = current
    return weeks
  }, {})
  const trendData = Object.values(currentChart).map((item) => ({ week: item.week, mentions: item.mentions, sentiment: item.sentimentCount ? Math.round(item.sentimentTotal / item.sentimentCount) : 0 }))
  const visibleChart = trendData.length > 1 ? trendData.slice(-6) : chartData
  return <div className="view-stack">
    <div className="metric-grid">
      <Metric label="Feedback captured" value={feedbackTotal.toLocaleString()} change="Live" detail="selected workspace" positive icon={<Inbox size={17} />} />
      <Metric label="Open issues" value={String(data.issues.filter((issue) => issue.status !== 'Monitoring').length)} change="+2" detail="since last review" icon={<Radar size={17} />} />
      <Metric label="Signal confidence" value={`${data.feedback.length ? Math.round((data.feedback.filter((item) => item.themes.length > 0).length / data.feedback.length) * 100) : 0}%`} change="Measured" detail="theme coverage" positive icon={<Gauge size={17} />} />
      <Metric label="Negative share" value={`${sentimentMix[0].value}%`} change="Observed" detail="current feedback" icon={<Target size={17} />} />
    </div>
    <div className="grid-2-1">
       <section className="panel chart-panel"><SectionHeader title="Signal volume & sentiment" description="Observed data · grouped by month" action={<button className="text-button" onClick={() => go('feedback')}>Explore feedback <ChevronRight size={14} /></button>} /><div className="chart-legend"><span><i className="legend-dot cobalt" />Mentions</span><span><i className="legend-dot coral" />Sentiment index</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={visibleChart} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
         <CartesianGrid stroke="var(--line)" vertical={false} />
         <XAxis dataKey="week" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
         <YAxis yAxisId="left" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
         <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
         <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--ink)' }} itemStyle={{ color: 'var(--ink)' }} cursor={{ stroke: 'var(--line-dark)' }} />
         <Area yAxisId="left" type="monotone" dataKey="mentions" fill="var(--cobalt)" fillOpacity={0.12} stroke="var(--cobalt)" strokeWidth={2} />
         <Line yAxisId="right" type="monotone" dataKey="sentiment" stroke="var(--coral)" strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: 'var(--surface)' }} />
       </ComposedChart></ResponsiveContainer></div></section>
       <section className="panel sentiment-panel"><SectionHeader title="Sentiment mix" description="All feedback · current period" /><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart>
         <Pie data={sentimentMix} innerRadius={62} outerRadius={84} paddingAngle={3} dataKey="value" stroke="none">{sentimentMix.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie>
         <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--ink)' }} itemStyle={{ color: 'var(--ink)' }} cursor={false} />
       </PieChart></ResponsiveContainer><div className="donut-center"><strong>{feedbackTotal.toLocaleString()}</strong><span>records</span></div></div><div className="sentiment-list">{sentimentMix.map((item) => <div key={item.name}><span><i className="legend-dot" style={{ background: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div></section>
    </div>
    <section className="panel"><SectionHeader title="Priority issues" description="Ranked using reach, severity, trend, and sentiment risk" action={<button className="text-button" onClick={() => go('radar')}>Open radar <ChevronRight size={14} /></button>} /><div className="issue-table compact"><div className="table-row table-head"><span>Issue</span><span>Priority</span><span>Mentions</span><span>Trend</span><span>Status</span></div>{rankedIssues.slice(0, 4).map((issue) => <button className="table-row table-button" key={issue.id} onClick={() => onIssue(issue)}><span className="issue-title-cell"><span className={`priority-mark ${getPriorityBand(calculatePriority(issue))}`} /><span><strong>{issue.title}</strong><small>{issue.productArea} · {issue.affectedAccounts} accounts affected</small></span></span><span><strong className="priority-number">{calculatePriority(issue)}</strong><small>{getPriorityBand(calculatePriority(issue))}</small></span><span>{issue.mentionCount}</span><span className="trend-up"><TrendingUp size={14} />{issue.trend}%</span><span><StatusPill status={issue.status} /></span></button>)}</div></section>
    <div className="grid-2-1 lower-grid"><section className="panel"><SectionHeader title="Recent signal" description="Latest customer language entering the workspace" /><div className="signal-list">{data.feedback.slice(0, 4).map((feedback) => <div className="signal-item" key={feedback.id}><div className={`sentiment-bar ${feedback.sentiment}`} /><div><div className="signal-meta"><strong>{feedback.account}</strong><span>{formatDate(feedback.date)}</span></div><p>“{feedback.text}”</p><div className="tag-row">{feedback.themes.slice(0, 2).map((theme) => <span className="tag" key={theme}>{theme}</span>)}</div></div></div>)}</div></section><section className="panel next-panel"><SectionHeader title="Next best moves" description="Based on current signal confidence" /><div className="move-list"><button onClick={() => go('recommendations')}><span className="move-number">01</span><span><strong>Review 4 recommendations</strong><small>2 new actions need an owner</small></span><ChevronRight size={15} /></button><button onClick={() => go('simulator')}><span className="move-number">02</span><span><strong>Run a counterfactual</strong><small>Test the response-state idea</small></span><ChevronRight size={15} /></button><button onClick={() => go('adaptation')}><span className="move-number">03</span><span><strong>Check experiments</strong><small>1 experiment is ready</small></span><ChevronRight size={15} /></button></div></section></div>
  </div>
}

function Metric({ label, value, change, detail, positive, icon }: { label: string; value: string; change: string; detail: string; positive?: boolean; icon: React.ReactNode }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong className="metric-value">{value}</strong><div className={`metric-change ${positive ? 'positive' : ''}`}>{positive ? <ArrowDown size={13} /> : <ArrowUp size={13} />}{change}<span>{detail}</span></div></div>
}

function FeedbackActions({ onSubmit, onImport }: { onSubmit: (payload: { text: string; rating?: number; category?: string; source: string }) => Promise<void>; onImport: (file: File) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [source, setSource] = useState('Manual entry')
  const [category, setCategory] = useState('')
  const [rating, setRating] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    await onSubmit({ text: text.trim(), source: source.trim() || 'Manual entry', category: category.trim() || undefined, rating: rating ? Number(rating) : undefined })
    setBusy(false)
    setText('')
    setCategory('')
    setRating('')
    setOpen(false)
  }
  return <div className="feedback-actions">
    <div className="feedback-actions-copy"><span className="eyebrow">Ingest signal</span><strong>Add source evidence without leaving the explorer.</strong><span>Manual records are analyzed locally or persisted through the connected API.</span></div>
    <div className="feedback-action-buttons"><label className="button button-secondary import-button"><Download size={14} />Import CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onImport(file); event.currentTarget.value = '' }} /></label><button className="button button-primary" onClick={() => setOpen(true)}><Plus size={15} />Add feedback</button></div>
    {open && <div className="inline-composer panel"><div className="composer-heading"><div><div className="eyebrow">Manual submission</div><h2>Capture customer language</h2></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close feedback form"><X size={18} /></button></div><form onSubmit={submit}><label>Feedback text<textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} placeholder="Paste the exact customer wording…" required /></label><div className="composer-grid"><label>Source<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Interview · Acme" /></label><label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Optional theme" /></label><label>Rating<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="">Not provided</option><option value="1">1 / 5</option><option value="2">2 / 5</option><option value="3">3 / 5</option><option value="4">4 / 5</option><option value="5">5 / 5</option></select></label></div><div className="composer-footer"><span>Customer text is stored as data, never executed as code.</span><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Analyzing…' : 'Submit feedback'}</button></div></form></div>}
  </div>
}

function FeedbackExplorer({ feedback }: { feedback: FeedbackRecord[] }) {
  const [query, setQuery] = useState('')
  const [sentiment, setSentiment] = useState('All sentiment')
  const [segment, setSegment] = useState('All segments')
  const [channel, setChannel] = useState('All channels')
  const [sort, setSort] = useState<'Recent' | 'Impact'>('Recent')
  const [selected, setSelected] = useState<FeedbackRecord | null>(null)
  const filtered = useMemo(() => feedback.filter((item) => {
    const searchable = `${item.account} ${item.text} ${item.themes.join(' ')} ${item.productArea}`.toLowerCase()
    return searchable.includes(query.toLowerCase()) && (sentiment === 'All sentiment' || item.sentiment === sentiment.toLowerCase()) && (segment === 'All segments' || item.segment === segment) && (channel === 'All channels' || item.channel === channel)
  }).sort((a, b) => sort === 'Recent' ? b.date.localeCompare(a.date) : (b.impact + b.severity) - (a.impact + a.severity)), [feedback, query, sentiment, segment, channel, sort])
  return <div className="view-stack"><div className="panel filter-panel"><div className="search-wrap"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search feedback, accounts, themes…" aria-label="Search feedback" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}</div><div className="filter-controls"><Select value={sentiment} options={['All sentiment', 'Positive', 'Neutral', 'Negative']} onChange={setSentiment} /><Select value={segment} options={['All segments', 'Enterprise', 'Growth', 'Scale']} onChange={setSegment} /><Select value={channel} options={['All channels', 'Interview', 'Support', 'Survey', 'Community']} onChange={setChannel} /><div className="sort-control"><Filter size={14} /><select value={sort} onChange={(event) => setSort(event.target.value as 'Recent' | 'Impact')} aria-label="Sort feedback"><option>Recent</option><option>Impact</option></select></div></div></div><div className="result-count">{filtered.length} feedback records <span>·</span> {query || sentiment !== 'All sentiment' || segment !== 'All segments' || channel !== 'All channels' ? 'Filtered view' : 'Current period'}</div><section className="panel"><div className="feedback-table">{filtered.map((item) => <button className="feedback-row" key={item.id} onClick={() => setSelected(item)}><div className={`sentiment-bar ${item.sentiment}`} /><div className="feedback-body"><div className="feedback-heading"><span className="account-avatar">{item.initials}</span><span><strong>{item.account}</strong><small>{item.role} · {item.segment}</small></span><span className="feedback-date">{formatDate(item.date)}</span></div><p>“{item.text}”</p><div className="feedback-footer"><span className="source-label">{item.channel}</span><span>{item.productArea}</span>{item.themes.map((theme) => <span className="tag" key={theme}>{theme}</span>)}</div></div><ChevronRight size={16} className="row-chevron" /></button>)}{filtered.length === 0 && <EmptyState title="No matching feedback" description="Try removing a filter or searching a broader phrase." />}</div></section>{selected && <FeedbackDetail feedback={selected} onClose={() => setSelected(null)} />}</div>
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) { return <select className="select-control" value={value} onChange={(event) => onChange(event.target.value)} aria-label={value}>{options.map((option) => <option key={option}>{option}</option>)}</select> }

function FeedbackDetail({ feedback, onClose }: { feedback: FeedbackRecord; onClose: () => void }) { return <div className="modal-backdrop" onClick={onClose}><section className="feedback-modal" role="dialog" aria-modal="true" aria-label="Feedback detail" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><div className="eyebrow">Source record · {feedback.id}</div><h2>{feedback.account}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close feedback detail"><X size={18} /></button></div><div className="detail-author"><span className="account-avatar large">{feedback.initials}</span><div><strong>{feedback.role}</strong><span>{feedback.channel} · {formatDate(feedback.date)}</span></div></div><blockquote>“{feedback.text}”</blockquote><div className="detail-grid"><span>Sentiment<strong className={`text-${feedback.sentiment}`}>{feedback.sentiment}</strong></span><span>Product area<strong>{feedback.productArea}</strong></span><span>Severity<strong>{feedback.severity}/5</strong></span><span>Impact<strong>{feedback.impact}/5</strong></span></div><div className="detail-section"><h3>Extracted themes</h3><div className="tag-row">{feedback.themes.map((theme) => <span className="tag" key={theme}>{theme}</span>)}</div></div><a className="source-link" href={feedback.sourceUrl} onClick={(event) => event.preventDefault()}><ExternalLink size={14} />Open source record</a></section></div> }

function IssueRadar({ issues, savedIssues, onSave, onOpen }: { issues: Issue[]; savedIssues: string[]; onSave: (id: string) => void; onOpen: (issue: Issue) => void }) {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All areas')
  const [status, setStatus] = useState('All status')
  const [sort, setSort] = useState('Priority')
  const areas = ['All areas', ...Array.from(new Set(issues.map((issue) => issue.productArea)))]
  const visible = [...issues].filter((issue) => `${issue.title} ${issue.summary} ${issue.owner}`.toLowerCase().includes(query.toLowerCase()) && (area === 'All areas' || issue.productArea === area) && (status === 'All status' || issue.status === status)).sort((a, b) => sort === 'Priority' ? calculatePriority(b) - calculatePriority(a) : sort === 'Momentum' ? b.trend - a.trend : b.mentionCount - a.mentionCount)
  return <div className="view-stack"><div className="radar-summary"><div><span className="eyebrow">Current view</span><strong>{visible.length} active signals</strong><p>Priority is recalculated from the same inputs on every client session.</p></div><div className="radar-legend"><span><i className="priority-mark critical" />Critical</span><span><i className="priority-mark high" />High</span><span><i className="priority-mark medium" />Medium</span></div></div><div className="panel filter-panel"><div className="search-wrap"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues or owners…" aria-label="Search issues" /></div><div className="filter-controls"><Select value={area} options={areas} onChange={setArea} /><Select value={status} options={['All status', 'Open', 'In discovery', 'Planned', 'Monitoring']} onChange={setStatus} /><Select value={sort} options={['Priority', 'Momentum', 'Mentions']} onChange={setSort} /></div></div><section className="panel"><div className="radar-table"><div className="table-row table-head"><span>Issue</span><span>Score</span><span>Reach</span><span>Momentum</span><span>Owner</span><span /></div>{visible.map((issue) => { const priority = calculatePriority(issue); return <div className="table-row radar-row" key={issue.id}><button className="issue-title-cell issue-open" onClick={() => onOpen(issue)}><span className={`priority-mark ${getPriorityBand(priority)}`} /><span><strong>{issue.title}</strong><small>{issue.productArea} · first seen {formatDate(issue.firstSeen)}</small></span></button><span><strong className="priority-number large-number">{priority}</strong><small className={`priority-label ${getPriorityBand(priority)}`}>{getPriorityBand(priority)}</small></span><span><strong>{issue.affectedAccounts}</strong><small>{issue.mentionCount} mentions</small></span><span className="trend-up">{issue.trend > 0 && <TrendingUp size={14} />}{issue.trend}%</span><span className="owner-cell"><span className="avatar small">{issue.owner.split(' ').map((name) => name[0]).join('')}</span>{issue.owner}</span><button className="save-button" aria-label={savedIssues.includes(issue.id) ? 'Remove saved issue' : 'Save issue'} onClick={() => onSave(issue.id)}>{savedIssues.includes(issue.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button></div> })}{visible.length === 0 && <EmptyState title="No issues match" description="Try a different product area, status, or search phrase." />}</div></section></div>
}

function StatusPill({ status }: { status: string }) { return <span className={`status-pill ${status.toLowerCase().replace(/ /g, '-')}`}>{status}</span> }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="empty-state"><Search size={20} /><strong>{title}</strong><p>{description}</p></div> }

function IssueDrawerTracked({ issue, feedback, saved, onSave, onStatus, onAssign, onClose }: { issue: Issue; feedback: FeedbackRecord[]; saved: boolean; onSave: () => void; onStatus: (status: Issue['status']) => void; onAssign: () => void; onClose: () => void }) {
  const evidence = feedback.filter((item) => issue.evidenceIds.includes(item.id))
  const priority = calculatePriority(issue)
  return <div className="drawer-backdrop" onClick={onClose}><aside className="issue-drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><div className="eyebrow">Issue detail · {issue.id}</div><h2>{issue.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close issue detail"><X size={18} /></button></div><div className="drawer-score"><div><span>Deterministic priority</span><strong>{priority}<small>/100</small></strong></div><span className={`priority-label ${getPriorityBand(priority)}`}>{getPriorityBand(priority)}</span></div><p className="drawer-summary">{issue.summary}</p><div className="drawer-actions"><button className={`button ${saved ? 'button-saved' : 'button-secondary'}`} onClick={onSave}>{saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}{saved ? 'Saved' : 'Save issue'}</button><button className="button button-primary" onClick={onAssign}>Assign follow-up</button></div><div className="drawer-metrics"><span>Affected accounts<strong>{issue.affectedAccounts}</strong></span><span>Mentions<strong>{issue.mentionCount}</strong></span><span>Trend<strong className="trend-up">+{issue.trend}%</strong></span><span>Owner<strong>{issue.owner}</strong></span></div><div className="detail-section status-editor"><div className="section-inline"><h3>Resolution tracking</h3><StatusPill status={issue.status} /></div><label>Current status<select value={issue.status} onChange={(event) => onStatus(event.target.value as Issue['status'])}><option>Open</option><option>In discovery</option><option>Planned</option><option>Monitoring</option></select></label></div><div className="detail-section"><h3>Signal inputs</h3><div className="factor-bars"><Factor label="Severity" value={issue.severity * 20} /><Factor label="Customer impact" value={issue.impact * 20} /><Factor label="Mention volume" value={Math.min(100, issue.mentionCount * 2.1)} /><Factor label="Sentiment risk" value={Math.round((1 - issue.sentiment) * 50)} /></div></div><div className="detail-section"><div className="section-inline"><h3>Evidence ({evidence.length})</h3><span className="confidence"><span className="status-dot online" />{evidence.length ? 'Linked evidence' : 'No linked evidence'}</span></div>{evidence.map((item) => <div className="evidence-quote" key={item.id}><p>“{item.text}”</p><small>{item.account} · {formatDate(item.date)}</small></div>)}</div></aside></div>
}

function Factor({ label, value }: { label: string; value: number }) { return <div className="factor"><div><span>{label}</span><strong>{Math.round(value)}</strong></div><div className="factor-track"><span style={{ width: `${value}%` }} /></div></div> }

function Recommendations({ recommendations, feedback, onStatus, onOpenIssue }: { recommendations: Recommendation[]; feedback: FeedbackRecord[]; onStatus: (id: string, status: Recommendation['status']) => void; onOpenIssue: (id: string) => void }) {
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const visible = recommendations.filter((item) => filter === 'All' || item.status === filter)
  return <div className="view-stack"><div className="recommendation-toolbar"><div className="segmented-control">{['All', 'New', 'Reviewing', 'Accepted'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}<span>{item === 'All' ? recommendations.length : recommendations.filter((recommendation) => recommendation.status === item).length}</span></button>)}</div><span className="toolbar-note"><Sparkles size={15} />Scored from evidence coverage and expected product impact</span></div><div className="recommendation-grid">{visible.map((item) => { const evidence = feedback.filter((record) => item.evidenceIds.includes(record.id)); return <article className={`recommendation-card ${expanded === item.id ? 'expanded' : ''}`} key={item.id}><div className="recommendation-top"><span className="rec-kicker">{item.effort} effort · {item.impact}</span><button className="icon-button" aria-label="Open recommendation menu" onClick={() => setExpanded(expanded === item.id ? null : item.id)}><Settings2 size={16} /></button></div><h2>{item.title}</h2><p>{item.rationale}</p><div className="confidence-row"><div><span>Confidence</span><strong>{item.confidence}%</strong></div><div className="confidence-track"><span style={{ width: `${item.confidence}%` }} /></div></div><div className="recommendation-action"><span className="eyebrow">Suggested action</span><strong>{item.action}</strong></div><div className="recommendation-footer"><span className="owner-cell"><span className="avatar small">{item.owner.split(' ').map((name) => name[0]).join('')}</span>{item.owner}</span><StatusPill status={item.status} /></div>{expanded === item.id && <div className="recommendation-expanded"><div className="detail-section"><h3>Evidence linked</h3>{evidence.map((record) => <p className="mini-evidence" key={record.id}>“{record.text.slice(0, 125)}…” <small>{record.account}</small></p>)}</div><div className="card-actions"><button className="text-button" onClick={() => onOpenIssue(item.issueId)}>View source issue <ChevronRight size={14} /></button><select value={item.status} onChange={(event) => onStatus(item.id, event.target.value as Recommendation['status'])} aria-label={`Change status for ${item.title}`}><option>New</option><option>Reviewing</option><option>Accepted</option><option>Parked</option></select></div></div>}</article> })}</div>{visible.length === 0 && <EmptyState title="No recommendations in this view" description="Change the status filter to see other actions." />}</div>
}

function Simulator({ issues, savedScenarios, onSave }: { issues: Issue[]; savedScenarios: Scenario[]; onSave: (scenario: Scenario) => void }) {
  const [scenario, setScenario] = useState<Scenario>(defaultScenario)
  const baseline = useMemo(() => rankScenario(issues, defaultScenario), [issues])
  const projected = useMemo(() => rankScenario(issues, scenario), [issues, scenario])
  const changed = projected.filter((item, index) => item.id !== baseline[index]?.id).length
  const reset = () => setScenario(defaultScenario)
  return <div className="view-stack"><div className="simulator-intro"><div><span className="eyebrow">Model: priority response v1.4</span><h2>Change the experience. See the likely shift.</h2><p>Move the sliders to model relative improvements. The simulator uses deterministic coefficients and is intended for directional planning.</p></div><div className="saved-scenarios"><span><BookmarkCheck size={15} />{savedScenarios.length} saved</span><button className="text-button" onClick={reset}>Reset model</button></div></div><div className="simulator-layout"><section className="panel scenario-controls"><SectionHeader title="Scenario inputs" description="Set a proposed experience level from 0–100" /><SliderField label="Response-state clarity" value={scenario.responseTime} description="Visible progress and predictable waits" onChange={(value) => setScenario({ ...scenario, responseTime: value })} /><SliderField label="Onboarding clarity" value={scenario.onboardingClarity} description="Persistent guidance for new teammates" onChange={(value) => setScenario({ ...scenario, onboardingClarity: value })} /><SliderField label="Search relevance" value={scenario.searchRelevance} description="Passage-level retrieval and context" onChange={(value) => setScenario({ ...scenario, searchRelevance: value })} /><div className="scenario-save"><button className="button button-primary" onClick={() => onSave(scenario)}><Bookmark size={15} />Save scenario</button><span>Saved locally in this browser</span></div></section><section className="panel ranking-panel"><SectionHeader title="Projected issue ranking" description={`${changed ? `${changed} ranking positions change` : 'Ranking remains stable'} · baseline vs. scenario`} /><div className="ranking-columns"><div><div className="column-label">Baseline</div>{baseline.slice(0, 5).map((item, index) => <RankingRow item={item} index={index} key={item.id} />)}</div><div><div className="column-label cobalt-text">Scenario</div>{projected.slice(0, 5).map((item, index) => <RankingRow item={item} index={index} key={item.id} baselineIndex={baseline.findIndex((base) => base.id === item.id)} />)}</div></div></section></div><section className="panel contribution-panel"><SectionHeader title="What moves the ranking?" description="Contribution explanation for the current scenario" /><div className="contribution-grid"><div><div className="contribution-total"><strong>{Math.round((scenario.responseTime + scenario.onboardingClarity + scenario.searchRelevance) / 3)}</strong><span>scenario index</span></div><p>Improving experience factors reduces modeled friction across connected issues. Search relevance is currently the highest-leverage factor.</p></div><div className="contribution-bars"><Contribution label="Search relevance" value={scenario.searchRelevance} delta={scenario.searchRelevance - defaultScenario.searchRelevance} /><Contribution label="Response-state clarity" value={scenario.responseTime} delta={scenario.responseTime - defaultScenario.responseTime} /><Contribution label="Onboarding clarity" value={scenario.onboardingClarity} delta={scenario.onboardingClarity - defaultScenario.onboardingClarity} /></div></div></section></div>
}

function SliderField({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (value: number) => void }) { return <label className="slider-field"><div><span><strong>{label}</strong><small>{description}</small></span><output>{value}</output></div><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label} /></label> }
function rankScenario(issues: Issue[], scenario: Scenario) { return issues.map((issue) => { const factor = issue.productArea === 'Search' ? scenario.searchRelevance : issue.productArea === 'Onboarding' ? scenario.onboardingClarity : issue.productArea === 'Workspace' || issue.productArea === 'Simulator' ? scenario.responseTime : 50; const multiplier = 1 - (factor - 50) / 400; return { ...issue, projected: Math.max(0, Math.round(calculatePriority(issue) * multiplier)) } }).sort((a, b) => b.projected - a.projected) }
function RankingRow({ item, index, baselineIndex }: { item: Issue & { projected: number }; index: number; baselineIndex?: number }) { const delta = baselineIndex === undefined ? 0 : baselineIndex - index; return <div className="ranking-row"><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.title}</strong><small>{item.projected} priority</small></span>{baselineIndex !== undefined && delta !== 0 && <em className={delta > 0 ? 'rank-up' : 'rank-down'}>{delta > 0 ? '↑' : '↓'}{Math.abs(delta)}</em>}</div> }
function Contribution({ label, value, delta }: { label: string; value: number; delta: number }) { return <div className="contribution"><div><span>{label}</span><strong>{delta >= 0 ? '+' : ''}{delta} pts</strong></div><div className="contribution-track"><span style={{ width: `${value}%` }} /></div></div> }

function AdaptionLabConnected({
  experiments,
  apiEndpoint,
  apiState,
  onToast,
  onReviewExperiment,
}: {
  experiments: DashboardData['experiments']
  apiEndpoint?: string
  apiState: 'seeded' | 'connected'
  onToast: (message: string) => void
  onReviewExperiment: (experiment: AdaptationExperiment) => void
}) {
  const [availability, setAvailability] = useState<AdaptionAvailability | null>(null)
  const [datasetId, setDatasetId] = useState('')
  const [run, setRun] = useState<AdaptionRun | null>(null)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const providerReady = apiState === 'connected' && Boolean(apiEndpoint)

  useEffect(() => {
    if (!providerReady || !apiEndpoint) return
    getAdaptionAvailability(apiEndpoint).then(setAvailability).catch(() => setAvailability(null))
  }, [apiEndpoint, providerReady])

  useEffect(() => {
    if (!run || !apiEndpoint || !['submitted', 'queued', 'pending', 'awaiting_input', 'running', 'processing'].includes(run.status.toLowerCase())) return
    const timer = window.setInterval(() => {
      setRefreshing(true)
      getAdaptionRun(apiEndpoint, run.id).then(setRun).catch(() => undefined).finally(() => setRefreshing(false))
    }, 5000)
    return () => window.clearInterval(timer)
  }, [apiEndpoint, run])

  const operate = async (operation: 'estimate' | 'run') => {
    if (!apiEndpoint || !datasetId.trim()) {
      onToast('Enter or select an Adaption dataset ID first')
      return
    }
    setBusy(true)
    try {
      const result = await runAdaptionOperation(apiEndpoint, operation, {
        dataset_id: datasetId.trim(),
        column_mapping: { prompt: 'feedback', completion: 'recommendation', context: ['category', 'source'] },
        job_specification: { max_rows: 100 },
        recipe_specification: { recipes: { deduplication: true, prompt_rephrase: false } },
        brand_controls: { length: 'concise', hallucination_mitigation: true, blueprint: 'Use only the supplied customer evidence. Do not invent customer claims.' },
      })
      setRun(result)
      onToast(operation === 'estimate' ? 'Adaption estimate received' : 'Adaption run submitted')
    } catch (error) {
      onToast(error instanceof Error ? error.message : `Adaption ${operation} failed`)
    } finally {
      setBusy(false)
    }
  }

  const sampleDatasets = [
    'ds_vanta_signals_2026',
    'ds_enterprise_feedback_oct',
    'ds_product_friction_q4',
  ]

  return (
    <div className="view-stack">
      <div className="lab-overview">
        <div>
          <div className="eyebrow">Provider-backed evaluation</div>
          <h2>Adaption Lab</h2>
          <p>Prepare a task-specific dataset, request a real estimate, then launch an adaptation run. Provider outputs are never replaced with synthetic success.</p>
        </div>
        <div className="lab-stats">
          <span><strong>{availability?.configured ? 'Ready' : 'Not ready'}</strong> provider status</span>
          <span><strong>{run?.status || '—'}</strong> latest run</span>
        </div>
      </div>
      <section className="panel adaption-console">
        <div className="section-header">
          <div>
            <h2>Run Adaptive Data</h2>
            <p>Uses the official Adaption SDK through the FastAPI backend.</p>
          </div>
          <span className={`integration-badge ${availability?.configured ? 'ready' : 'not-ready'}`}>
            <span className="status-dot" />
            {providerReady ? (availability?.configured ? 'Configured' : 'Configuration required') : 'API not connected'}
          </span>
        </div>
        <div className="adaption-form">
          <label>
            Adaption dataset ID
            <input value={datasetId} onChange={(event) => setDatasetId(event.target.value)} placeholder="Paste or pick a dataset ID below…" />
          </label>
          <div className="dataset-chip-group">
            <span>Quick fill:</span>
            {sampleDatasets.map((ds) => (
              <button key={ds} type="button" className="dataset-chip-btn" onClick={() => setDatasetId(ds)}>
                {ds}
              </button>
            ))}
          </div>
          <div className="adaption-mapping">
            <span className="eyebrow">Mapping sent with the request</span>
            <code>prompt ← feedback · completion ← recommendation · context ← category, source</code>
            <small>Recipes: deduplication on, prompt rephrasing off. Blueprint requires grounded, concise output.</small>
          </div>
          <div className="adaption-buttons">
            <button className="button button-secondary" onClick={() => void operate('estimate')} disabled={busy || !providerReady}>
              {busy ? 'Working…' : 'Request estimate'}
            </button>
            <button className="button button-primary" onClick={() => void operate('run')} disabled={busy || !providerReady}>
              {busy ? 'Working…' : 'Launch adaptation'}
            </button>
          </div>
        </div>
        {run && (
          <div className={`run-receipt ${run.status === 'failed' || run.status === 'unavailable' ? 'run-error' : ''}`}>
            <div>
              <span className="eyebrow">Provider receipt · {run.operation}</span>
              <strong>{run.status}</strong>
              <small>{run.provider_run_id ? `Provider run ${run.provider_run_id}` : `Local receipt ${run.id}`}</small>
            </div>
            <div className="run-receipt-meta">
              <span>Dataset<strong>{run.dataset_id}</strong></span>
              <span>Updated<strong>{new Date(run.updated_at).toLocaleString()}</strong></span>
              {refreshing && <span className="refreshing">Refreshing status…</span>}
            </div>
            {run.error_message && <p className="run-error-message">{run.error_message}</p>}
            {run.response && (
              <details>
                <summary>Provider response</summary>
                <pre>{JSON.stringify(run.response, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </section>
      <div className="adaption-disclosure">
        <strong>What is measured here</strong>
        <span>Dataset IDs, run status, provider responses, and evaluation metrics returned by Adaption.</span>
        <span>Not measured: customer outcomes, product lift, or causal impact. Those require a separate experiment.</span>
      </div>
      <section className="view-stack">
        <SectionHeader title="Planning experiments" description="Local planning artifacts; not Adaption output." />
        <div className="experiment-list">
          {experiments.map((experiment) => (
            <article className="panel experiment-card" key={experiment.id}>
              <div className="experiment-status">
                <span className={`experiment-dot ${experiment.status.toLowerCase()}`} />
                {experiment.status} · planning artifact
              </div>
              <div className="experiment-main">
                <div>
                  <h2>{experiment.name}</h2>
                  <p>{experiment.hypothesis}</p>
                  <div className="tag-row">
                    <span className="tag">{experiment.audience}</span>
                    <span className="tag">Linked · {experiment.linkedIssue}</span>
                  </div>
                </div>
                <div className="experiment-owner">
                  <span className="avatar small">{experiment.owner.split(' ').map((name) => name[0]).join('')}</span>
                  <span>{experiment.owner}</span>
                </div>
              </div>
              <div className="experiment-metrics">
                <span>Primary metric<strong>{experiment.metric}</strong></span>
                <span>Baseline<strong>{experiment.baseline}</strong></span>
                <span>Target<strong className="cobalt-text">{experiment.target}</strong></span>
                <button className="button button-secondary" onClick={() => onReviewExperiment(experiment)}>
                  <Send size={14} />
                  Review plan
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function Reports({
  reports,
  distribution,
  onDownload,
  onOpenReportModal,
  onOpenRecipientModal,
  onToast,
}: {
  reports: DashboardData['reports']
  distribution: RecipientItem[]
  onDownload: (name: string, format: 'CSV' | 'JSON') => void
  onOpenReportModal: () => void
  onOpenRecipientModal: () => void
  onToast: (message: string) => void
}) {
  return (
    <div className="view-stack">
      <div className="report-callout">
        <div className="report-callout-icon"><FileBarChart size={22} /></div>
        <div>
          <strong>Signal reporting, without the cleanup.</strong>
          <p>Every report carries the issue ranking, evidence coverage, and recommendation status from the selected period.</p>
        </div>
        <button className="button button-primary" onClick={onOpenReportModal}>
          Configure report
        </button>
      </div>
      <section className="panel">
        <SectionHeader title="Report library" description="Recurring report definitions and latest exports" />
        <div className="report-list">
          {reports.map((report) => (
            <div className="report-row" key={report.id}>
              <div className="report-icon"><FileBarChart size={18} /></div>
              <div className="report-name">
                <strong>{report.name}</strong>
                <span>{report.audience} · {report.cadence}</span>
              </div>
              <span className="last-run">Last run<strong>{report.lastRun}</strong></span>
              <span className="format-label">{report.format}</span>
              <button className="button button-secondary" onClick={() => onDownload(report.name, report.format)}>
                <Download size={14} />
                Download
              </button>
              <button className="icon-button" aria-label={`Open ${report.name} menu`} onClick={() => onToast(`${report.name} schedule is active`)}>
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
      <div className="grid-2-1 report-bottom">
        <section className="panel">
          <SectionHeader
            title="Latest brief"
            description="Week of October 07, 2026"
            action={<button className="text-button" onClick={() => onDownload('latest-signal-brief', 'CSV')}>Export CSV <Download size={14} /></button>}
          />
          <div className="brief-preview">
            <div>
              <span className="eyebrow">Executive readout</span>
              <h2>Response transparency is the clearest trust lever.</h2>
              <p>Negative mentions increased 18% over the period, concentrated in response states and search relevance. Three recommendations now have sufficient evidence for planning.</p>
            </div>
            <div className="brief-highlights">
              <span><strong>18%</strong>negative signal lift</span>
              <span><strong>86%</strong>evidence confidence</span>
              <span><strong>3</strong>planning-ready actions</span>
            </div>
          </div>
        </section>
        <section className="panel distribution-panel">
          <SectionHeader title="Distribution" description="Who receives the signal" />
          <div className="distribution-list">
            {distribution.map((item, idx) => (
              <div key={idx}>
                <span className="avatar small">{item.initials}</span>
                <span><strong>{item.name}</strong><small>{item.note}</small></span>
                <Check size={16} />
              </div>
            ))}
            <button className="text-button" onClick={onOpenRecipientModal}>
              <Plus size={14} />
              Add recipient
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

/* =========================================================================
   ENTERPRISE DIALOGS & MODALS
   ========================================================================= */

function SettingsModal({
  isOpen,
  apiEndpoint,
  apiState,
  onClose,
  onToast,
}: {
  isOpen: boolean
  apiEndpoint: string
  apiState: 'seeded' | 'connected'
  onClose: () => void
  onToast: (msg: string) => void
}) {
  const [tab, setTab] = useState<'integrations' | 'workspace' | 'team'>('integrations')
  const [pingLatency, setPingLatency] = useState<string | null>(null)
  const [isPinging, setIsPinging] = useState(false)

  if (!isOpen) return null

  const handlePing = async () => {
    setIsPinging(true)
    const t0 = performance.now()
    try {
      const res = await fetch(`${apiEndpoint.replace(/\/$/, '')}/health`)
      const elapsed = Math.round(performance.now() - t0)
      if (res.ok) setPingLatency(`${elapsed}ms · Operational`)
      else setPingLatency('HTTP Error')
    } catch {
      setPingLatency('Offline / Unreachable')
    } finally {
      setIsPinging(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div>
            <div className="eyebrow">Enterprise admin</div>
            <h2>Workspace Settings</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings"><X size={18} /></button>
        </div>

        <div className="settings-nav" style={{ padding: '0 24px', background: '#0c1113' }}>
          <button className={`settings-tab-btn ${tab === 'integrations' ? 'active' : ''}`} onClick={() => setTab('integrations')}>
            Integrations & API
          </button>
          <button className={`settings-tab-btn ${tab === 'workspace' ? 'active' : ''}`} onClick={() => setTab('workspace')}>
            Workspace & Model
          </button>
          <button className={`settings-tab-btn ${tab === 'team' ? 'active' : ''}`} onClick={() => setTab('team')}>
            Team & Access
          </button>
        </div>

        <div className="modal-content-scroll">
          {tab === 'integrations' && (
            <>
              <div className="status-pill-card">
                <div>
                  <strong>FastAPI Core Backend</strong>
                  <small>{apiEndpoint} · {apiState === 'connected' ? 'Connected & listening' : 'Local synthetic fallback'}</small>
                </div>
                <button className="button button-secondary" onClick={handlePing} disabled={isPinging}>
                  <RefreshCw size={14} className={isPinging ? 'spinning' : ''} />
                  {isPinging ? 'Pinging…' : pingLatency ? pingLatency : 'Test ping'}
                </button>
              </div>

              <div className="status-pill-card">
                <div>
                  <strong>Adaption Platform Integration</strong>
                  <small>Adaptive intelligence SDK · pt_live_... authenticated</small>
                </div>
                <span className="status-pill monitoring">Active</span>
              </div>

              <div className="vanta-field">
                <label>Webhook Notification URL</label>
                <input placeholder="https://api.vanta.com/v1/webhooks/customer-signal" defaultValue="https://hooks.slack.com/services/T00/B00/signal-digest" />
                <small>Alerts on critical priority score changes are dispatched in real-time.</small>
              </div>
            </>
          )}

          {tab === 'workspace' && (
            <>
              <div className="vanta-field">
                <label>Workspace Identifier</label>
                <input defaultValue="Northstar · Product Intelligence" />
              </div>
              <div className="vanta-field-row">
                <div className="vanta-field">
                  <label>Retention Window</label>
                  <select defaultValue="180">
                    <option value="90">90 Days</option>
                    <option value="180">180 Days (Recommended)</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>
                <div className="vanta-field">
                  <label>Score Sensitivity</label>
                  <select defaultValue="standard">
                    <option value="conservative">Conservative (High threshold)</option>
                    <option value="standard">Standard Deterministic v1.4</option>
                    <option value="aggressive">Aggressive (Early warning)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="status-pill-card">
                <div>
                  <strong>Jordan Davis</strong>
                  <small>jordan.davis@vanta.io · Product Operations</small>
                </div>
                <span className="status-pill in-discovery">Admin</span>
              </div>
              <div className="status-pill-card">
                <div>
                  <strong>Maya Chen</strong>
                  <small>maya.chen@vanta.io · VP Operations</small>
                </div>
                <span className="status-pill planned">Member</span>
              </div>
              <div className="status-pill-card">
                <div>
                  <strong>Sofia Alvarez</strong>
                  <small>sofia.alvarez@vanta.io · CX Lead</small>
                </div>
                <span className="status-pill planned">Member</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer-bar">
          <button className="button button-secondary" onClick={onClose}>Close</button>
          <button className="button button-primary" onClick={() => { onToast('Workspace preferences saved'); onClose(); }}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div>
            <div className="eyebrow">Documentation</div>
            <h2>Platform Guide & Deterministic Models</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close guide"><X size={18} /></button>
        </div>
        <div className="modal-content-scroll">
          <div>
            <h3 style={{ fontSize: 13, color: 'var(--cobalt)', marginBottom: 6 }}>1. Deterministic Priority Formula</h3>
            <p style={{ fontSize: 12, color: '#b5c0bd', lineHeight: 1.5 }}>
              Issue ranking is computed objectively using mathematical coefficients rather than ungrounded generative summaries:
              <br />
              <code>Score = 100 × (0.25·Volume + 0.30·NegativeRate + 0.20·RatingRisk + 0.20·SentimentRisk + 0.05·Recency)</code>
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: 13, color: 'var(--cobalt)', marginBottom: 6 }}>2. Counterfactual Simulator</h3>
            <p style={{ fontSize: 12, color: '#b5c0bd', lineHeight: 1.5 }}>
              Model prospective product investments by adjusting Response-state clarity, Onboarding guidance, or Search relevance to see directional priority changes before allocating engineering headcount.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: 13, color: 'var(--cobalt)', marginBottom: 6 }}>3. Keyboard Shortcuts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: 12, color: '#c5d0cc', marginTop: 8 }}>
              <span><code>Esc</code></span><span>Dismiss drawers and modals</span>
              <span><code>Ctrl+Shift+R</code></span><span>Hard reload client assets</span>
              <span><code>Click Logo</code></span><span>Return to Overview hub</span>
            </div>
          </div>
        </div>
        <div className="modal-footer-bar">
          <button className="button button-primary" onClick={onClose}>Understood</button>
        </div>
      </div>
    </div>
  )
}

function ReportCreateModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (report: ReportDefinition) => void
}) {
  const [name, setName] = useState('')
  const [audience, setAudience] = useState('Product Leadership')
  const [cadence, setCadence] = useState('Weekly on Monday')
  const [format, setFormat] = useState<'CSV' | 'JSON'>('CSV')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const newReport: ReportDefinition = {
      id: `report-${Date.now()}`,
      name: name.trim(),
      audience,
      cadence,
      lastRun: new Date().toISOString().slice(0, 16).replace('T', ' '),
      format,
    }
    onSave(newReport)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header-bar">
            <div>
              <div className="eyebrow">Distribution generator</div>
              <h2>Configure New Signal Report</h2>
            </div>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close report dialog"><X size={18} /></button>
          </div>
          <div className="modal-content-scroll">
            <div className="vanta-field">
              <label>Report Title</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 Executive Friction Digest" required />
            </div>
            <div className="vanta-field-row">
              <div className="vanta-field">
                <label>Target Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option>Product Leadership</option>
                  <option>CX & Operations</option>
                  <option>Security & Compliance Board</option>
                  <option>Growth Engineering Squad</option>
                </select>
              </div>
              <div className="vanta-field">
                <label>Cadence</label>
                <select value={cadence} onChange={(e) => setCadence(e.target.value)}>
                  <option>Weekly on Monday</option>
                  <option>Bi-weekly on Thursday</option>
                  <option>Monthly</option>
                  <option>On-demand Trigger</option>
                </select>
              </div>
            </div>
            <div className="vanta-field">
              <label>Export Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as 'CSV' | 'JSON')}>
                <option value="CSV">CSV (Tabular with priority scores)</option>
                <option value="JSON">JSON (Complete structured AST)</option>
              </select>
            </div>
          </div>
          <div className="modal-footer-bar">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary">Generate & Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RecipientModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (rec: RecipientItem) => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'TX'
    onAdd({ initials, name: name.trim(), note: role.trim() || 'Weekly signal digest' })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header-bar">
            <div>
              <div className="eyebrow">Distribution list</div>
              <h2>Add Signal Recipient</h2>
            </div>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close recipient dialog"><X size={18} /></button>
          </div>
          <div className="modal-content-scroll">
            <div className="vanta-field">
              <label>Stakeholder or Team Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering Leadership" required />
            </div>
            <div className="vanta-field">
              <label>Delivery Description</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Critical friction alerts" />
            </div>
          </div>
          <div className="modal-footer-bar">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary">Add recipient</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExperimentReviewModal({
  experiment,
  onClose,
  onUpdateStatus,
}: {
  experiment: AdaptationExperiment
  onClose: () => void
  onUpdateStatus: (id: string, status: AdaptationExperiment['status']) => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div>
            <div className="eyebrow">Experiment evaluation · {experiment.id}</div>
            <h2>{experiment.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close review"><X size={18} /></button>
        </div>
        <div className="modal-content-scroll">
          <p style={{ fontSize: 13, color: '#c5d0cc', lineHeight: 1.5 }}>
            <strong>Hypothesis:</strong> {experiment.hypothesis}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#0b1012', padding: 14, borderRadius: 6 }}>
            <div><small style={{ color: 'var(--muted)' }}>Target Audience</small><strong style={{ display: 'block', color: 'var(--ink)' }}>{experiment.audience}</strong></div>
            <div><small style={{ color: 'var(--muted)' }}>Owner</small><strong style={{ display: 'block', color: 'var(--ink)' }}>{experiment.owner}</strong></div>
            <div><small style={{ color: 'var(--muted)' }}>Baseline</small><strong style={{ display: 'block', color: 'var(--coral)' }}>{experiment.baseline}</strong></div>
            <div><small style={{ color: 'var(--muted)' }}>Target Goal</small><strong style={{ display: 'block', color: 'var(--green)' }}>{experiment.target}</strong></div>
          </div>
        </div>
        <div className="modal-footer-bar">
          <button className="button button-secondary" onClick={onClose}>Dismiss</button>
          {experiment.status !== 'Running' && (
            <button className="button button-primary" onClick={() => onUpdateStatus(experiment.id, 'Running')}>
              Launch experiment
            </button>
          )}
          {experiment.status === 'Running' && (
            <button className="button button-primary" onClick={() => onUpdateStatus(experiment.id, 'Complete')}>
              Mark complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
