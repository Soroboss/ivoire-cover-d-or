const DEFAULT_HOST = 'https://bzna2rx5.eu-central.insforge.app'
const API_HOST = (import.meta.env.VITE_INSFORGE_OSS_HOST as string | undefined) ?? DEFAULT_HOST

export async function callBackendFunction<T = unknown>(
  slug: string,
  body?: unknown,
): Promise<T> {
  const payload = body !== undefined ? JSON.stringify(body) : JSON.stringify({});
  const directUrl = `https://bzna2rx5.functions.insforge.app/${slug}`;
  const ossUrl = `${API_HOST}/functions/${slug}`;

  try {
    let res = await fetch(directUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    if (!res.ok) {
      res = await fetch(ossUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || "Impossible de joindre le service.");
    }
    return json as T;
  } catch (err: any) {
    throw new Error(err.message || "Une erreur de communication est survenue.");
  }
}

