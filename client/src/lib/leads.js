export const LEAD_STATUSES = [
  'New',
  'Researched',
  'Contacted',
  'Replied',
  'Qualified',
  'Meeting',
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
  New: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  Researched: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
  Contacted: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  Replied: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  Qualified: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
  Meeting: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  Proposal: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Lost: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
}

export const CHART_COLORS = {
  New: '#3b82f6',
  Researched: '#64748b',
  Contacted: '#8b5cf6',
  Replied: '#6366f1',
  Qualified: '#06b6d4',
  Meeting: '#14b8a6',
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