const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function backendFetch(path: string, token?: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BACKEND}${path}`, { ...options, headers })
  return res.json()
}

export const api = {
  auth: {
    me: (token: string) => backendFetch('/auth/me', token),
  },
  coins: {
    balance: (token: string) => backendFetch('/coins/balance', token),
    packages: () => backendFetch('/coins/packages'),
    deduct: (token: string, body: object) => backendFetch('/coins/deduct', token, { method: 'POST', body: JSON.stringify(body) }),
    createPurchase: (token: string, body: object) => backendFetch('/coins/purchase', token, { method: 'POST', body: JSON.stringify(body) }),
    confirmPurchase: (token: string, body: object) => backendFetch('/coins/confirm', token, { method: 'POST', body: JSON.stringify(body) }),
    history: (token: string) => backendFetch('/coins/history', token),
  },
  keys: {
    list: (token: string) => backendFetch('/keys/list', token),
    create: (token: string, body: object) => backendFetch('/keys/create', token, { method: 'POST', body: JSON.stringify(body) }),
    revoke: (token: string, body: object) => backendFetch('/keys/revoke', token, { method: 'POST', body: JSON.stringify(body) }),
  },
  admin: {
    stats: (token: string) => backendFetch('/admin/stats', token),
    users: (token: string, page = 1, search = '') => backendFetch(`/admin/users?page=${page}&search=${search}`, token),
    manageUser: (token: string, body: object) => backendFetch('/admin/user', token, { method: 'POST', body: JSON.stringify(body) }),
    transactions: (token: string) => backendFetch('/admin/transactions', token),
    godOverview: (token: string) => backendFetch('/admin/god-overview', token),
    godAdmins: (token: string) => backendFetch('/admin/god-admins', token),
  },
}
