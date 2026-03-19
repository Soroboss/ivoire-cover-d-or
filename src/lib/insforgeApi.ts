const DEFAULT_OSS_HOST = 'https://bzna2rx5.eu-central.insforge.app'
const OSS_HOST = (import.meta.env.VITE_INSFORGE_OSS_HOST as string | undefined) ?? DEFAULT_OSS_HOST

// Si la variable Vercel/Vite n’est pas injectée, on fallback sur la valeur du projet.
if (!import.meta.env.VITE_INSFORGE_OSS_HOST) {
  console.warn('VITE_INSFORGE_OSS_HOST manquant (fallback utilisé)')
}

export async function callInsforgeFunction<T = unknown>(
  slug: string,
  body?: unknown,
): Promise<T> {
  if (!OSS_HOST) throw new Error('VITE_INSFORGE_OSS_HOST manquant')

  const res = await fetch(`${OSS_HOST}/functions/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : JSON.stringify({}),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json as T
}

