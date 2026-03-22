/** Normalise un numéro pour comparaison (ex. 10 chiffres locaux → préfixe 225). */
export function normalizeTelephone(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) return '225' + cleaned;
  return cleaned;
}
