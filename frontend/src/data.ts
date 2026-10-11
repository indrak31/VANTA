import type {
  AdaptationExperiment,
  DashboardData,
  FeedbackRecord,
  Issue,
  Recommendation,
  ReportDefinition,
  Scenario,
} from './types'

export const seededFeedback: FeedbackRecord[] = [
  {
    id: 'fb-1042', account: 'Northstar Health', initials: 'NH', role: 'VP Operations', segment: 'Enterprise', channel: 'Interview', date: '2026-10-08',
    text: 'The workspace is powerful, but we lose confidence when an answer takes more than a few seconds. A visible run state would help our team understand what is happening.', sentiment: 'negative', themes: ['Response time', 'Transparency'], productArea: 'Workspace', severity: 4, impact: 5, effort: 3, frequency: 4, sourceUrl: 'interview://northstar/1042',
  },
  {
    id: 'fb-1038', account: 'Pine & Co', initials: 'PC', role: 'Customer Success Lead', segment: 'Growth', channel: 'Support', date: '2026-10-07',
    text: 'Search finds the title but not the useful sentence inside a transcript. We still open four records to find one detail.', sentiment: 'negative', themes: ['Search relevance', 'Time to value'], productArea: 'Search', severity: 4, impact: 4, effort: 3, frequency: 5, sourceUrl: 'support://pine/1038',
  },
  {
    id: 'fb-1033', account: 'Vertex Labs', initials: 'VL', role: 'Product Manager', segment: 'Scale', channel: 'Survey', date: '2026-10-05',
    text: 'The weekly signal digest is the first thing I read. Keep the evidence links — they make it easy to bring a recommendation into planning.', sentiment: 'positive', themes: ['Evidence', 'Digest'], productArea: 'Insights', severity: 1, impact: 4, effort: 2, frequency: 3, sourceUrl: 'survey://vertex/1033',
  },
  {
    id: 'fb-1027', account: 'Atelier Commerce', initials: 'AC', role: 'Head of CX', segment: 'Growth', channel: 'Community', date: '2026-10-04',
    text: 'I understand the initial setup, but the first-run checklist disappears too quickly. New teammates need a more deliberate introduction to the workflow.', sentiment: 'negative', themes: ['Onboarding', 'Enablement'], productArea: 'Onboarding', severity: 3, impact: 4, effort: 2, frequency: 4, sourceUrl: 'community://atelier/1027',
  },
  {
    id: 'fb-1022', account: 'Lumen Financial', initials: 'LF', role: 'Director of Support', segment: 'Enterprise', channel: 'Interview', date: '2026-10-02',
    text: 'We need a clean way to separate regulated customer notes from broad product feedback. The current filters make that possible only with a spreadsheet.', sentiment: 'negative', themes: ['Governance', 'Filtering'], productArea: 'Feedback', severity: 4, impact: 5, effort: 4, frequency: 3, sourceUrl: 'interview://lumen/1022',
  },
  {
    id: 'fb-1019', account: 'Kiteworks', initials: 'KW', role: 'Operations Manager', segment: 'Scale', channel: 'Survey', date: '2026-09-29',
    text: 'The issue view gives our weekly meeting a shared language. It would be useful to see what changed since the previous review without opening each issue.', sentiment: 'positive', themes: ['Issue tracking', 'Change history'], productArea: 'Insights', severity: 2, impact: 4, effort: 2, frequency: 3, sourceUrl: 'survey://kiteworks/1019',
  },
  {
    id: 'fb-1014', account: 'Cedar Schools', initials: 'CS', role: 'Digital Lead', segment: 'Growth', channel: 'Support', date: '2026-09-27',
    text: 'Recommendations are useful when they include a sample of the original wording. We do not need another black box score.', sentiment: 'neutral', themes: ['Evidence', 'Trust'], productArea: 'Recommendations', severity: 3, impact: 4, effort: 2, frequency: 4, sourceUrl: 'support://cedar/1014',
  },
  {
    id: 'fb-1009', account: 'Aster Mobility', initials: 'AM', role: 'Service Design Lead', segment: 'Enterprise', channel: 'Interview', date: '2026-09-24',
    text: 'We can act on the top three issues, but there is no safe place to test whether a faster response would move satisfaction before we commit engineering time.', sentiment: 'negative', themes: ['Simulation', 'Prioritization'], productArea: 'Simulator', severity: 4, impact: 5, effort: 3, frequency: 3, sourceUrl: 'interview://aster/1009',
  },
  {
    id: 'fb-1004', account: 'Meridian Travel', initials: 'MT', role: 'Chief Experience Officer', segment: 'Enterprise', channel: 'Survey', date: '2026-09-21',
    text: 'The cohort view is clear and fast. We need the same level of detail for regional teams so local owners can take action.', sentiment: 'positive', themes: ['Cohorts', 'Ownership'], productArea: 'Analytics', severity: 2, impact: 4, effort: 3, frequency: 3, sourceUrl: 'survey://meridian/1004',
  },
  {
    id: 'fb-0998', account: 'Monument Media', initials: 'MM', role: 'Research Director', segment: 'Scale', channel: 'Community', date: '2026-09-18',
    text: 'When multiple people tag the same theme, it is hard to tell whether the issue is growing or just being discussed more this week.', sentiment: 'neutral', themes: ['Trends', 'Taxonomy'], productArea: 'Analytics', severity: 3, impact: 3, effort: 3, frequency: 3, sourceUrl: 'community://monument/0998',
  },
  {
    id: 'fb-0991', account: 'Harbor Energy', initials: 'HE', role: 'Customer Programs Lead', segment: 'Enterprise', channel: 'Interview', date: '2026-09-14',
    text: 'We want to share a concise readout with leadership, but every export needs manual cleanup before it is presentable.', sentiment: 'negative', themes: ['Reporting', 'Executive view'], productArea: 'Reports', severity: 3, impact: 4, effort: 2, frequency: 3, sourceUrl: 'interview://harbor/0991',
  },
  {
    id: 'fb-0984', account: 'Quarry Systems', initials: 'QS', role: 'Product Operations', segment: 'Scale', channel: 'Support', date: '2026-09-10',
    text: 'Saved issues help us keep a focused backlog. A lightweight owner reminder would stop the list from becoming another place for work to disappear.', sentiment: 'positive', themes: ['Workflow', 'Ownership'], productArea: 'Issue Radar', severity: 2, impact: 3, effort: 2, frequency: 3, sourceUrl: 'support://quarry/0984',
  },
]

