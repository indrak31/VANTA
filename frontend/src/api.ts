import type { DashboardData, FeedbackRecord, Issue, Recommendation } from './types'

type ApiIssue = {
  id: number
  issue_key: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'ignored'
  feedback_count: number
  negative_count: number
  avg_sentiment: number
  avg_rating: number | null
  priority_score: number
  priority_breakdown: Record<string, unknown>
  created_at: string
  updated_at: string
}

type ApiFeedback = {
  id: string
  text: string
  rating: number | null
  category: string | null
  source: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentiment_score: number
  issues: { issue_key: string; title: string; priority_score: number }[]
  created_at: string
}

type ApiRecommendation = {
  issue_key: string
  title: string
  priority_score: number
  status: 'open' | 'in_progress' | 'resolved' | 'ignored'
  rationale: string
  suggested_actions: string[]
}

export type AdaptionAvailability = {
  configured: boolean
  sdk_installed: boolean
  api_key_configured: boolean
  provider: string
}

export type AdaptionRun = {
  id: string
  operation: 'estimate' | 'run'
  dataset_id: string
  status: string
  provider_run_id?: string | null
  response?: Record<string, unknown> | null
  error_code?: string | null
  error_message?: string | null
  status_refresh_error?: Record<string, string> | null
  created_at: string
  updated_at: string
}

const trimBase = (base: string) => base.replace(/\/$/, '')

const initials = (value: string) => value.split(/[^a-z0-9]+/i).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'IF'

const statusToUi = (status: ApiIssue['status']): Issue['status'] => ({
  open: 'Open',
  in_progress: 'In discovery',
  resolved: 'Monitoring',
  ignored: 'Planned',
}[status] as Issue['status'])

export const mapFeedback = (record: ApiFeedback): FeedbackRecord => {
  const source = record.source || 'Imported'
  const issue = record.issues[0]
  const account = source.includes('://') ? source.split('://')[1]?.split('/')[0] || source : source
  const channel = source.toLowerCase().includes('support') ? 'Support' : source.toLowerCase().includes('survey') ? 'Survey' : source.toLowerCase().includes('community') ? 'Community' : 'Interview'
  const issueName = issue?.title || record.category || 'General signal'
  const risk = record.sentiment === 'negative' ? 4 : record.sentiment === 'neutral' ? 3 : 2
  return {
    id: record.id,
    account,
    initials: initials(account),
    role: 'Feedback contributor',
    segment: 'Scale',
    channel,
    date: record.created_at.slice(0, 10),
    text: record.text,
    sentiment: record.sentiment,
    themes: [issueName],
    productArea: issueName,
    severity: risk,
    impact: record.rating ? Math.max(1, Math.round(6 - record.rating)) : risk,
    effort: 3,
    frequency: 3,
    sourceUrl: source,
  }
}

export const mapIssue = (issue: ApiIssue, feedback: FeedbackRecord[]): Issue => {
  const evidenceIds = feedback.filter((record) => record.themes.some((theme) => theme === issue.title)).map((record) => record.id)
  const productArea = issue.issue_key === 'performance' ? 'Workspace' : issue.issue_key === 'usability' ? 'Onboarding' : issue.issue_key === 'feature_request' ? 'Search' : issue.issue_key
  return {
    id: `api-${issue.id}`,
    title: issue.title,
    summary: issue.description,
    productArea,
    owner: 'Unassigned',
    affectedAccounts: issue.feedback_count,
    mentionCount: issue.feedback_count,
    sentiment: issue.avg_sentiment,
    severity: Math.max(1, Math.min(5, Math.round((issue.negative_count / Math.max(1, issue.feedback_count)) * 5) + 1)),
    impact: Math.max(1, Math.min(5, Math.round(issue.priority_score / 20))),
    effort: 3,
    trend: 0,
    firstSeen: issue.created_at.slice(0, 10),
    lastSeen: issue.updated_at.slice(0, 10),
    status: statusToUi(issue.status),
    evidenceIds: evidenceIds.length ? evidenceIds : feedback.filter((record) => record.themes.includes(issue.title)).slice(0, 4).map((record) => record.id),
  }
}

