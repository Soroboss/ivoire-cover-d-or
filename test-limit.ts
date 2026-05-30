import { createClient } from 'npm:@insforge/sdk';

const client = createClient({
  baseUrl: Deno.env.get('INSFORGE_BASE_URL') || 'https://bzna2rx5.eu-central.insforge.app',
  anonKey: Deno.env.get('ANON_KEY') || '...',
});

async function run() {
  // We don't have the anon key.
}
run();
