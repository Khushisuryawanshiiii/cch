import { useEffect, useMemo, useState } from "react"
import { Calculator, ChevronDown, ChevronUp, History, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DEAL_STATUS } from "../constants"
import {
  formatCurrency,
  isTrackingStatus,
  progressDots,
  progressSummary,
  statusTone,
} from "../helpers"

// Sales is a pure input/tracking surface now.
export function SalesView({ deals, onOpenDeal, subView }) {
  const [viewMode, setViewMode] = useState("pending")

  useEffect(() => {
    if (subView === "track-approvals") {
      setViewMode("tracking")
    } else if (subView === "deal-explorer") {
      setViewMode("pending")
    }
  }, [subView])
  const [expanded, setExpanded] = useState({})

  const pendingDeals = useMemo(
    () => deals.filter((deal) => deal.status === DEAL_STATUS.PENDING_INPUT),
    [deals],
  )
  const trackingDeals = useMemo(
    () => deals.filter((deal) => isTrackingStatus(deal.status)),
    [deals],
  )
  const belowThresholdCount = useMemo(
    () => deals.filter((deal) => deal.status === DEAL_STATUS.BELOW_THRESHOLD).length,
    [deals],
  )

  const currentDeals = viewMode === "pending" ? pendingDeals : trackingDeals

  function toggleExpanded(dealId) {
    setExpanded((prev) => ({ ...prev, [dealId]: !prev[dealId] }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/50 bg-white/90 p-5 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={viewMode === "pending" ? "default" : "outline"} onClick={() => setViewMode("pending")}>
            Deal Explorer ({pendingDeals.length})
          </Button>
          <Button size="sm" variant={viewMode === "tracking" ? "default" : "outline"} onClick={() => setViewMode("tracking")}>
            Track Approvals ({trackingDeals.length})
          </Button>
          {belowThresholdCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {belowThresholdCount} below threshold (excluded from workflow)
            </span>
          )}
        </div>

        <p className="max-w-md text-[12px] text-slate-500 dark:text-slate-400">
          Deals are ingested by the Reviewer from Salesforce. Open a Pending Input
          row in the Deal Explorer to enter bid values, costs and payment terms, then submit for review.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/50 bg-white/85 p-2 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full border-separate border-spacing-y-1.5 text-left text-sm">
          <thead>
            <tr>
              {["", "Opp No", "Account Name", "Opportunity", "Amount", "V.", "Stage", "Owner", "Status", "Progress", "Action"].map((label) => (
                <th key={label} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentDeals.map((deal) => (
              <DealRow
                key={deal.id}
                deal={deal}
                expanded={!!expanded[deal.id]}
                onToggle={() => toggleExpanded(deal.id)}
                onOpen={() => onOpenDeal(deal)}
              />
            ))}
            {currentDeals.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Calculator className="size-6 opacity-40" />
                    <span>
                      {viewMode === "pending"
                        ? "No pending deals yet. The Reviewer will upload Salesforce opportunities into your queue."
                        : "No deals in approval yet. Submit pending deals to start tracking."}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DealRow({ deal, expanded, onToggle, onOpen }) {
  const actionLabel = deal.status === DEAL_STATUS.PENDING_INPUT ? "Input Data" : "View"
  const { approved, total } = progressSummary(deal)

  return (
    <>
      <tr>
        <td className="rounded-l-xl border-l-4 border-l-transparent bg-white px-3 py-3 text-slate-700 dark:text-slate-300 transition-all hover:border-l-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={expanded ? "Collapse audit log" : "Expand audit log"}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </td>
        <td className="bg-white px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300 dark:bg-slate-900">{deal.opportunityNumber}</td>
        <td className="bg-white px-3 py-3 text-[13px] font-semibold text-slate-800 dark:text-slate-200 dark:bg-slate-900">{deal.accountName}</td>
        <td className="bg-white px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300 dark:bg-slate-900">{deal.opportunityName}</td>
        <td className="bg-white px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300 dark:bg-slate-900">
          {formatCurrency(deal.amount, deal.currency)}
        </td>
        <td className="bg-white px-3 py-3 dark:bg-slate-900">
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            v{deal.version || 1}
          </span>
        </td>
        <td className="bg-white px-3 py-3 text-[12px] text-slate-700 dark:text-slate-300 dark:bg-slate-900">{deal.stage}</td>
        <td className="bg-white px-3 py-3 text-[12px] text-slate-700 dark:text-slate-300 dark:bg-slate-900">{deal.opportunityOwner}</td>
        <td className="bg-white px-3 py-3 dark:bg-slate-900">
          <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(deal.status)}`}>
            {deal.status}
          </span>
        </td>
        <td className="bg-white px-3 py-3 dark:bg-slate-900">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {approved}/{total}
            </span>
            <div className="flex gap-1">
              {progressDots(deal).map((dot) => (
                <div
                  key={dot.key}
                  title={dot.tooltip}
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${dot.color} text-white`}
                >
                  {dot.status === "Approved" && <Check className="h-3 w-3" strokeWidth={3} />}
                  {dot.status === "Rejected" && <X className="h-3 w-3" strokeWidth={3} />}
                </div>
              ))}
            </div>
          </div>
        </td>
        <td className="rounded-r-xl bg-white px-3 py-3 dark:bg-slate-900">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onOpen}>
              {actionLabel}
            </Button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50/60 dark:bg-slate-900/40">
          <td colSpan={11} className="px-4 py-3">
            <AuditLog deal={deal} />
          </td>
        </tr>
      )}
    </>
  )
}

function AuditLog({ deal }) {
  const versionHistory = deal.versionHistory || []
  return (
    <div className="space-y-2 rounded-lg border bg-white p-3 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <History className="size-4" /> Detailed Version Audit Log
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-slate-600 dark:text-slate-300">
            <th className="px-2 py-1 text-left">Version</th>
            <th className="px-2 py-1 text-left">Changed At</th>
            <th className="px-2 py-1 text-left">Changed By</th>
            <th className="px-2 py-1 text-left">Summary</th>
          </tr>
        </thead>
        <tbody>
          {versionHistory.map((entry, idx) => (
            <tr key={entry.id || idx} className="border-b last:border-b-0">
              <td className="px-2 py-1 dark:text-slate-300">v{entry.versionNumber || 1}</td>
              <td className="px-2 py-1 dark:text-slate-300">{new Date(entry.changedAtUtc).toLocaleString()}</td>
              <td className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-200">{entry.changedBy || "system"}</td>
              <td className="px-2 py-1 text-slate-600 dark:text-slate-300">{entry.changeSummary || "—"}</td>
            </tr>
          ))}
          {versionHistory.length === 0 && (
            <tr>
              <td colSpan={4} className="px-2 py-2 text-center text-slate-500">
                No version shifts recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
