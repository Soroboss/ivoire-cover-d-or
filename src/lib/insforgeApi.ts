import { localEdgeFunctions } from './localBackend';


export async function callBackendFunction<T = unknown>(
  slug: string,
  body?: unknown,
): Promise<T> {
  const payload = body !== undefined ? JSON.stringify(body) : JSON.stringify({});

  try {
    const fn = localEdgeFunctions[slug];
    if (!fn) {
      throw new Error(`Function not found locally: ${slug}`);
    }

    const req = new Request(`http://localhost/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });

    const res = await fn(req);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { error: text };
    }

    if (!res.ok) {
      throw new Error(json.error || "Impossible de joindre le service.");
    }
    return json as T;
  } catch (err: any) {
    throw new Error(err.message || "Une erreur de communication est survenue.");
  }
}

