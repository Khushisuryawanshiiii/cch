export const APPROVAL_KEYS = ["Finance", "Legal", "BusinessHead", "SCM", "ServiceDelivery", "PreSales"]

/** App role name → deal approval RoleKey + permission used on the decision API (must match backend). */
export const APPROVER_LANE_CONFIG = [
  { role: "order-governance.approver-finance", lane: "Finance", permission: "order-governance.deal.review_finance" },
  { role: "order-governance.approver-legal", lane: "Legal", permission: "order-governance.deal.review_legal" },
  { role: "order-governance.approver-business-head", lane: "BusinessHead", permission: "order-governance.deal.review_business_head" },
  { role: "order-governance.approver-scm", lane: "SCM", permission: "order-governance.deal.review_scm" },
  { role: "order-governance.approver-service-delivery", lane: "ServiceDelivery", permission: "order-governance.deal.review_service_delivery" },
  { role: "order-governance.approver-pre-sales", lane: "PreSales", permission: "order-governance.deal.review_pre_sales" },
]

export const STAGES = [
  "Stage 0 Not in Market",
  "Stage 1 Stimulated",
  "Stage 2 Problem Definition",
  "Stage 3 Evaluate Options",
  "Stage 4 Recommendation",
  "Stage 5 Final Approval",
  "Closed Won",
  "Closed Lost",
]

export const DEAL_STATUS = Object.freeze({
  PENDING_INPUT: "Pending Input",
  BELOW_THRESHOLD: "Below Threshold",
  PENDING_REVIEW: "Pending Review",
  IN_APPROVAL: "In Approval",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  LEVEL_SKIPPED: "Level Skipped",
})

export const TRACKABLE_STATUSES = [
  DEAL_STATUS.PENDING_REVIEW,
  DEAL_STATUS.IN_APPROVAL,
  DEAL_STATUS.COMPLETED,
  DEAL_STATUS.REJECTED,
  DEAL_STATUS.LEVEL_SKIPPED,
]

export const SALES_DELETABLE_STATUSES = [DEAL_STATUS.PENDING_INPUT, DEAL_STATUS.BELOW_THRESHOLD]

export const DETAIL_TABS = [
  { id: "sfdc", label: "SFDC Info", icon: "info" },
  { id: "financials", label: "Financials", icon: "calculator" },
  { id: "payment", label: "Payment Terms", icon: "credit-card" },
  { id: "documents", label: "Documents", icon: "paperclip" },
  { id: "approval", label: "Approval", icon: "shield" },
]

export const BID_FIELDS = [
  { key: "productValue", label: "Product Value" },
  { key: "serviceValue", label: "Service Value" },
  { key: "amcValue", label: "AMC Value" },
  { key: "othersValue", label: "Others" },
]

export const COST_FIELDS = [
  { key: "productCost", label: "Product Cost" },
  { key: "externalServiceCost", label: "Ext. Service" },
  { key: "internalCost", label: "Internal Cost" },
  { key: "othersCost", label: "Others Cost" },
]

export const SECTION_NAMES = ["SFDC Info", "Financials", "Payment Terms", "Documents", "Approval", "Final Action", "History"]

export const DEFAULT_THRESHOLD_INR = 10000
