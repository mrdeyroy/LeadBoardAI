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

// ---- Ownership isolation (User A vs User B) ----
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