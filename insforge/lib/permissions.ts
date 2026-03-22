/* Partagé par les edge functions — aligné sur src/lib/permissions.ts */

export const ALL_PERMISSION_IDS = [
  'dashboard',
  'couvaisons',
  'clients',
  'machines',
  'analyses',
  'finances',
  'factures',
  'historique',
  'administration',
] as const

export type PermissionId = (typeof ALL_PERMISSION_IDS)[number]

export function normalizeRole(raw: string | null | undefined, isProjectAdmin?: boolean): string {
  if (isProjectAdmin) return 'Admin'
  const r = (raw ?? '').trim().toLowerCase()
  if (['admin', 'administrateur', 'administrator', 'superadmin'].includes(r)) return 'Admin'
  if (['technicien', 'tech', 'technician'].includes(r)) return 'Technicien'
  if (['réception/caisse', 'reception/caisse', 'reception', 'caisse', 'réception'].includes(r)) return 'Réception/Caisse'
  return 'Technicien'
}

function defaultPermissionsForRole(role: string): PermissionId[] {
  const all = [...ALL_PERMISSION_IDS]
  if (role === 'Admin') return all
  if (role === 'Technicien') return ['couvaisons', 'clients', 'machines', 'analyses']
  if (role === 'Réception/Caisse') return ['dashboard', 'couvaisons', 'clients', 'factures']
  return ['couvaisons']
}

function sanitizePermissions(arr: unknown): PermissionId[] {
  if (!Array.isArray(arr)) return []
  const valid = new Set<string>(ALL_PERMISSION_IDS)
  return arr.filter((x): x is PermissionId => typeof x === 'string' && valid.has(x))
}

export function resolvePermissions(
  role: string,
  fromProfile: string[] | undefined | null,
  isProjectAdmin?: boolean,
): PermissionId[] {
  if (isProjectAdmin || role === 'Admin') return [...ALL_PERMISSION_IDS]
  const custom = sanitizePermissions(fromProfile)
  if (custom.length > 0) return custom
  return defaultPermissionsForRole(role)
}
