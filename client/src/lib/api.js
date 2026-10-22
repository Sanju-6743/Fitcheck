export async function api(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }
  return data
}

export const get = (path, signal) => api(path, { signal })
export const post = (path, body) => api(path, { method: 'POST', body })
export const put = (path, body) => api(path, { method: 'PUT', body })
export const patch = (path, body) => api(path, { method: 'PATCH', body })
export const del = (path) => api(path, { method: 'DELETE' })
