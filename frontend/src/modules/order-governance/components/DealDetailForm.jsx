import { useEffect, useMemo, useState } from "react"
import { Calculator, CheckCircle2, ChevronLeft, CreditCard, Download, Info, Lock, Paperclip, Rocket, Shield, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  APPROVAL_KEYS,
  BID_FIELDS,
  COST_FIELDS,
  DEAL_STATUS,
  DETAIL_TABS,
  STAGES,
} from "../constants"
import {
  approvalStatusTone,
  calcDealTotals,
  can,
  currencySymbol,
  dealIsCcConfirmed,
  formatCurrency,
  formatDateTime,
  formatNumber,
  pickAdvisoryLaneForDeal,
  pickApproverActedLaneForDeal,
  pickApproverLaneForDeal,
  reviewerCanEdit,
  roleDisplayName,
  salesCanEdit,
} from "../helpers"

const TAB_ICONS = {
  info: Info,
  calculator: Calculator,
  "credit-card": CreditCard,
  paperclip: Paperclip,
  shield: Shield,
  rocket: Rocket,
}

const CC_FINAL_TAB = { id: "final", label: "Final Action", icon: "rocket" }

export function DealDetailForm({
  deal,
  currentRole,
  approverLaneKeys = [],
  requiredApprovals,
  setRequiredApprovals,
  reviewerComments = "",
  setReviewerComments,
  updateLocalDeal,
  onSubmitForApproval,
  onRoute,
  onReturn,
  onApprove,
  onReject,
  onAdvisoryComment,
  onUploadDocument,
  onDeleteDocument,
  onViewDocument,
  onDownloadDocument,
  onConfirm,
  onBack,
  permissions,
  isBusy,
}) {
  const isSales = currentRole === "sales"
  const isReviewer = currentRole === "reviewer"
  const isApprover = currentRole === "approver"
  const isCcManager = currentRole === "cc-manager"

  // CC Managers get an extra "Final Action" tab for ERP fulfilment entry.
  // Sales users only see the Approval tab AFTER the Reviewer has routed it.
  const tabs = useMemo(() => {
    let base = DETAIL_TABS
    if (isSales && (deal?.status === DEAL_STATUS.PENDING_INPUT || deal?.status === DEAL_STATUS.PENDING_REVIEW)) {
      base = base.filter((t) => t.id !== "approval")
    }
    return isCcManager ? [...base, CC_FINAL_TAB] : base
  }, [isCcManager, isSales, deal?.status])
  const defaultTabId = isCcManager ? CC_FINAL_TAB.id : DETAIL_TABS[0].id

  const [activeTab, setActiveTab] = useState(defaultTabId)
  const [approverComment, setApproverComment] = useState("")
  const [approverError, setApproverError] = useState("")
  const [approverBusy, setApproverBusy] = useState(false)

  useEffect(() => {
    setActiveTab(defaultTabId)
    setApproverComment("")
    setApproverError("")
  }, [deal?.id, defaultTabId])

  if (!deal) return null

  const editable = (isSales && salesCanEdit(deal)) || (isReviewer && reviewerCanEdit(deal))
  const totals = calcDealTotals(deal)
  const currency = deal.currency || "INR"

  const showSubmit = isSales && can(permissions, "order-governance.deal.submit") && deal.status === DEAL_STATUS.PENDING_INPUT
  const showRoute = isReviewer && can(permissions, "order-governance.route.configure") && (deal.status === DEAL_STATUS.PENDING_REVIEW || deal.status === DEAL_STATUS.LEVEL_SKIPPED)
  const showReturn = isReviewer && can(permissions, "order-governance.deal.return_to_sales") && (deal.status === DEAL_STATUS.PENDING_REVIEW || deal.status === DEAL_STATUS.IN_APPROVAL || deal.status === DEAL_STATUS.LEVEL_SKIPPED)

  // Approver lane resolution: the three states are mutually exclusive —
  // `actedLane` wins over `approverLane` wins over `advisoryLane` so an
  // approver who already decided always sees the read-only archive view
  // instead of a stale action form.
  const approverLane = isApprover ? pickApproverLaneForDeal(deal, approverLaneKeys) : null
  const advisoryLane = isApprover && !approverLane ? pickAdvisoryLaneForDeal(deal, approverLaneKeys) : null
  const actedLane = isApprover ? pickApproverActedLaneForDeal(deal, approverLaneKeys) : null
  const actedApproval = actedLane
    ? (deal.approvals || []).find((x) => x.roleKey === actedLane)
    : null
  const showApproverActions = Boolean(approverLane) && deal.status === DEAL_STATUS.IN_APPROVAL
  const showAdvisoryAction = Boolean(advisoryLane) && !actedLane && deal.status === DEAL_STATUS.IN_APPROVAL
  const showActedBanner = Boolean(actedLane)
  const ccAlreadyConfirmed = dealIsCcConfirmed(deal)
  const ccCanConfirm =
    isCcManager &&
    !ccAlreadyConfirmed &&
    (deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.LEVEL_SKIPPED) &&
    can(permissions, "order-governance.final.confirm_order")
  const canManageDocuments = can(permissions, "order-governance.deal.manage_documents")
  const submitValidation = useMemo(() => getSalesSubmitValidation(deal), [deal])
  const canSubmitNow = submitValidation.complete

  async function submitApproverDecision(decision) {
    setApproverError("")
    const trimmed = approverComment.trim()
    if (!trimmed) {
      setApproverError("A comment is required before you can approve or reject.")
      return
    }
    const handler = decision === "approve" ? onApprove : onReject
    if (!handler) return
    setApproverBusy(true)
    try {
      await handler(trimmed)
    } finally {
      setApproverBusy(false)
    }
  }

  async function submitAdvisoryComment() {
    setApproverError("")
    const trimmed = approverComment.trim()
    if (!trimmed) {
      setApproverError("Please type a comment before saving.")
      return
    }
    if (!onAdvisoryComment) return
    setApproverBusy(true)
    try {
      const ok = await onAdvisoryComment(trimmed)
      if (ok) setApproverComment("")
    } finally {
      setApproverBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ChevronLeft className="size-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="surface-elevated rounded-2xl">
        <nav className={`grid grid-cols-2 gap-1 rounded-t-2xl border-b bg-slate-50/60 p-2 sm:grid-cols-3 dark:bg-slate-900/60 ${isCcManager ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.icon] || Info
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all sm:text-sm ${
                  active
                    ? "bg-gradient-to-br from-[#6aa6ff] via-[#a58cff] to-[#6ed1b8] text-white shadow-[0_8px_24px_-10px_rgba(106,166,255,0.55)]"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-200"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="p-6">
          {activeTab === "sfdc" && (
            <SfdcTab deal={deal} editable={editable} updateLocalDeal={updateLocalDeal} currency={currency} />
          )}
          {activeTab === "financials" && (
            <FinancialsTab deal={deal} editable={editable} updateLocalDeal={updateLocalDeal} totals={totals} currency={currency} />
          )}
          {activeTab === "payment" && (
            <PaymentTab
              deal={deal}
              editable={editable}
              updateLocalDeal={updateLocalDeal}
              showSubmit={showSubmit}
              canSubmitNow={canSubmitNow}
              missingLabels={submitValidation.missing}
              onSubmitForApproval={onSubmitForApproval}
              isBusy={isBusy}
            />
          )}
          {activeTab === "documents" && (
            <DocumentsTab
              deal={deal}
              canManage={canManageDocuments}
              onUploadDocument={onUploadDocument}
              onDeleteDocument={onDeleteDocument}
              onViewDocument={onViewDocument}
              onDownloadDocument={onDownloadDocument}
              isBusy={isBusy}
            />
          )}
          {activeTab === "approval" && (
            <ApprovalTab
              deal={deal}
              isReviewer={isReviewer && (deal.status === DEAL_STATUS.PENDING_REVIEW || deal.status === DEAL_STATUS.LEVEL_SKIPPED)}
              requiredApprovals={requiredApprovals}
              setRequiredApprovals={setRequiredApprovals}
              reviewerComments={reviewerComments}
              setReviewerComments={setReviewerComments}
            />
          )}
          {activeTab === "final" && isCcManager && (
            <FinalActionTab
              deal={deal}
              currency={currency}
              canConfirm={ccCanConfirm}
              alreadyConfirmed={ccAlreadyConfirmed}
              onConfirm={onConfirm}
              isBusy={isBusy}
            />
          )}
        </div>

        {(showRoute || showReturn || showApproverActions || showAdvisoryAction || showActedBanner) && (
          <div className="flex flex-col items-center gap-3 border-t bg-slate-50/40 p-5 dark:bg-slate-900/40">
            {showRoute && (
              <Button size="lg" className="min-w-[260px] px-8" onClick={onRoute} disabled={isBusy}>
                {isBusy ? "Routing…" : "Finalize Review & Route"}
              </Button>
            )}
            {showReturn && (
              <Button
                variant="outline"
                onClick={onReturn}
                className="min-w-[260px] gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <span aria-hidden>⊘</span>
                Cancel Approval & Return to Sales
              </Button>
            )}
            {(showApproverActions || showAdvisoryAction) && (
              <ApproverActionPanel
                laneKey={approverLane || advisoryLane}
                mode={showApproverActions ? "decide" : "advisory"}
                comment={approverComment}
                onChangeComment={(value) => {
                  setApproverComment(value)
                  if (approverError) setApproverError("")
                }}
                error={approverError}
                busy={approverBusy}
                onApprove={() => submitApproverDecision("approve")}
                onReject={() => submitApproverDecision("reject")}
                onSaveAdvisory={submitAdvisoryComment}
              />
            )}
            {showActedBanner && !showApproverActions && !showAdvisoryAction && (
              <ActedBanner laneKey={actedLane} approval={actedApproval} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FieldDisplay({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value || "—"}</p>
    </div>
  )
}

function SfdcTab({ deal, editable, updateLocalDeal, currency }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <FieldDisplay label="Account" value={deal.accountName} />
        <FieldDisplay label="Opportunity" value={deal.opportunityName} />
        <FieldDisplay label="Number" value={deal.opportunityNumber} />
        <FieldDisplay label={`Amount (${currency})`} value={formatCurrency(deal.amount, currency)} />
        <FieldDisplay label="AM" value={deal.amName} />
        <FieldDisplay label="Geo" value={deal.geo} />
        <FieldDisplay label="Owner" value={deal.opportunityOwner} />
        <FieldDisplay label="Manager" value={deal.manager} />
        <FieldDisplay label="Delivery" value={deal.deliveryType} />
      </div>

      <div className="max-w-md">
        <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Current Stage
          <select
            className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={deal.stage || ""}
            onChange={(event) => updateLocalDeal("stage", event.target.value)}
            disabled={!editable}
          >
            <option value="">—</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

function MoneyInput({ label, value, onChange, disabled, currency }) {
  const normalizedValue =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? ""
      : String(value)
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
        <span className="text-sm text-slate-500">{currencySymbol(currency)}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:text-slate-500 dark:text-slate-100"
          value={normalizedValue}
          disabled={disabled}
          onChange={(event) => {
            const raw = event.target.value
            onChange(raw === "" ? null : Number(raw))
          }}
        />
      </div>
    </label>
  )
}

function ReadonlyMoney({ label, currency, value, tone = "emerald" }) {
  const palette =
    tone === "rose"
      ? "border-rose-100 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
      : "border-emerald-100 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${palette}`}>
        <span className="text-sm">{currencySymbol(currency)}</span>
        <span className="text-sm font-bold">{formatNumber(value)}</span>
      </div>
    </div>
  )
}

function FinancialsTab({ deal, editable, updateLocalDeal, totals, currency }) {
  const { totalCost, productMargin, serviceMargin, grossMargin } = totals
  const rows = BID_FIELDS.map((bidField, index) => ({
    bidField,
    costField: COST_FIELDS[index],
  }))

  return (
    <div className="space-y-6">
      <div className="surface-elevated overflow-x-auto rounded-lg bg-white/90">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-200/85 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Category</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Bid Value ({currency})</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Cost ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ bidField, costField }) => (
              <tr key={bidField.key} className="border-t border-slate-400/80 even:bg-slate-50/55 dark:border-slate-700 dark:even:bg-transparent">
                <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  {bidField.label}
                </td>
                <td className="px-3 py-2">
                  <MoneyInlineInput
                    currency={currency}
                    value={deal[bidField.key]}
                    onChange={(value) => updateLocalDeal(bidField.key, value)}
                    disabled={!editable}
                    placeholder={`Enter ${bidField.label}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <MoneyInlineInput
                    currency={currency}
                    value={deal[costField.key]}
                    onChange={(value) => updateLocalDeal(costField.key, value)}
                    disabled={!editable}
                    placeholder={`Enter ${costField.label}`}
                  />
                </td>
              </tr>
            ))}
            <tr className="border-t border-slate-400/85 bg-slate-200/60 dark:border-slate-700 dark:bg-slate-800/40">
              <td className="px-3 py-2 font-bold">Totals</td>
              <td className="px-3 py-2 font-bold">
                {currencySymbol(currency)} {formatNumber(totals.totalBid)}
              </td>
              <td className="px-3 py-2 font-bold text-rose-700 dark:text-rose-300">
                {currencySymbol(currency)} {formatNumber(totalCost)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MarginPill label="Product Margin" value={productMargin} />
        <MarginPill label="Service Margin" value={serviceMargin} />
        <MarginPill label="Gross Margin" value={grossMargin} />
      </div>
    </div>
  )
}

function MoneyInlineInput({ value, onChange, disabled, currency, placeholder }) {
  const normalizedValue =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? ""
      : String(value)
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-400/90 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_6px_16px_-10px_rgba(51,85,140,0.42)] ring-1 ring-slate-300/65 transition-colors focus-within:border-sky-400 focus-within:ring-sky-300/60 dark:border-slate-700 dark:bg-slate-800/60 dark:ring-0 dark:shadow-none">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-400">{currencySymbol(currency)}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 disabled:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
        value={normalizedValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value
          onChange(raw === "" ? null : Number(raw))
        }}
      />
    </div>
  )
}

function MarginPill({ label, value }) {
  const pct = Number.isFinite(value) ? value : 0
  const tone =
    pct >= 25
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : pct >= 10
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : "border-rose-100 bg-rose-50 text-rose-700"
  return (
    <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${tone}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-lg font-bold">{pct.toFixed(1)}%</span>
    </div>
  )
}

function PaymentTab({
  deal,
  editable,
  updateLocalDeal,
  showSubmit = false,
  canSubmitNow = false,
  missingLabels = [],
  onSubmitForApproval,
  isBusy = false,
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Cust. Payment</span>
          <textarea
            rows={4}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={deal.customerPaymentTerm || ""}
            onChange={(event) => updateLocalDeal("customerPaymentTerm", event.target.value)}
            disabled={!editable}
            placeholder="e.g. 30 / 60 / 10 — advance / on delivery / on go-live"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Vend. Payment</span>
          <textarea
            rows={4}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={deal.vendorPaymentTerm || ""}
            onChange={(event) => updateLocalDeal("vendorPaymentTerm", event.target.value)}
            disabled={!editable}
            placeholder="e.g. Net 60 from vendor invoice"
          />
        </label>
      </div>

      {showSubmit && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Submit is enabled only after all required values across SFDC, Bid Values, Costs & Margins, and Payment Terms are filled.
            </p>
            <Button
              size="lg"
              className="min-w-[260px] px-8"
              onClick={onSubmitForApproval}
              disabled={isBusy || !canSubmitNow}
            >
              {isBusy ? "Submitting…" : "Submit for Approval"}
            </Button>
          </div>
          {!canSubmitNow && missingLabels.length > 0 && (
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Complete required fields: {missingLabels.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function getSalesSubmitValidation(deal) {
  const missing = []
  const present = (value) => String(value ?? "").trim().length > 0
  const positive = (value) => Number(value ?? 0) > 0

  // SFDC minimum set required before submission.
  if (!present(deal?.opportunityNumber)) missing.push("Opportunity Number")
  if (!present(deal?.opportunityName)) missing.push("Opportunity Name")
  if (!present(deal?.accountName)) missing.push("Account Name")
  if (!present(deal?.stage)) missing.push("Stage")

  // Bid values.
  if (!positive(deal?.productValue)) missing.push("Product Value")
  if (!positive(deal?.serviceValue)) missing.push("Service Value")
  if (!positive(deal?.amcValue)) missing.push("AMC Value")
  if (!positive(deal?.othersValue)) missing.push("Others Value")

  // Costs & margins inputs.
  if (!positive(deal?.productCost)) missing.push("Product Cost")
  if (!positive(deal?.externalServiceCost)) missing.push("External Service Cost")
  if (!positive(deal?.internalCost)) missing.push("Internal Cost")
  if (!positive(deal?.othersCost)) missing.push("Others Cost")

  // Payment terms.
  if (!present(deal?.customerPaymentTerm)) missing.push("Customer Payment Term")
  if (!present(deal?.vendorPaymentTerm)) missing.push("Vendor Payment Term")

  return { complete: missing.length === 0, missing }
}

function DocumentsTab({
  deal,
  canManage,
  onUploadDocument,
  onDeleteDocument,
  onViewDocument,
  onDownloadDocument,
  isBusy,
}) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewDoc, setPreviewDoc] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const documents = Array.isArray(deal?.documents) ? deal.documents : []

  async function handleUploadSelected() {
    if (!selectedFiles.length || !onUploadDocument) return
    for (const file of selectedFiles) {
      // keep sequential to preserve deterministic UX and API messages
      await onUploadDocument(file)
    }
    setSelectedFiles([])
  }

  async function handleDelete(documentId) {
    if (!onDeleteDocument) return
    const confirmed = window.confirm("Delete this document? This action cannot be undone.")
    if (!confirmed) return
    await onDeleteDocument(documentId)
  }

  function handleSelectFiles(event) {
    const incoming = Array.from(event.target.files || [])
    if (incoming.length === 0) return
    setSelectedFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}:${f.lastModified}`))
      const merged = [...prev]
      incoming.forEach((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`
        if (!seen.has(key)) {
          merged.push(file)
          seen.add(key)
        }
      })
      return merged
    })
    event.target.value = ""
  }

  function removeQueuedFile(index) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleView(doc) {
    if (!onViewDocument) return
    setIsLoadingPreview(true)
    try {
      const result = await onViewDocument(doc.id, doc.originalFileName, doc.contentType)
      if (result?.url) {
        setPreviewDoc({ ...result, id: doc.id })
      }
    } finally {
      setIsLoadingPreview(false)
    }
  }

  function closePreview() {
    if (previewDoc?.url) {
      URL.revokeObjectURL(previewDoc.url)
    }
    setPreviewDoc(null)
  }

  const previewMime = (previewDoc?.contentType || "").toLowerCase()
  const canInlinePdf = previewMime.includes("pdf")
  const canInlineImage = previewMime.startsWith("image/")
  const canInline = canInlinePdf || canInlineImage

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Deal Documents</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Upload supporting files (PDF, Word, Excel, images) for this deal. All roles can view/download.
          Only Sales and Reviewer can upload or delete.
        </p>
        {canManage && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleSelectFiles}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleUploadSelected}
              disabled={!selectedFiles.length || isBusy}
              className="gap-2"
            >
              <Upload className="size-4" />
              Upload Selected ({selectedFiles.length})
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFiles([])}
                disabled={isBusy}
              >
                Clear Queue
              </Button>
            )}
          </div>
        )}
        {canManage && selectedFiles.length > 0 && (
          <div className="mt-3 rounded border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Upload Queue</p>
            <div className="mt-2 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}:${file.size}:${file.lastModified}`} className="flex items-center justify-between gap-2 rounded border border-slate-100 px-2 py-1.5 text-xs dark:border-slate-800">
                  <span className="truncate text-slate-700 dark:text-slate-200">
                    {file.name} ({formatFileSize(file.size)})
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => removeQueuedFile(index)}
                    disabled={isBusy}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="surface-elevated overflow-x-auto rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">File</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Type</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Size</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Uploaded By</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Uploaded At</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-t border-slate-200 dark:border-slate-700">
                <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{doc.originalFileName}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{doc.contentType}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{formatFileSize(doc.fileSizeBytes)}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{doc.uploadedBy}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{formatDateTime(doc.uploadedAtUtc)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleView(doc)}
                      disabled={isLoadingPreview}
                    >
                      <Paperclip className="size-4" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => onDownloadDocument?.(doc.id, doc.originalFileName)}
                    >
                      <Download className="size-4" /> Download
                    </Button>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="size-4" /> Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">No documents uploaded for this deal.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="sm:max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="truncate">{previewDoc?.fileName || "Document Preview"}</DialogTitle>
          </DialogHeader>
          <div className="h-full min-h-0 rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            {!previewDoc ? null : canInlineImage ? (
              <div className="flex h-full items-center justify-center p-4">
                <img
                  src={previewDoc.url}
                  alt={previewDoc.fileName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : canInlinePdf ? (
              <iframe
                src={previewDoc.url}
                title={previewDoc.fileName}
                className="h-full w-full rounded"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  In-app preview is not available for this file type.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You can still download and open it locally.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => onDownloadDocument?.(previewDoc.id, previewDoc.fileName)}
                >
                  <Download className="size-4" /> Download
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatFileSize(bytes) {
  const n = Number(bytes || 0)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function ApprovalTab({ deal, isReviewer, requiredApprovals, setRequiredApprovals, reviewerComments, setReviewerComments }) {
  const required = deal.requiredApprovals || []
  const rows = APPROVAL_KEYS.map((roleKey) => {
    const approval = (deal.approvals || []).find((entry) => entry.roleKey === roleKey)
    return {
      roleKey,
      required: required.includes(roleKey),
      status: approval?.status || "Pending",
      createdAtUtc: approval?.createdDateUtc,
      actionAtUtc: approval?.actionDateUtc,
      comments: approval?.comments,
    }
  })

  const setRequirement = (roleKey, requirement) => {
    setRequiredApprovals((prev) => {
      const isRequired = requirement === "required"
      const without = prev.filter((entry) => entry !== roleKey)
      return isRequired ? [...without, roleKey] : without
    })
  }

  return (
    <div className="space-y-5">
      {isReviewer && setReviewerComments && (
        <div>
          <label className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              My Comments <span className="text-slate-400">(Optional Note)</span>
            </span>
            <textarea
              rows={3}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={reviewerComments}
              onChange={(event) => setReviewerComments(event.target.value)}
              placeholder="Add comments…"
            />
          </label>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-slate-600" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isReviewer ? "Configure Approval Route — Required vs Optional (Advisory)" : "Approval Chain Status"}
          </h4>
        </div>
        {isReviewer ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Required</span> lanes
            must approve before the deal can be completed.{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">Optional</span> (Advisory)
            lanes stay in the approval chain for visibility and can leave advisory comments,
            but they do not block progress.
          </p>
        ) : null}
      </div>

      <div className="surface-elevated overflow-x-auto rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Role</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Requirement</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Created Date</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Action Date</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Status</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase">Comments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.roleKey} className="border-t border-slate-200 dark:border-slate-700">
                <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{row.roleKey}</td>
                <td className="px-3 py-2">
                  {isReviewer ? (
                    <RequirementToggle
                      roleKey={row.roleKey}
                      isRequired={requiredApprovals.includes(row.roleKey)}
                      onChange={(value) => setRequirement(row.roleKey, value)}
                    />
                  ) : (
                    <RequirementBadge required={row.required} />
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{formatDateTime(row.createdAtUtc)}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{formatDateTime(row.actionAtUtc)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${approvalStatusTone(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs italic text-slate-500 dark:text-slate-400">
                  {row.comments || "No comments provided"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RequirementBadge({ required }) {
  return required ? (
    <span className="rounded bg-sky-100 px-2 py-1 text-[10px] font-bold uppercase text-sky-800">Required</span>
  ) : (
    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">Optional</span>
  )
}

function RequirementToggle({ roleKey, isRequired, onChange }) {
  const baseBtn =
    "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors"
  const requiredActive = isRequired
    ? "bg-sky-600 text-white"
    : "text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-slate-800"
  const optionalActive = !isRequired
    ? "bg-slate-600 text-white"
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
  return (
    <div
      role="radiogroup"
      aria-label={`Requirement for ${roleKey}`}
      className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    >
      <button
        type="button"
        role="radio"
        aria-checked={isRequired}
        onClick={() => onChange("required")}
        className={`${baseBtn} ${requiredActive}`}
      >
        Required
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!isRequired}
        onClick={() => onChange("optional")}
        className={`${baseBtn} border-l border-slate-200 dark:border-slate-700 ${optionalActive}`}
        title="Optional (Advisory): stays in the chain, can comment, does not block the deal."
      >
        Optional
      </button>
    </div>
  )
}

function FinalActionTab({ deal, currency, canConfirm, alreadyConfirmed, onConfirm, isBusy }) {
  // Seed the inputs from the persisted values; default Actual PO Value to the
  // approved amount so the CC Manager only has to adjust deltas.
  const [actualPoValue, setActualPoValue] = useState(() =>
    Number(deal?.actualPoValue ?? deal?.amount ?? 0),
  )
  const [sapOrder, setSapOrder] = useState(() => String(deal?.sapOrder ?? ""))
  const [customerOrderNo, setCustomerOrderNo] = useState(() =>
    String(deal?.customerOrderNo ?? ""),
  )
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setActualPoValue(Number(deal?.actualPoValue ?? deal?.amount ?? 0))
    setSapOrder(String(deal?.sapOrder ?? ""))
    setCustomerOrderNo(String(deal?.customerOrderNo ?? ""))
    setError("")
  }, [deal?.id, alreadyConfirmed])

  const locked = alreadyConfirmed
  const disabled = locked || !canConfirm

  async function handleConfirm() {
    setError("")
    const numericPo = Number(actualPoValue)
    if (!Number.isFinite(numericPo) || numericPo <= 0) {
      setError("Enter a valid Actual PO Value greater than zero.")
      return
    }
    const sap = sapOrder.trim()
    const cust = customerOrderNo.trim()
    if (!sap) {
      setError("SAP Order No is required before confirming.")
      return
    }
    if (!cust) {
      setError("Customer Order No is required before confirming.")
      return
    }
    if (typeof onConfirm !== "function") return
    setBusy(true)
    try {
      await onConfirm({ actualPoValue: numericPo, sapOrder: sap, customerOrderNo: cust })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-100">
        <div className="flex items-center gap-2 font-semibold">
          <Rocket className="size-4" />
          ERP Fulfilment &amp; Order Execution
        </div>
        <p className="text-xs text-sky-800/80 dark:text-sky-200/80">
          Mirror the approved deal into SAP. Capture the Actual PO Value, SAP Order No, and
          Customer Order No, then click <span className="font-semibold">Confirm Order</span>.
          Once confirmed, these fields are locked for audit integrity.
        </p>
      </div>

      {locked && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>
            Order confirmed and archived. ERP details are read-only — re-execution is disabled to
            prevent duplicate bookings.
          </span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Actual PO Value ({currency}) <span className="text-rose-500">*</span>
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="text-sm text-slate-500">{currencySymbol(currency)}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:text-slate-500 dark:text-slate-100"
              value={actualPoValue}
              disabled={disabled}
              onChange={(event) => setActualPoValue(Number(event.target.value || 0))}
            />
            {locked && <Lock className="size-3.5 text-slate-400" aria-label="Locked" />}
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            SAP Order No <span className="text-rose-500">*</span>
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
            <input
              type="text"
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:text-slate-500 dark:text-slate-100"
              placeholder="e.g. SAP-2024-10043"
              value={sapOrder}
              disabled={disabled}
              onChange={(event) => setSapOrder(event.target.value)}
            />
            {locked && <Lock className="size-3.5 text-slate-400" aria-label="Locked" />}
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Customer Order No <span className="text-rose-500">*</span>
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
            <input
              type="text"
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:text-slate-500 dark:text-slate-100"
              placeholder="Customer PO reference"
              value={customerOrderNo}
              disabled={disabled}
              onChange={(event) => setCustomerOrderNo(event.target.value)}
            />
            {locked && <Lock className="size-3.5 text-slate-400" aria-label="Locked" />}
          </div>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryStat label="Approved Amount" value={formatCurrency(deal.amount, currency)} />
        <SummaryStat label="Current Status" value={deal.status} tone="sky" />
        <SummaryStat
          label="Required Approvers"
          value={(deal.requiredApprovals || []).length || "—"}
        />
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        {canConfirm ? (
          <Button
            size="lg"
            className="min-w-[220px] gap-2"
            onClick={handleConfirm}
            disabled={busy || isBusy}
          >
            <CheckCircle2 className="size-4" />
            {busy || isBusy ? "Confirming…" : "Confirm Order"}
          </Button>
        ) : locked ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            <CheckCircle2 className="size-3.5" /> Order Confirmed
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            Awaiting completion of the approval chain before confirmation can be executed.
          </span>
        )}
      </div>
    </div>
  )
}

function SummaryStat({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "sky"
      ? "border-sky-100 bg-sky-50/60 text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200"
      : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold">{value ?? "—"}</p>
    </div>
  )
}

function ApproverActionPanel({
  laneKey,
  mode,
  comment,
  onChangeComment,
  error,
  busy,
  onApprove,
  onReject,
  onSaveAdvisory,
}) {
  const isDecide = mode === "decide"
  return (
    <div className="w-full max-w-2xl space-y-3 rounded-lg border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {isDecide
            ? `Approve or reject as ${roleDisplayName(laneKey)} (Required)`
            : `Leave advisory comment as ${roleDisplayName(laneKey)} (Optional)`}
        </p>
        <span
          className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
            isDecide ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isDecide ? "Required" : "Optional"}
        </span>
      </div>
      <label className="grid gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Your Comment <span className="text-rose-500">*</span>
        </span>
        <textarea
          rows={3}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={comment}
          onChange={(event) => onChangeComment(event.target.value)}
          placeholder={
            isDecide
              ? "Justify your decision (mandatory)…"
              : "Share advisory notes for the approval chain…"
          }
        />
      </label>
      {error ? (
        <p className="text-xs font-semibold text-rose-600">{error}</p>
      ) : null}
      {isDecide ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={onReject} disabled={busy}>
            {busy ? "Saving…" : "Reject"}
          </Button>
          <Button onClick={onApprove} disabled={busy}>
            {busy ? "Saving…" : "Approve"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <Button onClick={onSaveAdvisory} disabled={busy}>
            {busy ? "Saving…" : "Save Advisory Comment"}
          </Button>
        </div>
      )}
    </div>
  )
}

function ActedBanner({ laneKey, approval }) {
  if (!approval) return null
  const toneClass =
    approval.status === "Approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800"
  return (
    <div className={`w-full max-w-2xl rounded-lg border px-4 py-3 text-sm ${toneClass}`}>
      <p className="font-semibold">
        You already {approval.status === "Approved" ? "approved" : "rejected"} this deal as {roleDisplayName(laneKey)}.
      </p>
      <p className="mt-1 text-xs">
        {formatDateTime(approval.actionDateUtc)} — {approval.comments || "No comment on file."}
      </p>
    </div>
  )
}
