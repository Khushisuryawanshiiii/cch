import {
  APPROVAL_KEYS,
  APPROVER_LANE_CONFIG,
  BID_FIELDS,
  COST_FIELDS,
  DEAL_STATUS,
  SALES_DELETABLE_STATUSES,
  TRACKABLE_STATUSES,
} from "./constants"

const APPROVED_STATUSES = new Set(["Approved", "Rejected"])

const CURRENCY_LOCALES = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
}

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
}

export function can(permissions, key) {
  return Array.isArray(permissions) && permissions.includes(key)
}

/**
 * Lanes the current user may act on (empty if not an approver).
 *
 * Approval roles (Finance, Legal, SCM, Business Head, PreSales,
 * Service Delivery) are strictly separated: a user sees a lane only if they
 * hold the exact `order-governance.approver-<lane>` role. There is no
 * catch-all fallback — the legacy `order-governance.approver` role grants no
 * lanes so that role boundaries cannot be quietly bypassed.
 */
export function getOgApproverLaneKeys(roles) {
  if (!Array.isArray(roles)) return []
  return APPROVER_LANE_CONFIG.filter((c) => roles.includes(c.role)).map((c) => c.lane)
}

export function getOgRole(roles) {
  if (!Array.isArray(roles)) return "sales"
  if (roles.includes("order-governance.reviewer")) return "reviewer"
  if (getOgApproverLaneKeys(roles).length > 0) return "approver"
  if (roles.includes("order-governance.cc-manager")) return "cc-manager"
  if (roles.includes("order-governance.sales")) return "sales"
  return "sales"
}

/** First required lane this user owns that is still pending on the deal (canonical APPROVAL_KEYS order). */
export function pickApproverLaneForDeal(deal, laneKeys) {
  if (!deal || !Array.isArray(laneKeys) || laneKeys.length === 0) return null
  const required = deal.requiredApprovals || []
  for (const key of APPROVAL_KEYS) {
    if (!laneKeys.includes(key)) continue
    if (!required.includes(key)) continue
    const approval = (deal.approvals || []).find((x) => x.roleKey === key)
    if (approval?.status === "Pending") return key
  }
  return null
}

export function dealNeedsApproverAction(deal, laneKeys) {
  if (!deal || deal.status !== DEAL_STATUS.IN_APPROVAL) return false
  return pickApproverLaneForDeal(deal, laneKeys) !== null
}

/**
 * Lane of this user that the reviewer marked Optional ("Not Required") on a
 * deal currently In Approval. Returned lane is eligible for advisory comments.
 */
export function pickAdvisoryLaneForDeal(deal, laneKeys) {
  if (!deal || !Array.isArray(laneKeys) || laneKeys.length === 0) return null
  if (deal.status !== DEAL_STATUS.IN_APPROVAL) return null
  for (const key of APPROVAL_KEYS) {
    if (!laneKeys.includes(key)) continue
    const approval = (deal.approvals || []).find((x) => x.roleKey === key)
    if (approval?.status === "Not Required") return key
  }
  return null
}

/** First lane of this user on the deal that has already been decided. */
export function pickApproverActedLaneForDeal(deal, laneKeys) {
  if (!deal || !Array.isArray(laneKeys) || laneKeys.length === 0) return null
  for (const key of APPROVAL_KEYS) {
    if (!laneKeys.includes(key)) continue
    const approval = (deal.approvals || []).find((x) => x.roleKey === key)
    if (approval && APPROVED_STATUSES.has(approval.status)) return key
  }
  return null
}

/**
 * Buckets deals into the 3 tabs an approver sees:
 *   action   — In-Approval deals where this user's lane is Required & Pending.
 *   advisory — In-Approval deals where this user's lane was marked Optional.
 *   archive  — Any deal where this user has already Approved or Rejected.
 * A deal never appears in more than one bucket per user because the lane
 * states that drive the three buckets are mutually exclusive.
 */
export function approverDealBuckets(deals, laneKeys) {
  const empty = { action: [], advisory: [], archive: [] }
  if (!Array.isArray(deals) || !Array.isArray(laneKeys) || laneKeys.length === 0) {
    return empty
  }
  const action = []
  const advisory = []
  const archive = []
  for (const deal of deals) {
    if (pickApproverActedLaneForDeal(deal, laneKeys)) {
      archive.push(deal)
      continue
    }
    if (dealNeedsApproverAction(deal, laneKeys)) {
      action.push(deal)
      continue
    }
    if (pickAdvisoryLaneForDeal(deal, laneKeys)) {
      advisory.push(deal)
    }
  }
  return { action, advisory, archive }
}

