import { useMemo, useState } from "react"
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Layers,
  Package,
  Rocket,
  ShieldCheck,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ccManagerBuckets,
  ccManagerKpis,
  dealIsCcConfirmed,
  formatCurrency,
  formatDateTime,
  progressDots,
  statusTone,
} from "../helpers"

const CC_TABS = [
  { id: "action", label: "My Action", icon: Rocket },
  { id: "archive", label: "Archive / Completed", icon: Archive },
]

export function CCManagerView({ deals, onOpenDeal }) {
  const [activeTab, setActiveTab] = useState("action")

  const dataset = Array.isArray(deals) ? deals : []
  const buckets = useMemo(() => ccManagerBuckets(dataset), [dataset])
  const kpis = useMemo(() => ccManagerKpis(dataset), [dataset])

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardCheck}
          tone="violet"
          value={kpis.awaiting}
          label="Awaiting Execution"
          subtitle="Approved deals missing ERP data"
          onClick={() => setActiveTab("action")}
        />
        <KpiCard
          icon={Layers}
          tone="amber"
          value={kpis.levelSkipped}
          label="Level Skipped"
          subtitle="Admin-bypassed, needs fulfilment"
          onClick={kpis.levelSkipped > 0 ? () => setActiveTab("action") : undefined}
        />
        <KpiCard
          icon={CheckCircle2}
          tone="emerald"
          value={kpis.archived}
          label="Orders Confirmed"
          subtitle="Finalised in ERP this cycle"
          onClick={kpis.archived > 0 ? () => setActiveTab("archive") : undefined}
        />
        <KpiCard
          icon={Package}
          tone="sky"
          value={kpis.totalHandled}
          label="Total Handled"
          subtitle="Historical audit record"
          onClick={kpis.totalHandled > 0 ? () => setActiveTab("archive") : undefined}
        />
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/95 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                CC Manager Dashboard
              </h3>
              <p className="text-xs text-slate-500">
                Final fulfilment &amp; order execution — mirror approved deals into SAP.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CC_TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              const count = tab.id === "action" ? buckets.myAction.length : buckets.archive.length
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? "bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                  <span className="ml-1 opacity-80">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-5">
          {activeTab === "action" && (
            <ActionQueueTable deals={buckets.myAction} onOpenDeal={onOpenDeal} />
          )}
          {activeTab === "archive" && (
            <ArchiveTable deals={buckets.archive} onOpenDeal={onOpenDeal} />
          )}
        </div>
      </div>
    </div>
  )
}

function ActionQueueTable({ deals, onOpenDeal }) {
  if (!deals.length) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No deals waiting for execution"
        message="Fully approved or level-skipped deals will land here for SAP fulfilment."
      />
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 dark:bg-slate-900/60">
          <tr>
            {["Opp No", "Account", "Opportunity", "Approved Amount", "Status", "Progress", "Action"].map((label) => (
              <th key={label} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200">{deal.opportunityNumber}</td>
              <td className="px-3 py-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100">{deal.accountName}</td>
              <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200">{deal.opportunityName}</td>
              <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200">
                {formatCurrency(deal.amount, deal.currency)}
              </td>
              <td className="px-3 py-3">
                <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(deal.status)}`}>
                  {deal.status}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1.5">
                  {progressDots(deal).map((dot) => (
                    <div
                      key={dot.key}
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${dot.color} text-white`}
                      title={dot.tooltip}
                    >
                      {dot.status === "Approved" && <Check className="h-3 w-3" strokeWidth={3} />}
                      {dot.status === "Rejected" && <X className="h-3 w-3" strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-3 py-3">
                <Button size="sm" className="gap-1" onClick={() => onOpenDeal?.(deal)}>
                  <Rocket className="size-3.5" />
                  Execute &amp; Confirm
                  <ChevronRight className="size-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ArchiveTable({ deals, onOpenDeal }) {
  if (!deals.length) {
    return (
      <EmptyState
        icon={Archive}
        title="Nothing archived yet"
        message="Confirmed orders will appear here once you finalise them in SAP."
      />
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 dark:bg-slate-900/60">
          <tr>
            {["Opp No", "Account", "Actual PO Value", "SAP Order", "Customer PO", "Confirmed", "Action"].map((label) => (
              <th key={label} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const confirmedEntry = (deal.history || []).find((h) => h?.eventType === "cc-confirmed")
            const confirmed = dealIsCcConfirmed(deal)
            return (
              <tr key={deal.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200">{deal.opportunityNumber}</td>
                <td className="px-3 py-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100">{deal.accountName}</td>
                <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200">
                  {formatCurrency(deal.actualPoValue ?? deal.amount, deal.currency)}
                </td>
                <td className="px-3 py-3 text-[13px] font-mono text-slate-700 dark:text-slate-200">
                  {deal.sapOrder || "—"}
                </td>
                <td className="px-3 py-3 text-[13px] font-mono text-slate-700 dark:text-slate-200">
                  {deal.customerOrderNo || "—"}
                </td>
                <td className="px-3 py-3 text-[12px] text-slate-500">
                  {confirmed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                      <FileCheck2 className="size-3.5" />
                      {formatDateTime(confirmedEntry?.createdAtUtc)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => onOpenDeal?.(deal)}>
                    View Audit Trail
                    <ChevronRight className="size-3.5" />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KpiCard({ icon: Icon, tone, value, label, subtitle, onClick }) {
  const palettes = {
    violet: { ring: "from-violet-200/60 via-white to-white", icon: "bg-violet-100 text-violet-700", bar: "bg-violet-300" },
    amber: { ring: "from-amber-200/70 via-white to-white", icon: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
    emerald: { ring: "from-emerald-200/60 via-white to-white", icon: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" },
    sky: { ring: "from-sky-200/60 via-white to-white", icon: "bg-sky-100 text-sky-700", bar: "bg-sky-400" },
  }
  const p = palettes[tone] || palettes.sky
  const baseClasses = `rounded-2xl border border-white/70 bg-gradient-to-br ${p.ring} p-4 shadow-[0_10px_30px_rgba(16,42,67,0.06)] dark:border-slate-700 dark:bg-slate-900`
  const interactive = typeof onClick === "function"
  const interactiveClasses = interactive
    ? "text-left cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(16,42,67,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    : ""
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className={`flex size-9 items-center justify-center rounded-lg ${p.icon}`}>
          <Icon className="size-4" />
        </div>
        <span className="text-3xl font-extrabold leading-none text-slate-800 dark:text-slate-100">{value}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-[11px] text-slate-500">{subtitle}</p>
      <div className={`mt-3 h-[3px] w-3/5 rounded-full ${p.bar}`} />
    </>
  )
  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={`${baseClasses} ${interactiveClasses}`}>
        {content}
      </button>
    )
  }
  return <div className={baseClasses}>{content}</div>
}

function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
      {Icon && <Icon className="size-6 text-slate-400" />}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{title}</p>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  )
}
