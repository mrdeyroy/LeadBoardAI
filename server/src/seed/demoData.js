import mongoose from 'mongoose'

import User from '../models/User.js'
import Lead from '../models/Lead.js'
import FollowUp from '../models/FollowUp.js'
import Activity from '../models/Activity.js'

export const DEMO_CREDENTIALS = {
  name: 'Demo User',
  email: 'demo@leadboard.ai',
  password: 'demo1234',
}

// name, company, requirement, budget, source, status, createdDaysAgo
const LEAD_SEEDS = [
  ['Rahul Sharma', 'Schnell Bakers', 'Website redesign with online ordering for the bakery and WhatsApp order notifications.', '₹45,000', 'Website', 'Qualified', 8],
  ['Ankit Verma', 'FitLife Gym', 'Gym management software with member billing, attendance and trainer scheduling.', '₹1,20,000', 'Instagram', 'Proposal', 12],
  ['Priya Nair', 'CloudCafe Co-working', 'Co-working space booking website with seat selection and online payment.', '₹65,000', 'Referral', 'Contacted', 5],
  ['Vikram Singh', 'Singh & Co. Realty', 'Real estate CRM to track inquiries, site visits and sales follow-ups.', '₹90,000', 'WhatsApp', 'New', 1],
  ['Sneha Iyer', 'Little Sprouts School', 'School admission portal with enquiry forms and document upload.', '₹38,000', 'Website', 'New', 0],
  ['Mohammed Arif', 'Arif Electronics', 'E-commerce store for electronics with bulk pricing and GST invoices.', '₹2,00,000', 'Referral', 'Qualified', 15],
  ['Kavita Desai', 'Desai Diagnostics', 'Clinic management with appointment booking and automated reminders.', '₹55,000', 'Phone', 'Proposal', 10],
  ['Rohan Das', 'Bytes & Brew', 'Cafe loyalty app (MVP) with QR-based discounts and order history.', '₹30,000', 'Instagram', 'Won', 20],
  ['Neha Gupta', 'Bloom & Stitch Boutique', 'Instagram store setup with catalogue management and direct orders.', '₹35,000', 'Instagram', 'Won', 18],
  ['Sanjay Patel', 'Patel Courier', 'Fleet tracking dashboard for courier vans with daily route reports.', '₹1,50,000', 'Phone', 'Contacted', 3],
  ['Divya Krishnan', 'Craft Corner', 'Portfolio website with product catalogue and enquiry form.', '₹20,000', 'Website', 'Lost', 22],
  ['Arjun Mehta', 'Mehta Traders', 'Supplier portal with purchase orders and status tracking.', '₹80,000', 'Referral', 'Contacted', 6],
  ['Farhan Khan', 'QuickServe Food', 'POS integration with delivery aggregators and real-time stock sync.', '₹1,10,000', 'WhatsApp', 'New', 2],
]

const TIMELINES = ['Within a month', '1–2 months', 'Within 3 months', 'Within 6 months', 'Urgent']
const NOTES = {
  Qualified: 'Very responsive on WhatsApp, need to share a clear proposal this week.',
  Proposal: 'Asked for a detailed breakdown — send by end of week.',
  Won: 'Signed the agreement. Ask for a testimonial after launch.',
  Lost: 'Chose a different vendor. Keep in touch for future work.',
}

function makeEmail(name, company) {
  const domain = company.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16)
  return `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${domain || 'gmail'}.com`
}

function daysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function daysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function hoursAfter(base, hours) {
  const d = new Date(base)
  d.setHours(d.getHours() + hours)
  return d
}

/**
 * Create the demo user, a set of realistic leads, follow-ups and activities.
 * Safe to run repeatedly — existing demo data is replaced.
 */
