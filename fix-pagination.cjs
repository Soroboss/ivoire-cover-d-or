const fs = require('fs');
const path = require('path');

const files = [
  'clients_list.ts',
  'couvaisons_list.ts',
  'transactions_list.ts',
  'client_financial_summary_list.ts',
  'depenses_list.ts',
  'salaire_agents_list.ts',
  'receipt_archives_list.ts',
  'client_messages_list.ts',
  'message_templates_list.ts'
];

for (const file of files) {
  const filepath = path.join('insforge/functions', file);
  if (!fs.existsSync(filepath)) continue;
  
  let content = fs.readFileSync(filepath, 'utf8');

  // Regex to match the single query definition, e.g.:
  // const { data, error } = await client.database.from('table').select('*').order('...', { ... })
  // We'll replace it with a pagination loop.
  
  const regex = /const\s+\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+client\.database\s*\.from\('([^']+)'\)\s*\.select\('\*'\)(.*?)\n/g;
  
  content = content.replace(regex, (match, table, orderClause) => {
    return `
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('${table}').select('*')${orderClause}.range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
`;
  });

  fs.writeFileSync(filepath, content);
  console.log('Fixed', filepath);
}
