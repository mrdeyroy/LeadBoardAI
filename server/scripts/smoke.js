import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

process.env.JWT_SECRET = 'test-secret'
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

// ---- Auth ----
const register = await request('POST', '/auth/register', {
  body: { name: 'Demo User', email: 'demo@example.com', password: 'secret123' },
})
check('register returns 201', register.status === 201)
check('register returns token + user', !!register.data?.token && register.data?.user?.email === 'demo@example.com')
check('register hides passwordHash', register.data?.user?.passwordHash === undefined)

const dup = await request('POST', '/auth/register', {
  body: { name: 'Demo User', email: 'demo@example.com', password: 'secret123' },
})
check('duplicate register -> 409', dup.status === 409)

const badRegister = await request('POST', '/auth/register', {
  body: { name: '', email: 'nope', password: '123' },
})
check('invalid register -> 400', badRegister.status === 400 && !!badRegister.data?.details)

const login = await request('POST', '/auth/login', {
  body: { email: 'demo@example.com', password: 'secret123' },
})
check('login returns 200', login.status === 200 && !!login.data?.token)

const badLogin = await request('POST', '/auth/login', {
  body: { email: 'demo@example.com', password: 'wrong' },
})
check('wrong password -> 401', badLogin.status === 401)

const token = login.data.token

const me = await request('GET', '/auth/me', { token })
check('me returns user', me.status === 200 && me.data.user.email === 'demo@example.com')

const meNoToken = await request('GET', '/auth/me')
check('me without token -> 401', meNoToken.status === 401)

const meBadToken = await request('GET', '/auth/me', { token: 'not-a-token' })
check('me with bad token -> 401', meBadToken.status === 401)

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

const createBadStatus = await request('POST', '/leads', { token, body: { name: 'X', status: 'Hot' } })
check('create with bad status -> 400', createBadStatus.status === 400)

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

// Second user (used for ownership checks)
const otherReg = await request('POST', '/auth/register', {
  body: { name: 'Other', email: 'other@example.com', password: 'other123' },
})
const otherToken = otherReg.data.token

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

// Second user isolation
const otherLead = await request('POST', '/leads', {
  token: otherToken,
  body: { name: "Other's Secret Lead" },
})
check('other user can create leads', otherLead.status === 201)

const visible = await request('GET', `/leads/${otherLead.data.lead.id}`, { token })
check('demo user cannot see other user lead -> 404', visible.status === 404)

const otherList = await request('GET', '/leads', { token: otherToken })
check('other user sees only own leads', otherList.data.pagination.total === 1)

// delete lead
const del = await request('DELETE', `/leads/${leadId}`, { token })
check('delete lead -> 200', del.status === 200)
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