export const mapRecommendation = (recommendation: ApiRecommendation, issues: Issue[], feedback: FeedbackRecord[]): Recommendation => {
  const issue = issues.find((item) => item.productArea === recommendation.issue_key)
  const evidenceIds = issue?.evidenceIds || feedback.filter((record) => record.themes.includes(issue?.title || '')).map((record) => record.id)
  return {
    id: `api-${recommendation.issue_key}`,
    title: recommendation.title,
    rationale: recommendation.rationale,
    action: recommendation.suggested_actions[0] || 'Review representative feedback and define a measurable follow-up.',
    owner: 'Product operations',
    impact: 'Reduces customer friction',
    confidence: Math.round(recommendation.priority_score),
    effort: 'Medium',
    status: recommendation.status === 'open' ? 'New' : recommendation.status === 'in_progress' ? 'Reviewing' : recommendation.status === 'resolved' ? 'Accepted' : 'Parked',
    issueId: issue?.id || recommendation.issue_key,
    evidenceIds,
  }
}

export async function loadRemoteData(base: string, seeded: DashboardData): Promise<DashboardData> {
  const root = trimBase(base)
  const [feedbackResponse, issueResponse, recommendationResponse] = await Promise.all([
    fetch(`${root}/api/feedback?limit=500`),
    fetch(`${root}/api/issues`),
    fetch(`${root}/api/recommendations`),
  ])
  if (!feedbackResponse.ok || !issueResponse.ok || !recommendationResponse.ok) throw new Error('VANTA API unavailable')
  const apiFeedback = await feedbackResponse.json() as ApiFeedback[]
  const feedback = apiFeedback.map(mapFeedback)
  const apiIssues = await issueResponse.json() as ApiIssue[]
  const issues = apiIssues.map((item) => mapIssue(item, feedback))
  const apiRecommendations = await recommendationResponse.json() as ApiRecommendation[]
  return { ...seeded, feedback, issues, recommendations: apiRecommendations.map((item) => mapRecommendation(item, issues, feedback)) }
}

export async function createRemoteFeedback(base: string, payload: { text: string; rating?: number; category?: string; source: string }): Promise<FeedbackRecord> {
  const response = await fetch(`${trimBase(base)}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!response.ok) throw new Error('Feedback could not be submitted')
  return mapFeedback(await response.json() as ApiFeedback)
}

export async function importRemoteFeedback(base: string, file: File): Promise<{ imported: number; rejected: number; errors: string[] }> {
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(`${trimBase(base)}/api/feedback/import`, { method: 'POST', body: form })
  if (!response.ok) throw new Error('CSV import failed')
  return await response.json() as { imported: number; rejected: number; errors: string[] }
}

export async function getAdaptionAvailability(base: string): Promise<AdaptionAvailability> {
  const response = await fetch(`${trimBase(base)}/api/adaption/status`)
  if (!response.ok) throw new Error('Adaption status unavailable')
  return await response.json() as AdaptionAvailability
}

export async function runAdaptionOperation(base: string, operation: 'estimate' | 'run', payload: Record<string, unknown>): Promise<AdaptionRun> {
  const response = await fetch(`${trimBase(base)}/api/adaption/${operation}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const body = await response.json() as AdaptionRun | { detail?: { message?: string } }
  if (!response.ok) throw Object.assign(new Error(('detail' in body && body.detail?.message) || `Adaption ${operation} failed`), { result: body })
  return body as AdaptionRun
}

export async function getAdaptionRun(base: string, runId: string): Promise<AdaptionRun> {
  const response = await fetch(`${trimBase(base)}/api/adaption/status/${runId}`)
  if (!response.ok) throw new Error('Adaption run status unavailable')
  return await response.json() as AdaptionRun
}

export interface AdaptionRemoteDataset {
  id: string
  name: string
  status: string
  row_count: number
}

export async function listAdaptionDatasets(base: string): Promise<AdaptionRemoteDataset[]> {
  try {
    const response = await fetch(`${trimBase(base)}/api/adaption/datasets`)
    if (!response.ok) return []
    return await response.json() as AdaptionRemoteDataset[]
  } catch {
    return []
  }
}

export async function uploadAdaptionDataset(base: string, name?: string): Promise<{ id: string; name: string; status: string }> {
  const url = `${trimBase(base)}/api/adaption/datasets/upload${name ? `?name=${encodeURIComponent(name)}` : ''}`
  const response = await fetch(url, { method: 'POST' })
  if (!response.ok) throw new Error('Dataset upload to Adaption failed')
  return await response.json() as { id: string; name: string; status: string }
}

