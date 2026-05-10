const BASE = '/api'

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// Dashboard
export const getDashboardStats = () => req('/dashboard/stats')
export const getRecentActivity = () => req('/dashboard/recent-activity')
export const getOrderTrend = () => req('/dashboard/order-trend')

// Products
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/products/${qs ? '?' + qs : ''}`)
}
export const getProduct = (id) => req(`/products/${id}`)
export const createProduct = (data) => req('/products/', { method: 'POST', body: JSON.stringify(data) })
export const updateProduct = (id, data) => req(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteProduct = (id) => req(`/products/${id}`, { method: 'DELETE' })
export const getCategories = () => req('/products/categories/list')

// Orders
export const getOrders = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/orders/${qs ? '?' + qs : ''}`)
}
export const getOrder = (id) => req(`/orders/${id}`)
export const createOrder = (data) => req('/orders/', { method: 'POST', body: JSON.stringify(data) })
export const updateOrderStatus = (id, status, notes) => {
  const qs = new URLSearchParams({ status, ...(notes ? { notes } : {}) }).toString()
  return req(`/orders/${id}/status?${qs}`, { method: 'PUT' })
}
export const cancelOrder = (id) => req(`/orders/${id}`, { method: 'DELETE' })
export const getOrderStats = () => req('/orders/stats/summary')

// Cargo
export const getAllCargo = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/cargo/${qs ? '?' + qs : ''}`)
}
export const getCargo = (tracking) => req(`/cargo/${tracking}`)
export const getCargoByOrder = (orderId) => req(`/cargo/order/${orderId}`)
export const getDelayedShipments = () => req('/cargo/delayed')
export const createCargo = (orderId, carrier, tracking) => {
  const qs = new URLSearchParams({ order_id: orderId, carrier, ...(tracking ? { tracking_number: tracking } : {}) }).toString()
  return req(`/cargo/?${qs}`, { method: 'POST' })
}
export const updateCargoStatus = (tracking, status, location, isDelayed, delayReason) => {
  const params = { status }
  if (location) params.location = location
  if (isDelayed) params.is_delayed = true
  if (delayReason) params.delay_reason = delayReason
  return req(`/cargo/${tracking}/status?${new URLSearchParams(params)}`, { method: 'PUT' })
}

// Inventory
export const getInventoryAlerts = () => req('/inventory/alerts')
export const getInventorySummary = () => req('/inventory/summary')
export const getTopSelling = (limit = 5) => req(`/inventory/top-selling?limit=${limit}`)
export const restockProduct = (id, qty) => req(`/inventory/restock/${id}?quantity=${qty}`, { method: 'POST' })

// AI Agent
export const chatWithAgent = (message, context) => req('/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ message, context })
})
export const getAIInsights = () => req('/ai/insights')

