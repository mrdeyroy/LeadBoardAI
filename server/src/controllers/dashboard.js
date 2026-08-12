import mongoose from 'mongoose'

import Activity from '../models/Activity.js'
import FollowUp from '../models/FollowUp.js'
import Lead, { LEAD_STATUSES } from '../models/Lead.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const toActivityJSON = (doc) => ({
  id: doc._id.toString(),
  type: doc.type,
  message: doc.message,
  metadata:
    doc.metadata instanceof Map ? Object.fromEntries(doc.metadata) : doc.metadata,
  createdAt: doc.createdAt,
  lead: doc.lead ? { id: doc.lead._id.toString(), name: doc.lead.name } : null,
})

const toFollowUpJSON = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  dueDate: doc.dueDate,
  completed: doc.completed,
  createdAt: doc.createdAt,
  lead: doc.lead ? { id: doc.lead._id.toString(), name: doc.lead.name } : null,
})

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)

  const [statusRows, sourceRows, total, pendingFollowUps, recentActivity] = await Promise.all([
    Lead.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Lead.countDocuments({ user: userId }),
    FollowUp.find({ user: userId, completed: false })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('lead', 'name')
      .lean(),
    Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('lead', 'name')
      .lean(),
  ])

  const byStatus = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0]))
  for (const row of statusRows) {
    byStatus[row._id] = row.count
  }

  const sourceCounts = sourceRows.map((row) => ({
    source: row._id && row._id.trim() ? row._id : 'Direct / Unspecified',
    count: row.count,
  }))

  res.json({
    leads: {
      total,
      new: byStatus.New,
      qualified: byStatus.Qualified,
      won: byStatus.Won,
    },
    outreachSummary: {
      totalProspects: total,
      contacted: byStatus.Contacted,
      replied: byStatus.Qualified,
      meetings: byStatus.Qualified,
      proposals: byStatus.Proposal,
      won: byStatus.Won,
    },
    statusCounts: LEAD_STATUSES.map((status) => ({
      status,
      count: byStatus[status],
    })),
    sourceCounts,
    pendingFollowUps: pendingFollowUps.map(toFollowUpJSON),
    recentActivity: recentActivity.map(toActivityJSON),
  })
})