import { useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { createOrderGovernanceApi } from "./api"
import { APPROVAL_KEYS, DEAL_STATUS, DEFAULT_THRESHOLD_INR } from "./constants"
import {
  approverDealBuckets,
  buildEnrichPayload,
  getOgApproverLaneKeys,
  getOgRole,
  pickAdvisoryLaneForDeal,
  pickApproverLaneForDeal,
  reviewerCanEdit,
  roleDisplayName,
  salesCanEdit,
} from "./helpers"
import { SalesView } from "./components/SalesView"
import { ReviewerView } from "./components/ReviewerView"
import { ApproverView } from "./components/ApproverView"
import { CCManagerView } from "./components/CCManagerView"
import { DealDetailForm } from "./components/DealDetailForm"

// Header aliases per logical field. Precedence is left-to-right.
// Matching is performed in two passes: (1) exact normalized equality, then
// (2) multi-token subset equality (alias must have >=2 tokens). This avoids
// substring leakage like "name" matching "account name" or "am" matching "amount".
const HEADER_ALIASES = {
  opportunityNumber: ["opportunity number", "opp number", "oppty number", "opportunity id", "oppty id", "opportunity no"],
  accountName: ["account name", "customer name", "account"],
  opportunityName: ["opportunity name", "oppty name", "deal name"],
  amount: ["amount", "deal value", "opportunity value", "net value", "total amount"],
  currency: ["opportunity currency", "currency"],
  stage: ["opportunity stage", "stage"],
  opportunityOwner: ["opportunity owner", "account owner", "owner"],
  amName: ["am name", "am"],
  manager: ["manager", "account manager", "reporting manager"],
  geo: ["geo", "region", "geography"],
  deliveryType: ["delivery type", "delivery model", "delivery"],
  closeDate: ["close date", "expected close date", "expected close", "closing date"],
}

function normalizeHeader(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value) {
  return normalizeHeader(value).split(" ").filter(Boolean)
}

function toAmount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  const cleaned = String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildHeaderResolver(rowKeys) {
  const normalizedKeyMap = rowKeys.map((originalKey) => ({
    originalKey,
    normalizedKey: normalizeHeader(originalKey),
    tokens: tokenize(originalKey),
  }))

  return function resolve(aliases) {
    const normalizedAliases = aliases.map((alias) => ({
      normalized: normalizeHeader(alias),
      tokens: tokenize(alias),
    }))

    for (const { normalized } of normalizedAliases) {
      const exact = normalizedKeyMap.find((entry) => entry.normalizedKey === normalized)
      if (exact) return exact.originalKey
    }

    for (const { tokens } of normalizedAliases) {
      if (tokens.length < 2) continue
      const subset = normalizedKeyMap.find((entry) => tokens.every((token) => entry.tokens.includes(token)))
      if (subset) return subset.originalKey
    }

    return null
  }
}

function parseExcelToRows(workbook) {
  const rows = []
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" })
    data.forEach((row) => {
      const resolve = buildHeaderResolver(Object.keys(row || {}))
      const get = (field) => {
        const key = resolve(HEADER_ALIASES[field])
        return key === null ? "" : row[key]
      }
      const mappedRow = {
        opportunityNumber: String(get("opportunityNumber") || "").trim(),
        accountName: String(get("accountName") || "").trim(),
        opportunityName: String(get("opportunityName") || "").trim(),
        amount: toAmount(get("amount")),
        currency: String(get("currency") || "INR").trim() || "INR",
        stage: String(get("stage") || "").trim(),
        opportunityOwner: String(get("opportunityOwner") || "").trim(),
        amName: String(get("amName") || "").trim(),
        manager: String(get("manager") || "").trim(),
        geo: String(get("geo") || "").trim(),
        deliveryType: String(get("deliveryType") || "").trim(),
        closeDate: String(get("closeDate") || "").trim(),
      }
      if (mappedRow.opportunityName && mappedRow.opportunityNumber) {
        rows.push(mappedRow)
      }
    })
  })
  return rows
}

