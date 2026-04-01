const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function evaluatePassword(password, signal) {
  const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    signal,
  })

  if (!response.ok) {
    throw new Error('Bridge request failed')
  }

  return response.json()
}