export const seededIssues: Issue[] = [
  { id: 'issue-01', title: 'Slow and opaque response states', summary: 'Customers lose confidence when analysis runs without a visible progress state or predictable response time.', productArea: 'Workspace', owner: 'Maya Chen', affectedAccounts: 18, mentionCount: 31, sentiment: -0.58, severity: 4, impact: 5, effort: 3, trend: 18, firstSeen: '2026-07-22', lastSeen: '2026-10-08', status: 'In discovery', evidenceIds: ['fb-1042', 'fb-1009'] },
  { id: 'issue-02', title: 'Search misses transcript context', summary: 'Exact phrases buried in long-form feedback are difficult to retrieve, slowing evidence gathering.', productArea: 'Search', owner: 'Ibrahim Shah', affectedAccounts: 15, mentionCount: 26, sentiment: -0.66, severity: 4, impact: 4, effort: 3, trend: 12, firstSeen: '2026-08-03', lastSeen: '2026-10-07', status: 'Open', evidenceIds: ['fb-1038'] },
  { id: 'issue-03', title: 'Onboarding guidance fades too early', summary: 'New teammates miss the core workflow because the first-run checklist is not available after initial setup.', productArea: 'Onboarding', owner: 'Sofia Alvarez', affectedAccounts: 11, mentionCount: 19, sentiment: -0.38, severity: 3, impact: 4, effort: 2, trend: 9, firstSeen: '2026-08-17', lastSeen: '2026-10-04', status: 'Planned', evidenceIds: ['fb-1027'] },
  { id: 'issue-04', title: 'Governance filters require workarounds', summary: 'Enterprise teams need faster ways to separate restricted notes from general product signal.', productArea: 'Feedback', owner: 'Maya Chen', affectedAccounts: 8, mentionCount: 14, sentiment: -0.44, severity: 4, impact: 5, effort: 4, trend: 4, firstSeen: '2026-08-30', lastSeen: '2026-10-02', status: 'Open', evidenceIds: ['fb-1022'] },
  { id: 'issue-05', title: 'Reporting needs manual polish', summary: 'Leadership readouts are valuable but exports require repeated formatting before they can be shared.', productArea: 'Reports', owner: 'Ibrahim Shah', affectedAccounts: 7, mentionCount: 12, sentiment: -0.31, severity: 3, impact: 4, effort: 2, trend: 6, firstSeen: '2026-08-21', lastSeen: '2026-09-14', status: 'Monitoring', evidenceIds: ['fb-0991'] },
  { id: 'issue-06', title: 'Trend lift is hard to distinguish', summary: 'Teams cannot easily tell whether a theme is genuinely growing or simply receiving more tags.', productArea: 'Analytics', owner: 'Sofia Alvarez', affectedAccounts: 6, mentionCount: 10, sentiment: -0.18, severity: 3, impact: 3, effort: 3, trend: 3, firstSeen: '2026-09-01', lastSeen: '2026-09-18', status: 'In discovery', evidenceIds: ['fb-0998'] },
]

