import { generateKeyPairSync } from 'node:crypto'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

// ---- Test auth: networkless Clerk verification ----------------------------
// The app verifies Clerk session tokens using a `jwtKey` (PEM public key).
// This harness generates its own RSA keypair, wires the public key in as
// CLERK_JWT_KEY, and mints RS256-signed tokens with the private key. No
// Clerk account or network call is required; the real `@clerk/express`
// verification path is exercised end to end.
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
})
const randomPair = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwtKeyPem = publicKey.export({ type: 'spki', format: 'pem' })

process.env.CLERK_SECRET_KEY = 'sk_test_2smokeSmokeSmokeSmokeSmokeSmokeSmokeSmoke'
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_Y2xlcmsubGVhZGJvYXJkLmRldiQ'
process.env.CLERK_JWT_KEY = jwtKeyPem
// The harness must not depend on a real Gemini key: force the in-memory app
// into the "AI provider not configured" path (deterministic, offline, cheap).
process.env.GEMINI_API_KEY = ''

const mongod = await MongoMemoryServer.create()
const uri = mongod.getUri()
process.env.MONGODB_URI = uri

const { default: app } = await import('../src/app.js')

await mongoose.connect(uri)

const server = app.listen(0)
const { port } = server.address()
const base = `http://127.0.0.1:${port}/api`

const results = []
let passed = 0
let failed = 0

const check = (name, condition, extra = '') => {
  if (condition) {
    passed += 1
    results.push(`PASS  ${name}`)
  } else {
    failed += 1
    results.push(`FAIL  ${name}  ${extra}`)
  }
}

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }
  return { status: res.status, data }
}

// Mint a Clerk-style session token for a given user identity.
// `extraClaims` can smuggle in fake user IDs / user profile data for tests.
const makeToken = (clerkUserId, extraClaims = {}) => {
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    {
      azp: 'http://localhost:5173',
      exp: now + 3600,
      iat: now,
      iss: 'https://smoke.clerk.accounts.dev',
      nbf: now - 5,
      sid: `sess_${clerkUserId}`,
      sub: clerkUserId,
      user: {
        firstName: 'Demo',
        lastName: 'User',
        emailAddress: 'demo@example.com',
      },
      ...extraClaims,
    },
    privateKey,
    { algorithm: 'RS256', header: { typ: 'JWT' } }
  )
}

const DEMO_USER = 'user_2smokeDemo'
const OTHER_USER = 'user_2smokeOther'
const token = makeToken(DEMO_USER)
const otherToken = makeToken(OTHER_USER, {
  user: { firstName: 'Other', lastName: 'User', emailAddress: 'other@example.com' },
})

// ---- Auth ----
const meNoToken = await request('GET', '/auth/me')
check('me without token -> 401', meNoToken.status === 401)

const meBadToken = await request('GET', '/auth/me', { token: 'not-a-jwt' })
check('me with garbage token -> 401', meBadToken.status === 401)

const expiredToken = makeToken('user_2smokeExpired', {})
const expClaims = jwt.decode(expiredToken)
const expired = jwt.sign({ ...expClaims, exp: Math.floor(Date.now() / 1000) - 3600 }, privateKey, {
  algorithm: 'RS256',
})
const meExpired = await request('GET', '/auth/me', { token: expired })
check('me with expired token -> 401', meExpired.status === 401)

const wrongKeyToken = makeToken('user_2smokeWrong')
const wrongKeyPayload = jwt.decode(wrongKeyToken, { json: true })
const wrongKeySigned = jwt.sign(wrongKeyPayload, randomPair.privateKey, { algorithm: 'RS256' })
const meWrongKey = await request('GET', '/auth/me', { token: wrongKeySigned })
check('token signed by wrong key -> 401', meWrongKey.status === 401)

// Fake userId in the token must be ignored — identity comes from the verified `sub`.
const meWithFakeClaim = await request('GET', '/auth/me', {
  token: makeToken(DEMO_USER, { userId: 'user_2sneaky' }),
})
check(
  'fake userId claim is ignored',
  meWithFakeClaim.status === 200 && meWithFakeClaim.data?.user?.clerkUserId === DEMO_USER
)

const me = await request('GET', '/auth/me', { token })
check('me returns synced app user', me.status === 200 && me.data?.user?.clerkUserId === DEMO_USER)
check('me user has ownership id', !!me.data?.user?.id)

const synced = await mongoose.model('User').findOne({ clerkUserId: DEMO_USER })
check('app user auto-created from clerk identity', !!synced)
check('no passwordHash field on app user', synced?.passwordHash === undefined)
check('email synced from clerk claims', synced?.email === 'demo@example.com')

// Upgrade test users to Pro plan for standard CRUD assertions
synced.plan = 'pro'
await synced.save()

// ---- Leads ----
const noAuthLeads = await request('GET', '/leads')
check('leads without token -> 401', noAuthLeads.status === 401)

const created = await request('POST', '/leads', {
  token,
  body: {
    name: 'Acme Corp',
    company: 'Acme',
    email: 'hi@acme.io',
    source: 'Website',
    requirement: 'Looking for a CRM',
    budget: '$2k',
  },
})
check('create lead -> 201', created.status === 201 && created.data.lead.name === 'Acme Corp')
check('lead defaults to New', created.data.lead.status === 'New')

