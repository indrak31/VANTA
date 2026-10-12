import { useState } from 'react'
import {
  Shield,
  Users,
  Database,
  Terminal,
  Key,
  CheckCircle2,
  Plus,
  RefreshCw,
  ExternalLink,
  Download,
  Lock,
  Layers,
  Activity,
  AlertTriangle,
} from 'lucide-react'
import type { UserProfile } from '../types'
import './admin-console.css'

interface AdminConsoleProps {
  currentUser?: UserProfile | null
  onToast: (msg: string) => void
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Product Lead' | 'Analyst' | 'Viewer'
  status: 'Active' | 'Invited'
  lastActive: string
}

interface ApiKeyItem {
  id: string
  name: string
  prefix: string
  created: string
  lastUsed: string
  rateLimit: string
}

interface AuditLogItem {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  ip: string
  status: 'Success' | 'Warn'
}

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Indra K', email: 'indrak31@gmail.com', role: 'Admin', status: 'Active', lastActive: 'Just now' },
  { id: '2', name: 'Jordan Davis', email: 'jordan@vanta.ai', role: 'Product Lead', status: 'Active', lastActive: '18m ago' },
  { id: '3', name: 'Alex Vance', email: 'alex.vance@vanta.enterprise', role: 'Analyst', status: 'Active', lastActive: '1h ago' },
  { id: '4', name: 'Elena Rostova', email: 'elena@vanta.ai', role: 'Viewer', status: 'Active', lastActive: '3h ago' },
]

const INITIAL_API_KEYS: ApiKeyItem[] = [
  { id: 'k1', name: 'Production Telemetry Stream', prefix: 'vanta_live_9a4f...', created: '2026-09-15', lastUsed: 'Just now', rateLimit: '10,000 req/min' },
  { id: 'k2', name: 'Zendesk / Intercom Ingest', prefix: 'vanta_live_3b81...', created: '2026-10-01', lastUsed: '4m ago', rateLimit: '5,000 req/min' },
  { id: 'k3', name: 'Adaption Lab Sandbox', prefix: 'vanta_test_7e02...', created: '2026-10-08', lastUsed: 'Yesterday', rateLimit: '1,000 req/min' },
]

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'a1', timestamp: '2026-10-13 00:41:10', actor: 'Indra K (Admin)', action: 'Enterprise Session Authentication Verified', resource: 'Identity Provider', ip: '127.0.0.1', status: 'Success' },
  { id: 'a2', timestamp: '2026-10-13 00:35:22', actor: 'Signal Streamer', action: 'Ingested 1,280 feedback vectors', resource: 'Core Pipeline Bus', ip: 'Internal', status: 'Success' },
  { id: 'a3', timestamp: '2026-10-12 23:18:44', actor: 'Jordan Davis', action: 'Recalibrated issue priority weights', resource: 'Counterfactual Simulator', ip: '192.168.1.4', status: 'Success' },
  { id: 'a4', timestamp: '2026-10-12 21:04:15', actor: 'Indra K (Admin)', action: 'Exported workspace backup (JSON)', resource: 'Intelligence Reports', ip: '127.0.0.1', status: 'Success' },
  { id: 'a5', timestamp: '2026-10-12 18:22:01', actor: 'Security Engine', action: 'Automated PII scrubbing completed', resource: 'Telemetry Sanitizer', ip: 'Internal', status: 'Success' },
]

