import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileSpreadsheet,
  Gauge,
  MapPin,
  Timer,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  Users,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DEAL_STATUS } from "../constants"
import {
  deepAnalysis,
  formatCurrency,
  operationalVelocity,
  progressDots,
  progressSummary,
  reviewerKpis,
  roleDisplayName,
  salesCanBulkClear,
  statusTone,
  strategicAnalysis,
} from "../helpers"

const REVIEWER_TABS = [
  { id: "triage", label: "Triage Queue" },
  { id: "tracking", label: "Global Tracking" },
  { id: "deep", label: "Deep Analysis" },
]

// "All" intentionally excludes Sales drafts that haven't been submitted yet —
// the reviewer's tracking view focuses on the active approval pipeline.
const TRACKING_FILTERS = [
  {
    id: "all",
    label: "All",
    match: (d) => d.status !== DEAL_STATUS.PENDING_INPUT && d.status !== DEAL_STATUS.BELOW_THRESHOLD,
  },
  {
    id: "draft",
    label: "Draft",
    match: (d) => d.status === DEAL_STATUS.PENDING_INPUT || d.status === DEAL_STATUS.BELOW_THRESHOLD,
  },
  {
    id: "in-approval",
    label: "In Approval",
    match: (d) => d.status === DEAL_STATUS.IN_APPROVAL || d.status === DEAL_STATUS.LEVEL_SKIPPED,
  },
  { id: "completed", label: "Completed", match: (d) => d.status === DEAL_STATUS.COMPLETED },
  { id: "rejected", label: "Rejected", match: (d) => d.status === DEAL_STATUS.REJECTED },
]