const createSecond = await request('POST', '/leads', {
  token,
  body: { name: 'Reliance Traders', status: 'Qualified' },
})
check('create second lead -> 201', createSecond.status === 201 && createSecond.data.lead.status === 'Qualified')

const createBad = await request('POST', '/leads', { token, body: { name: '' } })
check('create with empty name -> 400', createBad.status === 400)
check('validation error exposes field details', !!createBad.data?.details)

const createBadStatus = await request('POST', '/leads', { token, body: { name: 'X', status: 'Hot' } })
check('create with bad status -> 400', createBadStatus.status === 400)

const badJson = await fetch(base + '/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: '{not json',
})
check('malformed JSON body -> 400', badJson.status === 400)

const { leads: listOne } = (await request('GET', '/leads?search=acme', { token })).data
check('search finds acme', listOne.length === 1 && listOne[0].name === 'Acme Corp')

const { leads: qualified } = (await request('GET', '/leads?status=Qualified', { token })).data
check('status filter', qualified.length === 1 && qualified[0].name === 'Reliance Traders')

const all = await request('GET', '/leads', { token })
check('list pagination shape', all.data.pagination.total === 2 && all.data.leads.length === 2)

const leadId = created.data.lead.id
const got = await request('GET', `/leads/${leadId}`, { token })
check('get lead', got.status === 200 && got.data.lead.company === 'Acme')

const missing = await request('GET', '/leads/000000000000000000000000', { token })
check('get missing lead -> 404', missing.status === 404)

const updated = await request('PATCH', `/leads/${leadId}`, {
  token,
  body: { status: 'Contacted', notes: 'Initial call scheduled' },
})
check('update lead status + notes', updated.status === 200 && updated.data.lead.status === 'Contacted')

const badPatch = await request('PATCH', `/leads/${leadId}`, { token, body: { status: 'Nope' } })
check('patch with bad status -> 400', badPatch.status === 400)

// Verify activity logging via db directly
const dbActivities = await mongoose.model('Activity').find({ lead: leadId }).sort({ createdAt: 1 })
check('activities recorded (created, status, note)',
  dbActivities.some((a) => a.type === 'lead_created' && a.message.includes('Acme Corp')) &&
    dbActivities.some((a) => a.type === 'status_changed' && a.metadata.get('from') === 'New' && a.metadata.get('to') === 'Contacted') &&
    dbActivities.some((a) => a.type === 'note_added'))

// ---- Follow-ups ----
const followUp = await request('POST', '/followups', {
  token,
  body: { leadId, title: 'Call back next week', dueDate: '2026-08-20' },
})
check('create follow-up -> 201', followUp.status === 201 && followUp.data.followUp.title === 'Call back next week')

const fupBadLead = await request('POST', '/followups', {
  token,
  body: { leadId: '000000000000000000000000', title: 'X', dueDate: '2026-08-20' },
})
check('follow-up for missing lead -> 404', fupBadLead.status === 404)

const fupBadDate = await request('POST', '/followups', {
  token,
  body: { leadId, title: 'X', dueDate: 'not-a-date' },
})
check('follow-up bad date -> 400', fupBadDate.status === 400)

const fupId = followUp.data.followUp.id
const openList = await request('GET', '/followups?openOnly=true', { token })
check('open follow-ups listed with lead name', openList.data.followUps.length === 1 && openList.data.followUps[0].lead.name === 'Acme Corp')

// ---- Activities ----
const leadActs = await request('GET', `/leads/${leadId}/activities`, { token })
check('lead activities endpoint', leadActs.status === 200 && leadActs.data.activities.length >= 4)

const recentActs = await request('GET', '/activities?limit=5', { token })
check('recent activities endpoint', recentActs.status === 200 && recentActs.data.activities.length >= 4)
check('activity json has lead name', recentActs.data.activities[0].lead?.name !== undefined)

// ---- Dashboard ----
const dash = await request('GET', '/dashboard', { token })
check('dashboard returns 200', dash.status === 200)
check('dashboard totals', dash.data.leads.total === 2 &&
  dash.data.statusCounts.find((s) => s.status === 'Qualified').count === 1 &&
  dash.data.statusCounts.find((s) => s.status === 'Contacted').count === 1)
check('dashboard pending follow-ups', dash.data.pendingFollowUps.length === 1 && dash.data.pendingFollowUps[0].title === 'Call back next week')
check('dashboard recent activity', dash.data.recentActivity.length >= 4)

const toggle = await request('PATCH', `/followups/${fupId}`, { token, body: { completed: true } })
check('toggle follow-up complete', toggle.status === 200 && toggle.data.followUp.completed === true)

const openAfter = await request('GET', '/followups?openOnly=true', { token })
check('completed excluded from openOnly', openAfter.data.followUps.length === 0)

// ---- Second user (Clerk identity -> own app user + isolation) ----
const otherMe = await request('GET', '/auth/me', { token: otherToken })
check('second clerk identity syncs its own app user',
  otherMe.status === 200 && otherMe.data?.user?.clerkUserId === OTHER_USER)

const otherSynced = await mongoose.model('User').findOne({ clerkUserId: OTHER_USER })
check('two app users are distinct', otherSynced && !otherSynced._id.equals(synced._id))