export const seededRecommendations: Recommendation[] = [
  { id: 'rec-01', title: 'Add a response-state rail with time-to-result context', rationale: 'The same trust gap appears in enterprise interviews and simulation requests. A visible state should reduce abandonment while preserving the current analysis flow.', action: 'Prototype a four-state progress rail and measure completion plus perceived confidence.', owner: 'Maya Chen', impact: 'Protects enterprise adoption', confidence: 89, effort: 'Medium', status: 'Reviewing', issueId: 'issue-01', evidenceIds: ['fb-1042', 'fb-1009'] },
  { id: 'rec-02', title: 'Index transcript passages, not only record titles', rationale: 'Search relevance is the most frequent negative theme in the current window and affects both support and research workflows.', action: 'Add passage-level retrieval with highlighted matching context.', owner: 'Ibrahim Shah', impact: 'Cuts evidence collection time', confidence: 86, effort: 'High', status: 'New', issueId: 'issue-02', evidenceIds: ['fb-1038'] },
  { id: 'rec-03', title: 'Keep the onboarding checklist available in the workspace', rationale: 'The request is specific, repeated, and relatively low effort. Persistent guidance gives new teammates a clear next action without adding a training program.', action: 'Add a dismissible workspace checklist with progress persistence.', owner: 'Sofia Alvarez', impact: 'Improves first-week activation', confidence: 82, effort: 'Low', status: 'Accepted', issueId: 'issue-03', evidenceIds: ['fb-1027'] },
  { id: 'rec-04', title: 'Create a restricted-note filter preset', rationale: 'Enterprise users currently recreate the same multi-filter combination outside the product.', action: 'Ship a permission-aware preset and expose it in the feedback explorer.', owner: 'Maya Chen', impact: 'Reduces governance friction', confidence: 76, effort: 'Medium', status: 'New', issueId: 'issue-04', evidenceIds: ['fb-1022'] },
]

export const seededExperiments: AdaptationExperiment[] = [
  { id: 'exp-01', name: 'Progress rail in analysis workspace', hypothesis: 'Showing explicit response states will increase successful analysis completion by making wait time legible.', audience: 'Enterprise workspace admins', metric: 'Analysis completion', baseline: '71%', target: '80%', status: 'Ready', owner: 'Maya Chen', linkedIssue: 'issue-01' },
  { id: 'exp-02', name: 'Persistent first-week checklist', hypothesis: 'A persistent checklist will increase activation of a second teammate within seven days.', audience: 'New Growth workspaces', metric: 'Second-seat activation', baseline: '38%', target: '50%', status: 'Running', owner: 'Sofia Alvarez', linkedIssue: 'issue-03' },
  { id: 'exp-03', name: 'Passage-level search preview', hypothesis: 'Showing matching transcript passages will reduce time-to-evidence for research teams.', audience: 'Research and support roles', metric: 'Evidence time', baseline: '14 min', target: '8 min', status: 'Complete', owner: 'Ibrahim Shah', linkedIssue: 'issue-02' },
]

export const seededReports: ReportDefinition[] = [
  { id: 'report-01', name: 'Weekly signal brief', cadence: 'Every Monday', audience: 'Product leadership', lastRun: '2026-10-06 09:00', format: 'CSV' },
  { id: 'report-02', name: 'Enterprise friction review', cadence: 'Every other Thursday', audience: 'CX and product ops', lastRun: '2026-10-02 14:30', format: 'JSON' },
  { id: 'report-03', name: 'Adoption experiment readout', cadence: 'Monthly', audience: 'Growth squad', lastRun: '2026-10-01 10:15', format: 'CSV' },
]

export const seededData: DashboardData = {
  feedback: seededFeedback,
  issues: seededIssues,
  recommendations: seededRecommendations,
  experiments: seededExperiments,
  reports: seededReports,
}

export const defaultScenario: Scenario = { responseTime: 55, onboardingClarity: 48, searchRelevance: 62 }

export const formatDate = (iso: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${iso}T12:00:00`))

export const calculatePriority = (issue: Issue) => {
  const volume = Math.min(100, issue.mentionCount * 2.1)
  const sentimentRisk = Math.max(0, Math.min(100, (1 + issue.sentiment) * -50 + 50))
  const trend = Math.min(100, Math.max(0, 50 + issue.trend * 2))
  return Math.round(issue.severity * 10 * 0.32 + issue.impact * 10 * 0.28 + volume * 0.18 + sentimentRisk * 0.12 + trend * 0.1)
}

export const getPriorityBand = (score: number) => {
  if (score >= 80) return 'critical' as const
  if (score >= 65) return 'high' as const
  if (score >= 48) return 'medium' as const
  return 'watch' as const
}