export function OrderGovernanceModule({
  token,
  permissions,
  apiBaseUrl,
  roles = [],
  subView = null,
  myTasksNav = null,
  onGoToMyTasks = null,
}) {
  const api = useMemo(() => createOrderGovernanceApi(apiBaseUrl, token), [apiBaseUrl, token])
  const [deals, setDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("queue")
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD_INR)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [requiredApprovals, setRequiredApprovals] = useState(APPROVAL_KEYS)
  const [reviewerComments, setReviewerComments] = useState("")

  const currentRole = useMemo(() => getOgRole(roles), [roles])
  const approverLaneKeys = useMemo(() => getOgApproverLaneKeys(roles), [roles])
  const approverLaneLabel = useMemo(() => {
    if (approverLaneKeys.length === 0) return ""
    if (approverLaneKeys.length === 1) return roleDisplayName(approverLaneKeys[0])
    return `${approverLaneKeys.length} lanes`
  }, [approverLaneKeys])
  // selectedDeal is the source of truth while a deal is open in the detail form.
  // We do NOT recompute it from `deals` on every render — that would clobber
  // in-progress field edits the moment a refetch happens.
  const selectedDealFull = selectedDeal

  const dealByOpportunityNumber = useMemo(() => {
    const map = new Map()
    deals.forEach((deal) => {
      const key = String(deal.opportunityNumber || "").trim().toLowerCase()
      if (key) map.set(key, deal)
    })
    return map
  }, [deals])

  async function loadDeals() {
    const data = await api.getDeals()
    setDeals(data)
    return data
  }

  useEffect(() => {
    loadDeals().catch((error) => setMessage(error.message))
  }, [api])

  function openDeal(deal) {
    // Always start the form from the freshest server snapshot we have.
    const fresh = deals.find((entry) => entry.id === deal.id) || deal
    setSelectedDeal(fresh)
    setRequiredApprovals(fresh.requiredApprovals?.length ? fresh.requiredApprovals : APPROVAL_KEYS)
    setReviewerComments("")
    setActiveTab("detail")
  }

  function closeDeal() {
    setSelectedDeal(null)
    setReviewerComments("")
    setActiveTab("queue")
  }

  function normalizeRowForValidation(row) {
    return {
      opportunityNumber: String(row.opportunityNumber || "").trim(),
      accountName: String(row.accountName || "").trim(),
      opportunityName: String(row.opportunityName || "").trim(),
      amount: toAmount(row.amount),
      currency: String(row.currency || "INR").trim().toUpperCase() || "INR",
      stage: String(row.stage || "").trim(),
      opportunityOwner: String(row.opportunityOwner || "").trim(),
      amName: String(row.amName || "").trim(),
      manager: String(row.manager || "").trim(),
      geo: String(row.geo || "").trim(),
      deliveryType: String(row.deliveryType || "").trim(),
      closeDate: String(row.closeDate || "").trim(),
    }
  }

  function compareRowWithExisting(nextRow, existingDeal) {
    if (!existingDeal) {
      return { substantiveChanges: [], allChanges: [] }
    }
    const substantive = []
    const allChanges = []
    const compare = (fieldKey, label, nextValue, oldValue, isSubstantive = false) => {
      const nextNorm = String(nextValue ?? "").trim()
      const oldNorm = String(oldValue ?? "").trim()
      if (nextNorm === oldNorm) return
      const entry = { fieldKey, label, oldValue: oldNorm || "—", newValue: nextNorm || "—", isSubstantive }
      allChanges.push(entry)
      if (isSubstantive) substantive.push(entry)
    }

    compare("accountName", "Account", nextRow.accountName, existingDeal.accountName, true)
    compare("opportunityName", "Opportunity", nextRow.opportunityName, existingDeal.opportunityName, true)
    compare("amount", "Amount", String(nextRow.amount), String(existingDeal.amount), true)
    compare("currency", "Currency", nextRow.currency, existingDeal.currency, true)
    compare("stage", "Stage", nextRow.stage, existingDeal.stage, true)
    compare("opportunityOwner", "Owner", nextRow.opportunityOwner, existingDeal.opportunityOwner, true)
    compare("closeDate", "Close Date", nextRow.closeDate, existingDeal.closeDate, true)
    compare("amName", "AM Name", nextRow.amName, existingDeal.amName, false)
    compare("manager", "Manager", nextRow.manager, existingDeal.manager, false)
    compare("geo", "Geo", nextRow.geo, existingDeal.geo, false)
    compare("deliveryType", "Delivery Type", nextRow.deliveryType, existingDeal.deliveryType, false)
    return { substantiveChanges: substantive, allChanges }
  }

  function validatePreviewRows(rows) {
    return rows.map((rawRow, index) => {
      const row = normalizeRowForValidation(rawRow)
      const errors = []
      if (!row.opportunityNumber) errors.push("Opportunity Number is required")
      if (!row.opportunityName) errors.push("Opportunity Name is required")
      if (!(Number.isFinite(row.amount) && row.amount >= 0)) errors.push("Amount must be a valid positive number")
      if (!row.currency) errors.push("Currency is required")

      const isClosedLost = row.stage.toLowerCase().includes("closed lost")
      const inr = ConvertToInrLocal(row.amount, row.currency)
      const belowThreshold = inr < threshold

      const existingDeal = dealByOpportunityNumber.get(row.opportunityNumber.toLowerCase()) || null
      const changes = compareRowWithExisting(row, existingDeal)

      const changedFields = Object.fromEntries(changes.allChanges.map((change) => [change.fieldKey, true]))

      return {
        id: `${row.opportunityNumber || "row"}-${index}`,
        rowNumber: index + 1,
        row,
        errors,
        selected: true,
        existingDealId: existingDeal?.id || null,
        existingVersion: existingDeal?.version || 0,
        belowThreshold,
        isClosedLost,
        changedFields,
        ...changes,
      }
    })
  }

  function ConvertToInrLocal(amount, currency) {
    const rates = { INR: 1, USD: 83, EUR: 90, GBP: 105 }
    return Number(amount || 0) * (rates[String(currency || "INR").toUpperCase()] || 1)
  }

  async function prepareUploadPreview(file) {
    setIsLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const rows = parseExcelToRows(workbook)
      if (rows.length === 0) {
        setMessage("No valid rows found in the Excel file. Please check header names (Opportunity / Amount / Stage / etc).")
        return
      }
      const previewRows = validatePreviewRows(rows)
      const filteredOutBelowThresholdCount = previewRows.filter((entry) => entry.belowThreshold).length
      const visibleRows = previewRows.filter((entry) => !entry.belowThreshold)
      if (visibleRows.length === 0) {
        setMessage("All rows are below the minimum deal value threshold. Increase/decrease the threshold and try again.")
        return
      }
      setUploadPreview({
        fileName: file.name,
        rows: visibleRows,
        filteredOutBelowThresholdCount,
      })
      setMessage(
        filteredOutBelowThresholdCount > 0
          ? `Preview generated. ${filteredOutBelowThresholdCount} row(s) were hidden because they are below the INR threshold.`
          : "Preview generated. Review, edit and confirm to persist.",
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  function togglePreviewRow(rowId, selected) {
    setUploadPreview((prev) => {
      if (!prev) return prev
      const nextRows = prev.rows.map((entry) => {
        if (entry.id !== rowId) return entry
        return { ...entry, selected }
      })
      return { ...prev, rows: nextRows }
    })
  }

  function toggleAllPreviewRows(selected) {
    setUploadPreview((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        rows: prev.rows.map((entry) => ({ ...entry, selected })),
      }
    })
  }

  function cancelUploadPreview() {
    setUploadPreview(null)
    setMessage("Upload canceled. No data was saved.")
  }

  async function confirmUploadPreview() {
    if (!uploadPreview) return
    const rowsToPersist = uploadPreview.rows
      .filter((entry) => entry.selected && entry.errors.length === 0 && !entry.isClosedLost && !entry.belowThreshold)
      .map((entry) => entry.row)

    if (rowsToPersist.length === 0) {
      setMessage("No valid rows to upload. Resolve validation errors or select another file.")
      return
    }

    setIsLoading(true)
    try {
      const result = await api.ingest({ thresholdInr: threshold, rows: rowsToPersist })
      setMessage(`Upload confirmed. Created: ${result.createdCount}, Total tracked: ${result.totalTracked}`)
      setUploadPreview(null)
      await loadDeals()
      return { ok: true, rows: rowsToPersist, createdCount: result.createdCount, totalTracked: result.totalTracked }
    } catch (error) {
      setMessage(error.message || "Upload failed.")
      return { ok: false }
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteDeal(dealId) {
    try {
      await api.deleteDeal(dealId)
      setMessage("Deal deleted.")
      await loadDeals()
    } catch (error) {
      setMessage(error.message || "Delete failed.")
    }
  }

  // TEMP: Test-data reset. Calls the Dev-only backend endpoint which wipes
  // OG deals + approvals + history + version-history inside a transaction.
  // Users / Roles / Permissions are intentionally untouched so the caller
  // stays logged in. Returns a result object so the confirmation dialog can
  // render an inline success/error banner instead of silently closing.
  // Remove with the endpoint before prod.
  async function resetTestData(confirmation) {
    setIsLoading(true)
    try {
      const result = await api.resetTestData(confirmation)
      const counts = result?.deletedCounts || {}
      setMessage(
        `Test data reset. Deleted ${counts.deals ?? 0} deal(s), ${counts.approvals ?? 0} approval(s), ${counts.history ?? 0} history and ${counts.versionHistory ?? 0} version-history row(s).`,
      )
      setSelectedDeal(null)
      setUploadPreview(null)
      await loadDeals()
      return { ok: true, counts }
    } catch (error) {
      const errorMessage = error?.message || "Reset failed."
      setMessage(errorMessage)
      return { ok: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  async function clearPendingDeals(dealIds) {
    if (!dealIds?.length) {
      setMessage("Nothing to clear.")
      return
    }
    try {
      await Promise.all(dealIds.map((dealId) => api.deleteDeal(dealId)))
      setMessage(`Deleted ${dealIds.length} deal(s).`)
      await loadDeals()
    } catch (error) {
      setMessage(error.message || "Some deals could not be deleted.")
      await loadDeals()
    }
  }

  async function submitForApproval() {
    if (!selectedDealFull) return
    if (!salesCanEdit(selectedDealFull)) {
      setMessage("Deal is not in Pending Input — cannot submit.")
      return
    }
    setIsSubmitting(true)
    try {
      await api.enrich(selectedDealFull.id, buildEnrichPayload(selectedDealFull))
      await api.submit(selectedDealFull.id)
      setMessage(`Deal ${selectedDealFull.opportunityNumber} submitted for approval.`)
      await loadDeals()
      closeDeal()
    } catch (error) {
      setMessage(error.message || "Submit failed.")
      await loadDeals()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function routeDeal(dealId) {
    setIsSubmitting(true)
    try {
      const dealForEnrich = selectedDealFull && selectedDealFull.id === dealId ? selectedDealFull : null
      const trimmedComments = (reviewerComments || "").trim() || "Routed by reviewer."

      // The reviewer-route endpoint accepts the bid/cost/payment payload inline,
      // so a single permission-correct call applies any inline corrections,
      // recalculates margins server-side, flips status to "In Approval", and
      // starts the clock on the selected approvers.
      const enrichmentPayload = dealForEnrich && reviewerCanEdit(dealForEnrich) ? buildEnrichPayload(dealForEnrich) : {}

      await api.route(dealId, {
        requiredApprovals,
        reviewerComments: trimmedComments,
        ...enrichmentPayload,
      })

      setMessage("Routing updated and approval started.")
      await loadDeals()
      closeDeal()
    } catch (error) {
      setMessage(error.message || "Routing failed.")
      await loadDeals()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function nudgeApprover(deal, roleKey) {
    const friendly = roleKey === "Sales" ? "Sales" : roleDisplayName(roleKey)
    setMessage(`Reminder sent to ${friendly} for ${deal.opportunityName || deal.opportunityNumber}.`)
  }

  async function returnToSales(dealId) {
    try {
      await api.returnToSales(dealId)
      setMessage("Returned to sales for correction.")
      await loadDeals()
      if (selectedDeal?.id === dealId) closeDeal()
    } catch (error) {
      setMessage(error.message || "Return failed.")
    }
  }

  async function approverDecision(dealId, roleKey, decision, comments) {
    const trimmed = (comments || "").trim()
    if (!trimmed) {
      setMessage("A comment is required before you can approve or reject.")
      return false
    }
    try {
      await api.decision(dealId, roleKey, { decision, comments: trimmed })
      setMessage(`${roleDisplayName(roleKey)} marked ${decision}.`)
      await loadDeals()
      return true
    } catch (error) {
      setMessage(error.message || "Decision failed.")
      return false
    }
  }

  async function approverAdvisoryComment(dealId, roleKey, comments) {
    const trimmed = (comments || "").trim()
    if (!trimmed) {
      setMessage("Please type a comment before saving.")
      return false
    }
    try {
      await api.advisoryComment(dealId, roleKey, { comments: trimmed })
      setMessage(`${roleDisplayName(roleKey)} advisory comment saved.`)
      await loadDeals()
      return true
    } catch (error) {
      setMessage(error.message || "Advisory comment failed.")
      return false
    }
  }

  async function ccConfirm(dealId, payload) {
    // Fallback mirrors the old behaviour if a caller forgets to supply a
    // payload — but the Final Action tab now always provides validated values.
    const resolved = payload && typeof payload === "object"
      ? payload
      : {
          actualPoValue: selectedDealFull?.amount || 0,
          sapOrder: "",
          customerOrderNo: "",
        }
    setIsSubmitting(true)
    try {
      await api.ccConfirm(dealId, resolved)
      setMessage(`Order confirmed. SAP ${resolved.sapOrder || ""} · Customer PO ${resolved.customerOrderNo || ""}.`.trim())
      await loadDeals()
      if (selectedDeal?.id === dealId) closeDeal()
    } catch (error) {
      setMessage(error.message || "CC confirm failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function uploadDealDocument(file) {
    if (!selectedDealFull) return
    try {
      await api.uploadDealDocument(selectedDealFull.id, file)
      setMessage(`Document "${file.name}" uploaded.`)
      const latestDeals = await loadDeals()
      const refreshed = latestDeals.find((entry) => entry.id === selectedDealFull.id)
      if (refreshed) setSelectedDeal(refreshed)
    } catch (error) {
      setMessage(error.message || "Document upload failed.")
    }
  }

  async function deleteDealDocument(documentId) {
    if (!selectedDealFull) return
    try {
      await api.deleteDealDocument(selectedDealFull.id, documentId)
      setMessage("Document deleted.")
      const latestDeals = await loadDeals()
      const refreshed = latestDeals.find((entry) => entry.id === selectedDealFull.id)
      if (refreshed) setSelectedDeal(refreshed)
    } catch (error) {
      setMessage(error.message || "Document delete failed.")
    }
  }

  async function downloadDealDocument(documentId, fileName) {
    if (!selectedDealFull) return
    try {
      await api.downloadDealDocument(selectedDealFull.id, documentId, fileName)
      setMessage(`Downloaded "${fileName}".`)
    } catch (error) {
      setMessage(error.message || "Document download failed.")
    }
  }

  async function viewDealDocument(documentId, fileName, contentType) {
    if (!selectedDealFull) return
    try {
      const blob = await api.viewDealDocument(selectedDealFull.id, documentId)
      const url = URL.createObjectURL(blob)
      return {
        url,
        fileName,
        contentType: contentType || blob.type || "application/octet-stream",
      }
    } catch (error) {
      setMessage(error.message || "Document view failed.")
      return null
    }
  }

  function updateLocalDeal(field, value) {
    if (!selectedDealFull) return
    setSelectedDeal({ ...selectedDealFull, [field]: value })
  }

  const dealsForRole = useMemo(() => {
    if (currentRole === "sales") return deals
    if (currentRole === "reviewer") return deals
    // Approver view derives its own tabbed buckets; pass the full list through.
    if (currentRole === "approver") return deals
    if (currentRole === "cc-manager") {
      // CC Managers only act on deals that successfully cleared the approval
      // chain (Completed) or were bypassed by an Admin (Level Skipped). The
      // dual-tab dashboard further splits these into My Action vs Archive.
      return deals.filter(
        (deal) =>
          deal.status === DEAL_STATUS.COMPLETED ||
          deal.status === DEAL_STATUS.LEVEL_SKIPPED,
      )
    }
    return deals
  }, [deals, currentRole])

  const approverBuckets = useMemo(
    () => (currentRole === "approver" ? approverDealBuckets(deals, approverLaneKeys) : null),
    [currentRole, deals, approverLaneKeys],
  )

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-sky-50/60 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Governance Module</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sales-led deal lifecycle: ingest, enrich, submit, and track approvals end-to-end.
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold uppercase dark:bg-slate-800">
          {currentRole === "approver" && approverLaneLabel ? `${currentRole} · ${approverLaneLabel}` : currentRole}
        </span>
      </div>

      {activeTab === "queue" && (
        <>
          {currentRole === "sales" && (
            <SalesView
              deals={dealsForRole}
              onOpenDeal={openDeal}
              subView={subView}
            />
          )}
          {currentRole === "reviewer" && (
            <ReviewerView
              deals={dealsForRole}
              allDeals={deals}
              threshold={threshold}
              setThreshold={setThreshold}
              isLoading={isLoading}
              uploadPreview={uploadPreview}
              onUpload={prepareUploadPreview}
              onTogglePreviewRow={togglePreviewRow}
              onToggleAllPreviewRows={toggleAllPreviewRows}
              onConfirmUpload={confirmUploadPreview}
              onCancelUpload={cancelUploadPreview}
              onDelete={deleteDeal}
              onClearPending={clearPendingDeals}
              onResetTestData={resetTestData}
              onOpenDeal={openDeal}
              onReturn={returnToSales}
              onNudge={nudgeApprover}
              subView={subView}
              myTasksNav={myTasksNav}
              onGoToMyTasks={onGoToMyTasks}
            />
          )}
          {currentRole === "approver" && (
            <ApproverView
              buckets={approverBuckets || { action: [], advisory: [], archive: [] }}
              laneLabel={approverLaneLabel}
              approverLaneKeys={approverLaneKeys}
              onOpenDeal={openDeal}
            />
          )}
          {currentRole === "cc-manager" && (
            <CCManagerView deals={dealsForRole} onOpenDeal={openDeal} />
          )}
        </>
      )}

      {activeTab === "detail" && selectedDealFull && (
        <DealDetailForm
          deal={selectedDealFull}
          currentRole={currentRole}
          approverLaneKeys={approverLaneKeys}
          requiredApprovals={requiredApprovals}
          setRequiredApprovals={setRequiredApprovals}
          reviewerComments={reviewerComments}
          setReviewerComments={setReviewerComments}
          updateLocalDeal={updateLocalDeal}
          onSubmitForApproval={submitForApproval}
          onRoute={() => routeDeal(selectedDealFull.id)}
          onReturn={() => returnToSales(selectedDealFull.id)}
          onApprove={async (comments) => {
            const lane = pickApproverLaneForDeal(selectedDealFull, approverLaneKeys)
            if (!lane) return false
            const ok = await approverDecision(selectedDealFull.id, lane, "approve", comments)
            if (ok) closeDeal()
            return ok
          }}
          onReject={async (comments) => {
            const lane = pickApproverLaneForDeal(selectedDealFull, approverLaneKeys)
            if (!lane) return false
            const ok = await approverDecision(selectedDealFull.id, lane, "reject", comments)
            if (ok) closeDeal()
            return ok
          }}
          onAdvisoryComment={async (comments) => {
            const lane = pickAdvisoryLaneForDeal(selectedDealFull, approverLaneKeys)
            if (!lane) return false
            return approverAdvisoryComment(selectedDealFull.id, lane, comments)
          }}
          onUploadDocument={uploadDealDocument}
          onDeleteDocument={deleteDealDocument}
          onViewDocument={viewDealDocument}
          onDownloadDocument={downloadDealDocument}
          onConfirm={(payload) => ccConfirm(selectedDealFull.id, payload)}
          onBack={closeDeal}
          permissions={permissions}
          isBusy={isSubmitting}
        />
      )}

      {message && (
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {message}
        </div>
      )}
    </section>
  )
}
