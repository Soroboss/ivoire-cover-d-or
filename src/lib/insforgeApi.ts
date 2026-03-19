const OSS_HOST = import.meta.env.VITE_INSFORGE_OSS_HOST as string | undefined

if (!OSS_HOST) {
  // Le message n'est affiché qu'au runtime.
  // Si tu vois cette erreur, ajoute `VITE_INSFORGE_OSS_HOST` dans `.env.local` puis redémarre le dev server.
  console.warn('VITE_INSFORGE_OSS_HOST manquant')
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

