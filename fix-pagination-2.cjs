const fs = require('fs');
const path = require('path');

// Fix machines_list.ts
let m = fs.readFileSync('insforge/functions/machines_list.ts', 'utf8');
m = m.replace(/const\s+\{\s*data:\s*machinesRows,\s*error:\s*machinesErr\s*\}\s*=\s*await\s+client\.database\s*\.from\('machines'\)\s*\.select\('\*'\)\s*\.order\('created_at',\s*\{\s*ascending:\s*true\s*\}\)/, `
    let machinesRows: any[] = [];
    let machinesErr: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('machines').select('*').order('created_at', { ascending: true }).range(from, from + step - 1);
      if (res.error) { machinesErr = res.error; break; }
      if (res.data) machinesRows = machinesRows.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
`);
m = m.replace(/const\s+\{\s*data:\s*casiersRows,\s*error:\s*casiersErr\s*\}\s*=\s*machineIds\.length\s*\?\s*await\s+client\.database\.from\('casiers'\)\.select\('\*'\)\.in\('machine_id',\s*machineIds\)\s*:\s*\(\{\s*data:\s*\[\],\s*error:\s*null\s*\}\s*as\s*any\)/, `
    let casiersRows: any[] = [];
    let casiersErr: any = null;
    if (machineIds.length) {
      let from2 = 0;
      while(true) {
         const res = await client.database.from('casiers').select('*').in('machine_id', machineIds).range(from2, from2 + step - 1);
         if (res.error) { casiersErr = res.error; break; }
         if (res.data) casiersRows = casiersRows.concat(res.data);
         if (!res.data || res.data.length < step) break;
         from2 += step;
      }
    }
`);
fs.writeFileSync('insforge/functions/machines_list.ts', m);

// Fix message_templates_list.ts
let t = fs.readFileSync('insforge/functions/message_templates_list.ts', 'utf8');
t = t.replace(/const\s+\{\s*data:\s*templates,\s*error\s*\}\s*=\s*await\s+client\.database\s*\.from\('message_templates'\)\s*\.select\('\*'\)\s*\.order\('created_at',\s*\{\s*ascending:\s*false\s*\}\)/, `
    let templates: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('message_templates').select('*').order('created_at', { ascending: false }).range(from, from + step - 1);
      if (res.error) { error = res.error; break; }
      if (res.data) templates = templates.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
`);
fs.writeFileSync('insforge/functions/message_templates_list.ts', t);

// Fix client_messages_list.ts
let cm = fs.readFileSync('insforge/functions/client_messages_list.ts', 'utf8');
cm = cm.replace(/let\s+query\s*=\s*client\.database\.from\('client_messages'\)\.select\('\*'\)\.order\('sent_at',\s*\{\s*ascending:\s*false\s*\}\)[\s\S]*?const\s+\{\s*data,\s*error\s*\}\s*=\s*await\s+query/, `
    let baseQuery = client.database.from('client_messages').select('*').order('sent_at', { ascending: false });
    if (clientId) baseQuery = baseQuery.eq('client_id', clientId);
    if (couvaisonId) baseQuery = baseQuery.eq('couvaison_id', couvaisonId);

    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await baseQuery.range(from, from + step - 1);
      if (res.error) { error = res.error; break; }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
`);
fs.writeFileSync('insforge/functions/client_messages_list.ts', cm);

// Fix users_list.ts
let u = fs.readFileSync('insforge/functions/users_list.ts', 'utf8');
u = u.replace(/const\s+\{\s*data,\s*error\s*\}\s*=\s*await\s+client\.database\s*\.from\('users'\)\s*\.select\('id,\s*nom,\s*username,\s*telephone,\s*role,\s*actif,\s*password_hash,\s*profile,\s*is_project_admin'\)\s*\.order\('created_at',\s*\{\s*ascending:\s*true\s*\}\)/, `
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('users').select('id, nom, username, telephone, role, actif, password_hash, profile, is_project_admin').order('created_at', { ascending: true }).range(from, from + step - 1);
      if (res.error) { error = res.error; break; }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
`);
fs.writeFileSync('insforge/functions/users_list.ts', u);
