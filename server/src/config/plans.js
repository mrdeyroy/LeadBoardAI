export const PLANS = {
  free: {
    name: 'Free',
    maxLeads: 50,
    maxAiActionsPerMonth: 20,
    features: {
      csvExport: false,
      csvImport: false,
      advancedAnalytics: false,
    },
  },
  pro: {
    name: 'Pro',
    maxLeads: Infinity,
    maxAiActionsPerMonth: 500,
    features: {
      csvExport: true,
      csvImport: true,
      advancedAnalytics: true,
    },
  },
}

export function getPlanConfig(planName = 'free') {
  const normalized = (planName || 'free').toLowerCase()
  return PLANS[normalized] || PLANS.free
}
