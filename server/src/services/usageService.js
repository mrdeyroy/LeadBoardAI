import Lead from '../models/Lead.js'
import User from '../models/User.js'
import { getPlanConfig } from '../config/plans.js'
import { ApiError } from '../utils/ApiError.js'

export async function checkAndResetMonthlyUsage(user) {
  const now = new Date()
  const lastReset = user.aiUsageResetDate ? new Date(user.aiUsageResetDate) : new Date(0)

  // Check if a calendar month has elapsed
  const isDifferentMonth =
    now.getFullYear() !== lastReset.getFullYear() || now.getMonth() !== lastReset.getMonth()

  if (isDifferentMonth) {
    user.aiUsageCount = 0
    user.aiUsageResetDate = now
    await user.save()
  }
  return user
}

export async function checkLeadLimit(userId, additionalCount = 1) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')

  const planConfig = getPlanConfig(user.plan)
  if (planConfig.maxLeads === Infinity) return { allowed: true }

  const currentCount = await Lead.countDocuments({ user: userId })
  if (currentCount + additionalCount > planConfig.maxLeads) {
    throw new ApiError(
      403,
      `Lead limit reached for your ${planConfig.name} plan (${currentCount}/${planConfig.maxLeads}). Please upgrade to Pro for unlimited leads.`
    )
  }

  return { allowed: true, currentCount, maxLeads: planConfig.maxLeads }
}

export async function checkAIUsage(userId) {
  let user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')

  user = await checkAndResetMonthlyUsage(user)
  const planConfig = getPlanConfig(user.plan)

  if (user.aiUsageCount >= planConfig.maxAiActionsPerMonth) {
    throw new ApiError(
      429,
      `Monthly AI usage limit reached for your ${planConfig.name} plan (${user.aiUsageCount}/${planConfig.maxAiActionsPerMonth}). Upgrade to Pro for higher limits.`
    )
  }

  return { allowed: true, usageCount: user.aiUsageCount, maxUsage: planConfig.maxAiActionsPerMonth }
}

export async function incrementAIUsage(userId) {
  let user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')

  user = await checkAndResetMonthlyUsage(user)
  user.aiUsageCount += 1
  await user.save()

  return user.aiUsageCount
}

export async function checkFeatureAccess(userId, featureName) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')

  const planConfig = getPlanConfig(user.plan)
  if (!planConfig.features[featureName]) {
    throw new ApiError(
      403,
      `The feature "${featureName}" is not available on the ${planConfig.name} plan. Please upgrade to Pro.`
    )
  }

  return true
}
