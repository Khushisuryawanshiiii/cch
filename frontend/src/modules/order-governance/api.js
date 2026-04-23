export function createOrderGovernanceApi(apiBaseUrl, token) {
  async function request(path, options = {}) {
    const isFormData = options.body instanceof FormData
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    })
    if (!response.ok) {
      throw new Error((await response.text()) || "Request failed")
    }
    if (response.status === 204) return null
    return response.json()
  }

  async function downloadRequest(path) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      throw new Error((await response.text()) || "Request failed")
    }
    return response.blob()
  }

  return {
    getDeals: () => request("/api/order-governance/deals"),
    ingest: (payload) =>
      request("/api/order-governance/deals/ingest", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    submit: (dealId) => request(`/api/order-governance/deals/${dealId}/submit`, { method: "POST" }),
    deleteDeal: (dealId) => request(`/api/order-governance/deals/${dealId}`, { method: "DELETE" }),
    route: (dealId, payload) =>
      request(`/api/order-governance/deals/${dealId}/reviewer-route`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    returnToSales: (dealId) => request(`/api/order-governance/deals/${dealId}/return-to-sales`, { method: "POST" }),
    decision: (dealId, roleKey, payload) =>
      request(`/api/order-governance/deals/${dealId}/approvals/${roleKey}/decision`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    advisoryComment: (dealId, roleKey, payload) =>
      request(`/api/order-governance/deals/${dealId}/approvals/${roleKey}/advisory-comment`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getDealDocuments: (dealId) => request(`/api/order-governance/deals/${dealId}/documents`),
    uploadDealDocument: (dealId, file) => {
      const formData = new FormData()
      formData.append("file", file)
      return request(`/api/order-governance/deals/${dealId}/documents`, {
        method: "POST",
        body: formData,
      })
    },
    deleteDealDocument: (dealId, documentId) =>
      request(`/api/order-governance/deals/${dealId}/documents/${documentId}`, {
        method: "DELETE",
      }),
    viewDealDocument: async (dealId, documentId) => {
      return downloadRequest(`/api/order-governance/deals/${dealId}/documents/${documentId}/view`)
    },
    downloadDealDocument: async (dealId, documentId, fileName) => {
      const blob = await downloadRequest(`/api/order-governance/deals/${dealId}/documents/${documentId}/download`)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName || "document"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      return true
    },
    ccConfirm: (dealId, payload) =>
      request(`/api/order-governance/deals/${dealId}/cc-confirm`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    enrich: (dealId, payload) =>
      request(`/api/order-governance/deals/${dealId}/enrich`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    // TEMP: Dev-only reset for wiping OG transactional + audit data.
    // Backend returns 404 in non-Development environments. Remove alongside
    // the button + endpoint before any production release.
    resetTestData: (confirmation) =>
      request("/api/order-governance/admin/reset-test-data", {
        method: "POST",
        body: JSON.stringify({ confirmation }),
      }),
  }
}