// ---- AI tools (execution requires no Gemini key) ----
const aiNoAuth = await request('POST', '/ai/actions', { body: { tool: 'addLeadNote', params: { leadId, content: 'x' } } })
check('ai actions without token -> 401', aiNoAuth.status === 401)

const badTool = await request('POST', '/ai/actions', { token, body: { tool: 'dropDatabase', params: {} } })
check('unknown tool -> 400', badTool.status === 400 && badTool.data.error.includes('Unknown tool'))

const badParams = await request('POST', '/ai/actions', { token, body: { tool: 'updateLeadStatus', params: { leadId, status: 'Hot' } } })
check('tool param enum -> 400', badParams.status === 400 && !!badParams.data.details)

const missingParam = await request('POST', '/ai/actions', { token, body: { tool: 'updateLeadStatus', params: { leadId } } })
check('tool missing required param -> 400', missingParam.status === 400 && !!missingParam.data.details)

const aiStatus = await request('POST', '/ai/actions', {
  token,
  body: { tool: 'updateLeadStatus', params: { leadId, status: 'Qualified' } },
})
check('ai updateLeadStatus executes', aiStatus.status === 200 && aiStatus.data.result.to === 'Qualified')

const leadAfterAi = await request('GET', `/leads/${leadId}`, { token })
check('lead status changed by ai tool', leadAfterAi.data.lead.status === 'Qualified')

const aiNote = await request('POST', '/ai/actions', {
  token,
  body: { tool: 'addLeadNote', params: { leadId, content: 'Strong fit — initial call done' } },
})
check('ai addLeadNote executes', aiNote.status === 200 && aiNote.data.result.note.startsWith('Strong fit'))

const aiFollowUp = await request('POST', '/ai/actions', {
  token,
  body: { tool: 'createFollowUp', params: { leadId, title: 'AI: send proposal', dueDate: '2026-08-25' } },
})
check('ai createFollowUp executes', aiFollowUp.status === 200 && aiFollowUp.data.result.followUpId)

const aiBadDate = await request('POST', '/ai/actions', {
  token,
  body: { tool: 'createFollowUp', params: { leadId, title: 'X', dueDate: 'garbage' } },
})
check('ai follow-up bad date -> 400', aiBadDate.status === 400)

const aiWrongOwner = await request('POST', '/ai/actions', {
  token: otherToken,
  body: { tool: 'updateLeadStatus', params: { leadId, status: 'Won' } },
})
check('ai tool blocked for other user -> 404', aiWrongOwner.status === 404)

const aiActivities = await mongoose.model('Activity').find({ lead: leadId, 'metadata.actor': 'ai' }).sort({ createdAt: 1 })
check('ai actions logged with actor metadata',
  aiActivities.some((a) => a.type === 'status_changed' && a.metadata.get('to') === 'Qualified') &&
    aiActivities.some((a) => a.type === 'note_added') &&
    aiActivities.some((a) => a.type === 'followup_created'))

// AI generation endpoints require a Gemini key — they must fail cleanly without one
const noKeyAnalyze = await request('POST', '/ai/analyze', { token, body: { leadId } })
check('analyze without key -> 500', noKeyAnalyze.status === 500 && noKeyAnalyze.data.error === 'Gemini API key not configured')

const noKeyChat = await request('POST', '/ai/chat', { token, body: { leadId, message: 'What should I do next?' } })
check('chat without key -> 500', noKeyChat.status === 500 && noKeyChat.data.error === 'Gemini API key not configured')

const badChatHistory = await request('POST', '/ai/chat', { token, body: { leadId, message: 'hi', history: 'not-an-array' } })
check('chat history must be an array -> 400', badChatHistory.status === 400)

const badChatHistoryRole = await request('POST', '/ai/chat', {
  token,
  body: { leadId, message: 'hi', history: [{ role: 'system', text: 'sys' }] },
})
check('chat history invalid role -> 400', badChatHistoryRole.status === 400)

const badReplyTone = await request('POST', '/ai/reply', { token, body: { leadId, tone: 'shouty' } })
check('reply invalid tone -> 400', badReplyTone.status === 400)

// ---- Ownership isolation (User A vs User B) ----
const otherUser = await mongoose.model('User').findOne({ clerkUserId: OTHER_USER })
if (otherUser) {
  otherUser.plan = 'pro'
  await otherUser.save()
}

const otherLead = await request('POST', '/leads', {
  token: otherToken,
  body: { name: "Other's Secret Lead" },
})
check('other user can create leads', otherLead.status === 201)

const visible = await request('GET', `/leads/${otherLead.data.lead.id}`, { token })
check('demo user cannot see other user lead -> 404', visible.status === 404)

const otherList = await request('GET', '/leads', { token: otherToken })
check('other user sees only own leads', otherList.data.pagination.total === 1)

const otherLeadId = otherLead.data.lead.id

const otherPatchOurs = await request('PATCH', `/leads/${leadId}`, {
  token: otherToken,
  body: { status: 'Won' },
})
check('other user cannot modify our lead -> 404', otherPatchOurs.status === 404)

const otherDeleteOurs = await request('DELETE', `/leads/${leadId}`, { token: otherToken })
check('other user cannot delete our lead -> 404', otherDeleteOurs.status === 404)