export const ROLE_DISPLAY_NAMES = {
  Finance: "Finance",
  Legal: "Legal",
  BusinessHead: "Business Head",
  SCM: "SCM",
  ServiceDelivery: "Service Delivery",
  PreSales: "Pre-Sales",
  Reviewer: "Reviewer",
}

export function roleDisplayName(roleKey) {
  return ROLE_DISPLAY_NAMES[roleKey] || roleKey
}

export function progressDots(deal) {
  const requiredList = deal?.requiredApprovals || []
  const hasRoute = requiredList.length > 0 || (deal?.approvals && deal.approvals.length > 0)

  return APPROVAL_KEYS.map((key) => {
    const isRequired = hasRoute ? requiredList.includes(key) : true
    const approval = (deal?.approvals || []).find((x) => x.roleKey === key)
    
    let status = approval?.status || "Pending"
    let color = isRequired ? "bg-emerald-500" : "bg-slate-300"
    
    if (status === "Approved") {
      color = "bg-emerald-500"
    } else if (status === "Rejected") {
      color = "bg-red-500"
    }

    return {
      key,
      color,
      status,
      isRequired,
      label: roleDisplayName(key),
      tooltip: `${status}: ${roleDisplayName(key)}${isRequired ? '' : ' (Optional)'}`,
    }
  })
}

export function progressSummary(deal) {
  const required = deal?.requiredApprovals || []
  const approved = required.filter((roleKey) => {
    const approval = (deal?.approvals || []).find((x) => x.roleKey === roleKey)
    return approval?.status === "Approved"
  }).length
  return { approved, total: required.length, complete: required.length > 0 && approved === required.length }
}

export function currencySymbol(code) {
  return CURRENCY_SYMBOLS[code] || "₹"
}

export function formatCurrency(amount, code = "INR") {
  const numeric = Number(amount ?? 0)
  const locale = CURRENCY_LOCALES[code] || "en-IN"
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code || "INR",
      maximumFractionDigits: 2,
    }).format(numeric)
  } catch {
    return `${currencySymbol(code)} ${numeric.toLocaleString()}`
  }
}

export function formatNumber(amount) {
  const numeric = Number(amount ?? 0)
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(numeric)
  } catch {
    return numeric.toLocaleString()
  }
}

export function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

export function calcDealTotals(deal) {
  const sum = (fields) => fields.reduce((acc, field) => acc + Number(deal?.[field.key] ?? 0), 0)
  const totalBid = sum(BID_FIELDS)
  const totalCost = sum(COST_FIELDS)

  const productValue = Number(deal?.productValue ?? 0)
  const productCost = Number(deal?.productCost ?? 0)
  const serviceValue = Number(deal?.serviceValue ?? 0)
  const externalServiceCost = Number(deal?.externalServiceCost ?? 0)
  const internalCost = Number(deal?.internalCost ?? 0)

  const productMargin = productValue > 0 ? ((productValue - productCost) / productValue) * 100 : 0
  const serviceCombinedCost = externalServiceCost + internalCost
  const serviceMargin = serviceValue > 0 ? ((serviceValue - serviceCombinedCost) / serviceValue) * 100 : 0
  const grossMargin = totalBid > 0 ? ((totalBid - totalCost) / totalBid) * 100 : 0

  return { totalBid, totalCost, productMargin, serviceMargin, grossMargin }
}

export function buildEnrichPayload(deal) {
  return {
    stage: deal?.stage || "",
    productValue: Number(deal?.productValue || 0),
    serviceValue: Number(deal?.serviceValue || 0),
    amcValue: Number(deal?.amcValue || 0),
    othersValue: Number(deal?.othersValue || 0),
    productCost: Number(deal?.productCost || 0),
    externalServiceCost: Number(deal?.externalServiceCost || 0),
    internalCost: Number(deal?.internalCost || 0),
    othersCost: Number(deal?.othersCost || 0),
    customerPaymentTerm: deal?.customerPaymentTerm || "",
    vendorPaymentTerm: deal?.vendorPaymentTerm || "",
  }
}

export function salesCanEdit(deal) {
  return deal?.status === DEAL_STATUS.PENDING_INPUT
}

export function reviewerCanEdit(deal) {
  return deal?.status === DEAL_STATUS.PENDING_REVIEW || deal?.status === DEAL_STATUS.LEVEL_SKIPPED
}

const RENEWAL_KEYWORDS = ["renew", "amc", "extension", "support"]

function isRenewalDeal(deal) {
  const value = (deal?.deliveryType || "").toLowerCase()
  return RENEWAL_KEYWORDS.some((keyword) => value.includes(keyword))
}

