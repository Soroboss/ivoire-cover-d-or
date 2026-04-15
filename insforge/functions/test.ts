import { createClient } from 'npm:@insforge/sdk'

export default async function (req: Request): Promise<Response> {
  const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
  const anonKey = Deno.env.get('ANON_KEY') || ''
  const client = createClient({ baseUrl, anonKey })
  
  return new Response(JSON.stringify({ ok: true, hasClient: !!client }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