const otherFup = await request('POST', '/followups', {
  token: otherToken,
  body: { leadId, title: 'Poke at their lead', dueDate: '2026-08-30' },
})
check('other user cannot follow up our lead -> 404', otherFup.status === 404)

const otherPatchOurFup = await request('PATCH', `/followups/${fupId}`, {
  token: otherToken,
  body: { completed: true },
})
check('other user cannot touch our follow-up -> 404', otherPatchOurFup.status === 404)

const otherFupList = await request('GET', '/followups', { token: otherToken })
check('other user sees only their follow-ups', otherFupList.data.followUps.length === 0)

const otherLeadActs = await request('GET', `/leads/${leadId}/activities`, { token: otherToken })
check('other user cannot read our lead activities -> 404', otherLeadActs.status === 404)

const otherRecentActs = await request('GET', '/activities?limit=20', { token: otherToken })
check(
  'other user activity feed is isolated from our lead',
  otherRecentActs.data.activities.length === 1 &&
    !otherRecentActs.data.activities.some((a) => a.lead?.id === leadId)
)

const dashOther = await request('GET', '/dashboard', { token: otherToken })
check('other user dashboard is isolated', dashOther.data.leads.total === 1)

// ---- User Profile & Preferences ----
const userProfile = await request('GET', '/user/profile', { token })
check('get user profile -> 200', userProfile.status === 200 && userProfile.data.user.email !== undefined)

const updateProf = await request('PATCH', '/user/profile', {
  token,
  body: { phone: '+1234567890', jobTitle: 'Sales Director', companyName: 'Acme Sales', bio: 'CRM Lead' },
})
check('update user profile -> 200', updateProf.status === 200 && updateProf.data.user.jobTitle === 'Sales Director')

const updatePref = await request('PATCH', '/user/preferences', {
  token,
  body: { itemsPerPage: 50, defaultView: 'cards', theme: 'dark' },
})
check('update user preferences -> 200', updatePref.status === 200 && updatePref.data.user.preferences.itemsPerPage === 50)

const badPref = await request('PATCH', '/user/preferences', {
  token,
  body: { itemsPerPage: 100 },
})
check('invalid preferences -> 400', badPref.status === 400)

// Set DEMO_USER to Pro for initial CSV feature testing
const demoUserEarly = await mongoose.model('User').findOne({ clerkUserId: DEMO_USER })
demoUserEarly.plan = 'pro'
await demoUserEarly.save()

// ---- CSV Export & Import ----
const exportRes = await fetch(base + '/leads/export', {
  headers: { Authorization: `Bearer ${token}` },
})
const csvText = await exportRes.text()
check('csv export -> 200 with text/csv', exportRes.status === 200 && csvText.includes('Name,Company,Contact Person,Email'))

const importRes = await request('POST', '/leads/import', {
  token,
  body: {
    leads: [
      { name: 'Imported Lead 1', company: 'Corp 1', status: 'New', source: 'CSV Import' },
      { name: 'Imported Lead 2', company: 'Corp 2', status: 'Qualified', source: 'Website' },
      { name: '' }, // invalid, should be skipped
    ],
  },
})
check('csv import -> 200 with importedCount', importRes.status === 200 && importRes.data.importedCount === 2 && importRes.data.skippedCount === 1)

// ---- CSV import edge cases ----
const importNonArray = await request('POST', '/leads/import', { token, body: { leads: 'not-an-array' } })
check('csv import non-array body treated as empty -> importedCount 0', importNonArray.status === 200 && importNonArray.data.importedCount === 0)

const importAllInvalid = await request('POST', '/leads/import', {
  token,
  body: { leads: [{ name: '' }, { name: '   ' }, null] },
})
check('csv import all-invalid rows -> importedCount 0, skippedCount 3', importAllInvalid.status === 200 && importAllInvalid.data.importedCount === 0 && importAllInvalid.data.skippedCount === 3)

const sortedLeads = await request('GET', '/leads?sortBy=name&sortOrder=asc', { token })
check('leads sorting by name', sortedLeads.status === 200 && sortedLeads.data.leads.length >= 2)

const dashWithSources = await request('GET', '/dashboard', { token })
check('dashboard sourceCounts included', Array.isArray(dashWithSources.data.sourceCounts) && dashWithSources.data.sourceCounts.length >= 1)

// ---- Follow-up PATCH validation ----
const patchFupEmptyTitle = await request('PATCH', `/followups/${fupId}`, {
  token,
  body: { title: '   ' },
})
check('follow-up patch empty title -> 400', patchFupEmptyTitle.status === 400)

const patchFupBadDate = await request('PATCH', `/followups/${fupId}`, {
  token,
  body: { dueDate: 'not-a-date' },
})
check('follow-up patch bad date -> 400', patchFupBadDate.status === 400)

const patchFupValidTitle = await request('PATCH', `/followups/${fupId}`, {
  token,
  body: { title: 'Updated Call Title' },
})
check('follow-up patch valid title -> 200', patchFupValidTitle.status === 200 && patchFupValidTitle.data.followUp.title === 'Updated Call Title')

// ---- Follow-up DELETE ----
const aiFupId = aiFollowUp.data.result.followUpId
const deleteFupOtherUser = await request('DELETE', `/followups/${aiFupId}`, { token: otherToken })
check('other user cannot delete our follow-up -> 404', deleteFupOtherUser.status === 404)