export function AdminConsole({ currentUser, onToast }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'ingestion' | 'retention' | 'security'>('team')
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM)
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS)
  const [auditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS)

  // Modals & form state
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Product Lead' | 'Analyst' | 'Viewer'>('Analyst')

  // Retention controls
  const [retentionDays, setRetentionDays] = useState('180')
  const [piiScrubbing, setPiiScrubbing] = useState(true)
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(78)
  const [enforceSso, setEnforceSso] = useState(true)

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'Invited',
      lastActive: 'Pending invite',
    }
    setTeam((prev) => [...prev, newMember])
    setInviteModalOpen(false)
    setInviteEmail('')
    onToast(`Invitation sent to ${inviteEmail} as ${inviteRole}`)
  }

  const handleGenerateKey = () => {
    const keyName = prompt('Enter a name for the new API Key:', 'Slack Events Webhook')
    if (keyName) {
      const newKey: ApiKeyItem = {
        id: `k-${Date.now()}`,
        name: keyName,
        prefix: `vanta_live_${Math.random().toString(36).substring(2, 8)}...`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never',
        rateLimit: '5,000 req/min',
      }
      setApiKeys((prev) => [newKey, ...prev])
      onToast(`API Key "${keyName}" generated successfully`)
    }
  }

  const handleRevokeKey = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke API Key "${name}"?`)) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id))
      onToast(`API Key "${name}" revoked`)
    }
  }

  return (
    <div className="admin-console-page">
      {/* Top Banner */}
      <div className="admin-header-banner">
        <div className="admin-header-copy">
          <div className="admin-badge-row">
            <span className="admin-shield-badge">
              <Shield size={13} />
              <span>ENTERPRISE GOVERNANCE</span>
            </span>
            <span className="admin-status-pill">
              <span className="live-dot" />
              <span>CLUSTER HEALTHY · 99.98% SLA</span>
            </span>
          </div>
          <h1>Admin Console & Security Operations</h1>
          <p>
            Manage team identity (RBAC), ingestion webhook credentials, privacy retention policies, and compliance audit trails.
          </p>
        </div>

        <div className="admin-header-user-card">
          <div className="user-card-top">
            <div className="user-card-avatar">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'IK'}
            </div>
            <div>
              <strong>{currentUser?.name || 'Indra K'}</strong>
              <small>{currentUser?.email || 'admin@vanta.ai'}</small>
            </div>
          </div>
          <div className="user-card-meta">
            <span className="role-tag">{currentUser?.role || 'Admin'}</span>
            <span className="provider-tag">SECURE WORKSPACE</span>
          </div>
          <div className="user-card-status-badge">
            <span className="live-dot" />
            <span>Root Admin Authority · Active</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <Users size={15} />
          <span>Team & Access (RBAC)</span>
          <span className="tab-count">{team.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'ingestion' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingestion')}
        >
          <Database size={15} />
          <span>Ingestion & API Keys</span>
          <span className="tab-count">{apiKeys.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'retention' ? 'active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          <Layers size={15} />
          <span>Retention & AI Policies</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Terminal size={15} />
          <span>Security & Audit Logs</span>
          <span className="tab-count">{auditLogs.length}</span>
        </button>
      </div>

      {/* TAB CONTENT: TEAM & RBAC */}
      {activeTab === 'team' && (
        <div className="admin-tab-pane">
          <div className="pane-header-actions">
            <div>
              <h2>Organization Members & Permissions</h2>
              <p>Control who has access to customer signals, simulation playbooks, and reports.</p>
            </div>
            <button className="button button-primary" onClick={() => setInviteModalOpen(true)}>
              <Plus size={14} />
              <span>Invite Team Member</span>
            </button>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <span>Member</span>
              <span>Role</span>
              <span>Status</span>
              <span>Last Active</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            <div className="admin-table-rows">
              {team.map((member) => (
                <div key={member.id} className="admin-table-row">
                  <div className="member-name-cell">
                    <div className="member-avatar">{member.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                    </div>
                  </div>

                  <div>
                    <span className={`role-badge-pill role-${member.role.toLowerCase().replace(/\s+/g, '-')}`}>
                      {member.role}
                    </span>
                  </div>

                  <div>
                    <span className={`status-badge-pill ${member.status === 'Active' ? 'active' : 'pending'}`}>
                      {member.status}
                    </span>
                  </div>

                  <div className="mono-date">{member.lastActive}</div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      className="table-action-btn"
                      onClick={() => onToast(`Permissions edited for ${member.name}`)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INGESTION & API KEYS */}
      {activeTab === 'ingestion' && (
        <div className="admin-tab-pane">
          {/* Active Webhook Feeds */}
          <div className="admin-section-block">
            <div className="section-title-row">
              <div>
                <h2>Active Ingestion Feeds</h2>
                <p>Real-time connectors ingesting customer feedback vectors into the intelligence bus.</p>
              </div>
              <button
                className="button button-secondary"
                onClick={() => onToast('Checked all webhook pipelines: 4/4 operational')}
              >
                <RefreshCw size={13} />
                <span>Test Pipelines</span>
              </button>
            </div>

            <div className="pipeline-grid">
              <div className="pipeline-card">
                <div className="pipeline-card-top">
                  <span className="pipeline-dot live" />
                  <strong>Zendesk Support Webhook</strong>
                  <span className="pipeline-status">HEALTHY</span>
                </div>
                <p>Ingesting tickets, resolution notes, and customer sentiment telemetry.</p>
                <div className="pipeline-footer">
                  <span>VOLUME: 420 events/day</span>
                  <span className="mono-date">LATENCY 12ms</span>
                </div>
              </div>

              <div className="pipeline-card">
                <div className="pipeline-card-top">
                  <span className="pipeline-dot live" />
                  <strong>Salesforce CRM Sync</strong>
                  <span className="pipeline-status">HEALTHY</span>
                </div>
                <p>Syncing ARR risk, account renewal dates, and stakeholder churn flags.</p>
                <div className="pipeline-footer">
                  <span>VOLUME: 310 accounts/day</span>
                  <span className="mono-date">LATENCY 18ms</span>
                </div>
              </div>

              <div className="pipeline-card">
                <div className="pipeline-card-top">
                  <span className="pipeline-dot live" />
                  <strong>Slack #customer-feedback</strong>
                  <span className="pipeline-status">STREAMING</span>
                </div>
                <p>Capturing raw unstructured mentions and sales rep customer quotes.</p>
                <div className="pipeline-footer">
                  <span>VOLUME: 550 messages/day</span>
                  <span className="mono-date">REALTIME</span>
                </div>
              </div>

              <div className="pipeline-card">
                <div className="pipeline-card-top">
                  <span className="pipeline-dot live" />
                  <strong>Adaption Lab Connector</strong>
                  <span className="pipeline-status">BI-DIRECTIONAL</span>
                </div>
                <p>Syncing automated playbooks and hypothesis experiment baselines.</p>
                <div className="pipeline-footer">
                  <span>STATUS: CONNECTED</span>
                  <span className="mono-date">TLS 1.3</span>
                </div>
              </div>
            </div>
          </div>

          {/* API Keys Management */}
          <div className="admin-section-block">
            <div className="pane-header-actions">
              <div>
                <h2>API Credentials & Integration Tokens</h2>
                <p>High-throughput bearer tokens used by your SDKs and data pipelines.</p>
              </div>
              <button className="button button-primary" onClick={handleGenerateKey}>
                <Key size={14} />
                <span>Generate New API Key</span>
              </button>
            </div>

            <div className="admin-table-container">
              <div className="admin-table-header">
                <span>Key Name</span>
                <span>Prefix</span>
                <span>Created</span>
                <span>Last Used</span>
                <span>Rate Limit</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              <div className="admin-table-rows">
                {apiKeys.map((k) => (
                  <div key={k.id} className="admin-table-row">
                    <div>
                      <strong>{k.name}</strong>
                    </div>
                    <div className="mono-key">{k.prefix}</div>
                    <div className="mono-date">{k.created}</div>
                    <div className="mono-date">{k.lastUsed}</div>
                    <div><span className="rate-pill">{k.rateLimit}</span></div>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        className="table-action-btn danger"
                        onClick={() => handleRevokeKey(k.id, k.name)}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RETENTION & AI POLICIES */}
      {activeTab === 'retention' && (
        <div className="admin-tab-pane">
          <div className="pane-header-actions">
            <div>
              <h2>Data Retention & Automated Privacy Policies</h2>
              <p>Configure storage windows, automated GDPR redaction, and AI classification thresholds.</p>
            </div>
            <button
              className="button button-primary"
              onClick={() => onToast('Governance policies saved successfully')}
            >
              <CheckCircle2 size={14} />
              <span>Save Policy Changes</span>
            </button>
          </div>

          <div className="policy-settings-grid">
            <div className="policy-card">
              <h3>Telemetry Retention Window</h3>
              <p>Determines how long raw customer feedback mentions are stored before automated vectorization.</p>
              <div className="policy-control-row">
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="policy-select"
                >
                  <option value="90">90 Days (Enterprise Rolling)</option>
                  <option value="180">180 Days (Recommended)</option>
                  <option value="365">1 Year (Compliance Standard)</option>
                  <option value="unlimited">Indefinite (Full History)</option>
                </select>
              </div>
              <small>Older signals will be preserved in synthesized trend models without storing raw PII.</small>
            </div>

            <div className="policy-card">
              <h3>Automated PII Redaction (GDPR / CCPA)</h3>
              <p>Automatically scrub customer email addresses, phone numbers, and payment details before ingestion.</p>
              <div className="toggle-row">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={piiScrubbing}
                    onChange={(e) => setPiiScrubbing(e.target.checked)}
                  />
                  <span>Enable Real-Time Entity Masking</span>
                </label>
              </div>
              <small>Uses zero-shot NER models to mask personal names and company-sensitive identifiers.</small>
            </div>

            <div className="policy-card">
              <h3>AI Confidence Threshold ({aiConfidenceThreshold}%)</h3>
              <p>Minimum algorithmic certainty required before promoting an emerging cluster to the Issue Radar.</p>
              <div className="policy-slider-wrap">
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={aiConfidenceThreshold}
                  onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                  className="policy-slider"
                />
                <span className="slider-val">{aiConfidenceThreshold}% Threshold</span>
              </div>
              <small>Higher values reduce noise; lower values highlight early canary signals earlier.</small>
            </div>

            <div className="policy-card">
              <h3>SSO & Session Security</h3>
              <p>Require Enterprise Single Sign-On (SAML 2.0 / OIDC) for all workspace members.</p>
              <div className="toggle-row">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={enforceSso}
                    onChange={(e) => setEnforceSso(e.target.checked)}
                  />
                  <span>Enforce Enterprise SAML 2.0 / IdP SSO</span>
                </label>
              </div>
              <small>Restricts unmanaged password bypass and synchronizes with corporate Okta / Azure AD Directory.</small>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SECURITY & AUDIT LOGS */}
      {activeTab === 'security' && (
        <div className="admin-tab-pane">
          <div className="pane-header-actions">
            <div>
              <h2>Audit Trail & Security Telemetry</h2>
              <p>Cryptographically verifiable record of administrative actions, data exports, and auth sessions.</p>
            </div>
            <button
              className="button button-secondary"
              onClick={() => onToast('Audit log export initiated (CSV)')}
            >
              <Download size={13} />
              <span>Export Audit Trail (CSV)</span>
            </button>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header audit-header">
              <span>Timestamp</span>
              <span>Actor</span>
              <span>Action</span>
              <span>Target Resource</span>
              <span>Origin IP</span>
              <span style={{ textAlign: 'right' }}>Result</span>
            </div>

            <div className="admin-table-rows">
              {auditLogs.map((log) => (
                <div key={log.id} className="admin-table-row audit-row">
                  <div className="mono-date">{log.timestamp}</div>
                  <div><strong>{log.actor}</strong></div>
                  <div>{log.action}</div>
                  <div className="mono-key">{log.resource}</div>
                  <div className="mono-date">{log.ip}</div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="status-badge-pill active">
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setInviteModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Invite Member to Workspace</h3>
              <button className="btn-close-modal" onClick={() => setInviteModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="admin-modal-form">
              <div className="form-group">
                <label>Work Email Address</label>
                <input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="Admin">Admin (Full Console Access & Ingestion Keys)</option>
                  <option value="Product Lead">Product Lead (Radar, Simulator & Playbooks)</option>
                  <option value="Analyst">Analyst (Feedback Explorer & Reports)</option>
                  <option value="Viewer">Viewer (Read-Only Dashboards)</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Send Enterprise Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
