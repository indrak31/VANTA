export type ViewKey =
  | 'overview'
  | 'feedback'
  | 'radar'
  | 'recommendations'
  | 'simulator'
  | 'adaptation'
  | 'reports'

export type Sentiment = 'positive' | 'neutral' | 'negative'
export type PriorityBand = 'critical' | 'high' | 'medium' | 'watch'

export interface FeedbackRecord {
  id: string
  account: string
  initials: string
  role: string
  segment: 'Enterprise' | 'Growth' | 'Scale'
  channel: 'Interview' | 'Support' | 'Survey' | 'Community'
  date: string
  text: string
  sentiment: Sentiment
  themes: string[]
  productArea: string
  severity: number
  impact: number
  effort: number
  frequency: number
  sourceUrl: string
}

export interface Issue {
  id: string
  title: string
  summary: string
  productArea: string
  owner: string
  affectedAccounts: number
  mentionCount: number
  sentiment: number
  severity: number
  impact: number
  effort: number
  trend: number
  firstSeen: string
  lastSeen: string
  status: 'Open' | 'In discovery' | 'Planned' | 'Monitoring'
  evidenceIds: string[]
}

export interface Recommendation {
  id: string
  title: string
  rationale: string
  action: string
  owner: string
  impact: string
  confidence: number
  effort: 'Low' | 'Medium' | 'High'
  status: 'New' | 'Reviewing' | 'Accepted' | 'Parked'
  issueId: string
  evidenceIds: string[]
}

export interface Scenario {
  responseTime: number
  onboardingClarity: number
  searchRelevance: number
}

export interface AdaptationExperiment {
  id: string
  name: string
  hypothesis: string
  audience: string
  metric: string
  baseline: string
  target: string
  status: 'Ready' | 'Running' | 'Complete'
  owner: string
  linkedIssue: string
}

export interface ReportDefinition {
  id: string
  name: string
  cadence: string
  audience: string
  lastRun: string
  format: 'CSV' | 'JSON'
}

export interface DashboardData {
  feedback: FeedbackRecord[]
  issues: Issue[]
  recommendations: Recommendation[]
  experiments: AdaptationExperiment[]
  reports: ReportDefinition[]
}