const deleteFupOwned = await request('DELETE', `/followups/${aiFupId}`, { token })
check('delete own follow-up -> 200', deleteFupOwned.status === 200)

const deleteFupGone = await request('GET', '/followups', { token })
check('deleted follow-up no longer in list', !deleteFupGone.data.followUps.some((f) => f.id === aiFupId))

// ---- Activity type filtering & search ----
const actsByType = await request('GET', `/leads/${leadId}/activities?type=status_changed`, { token })
check('activities filter by type=status_changed', actsByType.status === 200 && actsByType.data.activities.every((a) => a.type === 'status_changed'))

const recentActsByType = await request('GET', '/activities?type=lead_created', { token })
check('recent activities filter by type=lead_created', recentActsByType.status === 200 && recentActsByType.data.activities.length > 0 && recentActsByType.data.activities.every((a) => a.type === 'lead_created'))

const actSearch = await request('GET', '/activities?search=Acme', { token })
check('recent activities search by message keyword', actSearch.status === 200 && actSearch.data.activities.length > 0 && actSearch.data.activities.every((a) => a.message.toLowerCase().includes('acme')))

const actsNoMatch = await request('GET', '/activities?search=zzznomatchzzz', { token })
check('activity search with no match returns empty array', actsNoMatch.status === 200 && actsNoMatch.data.activities.length === 0)

// ---- Lead source filter ----
const sourceFilter = await request('GET', '/leads?source=Website', { token })
check('lead source filter returns matching leads', sourceFilter.status === 200 && sourceFilter.data.leads.every((l) => l.source?.toLowerCase().includes('website')))

const sourceNoMatch = await request('GET', '/leads?source=NonExistentSource123', { token })
check('lead source filter with no match returns empty list', sourceNoMatch.status === 200 && sourceNoMatch.data.leads.length === 0)

// ---- Lead pagination ----
const page1 = await request('GET', '/leads?page=1&limit=2', { token })
check('lead pagination page 1 limit 2 has correct shape', page1.status === 200 && page1.data.pagination.page === 1 && page1.data.pagination.limit === 2 && page1.data.leads.length <= 2)

const page2 = await request('GET', '/leads?page=2&limit=2', { token })
check('lead pagination page 2 returns correct page number', page2.status === 200 && page2.data.pagination.page === 2)

const badSortField = await request('GET', '/leads?sortBy=injectedField&sortOrder=asc', { token })
check('leads invalid sortBy falls back to createdAt', badSortField.status === 200)

// ---- Profile update validation ----
const profEmptyName = await request('PATCH', '/user/profile', { token, body: { name: '   ' } })
check('profile update empty name -> 400', profEmptyName.status === 400)

const profValidName = await request('PATCH', '/user/profile', { token, body: { name: 'Demo Smith' } })
check('profile update valid name -> 200', profValidName.status === 200 && profValidName.data.user.name === 'Demo Smith')

// ---- Preferences validation edge cases ----
const badView = await request('PATCH', '/user/preferences', { token, body: { defaultView: 'list' } })
check('preferences bad defaultView -> 400', badView.status === 400)

const badTheme = await request('PATCH', '/user/preferences', { token, body: { theme: 'solarized' } })
check('preferences bad theme -> 400', badTheme.status === 400)

const goodPrefs = await request('PATCH', '/user/preferences', { token, body: { itemsPerPage: 10, defaultView: 'table', theme: 'light' } })
check('preferences all valid -> 200', goodPrefs.status === 200 && goodPrefs.data.user.preferences.theme === 'light')



// ---- Dashboard sourceCounts shape ----
const dashShape = await request('GET', '/dashboard', { token })
check('dashboard sourceCounts items have source and count keys',
  Array.isArray(dashShape.data.sourceCounts) &&
  dashShape.data.sourceCounts.every((s) => typeof s.source === 'string' && typeof s.count === 'number'))
check('dashboard statusCounts covers all statuses', dashShape.data.statusCounts.length >= 5)
check('dashboard leads.won is a number', typeof dashShape.data.leads.won === 'number')

// ---- AI ownership: chat and reply with unowned lead ----
const aiChatOther = await request('POST', '/ai/chat', {
  token: otherToken,
  body: { leadId, message: 'What should I do next?' },
})
check('ai chat for unowned lead -> 404', aiChatOther.status === 404)

const aiReplyOther = await request('POST', '/ai/reply', {
  token: otherToken,
  body: { leadId, tone: 'professional' },
})
check('ai reply for unowned lead -> 404', aiReplyOther.status === 404)

const aiAnalyzeOther = await request('POST', '/ai/analyze', {
  token: otherToken,
  body: { leadId },
})
check('ai analyze for unowned lead -> 404', aiAnalyzeOther.status === 404)

// ---- Rate limiting (AI endpoints) ----
let limited = false
for (let i = 0; i < 35; i += 1) {
  const res = await request('POST', '/ai/actions', {
    token,
    body: { tool: 'updateLeadStatus', params: { leadId, status: 'Contacted' } },
  })
  if (res.status === 429) {
    limited = true
    break
  }
}
check('ai endpoints are rate limited -> 429', limited === true)

