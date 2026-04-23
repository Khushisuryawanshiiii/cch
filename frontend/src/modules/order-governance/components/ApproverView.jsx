import { useMemo, useState } from "react"
import { Archive, ClipboardCheck, MessageSquareDashed, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  currencySymbol,
  formatDateTime,
  pickAdvisoryLaneForDeal,
  pickApproverActedLaneForDeal,
  pickApproverLaneForDeal,
  progressDots,
  roleDisplayName,
  statusTone,
} from "../helpers"

const TAB_DEFS = [
  {
    id: "action",
    label: "My Action",
    description:
      "Deals where your role is marked Required. Approve or reject to clear them from this list.",
    icon: ClipboardCheck,
    emptyText: "No deals are waiting on your decision right now.",
  },
  {
    id: "advisory",
    label: "Advisory",
    description:
      "Deals where the reviewer marked your role Optional. You can leave advisory comments without blocking the workflow.",
    icon: MessageSquareDashed,
    emptyText: "No optional (advisory) deals routed to you.",
  },
  {
    id: "archive",
    label: "Archive / Completed",
    description:
      "Historical view of deals you have already approved or rejected. Read-only for lookup and audit.",
    icon: Archive,
    emptyText: "You haven't acted on any deals yet.",
  },
]

export function ApproverView({
  buckets,
  laneLabel = "",
  approverLaneKeys = [],
  onOpenDeal,
}) {
  const [activeTab, setActiveTab] = useState("action")
  const counts = useMemo(
    () => ({
      action: buckets?.action?.length ?? 0,
      advisory: buckets?.advisory?.length ?? 0,
      archive: buckets?.archive?.length ?? 0,
    }),
    [buckets],
  )

  const currentDeals = buckets?.[activeTab] ?? []
  const currentTabDef = TAB_DEFS.find((t) => t.id === activeTab) ?? TAB_DEFS[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {laneLabel ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Your lane:
            </span>{" "}
            {laneLabel}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-900/60">
        {TAB_DEFS.map((tab) => {
          const Icon = tab.icon
          const active = tab.id === activeTab
          const count = counts[tab.id]
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-gradient-to-br from-[#6aa6ff] via-[#a58cff] to-[#6ed1b8] text-white shadow-[0_8px_24px_-12px_rgba(106,166,255,0.55)]"
                  : "text-slate-600 hover:bg-white hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </nav>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {currentTabDef.description}
      </p>

      {activeTab === "action" && (
        <ApproverDealTable
          deals={currentDeals}
          laneKeys={approverLaneKeys}
          emptyText={currentTabDef.emptyText}
          variant="action"
          onOpenDeal={onOpenDeal}
        />
      )}
      {activeTab === "advisory" && (
        <ApproverDealTable
          deals={currentDeals}
          laneKeys={approverLaneKeys}
          emptyText={currentTabDef.emptyText}
          variant="advisory"
          onOpenDeal={onOpenDeal}
        />
      )}
      {activeTab === "archive" && (
        <ApproverDealTable
          deals={currentDeals}
          laneKeys={approverLaneKeys}
          emptyText={currentTabDef.emptyText}
          variant="archive"
          onOpenDeal={onOpenDeal}
        />
      )}
    </div>
  )
}

function ApproverDealTable({ deals, laneKeys, emptyText, variant, onOpenDeal }) {
  const showLaneColumn = variant !== "action"
  const showDecisionColumn = variant === "archive"
  const openLabel =
    variant === "action"
      ? "Review & Decide"
      : variant === "advisory"
        ? "View & Comment"
        : "View Audit"

  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-3 py-2">Opp No</th>
            <th className="px-3 py-2">Opportunity</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Status</th>
            {showLaneColumn ? <th className="px-3 py-2">Your Lane</th> : null}
            {showDecisionColumn ? <th className="px-3 py-2">Your Decision</th> : null}
            {showDecisionColumn ? <th className="px-3 py-2">Action Date</th> : null}
            <th className="px-3 py-2">Progress</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const laneForVariant =
              variant === "action"
                ? pickApproverLaneForDeal(deal, laneKeys)
                : variant === "advisory"
                  ? pickAdvisoryLaneForDeal(deal, laneKeys)
                  : pickApproverActedLaneForDeal(deal, laneKeys)
            const approval = laneForVariant
              ? (deal.approvals || []).find((x) => x.roleKey === laneForVariant)
              : null
            return (
              <tr key={deal.id} className="border-t align-top">
                <td className="px-3 py-2 font-mono text-xs dark:text-slate-300">{deal.opportunityNumber}</td>
                <td className="px-3 py-2">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {deal.opportunityName}
                  </div>
                  <div className="text-xs text-slate-500">{deal.accountName}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap dark:text-slate-300">
                  {currencySymbol(deal.currency)} {Number(deal.amount || 0).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${statusTone(
                      deal.status,
                    )}`}
                  >
                    {deal.status}
                  </span>
                </td>
                {showLaneColumn ? (
                  <td className="px-3 py-2 text-xs dark:text-slate-300">
                    {laneForVariant ? roleDisplayName(laneForVariant) : "—"}
                  </td>
                ) : null}
                {showDecisionColumn ? (
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                        approval?.status === "Approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : approval?.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {approval?.status || "—"}
                    </span>
                  </td>
                ) : null}
                {showDecisionColumn ? (
                  <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                    {formatDateTime(approval?.actionDateUtc)}
                  </td>
                ) : null}
                <td className="px-3 py-2">
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
                </td>
                <td className="px-3 py-2">
                  <Button size="sm" variant="outline" onClick={() => onOpenDeal(deal)}>
                    {openLabel}
                  </Button>
                </td>
              </tr>
            )
          })}
          {deals.length === 0 ? (
            <tr>
              <td
                colSpan={
                  (showLaneColumn ? 1 : 0) +
                  (showDecisionColumn ? 2 : 0) +
                  6
                }
                className="px-3 py-8 text-center text-slate-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
