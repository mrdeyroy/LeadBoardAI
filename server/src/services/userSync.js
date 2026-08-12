import { clerkClient } from '@clerk/express'

import User from '../models/User.js'

/**
 * Best-effort profile resolution for a brand-new application User.
 * Tries Clerk session claims first (development tokens embed user data),
 * then falls back to the Clerk Backend API. If both are unavailable
 * (offline / test) the user is created with a placeholder identity —
 * ownership still works because it is keyed by clerkUserId.
 */
async function resolveProfile(clerkUserId, sessionClaims) {
  const sessionUser = sessionClaims?.user ?? null
  const candidate = {
    name: [sessionUser?.firstName, sessionUser?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim(),
    email: sessionUser?.emailAddress ?? sessionUser?.email ?? '',
  }

  if (!candidate.name || !candidate.email) {
    try {
      const profile = await clerkClient.users.getUser(clerkUserId)
      if (!candidate.name) {
        candidate.name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
      }
      if (!candidate.email && profile.emailAddresses?.length > 0) {
        const primaryId = profile.primaryEmailAddressId
        const match =
          profile.emailAddresses.find((e) => e.id === primaryId) ??
          profile.emailAddresses[0]
        candidate.email = match.emailAddress ?? ''
      }
    } catch {
      /* Clerk API unreachable — keep placeholders (offline/test mode) */
    }
  }

  return candidate
}

/**
 * Find the application User for a verified Clerk user, creating and
 * syncing the application-side record on first contact.
 *
 * This is the seam between the Clerk identity (clerkUserId) and the
 * existing MongoDB ownership model: every Lead/FollowUp/Activity row is
 * owned by the returned document's `_id`, not by the Clerk ID.
 */
export async function findOrCreateAppUser(clerkUserId, sessionClaims) {
  const existing = await User.findOne({ clerkUserId })
  if (existing) return existing

  const profile = await resolveProfile(clerkUserId, sessionClaims)

  const newUser = await User.create({
    clerkUserId,
    name: (profile.name || 'Unnamed user').slice(0, 100),
    email: (profile.email || '').slice(0, 254),
  })

  return newUser
}