export function reviewerKpis(deals) {
  const list = Array.isArray(deals) ? deals : []
  return {
    activePipeline: list.filter((d) => d.status === DEAL_STATUS.IN_APPROVAL).length,
    triageQueue: list.filter((d) => d.status === DEAL_STATUS.PENDING_REVIEW).length,
    completed: list.filter((d) => d.status === DEAL_STATUS.COMPLETED).length,
    salesDrafts: list.filter((d) => d.status === DEAL_STATUS.PENDING_INPUT).length,
  }
}

export function strategicAnalysis(deals) {
  const list = Array.isArray(deals) ? deals : []
  if (list.length === 0) {
    return {
      topGeo: "N/A",
      pipelineEfficiency: 0,
      newCount: 0,
      renewalCount: 0,
      newPct: 0,
      renewalPct: 0,
    }
  }

  const geoCount = new Map()
  list.forEach((deal) => {
    const geo = (deal.geo || "").trim()
    if (!geo) return
    geoCount.set(geo, (geoCount.get(geo) || 0) + 1)
  })
  const topGeoEntry = [...geoCount.entries()].sort((a, b) => b[1] - a[1])[0]
  const topGeo = topGeoEntry ? topGeoEntry[0] : "N/A"

  const closed = list.filter((d) => d.status === DEAL_STATUS.COMPLETED || d.status === DEAL_STATUS.REJECTED)
  const wins = closed.filter((d) => d.status === DEAL_STATUS.COMPLETED).length
  const pipelineEfficiency = closed.length === 0 ? 0 : Math.round((wins / closed.length) * 100)

  const renewalCount = list.filter(isRenewalDeal).length
  const newCount = list.length - renewalCount
  const total = list.length
  const newPct = Math.round((newCount / total) * 100)
  const renewalPct = 100 - newPct

  return { topGeo, pipelineEfficiency, newCount, renewalCount, newPct, renewalPct }
}

export function operationalVelocity(deals) {
  const list = Array.isArray(deals) ? deals : []
  const owners = new Set()
  const accountTotals = new Map()
  const durationsMs = []

  list.forEach((deal) => {
    if (deal.opportunityOwner) owners.add(deal.opportunityOwner.trim())
    const key = (deal.accountName || "").trim()
    if (key) {
      const value = Number(deal.amount || 0)
      accountTotals.set(key, (accountTotals.get(key) || 0) + value)
    }

    const submittedHistory = (deal.history || []).find((entry) => entry.eventType === "submitted")
    const finalHistory = (deal.history || []).find((entry) =>
      entry.eventType === "cc-confirmed" || entry.eventType === "decision",
    )
    if (submittedHistory && finalHistory) {
      const start = new Date(submittedHistory.createdAtUtc).getTime()
      const end = new Date(finalHistory.createdAtUtc).getTime()
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        durationsMs.push(end - start)
      }
    }
  })

  const topAccountEntry = [...accountTotals.entries()].sort((a, b) => b[1] - a[1])[0]
  const avgDays = durationsMs.length === 0
    ? 0
    : durationsMs.reduce((acc, ms) => acc + ms, 0) / durationsMs.length / (1000 * 60 * 60 * 24)

  return {
    activeOwners: owners.size,
    topAccount: topAccountEntry ? topAccountEntry[0] : "N/A",
    avgApprovalDays: avgDays,
  }
}