export async function seedDemoData() {
  const existing = await User.findOne({ email: DEMO_CREDENTIALS.email })
  if (existing) {
    await Activity.deleteMany({ user: existing._id })
    await FollowUp.deleteMany({ user: existing._id })
    await Lead.deleteMany({ user: existing._id })
    await User.deleteOne({ _id: existing._id })
  }

  const user = await User.create({
    name: DEMO_CREDENTIALS.name,
    email: DEMO_CREDENTIALS.email,
    passwordHash: DEMO_CREDENTIALS.password,
  })

  const leadDocs = LEAD_SEEDS.map(([name, company, requirement, budget, source, status, age], i) => {
    const createdAt = daysAgo(age)
    return {
      user: user._id,
      name,
      company,
      email: makeEmail(name, company),
      phone: `+91 98${String(70000000 + i * 137274).slice(0, 8)}`,
      source,
      requirement,
      budget,
      timeline: TIMELINES[i % TIMELINES.length],
      status,
      notes: NOTES[status] ?? '',
      createdAt,
      updatedAt: createdAt,
    }
  })
  const leads = await Lead.insertMany(leadDocs, { timestamps: false })

  const activities = []
  for (const lead of leads) {
    const created = lead.createdAt
    activities.push({
      user: user._id,
      lead: lead._id,
      type: 'lead_created',
      message: `Lead created from ${lead.source || 'unknown source'}`,
      metadata: { source: lead.source || '' },
      createdAt: created,
    })

    const steps =
      lead.status === 'Won'
        ? ['Contacted', 'Qualified', 'Won']
        : lead.status === 'Lost'
          ? ['Contacted', 'Proposal', 'Lost']
          : ['New'].concat(lead.status === 'New' ? [] : [lead.status])

    const ageMs = Date.now() - created.getTime()
    steps.forEach((to, stepIndex) => {
      const from = stepIndex === 0 ? null : steps[stepIndex - 1]
      if (!from || to === from) return
      const at = hoursAfter(
        created,
        Math.round(((stepIndex + 0.6) / steps.length) * (ageMs / 3600000))
      )
      activities.push({
        user: user._id,
        lead: lead._id,
        type: 'status_changed',
        message: `Status changed from ${from} to ${to}`,
        metadata: { from, to, actor: 'manual' },
        createdAt: at,
      })
    })
  }

  const aiLeads = leads.filter((lead) => ['Qualified', 'Contacted'].includes(lead.status))
  for (const lead of aiLeads) {
    activities.push({
      user: user._id,
      lead: lead._id,
      type: 'ai_analysis',
      message: 'AI analysis generated',
      metadata: { leadId: lead._id.toString(), quality: 'Medium' },
      createdAt:
        hoursAfter(lead.createdAt, Math.round((Date.now() - lead.createdAt.getTime()) / 7200000) + 1),
    })
  }

  const followUpSeeds = [
    { leadIndex: 0, title: 'Send detailed proposal', dueDays: 2 },
    { leadIndex: 2, title: 'Follow up on WhatsApp about requirements', dueDays: -1 },
    { leadIndex: 3, title: 'Intro call to understand requirements', dueDays: 5 },
    { leadIndex: 4, title: 'Share brochure and pricing', dueDays: 3 },
    { leadIndex: 6, title: 'Run product demo call', dueDays: -4, completed: true },
    { leadIndex: 7, title: 'Request testimonial and referral', dueDays: -10, completed: true },
  ]

  const followUps = []
  for (const { leadIndex, title, dueDays, completed = false } of followUpSeeds) {
    const lead = leads[leadIndex]
    const dueDate = daysFromNow(dueDays)
    followUps.push({
      user: user._id,
      lead: lead._id,
      title,
      dueDate,
      completed,
      createdAt: hoursAfter(lead.createdAt, 6),
      updatedAt: completed ? daysAgo(dueDays * -1) : hoursAfter(lead.createdAt, 6),
    })
    activities.push({
      user: user._id,
      lead: lead._id,
      type: 'followup_created',
      message: `Follow-up scheduled: ${title}`,
      metadata: { title, dueDate: dueDate.toISOString() },
      createdAt: hoursAfter(lead.createdAt, 6),
    })
  }
  await FollowUp.insertMany(followUps, { timestamps: false })

  await Activity.insertMany(activities, { timestamps: false })

  return {
    user: user._id.toString(),
    leads: leads.length,
    followUps: followUps.length,
    activities: activities.length,
  }
}