export function ReviewerView({
  deals,
  allDeals,
  threshold,
  setThreshold,
  isLoading,
  uploadPreview,
  onUpload,
  onTogglePreviewRow,
  onToggleAllPreviewRows,
  onConfirmUpload,
  onCancelUpload,
  onClearPending,
  onResetTestData,
  onOpenDeal,
  onReturn,
  onNudge,
  subView = null,
  myTasksNav = null,
  onGoToMyTasks = null,
}) {
  const isMyTasksView = subView === "my-tasks"
  const isUploadView  = subView === "upload-data"
  const dataset = Array.isArray(allDeals) && allDeals.length ? allDeals : deals
  const [activeTab, setActiveTab] = useState("triage")
  const [trackingFilter, setTrackingFilter] = useState("all")

  // TEMP: Test-data reset dialog state. The user must type the exact phrase
  // "RESET" before the destructive call is made. The production guard lives
  // on the backend (IsDevelopment + permission + typed phrase), so we do NOT
  // gate the button on import.meta.env.DEV — that was swallowing the button
  // whenever the frontend was served as a built bundle. `resetStatus` drives
  // an inline success/error banner in the dialog so the user gets clear
  // feedback. Remove this block with the endpoint before any production release.
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetPhrase, setResetPhrase] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [resetStatus, setResetStatus] = useState(null)
  const canResetTestData = typeof onResetTestData === "function"
  const resetPhraseValid = resetPhrase === "RESET"

  // When the parent asks us to jump to a specific tab/filter (e.g. via a KPI
  // click), it bumps myTasksNav.key. We resync local tab state on every bump
  // so repeated clicks on the same KPI still work.
  useEffect(() => {
    if (!myTasksNav) return
    if (myTasksNav.tab) setActiveTab(myTasksNav.tab)
    if (myTasksNav.trackingFilter) setTrackingFilter(myTasksNav.trackingFilter)
  }, [myTasksNav?.key])

  const kpis = useMemo(() => reviewerKpis(dataset), [dataset])
  const strategy = useMemo(() => strategicAnalysis(dataset), [dataset])
  const velocity = useMemo(() => operationalVelocity(dataset), [dataset])
  const deep = useMemo(() => deepAnalysis(dataset), [dataset])

  const triageDeals = useMemo(
    () => dataset.filter((d) => d.status === DEAL_STATUS.PENDING_REVIEW || d.status === DEAL_STATUS.LEVEL_SKIPPED),
    [dataset],
  )
  const trackingDeals = useMemo(() => {
    const filter = TRACKING_FILTERS.find((entry) => entry.id === trackingFilter) || TRACKING_FILTERS[0]
    return dataset.filter(filter.match)
  }, [dataset, trackingFilter])

  // Draft imports we already pushed to Sales but that haven't been enriched yet.
  // Reviewer owns bulk cleanup now, so we surface the count and enable "Clear
  // Drafts" only when there is something to remove.
  const clearableDeals = useMemo(
    () => (Array.isArray(dataset) ? dataset.filter(salesCanBulkClear) : []),
    [dataset],
  )

  function openResetDialog() {
    setResetPhrase("")
    setResetStatus(null)
    setResetDialogOpen(true)
  }

  function handleResetDialogOpenChange(open) {
    setResetDialogOpen(open)
    if (!open) {
      setResetPhrase("")
      setResetStatus(null)
    }
  }

  async function handleConfirmReset() {
    if (!resetPhraseValid || isResetting) return
    setIsResetting(true)
    setResetStatus(null)
    try {
      const result = await onResetTestData?.(resetPhrase)
      if (result?.ok) {
        setResetStatus({ kind: "success", counts: result.counts || {} })
        setResetPhrase("")
        // Leave the success banner visible long enough to be read, then close.
        setTimeout(() => {
          setResetDialogOpen(false)
          setResetStatus(null)
        }, 1800)
      } else {
        setResetStatus({
          kind: "error",
          message: result?.error || "Reset failed. Check the backend log.",
        })
      }
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* TEMP: Always-visible Reset Test Data strip. Renders for the reviewer
          regardless of subView so the button is reachable from both the main
          queue and the My Tasks view. Backend endpoint 404s in Production so
          it is safe to leave unconditional. Remove with the endpoint before
          shipping. */}
      {canResetTestData && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 px-4 py-2 text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="flex items-center gap-2 text-[12px]">
            <AlertTriangle className="size-4" />
            <span>
              <strong>Test harness:</strong> Reset Test Data wipes <em>all</em> Order Governance
              deals + audit history (unlike "Clear Drafts", which only removes unsubmitted drafts).
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={openResetDialog}
            disabled={isLoading || isResetting}
            className="gap-2 border-amber-400 bg-white/70 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-900/40"
          >
            <AlertTriangle className="size-4" />
            Reset Test Data
          </Button>
        </div>
      )}

      {/* Reset Test Data confirmation dialog */}
      {canResetTestData && (
        <Dialog open={resetDialogOpen} onOpenChange={handleResetDialogOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="size-5" /> Reset Order Governance Test Data
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <p>
                This will permanently delete <strong>all Order Governance deals, approvals, history
                and version-history rows</strong> from the database. It does <strong>not</strong>{" "}
                touch users, roles or permissions, so you will stay logged in.
              </p>
              <p className="text-xs text-slate-500">
                The backend accepts this call only in the Development environment. Type{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] font-semibold dark:bg-slate-800">
                  RESET
                </code>{" "}
                (all caps, no quotes) to enable the button.
              </p>
              <Input
                autoFocus
                value={resetPhrase}
                onChange={(event) => {
                  setResetPhrase(event.target.value)
                  if (resetStatus?.kind === "error") setResetStatus(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && resetPhraseValid && !isResetting) {
                    event.preventDefault()
                    handleConfirmReset()
                  }
                }}
                placeholder="Type RESET to confirm"
                disabled={isResetting || resetStatus?.kind === "success"}
                className={
                  resetPhraseValid
                    ? "border-emerald-400 focus-visible:ring-emerald-200"
                    : resetPhrase.length > 0
                    ? "border-amber-400"
                    : ""
                }
              />
              <p
                className={`text-[11px] font-medium ${
                  resetPhraseValid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                {resetPhraseValid
                  ? "Confirmation phrase matched — click Reset Test Data to proceed."
                  : resetPhrase.length === 0
                  ? "Awaiting confirmation phrase…"
                  : `Phrase does not match. Type "RESET" exactly (all caps).`}
              </p>

              {resetStatus?.kind === "success" && (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <p className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="size-4" /> Test data reset successfully.
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                    Deleted {resetStatus.counts.deals ?? 0} deal(s),{" "}
                    {resetStatus.counts.approvals ?? 0} approval(s),{" "}
                    {resetStatus.counts.history ?? 0} history and{" "}
                    {resetStatus.counts.versionHistory ?? 0} version-history row(s). Closing…
                  </p>
                </div>
              )}

              {resetStatus?.kind === "error" && (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="size-4" /> Reset failed
                  </p>
                  <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">
                    {resetStatus.message}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleResetDialogOpenChange(false)}
                disabled={isResetting}
              >
                {resetStatus?.kind === "success" ? "Close" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmReset}
                disabled={!resetPhraseValid || isResetting || resetStatus?.kind === "success"}
                className="gap-2"
                title={
                  resetPhraseValid
                    ? "Wipe all Order Governance test data"
                    : "Type RESET (all caps) in the field above to enable"
                }
              >
                <Trash2 className="size-4" />
                {isResetting ? "Resetting…" : "Reset Test Data"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Upload Data sub-view ── */}
      {isUploadView && (
        <UploadDataView
          threshold={threshold}
          setThreshold={setThreshold}
          isLoading={isLoading}
          uploadPreview={uploadPreview}
          onUpload={onUpload}
          onTogglePreviewRow={onTogglePreviewRow}
          onToggleAllPreviewRows={onToggleAllPreviewRows}
          onConfirmUpload={onConfirmUpload}
          onCancelUpload={onCancelUpload}
          clearableDeals={clearableDeals}
          onClearPending={onClearPending}
        />
      )}

      {/* ── Deal Explorer: KPI cards + Strategic / Operational panels ── */}
      {!isMyTasksView && !isUploadView && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Activity}
              tone="violet"
              value={kpis.activePipeline}
              label="Active Pipeline"
              subtitle="Deals currently with approvers"
              onClick={onGoToMyTasks ? () => onGoToMyTasks({ tab: "tracking", trackingFilter: "in-approval" }) : undefined}
            />
            <KpiCard
              icon={Clock}
              tone="amber"
              value={kpis.triageQueue}
              label="Triage Queue"
              subtitle="Awaiting your routing"
              onClick={onGoToMyTasks ? () => onGoToMyTasks({ tab: "triage" }) : undefined}
            />
            <KpiCard
              icon={CheckCircle2}
              tone="emerald"
              value={kpis.completed}
              label="Completed"
              subtitle="Fully approved this cycle"
              onClick={onGoToMyTasks ? () => onGoToMyTasks({ tab: "tracking", trackingFilter: "completed" }) : undefined}
            />
            <KpiCard
              icon={FileSpreadsheet}
              tone="sky"
              value={kpis.salesDrafts}
              label="Sales Drafts"
              subtitle="Uploaded but not submitted"
              onClick={onGoToMyTasks ? () => onGoToMyTasks({ tab: "tracking", trackingFilter: "draft" }) : undefined}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard icon={TrendingUp} title="Strategic Business Analysis">
              <div className="grid gap-4 sm:grid-cols-2">
                <Stat
                  icon={MapPin}
                  label="Top Geo Focus"
                  value={strategy.topGeo}
                  valueClass="text-slate-800 dark:text-slate-100"
                />
                <Stat
                  label="Pipeline Efficiency"
                  value={`${strategy.pipelineEfficiency}% Win Rate`}
                  valueClass="text-sky-600"
                />
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Business Mix (New vs Renewal)</p>
                <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="bg-sky-500" style={{ width: `${strategy.newPct}%` }} />
                  <div className="bg-amber-500" style={{ width: `${strategy.renewalPct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <Legend color="bg-sky-500" label={`New Business (${strategy.newPct}%)`} />
                  <Legend color="bg-amber-500" label={`Renewal (${strategy.renewalPct}%)`} />
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={Gauge} title="Operational Velocity">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
                <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Users className="size-4" /> Active Sales Owners
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {velocity.activeOwners} {velocity.activeOwners === 1 ? "Person" : "People"}
                </span>
              </div>

              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Top Performing Account</p>
                <p className="mt-1 text-base font-extrabold uppercase text-sky-700 dark:text-sky-300">{velocity.topAccount}</p>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Timer className="size-4" /> Avg. Approval Time
                </span>
                <span className={`font-semibold ${velocity.avgApprovalDays <= 3 ? "text-emerald-600" : "text-amber-600"}`}>
                  ~{velocity.avgApprovalDays.toFixed(1)} Days
                </span>
              </div>
            </SectionCard>
          </div>
        </>
      )}

      {/* ── My Tasks sub-view ── */}
      {isMyTasksView && (
        <div className="rounded-2xl border border-white/60 bg-white/95 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Reviewer Dashboard</h3>
                <p className="text-xs text-slate-500">Triage Inputs & Select Approvers</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {REVIEWER_TABS.map((tab) => {
                const active = activeTab === tab.id
                const count = tab.id === "triage"
                  ? triageDeals.length
                  : tab.id === "tracking"
                    ? dataset.length
                    : null
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {tab.label}
                    {count !== null && <span className="ml-1 opacity-80">({count})</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {activeTab !== "deep" && (
            <div className="px-5 pt-4">
              <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[12px] text-sky-800 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-100">
                <span className="font-bold">Reviewer Role:</span> Validate sales inputs and{" "}
                <span className="font-bold">Select REQUIRED Approvers</span> in the &lsquo;Approval&rsquo; tab. Deals only
                appear for approvers if you mark them as required.
              </p>
            </div>
          )}

          <div className="p-5">
            {activeTab === "triage" && (
              <TriageQueueTable deals={triageDeals} onOpenDeal={onOpenDeal} onNudge={onNudge} />
            )}
            {activeTab === "tracking" && (
              <TrackingPanel
                deals={trackingDeals}
                filter={trackingFilter}
                setFilter={setTrackingFilter}
                counts={dataset}
                onOpenDeal={onOpenDeal}
                onReturn={onReturn}
                onNudge={onNudge}
              />
            )}
            {activeTab === "deep" && <DeepAnalysisPanel deep={deep} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Data sub-view
// ─────────────────────────────────────────────────────────────────────────────

function UploadDataView({
  threshold,
  setThreshold,
  isLoading,
  uploadPreview,
  onUpload,
  onTogglePreviewRow,
  onToggleAllPreviewRows,
  onConfirmUpload,
  onCancelUpload,
  clearableDeals,
  onClearPending,
}) {
  const fileInputRef = useRef(null)
  const gridRef      = useRef(null)
  const resultsRef   = useRef(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isParsing, setIsParsing]   = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  // Auto-scroll to preview grid when it first appears
  useEffect(() => {
    if (uploadPreview && gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [uploadPreview])

  // Auto-scroll to results banner after successful import
  useEffect(() => {
    if (uploadResult && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [uploadResult])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadResult(null)
    setIsParsing(true)
    try {
      await onUpload?.(file)
    } finally {
      setIsParsing(false)
    }
    event.target.value = ""
  }

  function handleClearDrafts() {
    if (!clearableDeals?.length) return
    const ok = window.confirm(
      `Delete ${clearableDeals.length} draft deal(s) (Pending Input + Below Threshold) that Sales has not submitted? This cannot be undone.`,
    )
    if (!ok) return
    onClearPending?.(clearableDeals.map((d) => d.id))
  }

  const previewRows      = uploadPreview?.rows ?? []
  const selectedRows     = previewRows.filter((e) => e.selected)
  const validRows        = selectedRows.filter((e) => e.errors.length === 0 && !e.isClosedLost)
  const invalidRows      = previewRows.filter((e) => e.errors.length > 0)
  const skippedClosedLost = previewRows.filter((e) => e.isClosedLost).length
  const belowThresholdCount = Number(uploadPreview?.filteredOutBelowThresholdCount || 0)
  const allSelected = previewRows.length > 0 && previewRows.every((e) => e.selected)
  const someSelected = previewRows.some((e) => e.selected)

  async function handleConfirmImport() {
    const rowsSnapshot  = validRows.map((e) => e.row)
    const fileNameSnap  = uploadPreview?.fileName ?? ""
    setConfirmDialogOpen(false)
    const result = await onConfirmUpload?.()
    if (result?.ok) {
      setUploadResult({
        rows: rowsSnapshot,
        fileName: fileNameSnap,
        createdCount: result.createdCount,
        totalTracked: result.totalTracked,
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Upload Panel ── */}
      <div className="rounded-2xl border border-white/50 bg-white/90 p-6 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Upload className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              Upload Salesforce Data
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Select an Excel (.xlsx / .xls) file to preview rows, review changes, and confirm import.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Threshold input */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Min. Deal Value (INR)
            </p>
            <div className="mt-1 flex items-center gap-2">
              <input
                className="w-24 rounded border bg-transparent px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100"
                type="number"
                min="0"
                value={threshold ?? 0}
                onChange={(e) => setThreshold?.(Number(e.target.value || 0))}
              />
              <AlertCircle
                className="size-4 text-slate-400"
                aria-label="Only deals at or above this INR threshold enter the workflow."
              />
            </div>
          </div>

          {/* Hidden file input + trigger button */}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Upload className="size-4" />
            {isLoading ? "Processing…" : "Select Excel File"}
          </Button>

          {/* Clear Drafts */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearDrafts}
            disabled={!clearableDeals?.length}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:border-slate-200 disabled:text-slate-400"
            title="Delete Pending Input + Below Threshold drafts that Sales has not yet submitted"
          >
            <Trash2 className="size-4" />
            Clear Drafts ({clearableDeals?.length ?? 0})
          </Button>
        </div>
      </div>

      {/* ── Skeleton shimmer while parsing ── */}
      {isParsing && (
        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/90 p-6 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mb-3 h-9 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {/* ── Empty-state hint before any file is chosen ── */}
      {!isParsing && !uploadPreview && !uploadResult && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <FileSpreadsheet className="size-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
            Select an Excel file above to preview rows before importing.
          </p>
        </div>
      )}

      {/* ── Data Grid (shown after file is parsed) ── */}
      {uploadPreview && (
        <div ref={gridRef} className="overflow-hidden rounded-2xl border border-white/50 bg-white/90 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-slate-700 dark:bg-slate-900">
          {/* Grid header: filename + summary chips */}
          <div className="border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="mb-4">
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Preview —{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {uploadPreview.fileName}
                </span>
              </h4>
              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                Review rows below, deselect any you want to skip, then confirm to import.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <SummaryChip tone="indigo" label="Selected" value={`${selectedRows.length}/${previewRows.length}`} />
              <SummaryChip tone="emerald" label="Valid" value={validRows.length} />
              <SummaryChip tone="rose" label="Invalid" value={invalidRows.length} />
              {(skippedClosedLost + belowThresholdCount) > 0 && (
                <SummaryChip tone="amber" label="Skipped" value={skippedClosedLost + belowThresholdCount} />
              )}
              {belowThresholdCount > 0 && (
                <p className="self-center text-[11px] text-slate-400 dark:text-slate-500">
                  {belowThresholdCount} row(s) hidden — below INR threshold
                </p>
              )}
            </div>
          </div>

          {/* Scrollable table */}
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                <tr>
                  {["Pick", "Opp No", "Opportunity", "Amount", "Currency", "Stage", "Owner", "Status", "Changes"].map(
                    (label) => (
                      <th
                        key={label}
                        className="border-b border-slate-100 px-3 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:border-slate-800 dark:text-slate-500"
                      >
                        {label === "Pick" ? (
                          <input
                            type="checkbox"
                            className="size-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = !allSelected && someSelected
                            }}
                            onChange={(e) => onToggleAllPreviewRows?.(e.target.checked)}
                          />
                        ) : (
                          label
                        )}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {previewRows.map((entry) => {
                  const changed = entry.changedFields || {}
                  const isInvalid = entry.errors.length > 0
                  return (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          className="size-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                          checked={!!entry.selected}
                          onChange={(e) => onTogglePreviewRow?.(entry.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-[12px] text-slate-500 dark:text-slate-400">
                        <span className={changed.opportunityNumber ? "font-semibold text-indigo-600 dark:text-indigo-400" : ""}>
                          {entry.row.opportunityNumber || "—"}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-3 py-3">
                        <p className={`truncate font-medium ${changed.opportunityName ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"}`}>
                          {entry.row.opportunityName || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={changed.amount ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"}>
                          {entry.row.amount}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                        {entry.row.currency || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${changed.stage ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>
                          {entry.row.stage || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                        {entry.row.opportunityOwner || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {isInvalid ? (
                          <span className="status-pill status-pill-coral">
                            <AlertCircle className="size-3" /> Error
                          </span>
                        ) : entry.isClosedLost ? (
                          <span className="status-pill status-pill-warning">Closed Lost</span>
                        ) : entry.belowThreshold ? (
                          <span className="status-pill status-pill-warning">Below Threshold</span>
                        ) : (
                          <span className="status-pill status-pill-success">Ready</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {entry.allChanges?.length > 0 ? (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                            {entry.allChanges.length} changes
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-slate-400">No change</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Grid footer: actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 p-5 dark:border-slate-800">
            <p className="max-w-sm text-[12px] text-slate-400 dark:text-slate-500">
              Once confirmed, valid deals land in the Sales queue as{" "}
              <strong className="text-slate-600 dark:text-slate-300">Pending Input</strong> for enrichment.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelUpload}
                disabled={isLoading}
                className="px-6"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={isLoading || validRows.length === 0}
                className="gap-2 bg-indigo-600 px-6 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check className="size-4" />
                Confirm Upload ({validRows.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Committed Results (persists after successful import) ── */}
      {uploadResult && !uploadPreview && (
        <div ref={resultsRef} className="overflow-hidden rounded-2xl border border-emerald-200 bg-white/90 shadow-[0_10px_30px_rgba(16,42,67,0.08)] dark:border-emerald-900/40 dark:bg-slate-900">
          {/* Success banner */}
          <div className="flex flex-wrap items-center gap-4 border-b border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Check className="size-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-extrabold text-emerald-800 dark:text-emerald-200">
                Import Successful — {uploadResult.fileName}
              </h4>
              <p className="mt-0.5 text-[12px] text-emerald-700/70 dark:text-emerald-400/70">
                {uploadResult.createdCount} new deal(s) created · {uploadResult.totalTracked} total tracked
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadResult(null)}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400"
            >
              Dismiss
            </Button>
          </div>

          {/* Results table */}
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                <tr>
                  {["#", "Opp No", "Account Name", "Opportunity Name", "Amount", "Currency", "Stage", "Owner"].map((h) => (
                    <th
                      key={h}
                      className="border-b border-slate-100 px-3 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:border-slate-800 dark:text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {uploadResult.rows.map((row, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-3 py-2.5 text-[11px] text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-slate-500 dark:text-slate-400">
                      {row.opportunityNumber || "—"}
                    </td>
                    <td className="max-w-[160px] px-3 py-2.5">
                      <p className="truncate text-slate-600 dark:text-slate-300">{row.accountName || "—"}</p>
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5">
                      <p className="truncate font-medium text-slate-700 dark:text-slate-200">{row.opportunityName || "—"}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.amount ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{row.currency || "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {row.stage || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{row.opportunityOwner || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Confirmation popup ── */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-indigo-600" />
              Confirm Data Import
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <p>
              You are about to insert{" "}
              <strong className="text-indigo-700 dark:text-indigo-300">
                {validRows.length} deal(s)
              </strong>{" "}
              into the database.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deals already in the system will be updated if major fields have changed. All
              imported deals will appear in the Sales queue as <em>Pending Input</em> awaiting
              enrichment. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isLoading}
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Check className="size-4" />
              {isLoading ? "Importing…" : "Yes, Import Deals"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary chip used inside UploadDataView
// ─────────────────────────────────────────────────────────────────────────────

function SummaryChip({ tone, label, value }) {
  const palettes = {
    indigo: "bg-indigo-50/60 border-indigo-100 text-indigo-600/80 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400/80",
    emerald: "bg-emerald-50/60 border-emerald-100 text-emerald-600/80 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400/80",
    rose: "bg-rose-50/60 border-rose-100 text-rose-600/80 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400/80",
    amber: "bg-amber-50/60 border-amber-100 text-amber-600/80 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400/80",
  }
  const cls = palettes[tone] || palettes.indigo
  const valueColor = tone === "indigo" ? "text-indigo-900 dark:text-indigo-100"
    : tone === "emerald" ? "text-emerald-900 dark:text-emerald-100"
    : tone === "rose" ? "text-rose-900 dark:text-rose-100"
    : "text-amber-900 dark:text-amber-100"

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${cls}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared presentational components
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, tone, value, label, subtitle, onClick }) {
  const palettes = {
    violet: {
      ring: "from-violet-200/60 via-white to-white",
      icon: "bg-violet-100 text-violet-700",
      bar: "bg-violet-300",
    },
    amber: {
      ring: "from-amber-200/70 via-white to-white",
      icon: "bg-amber-100 text-amber-700",
      bar: "bg-amber-400",
    },
    emerald: {
      ring: "from-emerald-200/60 via-white to-white",
      icon: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-400",
    },
    sky: {
      ring: "from-sky-200/60 via-white to-white",
      icon: "bg-sky-100 text-sky-700",
      bar: "bg-sky-400",
    },
  }
  const p = palettes[tone] || palettes.sky
  const interactive = typeof onClick === "function"
  const baseClasses = `rounded-2xl border border-white/70 bg-gradient-to-br ${p.ring} p-4 shadow-[0_10px_30px_rgba(16,42,67,0.06)] dark:border-slate-700 dark:bg-slate-900`
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
      <button type="button" onClick={onClick} className={`${baseClasses} ${interactiveClasses}`} aria-label={`Open ${label} in My Tasks`}>
        {content}
      </button>
    )
  }
  return <div className={baseClasses}>{content}</div>
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_10px_30px_rgba(16,42,67,0.06)] dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-slate-600 dark:text-slate-300" />}
        <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function Stat({ icon: Icon, label, value, valueClass = "text-slate-800" }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-slate-500" />}
        <span className={`text-base font-bold ${valueClass}`}>{value}</span>
      </div>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

function ProgressCell({ deal, onNudge }) {
  const { approved, total, complete } = progressSummary(deal)
  const dots = progressDots(deal)
  const hoverable = deal.status === DEAL_STATUS.IN_APPROVAL || deal.status === DEAL_STATUS.LEVEL_SKIPPED
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-[11px] font-bold ${complete ? "text-emerald-600" : "text-slate-600 dark:text-slate-300"}`}>
        {approved}/{total}
      </span>
      <div className="flex items-center gap-1.5">
        {dots.map((dot) => {
          const isPending = dot.status === "Pending"
          const interactive = hoverable && isPending && Boolean(onNudge)
          const Tag = interactive ? "button" : "span"
          const interactiveClasses = interactive
            ? "cursor-pointer hover:scale-150 hover:ring-2 hover:ring-amber-300"
            : "cursor-default"
          return (
            <Tag
              key={dot.key}
              type={interactive ? "button" : undefined}
              onClick={interactive ? () => onNudge?.(deal, dot.key) : undefined}
              className={`flex h-4 w-4 items-center justify-center rounded-full transition-all ${dot.color} ${interactiveClasses} text-white`}
              title={interactive ? `${dot.tooltip} — click to nudge` : dot.tooltip}
              aria-label={dot.tooltip}
            >
              {dot.status === "Approved" && <Check className="h-3 w-3" strokeWidth={3} />}
              {dot.status === "Rejected" && <X className="h-3 w-3" strokeWidth={3} />}
            </Tag>
          )
        })}
      </div>
    </div>
  )
}

function VersionBadge({ version }) {
  return (
    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
      v{version || 1}
    </span>
  )
}

function TriageQueueTable({ deals, onOpenDeal, onNudge }) {
  if (deals.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No deals waiting for triage"
        message="When sales submits a deal it lands here for you to validate and route."
      />
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 dark:bg-slate-900/60">
          <tr>
            {["Opp No", "Account Name", "Opportunity", "Amount", "V.", "Status", "Progress", "Action"].map((label) => (
              <th key={label} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300">{deal.opportunityNumber}</td>
              <td className="px-3 py-3 text-[13px] font-semibold text-slate-800 dark:text-slate-200">{deal.accountName}</td>
              <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300">{deal.opportunityName}</td>
              <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300">{formatCurrency(deal.amount, deal.currency)}</td>
              <td className="px-3 py-3"><VersionBadge version={deal.version} /></td>
              <td className="px-3 py-3">
                <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(deal.status)}`}>
                  {deal.status}
                </span>
              </td>
              <td className="px-3 py-3"><ProgressCell deal={deal} onNudge={onNudge} /></td>
              <td className="px-3 py-3">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => onOpenDeal(deal)}>
                  Review & Route
                  <ChevronRight className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrackingPanel({ deals, filter, setFilter, counts, onOpenDeal, onReturn, onNudge }) {
  const tabs = TRACKING_FILTERS.map((entry) => ({
    ...entry,
    count: counts.filter(entry.match).length,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                active
                  ? "bg-sky-600 text-white shadow"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          )
        })}
      </div>

      {deals.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No deals in this view" message="Try a different status filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60">
              <tr>
                {["Opp No", "Account Name", "Opportunity", "Amount", "V.", "Status", "Progress", "Action"].map((label) => (
                  <th key={label} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <TrackingRow
                  key={deal.id}
                  deal={deal}
                  onOpenDeal={onOpenDeal}
                  onReturn={onReturn}
                  onNudge={onNudge}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TrackingRow({ deal, onOpenDeal, onReturn, onNudge }) {
  const isDraft = deal.status === DEAL_STATUS.PENDING_INPUT || deal.status === DEAL_STATUS.BELOW_THRESHOLD
  const inApproval = deal.status === DEAL_STATUS.IN_APPROVAL || deal.status === DEAL_STATUS.LEVEL_SKIPPED
  const pendingApprovers = inApproval
    ? (deal.requiredApprovals || []).filter((roleKey) => {
        const approval = (deal.approvals || []).find((a) => a.roleKey === roleKey)
        return !approval || approval.status === "Pending"
      })
    : []

  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300">{deal.opportunityNumber}</td>
      <td className="px-3 py-3 text-[13px] font-semibold text-slate-800 dark:text-slate-200">{deal.accountName}</td>
      <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300">{deal.opportunityName}</td>
      <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300">{formatCurrency(deal.amount, deal.currency)}</td>
      <td className="px-3 py-3"><VersionBadge version={deal.version} /></td>
      <td className="px-3 py-3">
        <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(deal.status)}`}>
          {deal.status}
        </span>
      </td>
      <td className="px-3 py-3"><ProgressCell deal={deal} onNudge={onNudge} /></td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onOpenDeal(deal)}>
            View Details
            <ChevronRight className="size-4" />
          </Button>
          {isDraft && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => onNudge?.(deal, "Sales")}
              title="Send a nudge to sales"
            >
              <Bell className="size-4" /> Nudge Sales
            </Button>
          )}
          {inApproval && pendingApprovers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {pendingApprovers.map((roleKey) => (
                <Button
                  key={roleKey}
                  size="icon"
                  variant="outline"
                  className="size-8 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => onNudge?.(deal, roleKey)}
                  title={`Nudge ${roleDisplayName(roleKey)}`}
                  aria-label={`Nudge ${roleDisplayName(roleKey)}`}
                >
                  <Bell className="size-4" />
                </Button>
              ))}
            </div>
          )}
          {(deal.status === DEAL_STATUS.IN_APPROVAL || deal.status === DEAL_STATUS.LEVEL_SKIPPED) && (
            <Button
              size="sm"
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => onReturn?.(deal.id)}
            >
              Return
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

function DeepAnalysisPanel({ deep }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard icon={Truck} title="Delivery Type Analysis">
          {deep.deliveryTypes.length === 0 ? (
            <p className="text-sm text-slate-500">No delivery type data available.</p>
          ) : (
            <div className="space-y-3">
              {deep.deliveryTypes.map((entry) => (
                <div key={entry.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.label}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {entry.count} {entry.count === 1 ? "Deal" : "Deals"} ({entry.pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-sky-500" style={{ width: `${entry.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Timer} title="Approval Bottlenecks">
          {deep.bottlenecks.length === 0 ? (
            <p className="text-sm text-slate-500">No active bottlenecks detected.</p>
          ) : (
            <ul className="space-y-2">
              {deep.bottlenecks.map((entry) => (
                <li key={entry.roleKey} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.roleKey}</span>
                  <span className="text-xs font-bold uppercase text-amber-700">
                    {entry.pending} pending
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SectionCard icon={AlertTriangle} title="Risk Assessment">
          {deep.risks.length === 0 ? (
            <p className="text-sm text-slate-500">No risk indicators surfaced.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60">
                  <tr>
                    {["Oppty", "Risk Factor", "Potential Impact"].map((label) => (
                      <th key={label} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deep.risks.map((entry) => (
                    <tr key={entry.opp} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{entry.opp}</td>
                      <td className="px-3 py-2 text-rose-600">{entry.risk}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{entry.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-100 shadow-[0_10px_30px_rgba(16,42,67,0.18)]">
          <h4 className="text-base font-extrabold">Quick Insights</h4>
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Avg. Deal Margin</p>
            <p className="text-2xl font-extrabold text-emerald-300">{deep.avgMargin.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">System Throughput</p>
            <p className="text-2xl font-extrabold text-sky-300">{deep.throughputPerMonth} Records/mo</p>
          </div>
        </div>
      </div>
    </div>
  )
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