export function deepAnalysis(deals) {
  const list = Array.isArray(deals) ? deals : []
  const total = list.length

  const deliveryMap = new Map()
  list.forEach((deal) => {
    const key = (deal.deliveryType || "Unspecified").trim() || "Unspecified"
    deliveryMap.set(key, (deliveryMap.get(key) || 0) + 1)
  })
  const deliveryTypes = [...deliveryMap.entries()]
    .map(([label, count]) => ({ label, count, pct: total === 0 ? 0 : Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)

  const bottleneckMap = new Map()
  list
    .filter((d) => d.status === DEAL_STATUS.IN_APPROVAL)
    .forEach((deal) => {
      ;(deal.requiredApprovals || []).forEach((roleKey) => {
        const approval = (deal.approvals || []).find((a) => a.roleKey === roleKey)
        if (!approval || approval.status === "Approved") return
        bottleneckMap.set(roleKey, (bottleneckMap.get(roleKey) || 0) + 1)
      })
    })
  const bottlenecks = [...bottleneckMap.entries()]
    .map(([roleKey, pending]) => ({ roleKey, pending }))
    .sort((a, b) => b.pending - a.pending)

  const risks = list
    .map((deal) => {
      const totals = calcDealTotals(deal)
      const reasons = []
      if (totals.totalBid > 0 && totals.grossMargin < 10) reasons.push("Margin < 10%")
      if (deal.status === DEAL_STATUS.PENDING_INPUT) reasons.push("Awaiting sales inputs")
      if (deal.status === DEAL_STATUS.REJECTED) reasons.push("Rejected by approver")
      const stale = deal.updatedAtUtc && Date.now() - new Date(deal.updatedAtUtc).getTime() > 7 * 24 * 60 * 60 * 1000
      if (stale && deal.status === DEAL_STATUS.IN_APPROVAL) reasons.push("Stale > 7 days")
      if (reasons.length === 0) return null
      return {
        opp: deal.opportunityNumber,
        risk: reasons[0],
        impact: reasons.slice(1).join(" · ") || (totals.totalBid > 0 ? `${totals.grossMargin.toFixed(1)}% margin` : "Pending data"),
      }
    })
    .filter(Boolean)

  const totalsList = list.map((deal) => calcDealTotals(deal)).filter((t) => t.totalBid > 0)
  const avgMargin = totalsList.length === 0 ? 0 : totalsList.reduce((acc, t) => acc + t.grossMargin, 0) / totalsList.length

  const monthMap = new Map()
  list.forEach((deal) => {
    const date = deal.createdAtUtc ? new Date(deal.createdAtUtc) : null
    if (!date || Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  })
  const monthsTracked = monthMap.size || 1
  const throughputPerMonth = Math.round(list.length / monthsTracked)

  return { deliveryTypes, bottlenecks, risks, avgMargin, throughputPerMonth }
}

/** True once the CC Manager has executed the Confirm Order action.
 *  We detect the state from multiple signals so the UI stays correct even
 *  if the backend normalises fields slightly differently across responses:
 *   - a history event of type "cc-confirmed", or
 *   - any of the ERP fulfilment fields populated (sapOrder / customerOrderNo). */
export function dealIsCcConfirmed(deal) {
  if (!deal) return false
  const history = Array.isArray(deal.history) ? deal.history : []
  if (history.some((entry) => entry?.eventType === "cc-confirmed")) return true
  const sap = String(deal.sapOrder ?? "").trim()
  if (sap) return true
  const customerPo = String(deal.customerOrderNo ?? "").trim()
  if (customerPo) return true
  return false
}

/** Buckets deals into the CC Manager's two-tab dashboard:
 *   myAction — Completed or Level Skipped, not yet ERP-confirmed.
 *   archive  — already CC-confirmed (regardless of end status).
 *  Rejected deals never reach the CC Manager per the workflow spec. */
export function ccManagerBuckets(deals) {
  const empty = { myAction: [], archive: [] }
  if (!Array.isArray(deals)) return empty
  const myAction = []
  const archive = []
  for (const deal of deals) {
    const isConfirmed = dealIsCcConfirmed(deal)
    const passedApproval =
      deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.LEVEL_SKIPPED
    if (isConfirmed) {
      archive.push(deal)
      continue
    }
    if (passedApproval) myAction.push(deal)
  }
  return { myAction, archive }
}

export function ccManagerKpis(deals) {
  const list = Array.isArray(deals) ? deals : []
  const { myAction, archive } = ccManagerBuckets(list)
  const levelSkipped = myAction.filter((d) => d.status === DEAL_STATUS.LEVEL_SKIPPED).length
  return {
    awaiting: myAction.length,
    archived: archive.length,
    levelSkipped,
    totalHandled: archive.length,
  }
}

export function salesCanDeleteRow(deal) {
  return deal?.status === DEAL_STATUS.PENDING_INPUT
}

export function salesCanBulkClear(deal) {
  return SALES_DELETABLE_STATUSES.includes(deal?.status)
}

export function isTrackingStatus(status) {
  return TRACKABLE_STATUSES.includes(status)
}

export function statusTone(status) {
  const value = (status || "").toLowerCase()
  if (value === "pending input") return "bg-rose-100 text-rose-700"
  if (value === "pending review") return "bg-amber-100 text-amber-800"
  if (value === "in approval") return "bg-sky-100 text-sky-800"
  if (value === "completed") return "bg-emerald-100 text-emerald-800"
  if (value === "rejected") return "bg-red-100 text-red-800"
  if (value === "level skipped") return "bg-cyan-100 text-cyan-800"
  if (value === "below threshold") return "bg-slate-200 text-slate-700"
  return "bg-slate-100 text-slate-700"
}

export function approvalStatusTone(status) {
  const value = (status || "").toLowerCase()
  if (value === "approved") return "bg-emerald-100 text-emerald-700"
  if (value === "rejected") return "bg-red-100 text-red-700"
  return "bg-amber-100 text-amber-800"
}
