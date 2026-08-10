import addLeadNote from './addLeadNote.js'
import createFollowUp from './createFollowUp.js'
import updateLeadStatus from './updateLeadStatus.js'

export const TOOLS = [updateLeadStatus, addLeadNote, createFollowUp]

export function getTool(name) {
  return TOOLS.find((tool) => tool.name === name) ?? null
}