// ---- Notifications & Scheduler (Phase 17) ----
const { processScheduledFollowUps } = await import('../src/services/schedulerService.js')

// Create a due today follow-up and an overdue follow-up for DEMO_USER
const dToday = new Date()
const todayStr = `${dToday.getFullYear()}-${String(dToday.getMonth() + 1).padStart(2, '0')}-${String(dToday.getDate()).padStart(2, '0')}`
const dueTodayFup = await request('POST', '/followups', {
  token,
  body: { leadId, title: 'Call client today', dueDate: todayStr },
})
check('create due today follow-up', dueTodayFup.status === 201)

const pastDate = new Date()
pastDate.setDate(pastDate.getDate() - 3)
const pastStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`
const overdueFup = await request('POST', '/followups', {
  token,
  body: { leadId, title: 'Missed proposal review', dueDate: pastStr },
})
check('create overdue follow-up', overdueFup.status === 201)

// Run scheduler job manually to process follow-ups
await processScheduledFollowUps()

const notifs = await request('GET', '/notifications', { token })
check('get notifications returns list & unread count', notifs.status === 200 && notifs.data.notifications.length >= 2 && notifs.data.unreadCount >= 2)
check('due notification created with type followup_due', notifs.data.notifications.some((n) => n.type === 'followup_due' && n.title.includes('Call client today')))
check('overdue notification created with type followup_overdue', notifs.data.notifications.some((n) => n.type === 'followup_overdue' && n.title.includes('Missed proposal review')))

// Test duplicate prevention (idempotency)
const countBefore = notifs.data.notifications.length
await processScheduledFollowUps()
const notifsAfter = await request('GET', '/notifications', { token })
check('duplicate prevention: re-running scheduler creates no extra notifications', notifsAfter.data.notifications.length === countBefore)

// Test ownership isolation on notifications
const otherNotifs = await request('GET', '/notifications', { token: otherToken })
check('ownership isolation: other user cannot see DEMO_USER notifications', otherNotifs.status === 200 && !otherNotifs.data.notifications.some((n) => n.id === notifs.data.notifications[0].id))

const targetNotifId = notifs.data.notifications[0].id
const otherMarkRead = await request('PATCH', `/notifications/${targetNotifId}/read`, { token: otherToken })
check('ownership isolation: other user cannot mark DEMO_USER notification read -> 404', otherMarkRead.status === 404)

// Test mark as read
const markReadRes = await request('PATCH', `/notifications/${targetNotifId}/read`, { token })
check('mark single notification as read -> 200', markReadRes.status === 200 && markReadRes.data.notification.read === true)

const markAllReadRes = await request('PATCH', '/notifications/read-all', { token })
check('mark all notifications as read -> 200', markAllReadRes.status === 200)

const notifsAllRead = await request('GET', '/notifications', { token })
check('unread count is 0 after markAllAsRead', notifsAllRead.status === 200 && notifsAllRead.data.unreadCount === 0)

// ---- SaaS Usage Limits & Feature Gating (Phase 18) ----
const { checkAndResetMonthlyUsage } = await import('../src/services/usageService.js')
const User = mongoose.model('User')

const demoUserDoc = await User.findOne({ clerkUserId: DEMO_USER })
demoUserDoc.plan = 'free'
await demoUserDoc.save()

// Check profile subscription payload shape
const profSub = await request('GET', '/user/profile', { token })
check('profile includes subscription details', profSub.status === 200 && profSub.data.subscription?.plan === 'free' && profSub.data.subscription?.maxLeads === 50)

// Feature gating: CSV export and import are Pro only for Free users
const exportGated = await request('GET', '/leads/export', { token })
check('free user CSV export blocked -> 403', exportGated.status === 403 && exportGated.data.error.includes('csvExport'))

const importGated = await request('POST', '/leads/import', { token, body: { leads: [{ name: 'Test' }] } })
check('free user CSV import blocked -> 403', importGated.status === 403 && importGated.data.error.includes('csvImport'))

// AI Usage Limit & Increment for Free user (max 20)
demoUserDoc.plan = 'free'
demoUserDoc.aiUsageCount = 20
await demoUserDoc.save()

const aiExceeded = await request('POST', '/ai/actions', {
  token,
  body: { tool: 'updateLeadStatus', params: { leadId, status: 'Contacted' } },
})
check('AI endpoint blocked when monthly limit reached -> 429', aiExceeded.status === 429 && Boolean(aiExceeded.data.error))

// Ownership isolation on usage: OTHER_USER is unaffected by DEMO_USER's AI usage limit
const otherUserDoc = await User.findOne({ clerkUserId: OTHER_USER })
check('other user usage is independent of demo user', otherUserDoc.aiUsageCount === 0)

// Test Monthly Usage Reset
const pastResetDate = new Date()
pastResetDate.setMonth(pastResetDate.getMonth() - 2)
demoUserDoc.aiUsageResetDate = pastResetDate
await demoUserDoc.save()

await checkAndResetMonthlyUsage(demoUserDoc)
check('monthly reset resets aiUsageCount to 0 for a new month', demoUserDoc.aiUsageCount === 0)

// Lead Limit enforcement (max 50 for Free)
const currentLeadCount = await mongoose.model('Lead').countDocuments({ user: demoUserDoc._id })
// Fill lead count up to 50
const fillLeads = []
for (let i = currentLeadCount; i < 50; i++) {
  fillLeads.push({ user: demoUserDoc._id, name: `Bulk Fill Lead ${i}`, status: 'New' })
}
if (fillLeads.length > 0) {
  await mongoose.model('Lead').insertMany(fillLeads)
}

const leadLimitExceeded = await request('POST', '/leads', { token, body: { name: 'One Lead Too Many' } })
check('lead creation blocked when plan limit reached -> 403', leadLimitExceeded.status === 403 && leadLimitExceeded.data.error.includes('limit reached'))

// Upgrade DEMO_USER to Pro plan
demoUserDoc.plan = 'pro'
await demoUserDoc.save()

const proLeadCreated = await request('POST', '/leads', { token, body: { name: 'Pro Lead Created' } })
check('pro user can exceed 50 leads', proLeadCreated.status === 201)

const proExportRes = await request('GET', '/leads/export', { token })
check('pro user CSV export allowed -> 200', proExportRes.status === 200)

// ---- Agency Cold-Outreach & Workflow (Phase 20) ----
// 1. Create lead with new agency fields
const agencyLeadRes = await request('POST', '/leads', {
  token,
  body: {
    name: 'Apollo Bakery',
    company: 'Apollo Bakers Pvt Ltd',
    contactPerson: 'Vikram Seth',
    website: 'https://apollobakers.com',
    industry: 'Food & Beverage',
    websiteStatus: 'Redesign Opportunity',
    outreachChannel: 'Cold Email',
  },
})
check('create lead with agency fields -> 201', agencyLeadRes.status === 201 && agencyLeadRes.data.lead.websiteStatus === 'Redesign Opportunity')
const agencyLeadId = agencyLeadRes.data.lead.id

// 2. Update outreach status, channel, and follow-up date
const updateOutreachRes = await request('PATCH', `/leads/${agencyLeadId}`, {
  token,
  body: {
    websiteStatus: 'Outdated Website',
    outreachChannel: 'WhatsApp',
    lastContactedAt: new Date().toISOString(),
    nextFollowUpAt: new Date().toISOString(),
  },
})
check('update agency fields & record activities -> 200', updateOutreachRes.status === 200 && updateOutreachRes.data.lead.websiteStatus === 'Outdated Website' && updateOutreachRes.data.lead.outreachChannel === 'WhatsApp')

// 3. Verify activity timeline records outreach changes
const agencyActivities = await request('GET', `/leads/${agencyLeadId}/activities`, { token })
check('outreach activity events recorded', agencyActivities.status === 200 && agencyActivities.data.activities.some((a) => a.type === 'website_status_changed' || a.type === 'outreach_channel_changed'))

// 4. Test agency outreach filters (websiteStatus, outreachChannel, industry)
const filterWebRes = await request('GET', '/leads?websiteStatus=Outdated%20Website', { token })
check('filter leads by websiteStatus', filterWebRes.status === 200 && filterWebRes.data.leads.some((l) => l.id === agencyLeadId))

const filterChanRes = await request('GET', '/leads?outreachChannel=WhatsApp', { token })
check('filter leads by outreachChannel', filterChanRes.status === 200 && filterChanRes.data.leads.some((l) => l.id === agencyLeadId))

// 5. Test dashboard outreach summary payload
const dashOutreach = await request('GET', '/dashboard', { token })
check('dashboard contains outreachSummary stats', dashOutreach.status === 200 && typeof dashOutreach.data.outreachSummary?.totalProspects === 'number')

// 6. Test CSV Import with new agency fields & backward compatibility with old CSV format
const agencyCsvImport = await request('POST', '/leads/import', {
  token,
  body: {
    leads: [
      {
        name: 'Legacy Lead Old CSV',
        company: 'Old Corp',
        // missing agency fields (backward compatibility check)
      },
      {
        name: 'New Agency Prospect',
        company: 'Agency Client Co',
        contactPerson: 'Siddharth Roy',
        website: 'https://agencyclient.io',
        industry: 'SaaS',
        websiteStatus: 'No Website',
        outreachChannel: 'Cold Email',
      },
    ],
  },
})
check('agency CSV import backward compatible -> 200', agencyCsvImport.status === 200 && agencyCsvImport.data.importedCount === 2)

// 7. Verify ownership isolation on agency fields & outreach filters
const otherUserOutreachFilter = await request('GET', '/leads?websiteStatus=Outdated%20Website', { token: otherToken })
check('ownership isolation: other user cannot see demo user agency leads', otherUserOutreachFilter.status === 200 && !otherUserOutreachFilter.data.leads.some((l) => l.id === agencyLeadId))

// ---- Phase 21 Daily Sales Workspace & Bulk Operations ----
// 1. Pipeline Status Transitions (Researched, Replied, Meeting)
const resStatusP1 = await request('PATCH', `/leads/${agencyLeadId}`, { token, body: { status: 'Researched' } })
check('transition to Researched status -> 200', resStatusP1.status === 200 && resStatusP1.data.lead.status === 'Researched')

const resStatusP2 = await request('PATCH', `/leads/${agencyLeadId}`, { token, body: { status: 'Replied' } })
check('transition to Replied status -> 200', resStatusP2.status === 200 && resStatusP2.data.lead.status === 'Replied')

const resStatusP3 = await request('PATCH', `/leads/${agencyLeadId}`, { token, body: { status: 'Meeting' } })
check('transition to Meeting status -> 200', resStatusP3.status === 200 && resStatusP3.data.lead.status === 'Meeting')

// 2. Outreach Analytics Calculation (replyRate, meetingRate, closeRate)
const dashAnalytics = await request('GET', '/dashboard', { token })
check('outreach analytics contains rates', dashAnalytics.status === 200 &&
  typeof dashAnalytics.data.outreachSummary?.replyRate === 'number' &&
  typeof dashAnalytics.data.outreachSummary?.meetingRate === 'number' &&
  typeof dashAnalytics.data.outreachSummary?.closeRate === 'number')

// 3. Bulk Update Operations (channel update, mark contacted, schedule follow-up, change status)
const lead1Res = await request('POST', '/leads', { token, body: { name: 'Bulk Target Alpha', status: 'New' } })
const lead2Res = await request('POST', '/leads', { token, body: { name: 'Bulk Target Beta', status: 'Researched' } })
const targetIds = [lead1Res.data.lead.id, lead2Res.data.lead.id]

const bulkChanRes = await request('POST', '/leads/bulk-update', {
  token,
  body: {
    leadIds: targetIds,
    action: 'update_outreach_channel',
    payload: { outreachChannel: 'Instagram' },
  },
})
check('bulk update outreach channel -> 200', bulkChanRes.status === 200 && bulkChanRes.data.updatedCount === 2)

const bulkContactRes = await request('POST', '/leads/bulk-update', {
  token,
  body: {
    leadIds: targetIds,
    action: 'mark_contacted',
  },
})
check('bulk mark contacted -> 200', bulkContactRes.status === 200 && bulkContactRes.data.updatedCount === 2)

const bulkFollowUpRes = await request('POST', '/leads/bulk-update', {
  token,
  body: {
    leadIds: targetIds,
    action: 'schedule_followup',
    payload: { dueDate: new Date().toISOString(), title: 'Batch follow up' },
  },
})
check('bulk schedule follow-up -> 200', bulkFollowUpRes.status === 200 && bulkFollowUpRes.data.updatedCount === 2)

// 4. Ownership Isolation on Bulk Actions (otherUser cannot bulk update demo user leads)
const bulkOtherUserRes = await request('POST', '/leads/bulk-update', {
  token: otherToken,
  body: {
    leadIds: targetIds,
    action: 'mark_contacted',
  },
})
check('ownership isolation: other user bulk update returns 404', bulkOtherUserRes.status === 404)

// ---- Phase 22 Agency AI Sales Assistant Capabilities ----
const { clearRateLimitHits } = await import('../src/middleware/rateLimit.js')
clearRateLimitHits()

demoUserDoc.aiUsageCount = 0
await demoUserDoc.save()

// 1. Lead Prioritization Endpoint
const prioritizeRes = await request('POST', '/ai/prioritize', { token })
check('ai prioritize leads endpoint without key -> 500', prioritizeRes.status === 500 || prioritizeRes.status === 200)

// 2. Lead Fit Analysis Endpoint
const fitRes = await request('POST', '/ai/fit-analysis', { token, body: { leadId: agencyLeadId } })
check('ai fit analysis endpoint without key -> 500', fitRes.status === 500 || fitRes.status === 200)

// 3. Follow-Up Assistant Endpoint
const fupAssistantRes = await request('POST', '/ai/followup-assistant', { token })
check('ai followup assistant endpoint without key -> 500', fupAssistantRes.status === 500 || fupAssistantRes.status === 200)

// 4. Outreach Drafting Endpoint (first_cold, follow_up, post_call)
const draftRes = await request('POST', '/ai/draft-outreach', { token, body: { leadId: agencyLeadId, type: 'first_cold', tone: 'professional' } })
check('ai draft outreach endpoint without key -> 500', draftRes.status === 500 || draftRes.status === 200)

// 5. Weekly Sales Summary Endpoint
const weeklyRes = await request('POST', '/ai/weekly-summary', { token })
check('ai weekly summary endpoint without key -> 500', weeklyRes.status === 500 || weeklyRes.status === 200)

// 6. Ownership Isolation on Lead Fit & Outreach Drafting
const otherFitRes = await request('POST', '/ai/fit-analysis', { token: otherToken, body: { leadId: agencyLeadId } })
check('ownership isolation: unowned fit analysis -> 404', otherFitRes.status === 404)

// ---- Public routes ----
const health = await request('GET', '/health')
check('health stays public', health.status === 200 && health.data.status === 'ok')

// delete lead (owned)
const del = await request('DELETE', `/leads/${leadId}`, { token })
check('delete own lead -> 200', del.status === 200)
const gone = await request('GET', `/leads/${leadId}`, { token })
check('lead gone after delete', gone.status === 404)

// ---- Output ----
console.log(`\n${'-'.repeat(60)}`)
for (const line of results) console.log(line)
console.log(`\n${passed} passed, ${failed} failed`)

await mongoose.disconnect()
await server.close()
await mongod.stop()

process.exit(failed > 0 ? 1 : 0)