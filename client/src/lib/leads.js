export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Won',
  'Lost',
]

export const WEBSITE_STATUSES = [
  'No Website',
  'Outdated Website',
  'Good Website',
  'Redesign Opportunity',
]

export const OUTREACH_CHANNELS = [
  'Cold Email',
  'Phone',
  'WhatsApp',
  'Instagram',
  'Referral',
  'Other',
]

export const STATUS_STYLES = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-violet-100 text-violet-700',
  Qualified: 'bg-cyan-100 text-cyan-700',
  Proposal: 'bg-amber-100 text-amber-700',
  Won: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-rose-100 text-rose-700',
}

export const CHART_COLORS = {
  New: '#3b82f6',
  Contacted: '#8b5cf6',
  Qualified: '#06b6d4',
  Proposal: '#f59e0b',
  Won: '#10b981',
  Lost: '#f43f5e',
}

export const SOURCES = ['Website', 'WhatsApp', 'Instagram', 'Phone', 'Referral', 'Other']

export const emptyLead = {
  name: '',
  company: '',
  contactPerson: '',
  email: '',
  phone: '',
  website: '',
  industry: '',
  websiteStatus: 'No Website',
  outreachChannel: 'Cold Email',
  source: '',
  requirement: '',
  budget: '',
  timeline: '',
  status: 'New',
  lastContactedAt: '',
  nextFollowUpAt: '',
  notes: '',
}