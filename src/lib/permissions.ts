import type { PermissionKey, Role, User } from '../types';

export const PERMISSION_CATALOG: { id: PermissionKey; label: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'couvaisons', label: 'Couvaisons' },
  { id: 'clients', label: 'Clients & historique' },
  { id: 'machines', label: 'Parc machines' },
  { id: 'analyses', label: 'Expertise & conseils' },
  { id: 'finances', label: 'Finances' },
  { id: 'factures', label: 'Factures' },
  { id: 'historique', label: 'Historique' },
  { id: 'administration', label: 'Administration (comptes)' },
];

const ALL_KEYS: PermissionKey[] = PERMISSION_CATALOG.map((p) => p.id);

export function normalizeRole(raw: string | null | undefined, isProjectAdmin?: boolean): Role {
  if (isProjectAdmin) return 'Admin';
  const r = (raw ?? '').trim().toLowerCase();
  if (['admin', 'administrateur', 'administrator', 'superadmin'].includes(r)) return 'Admin';
  if (['technicien', 'tech', 'technician'].includes(r)) return 'Technicien';
  if (['réception/caisse', 'reception/caisse', 'reception', 'caisse', 'réception'].includes(r)) return 'Réception/Caisse';
  if (['finance', 'financier', 'finances'].includes(r)) return 'Finance';
  if (['comptable', 'compta', 'accounting', 'accountant'].includes(r)) return 'Comptable';
  if (['logistique', 'logistic', 'logistics', 'magasinier'].includes(r)) return 'Logistique';
  return 'Technicien';
}

export function defaultPermissionsForRole(role: Role): PermissionKey[] {
  switch (role) {
    case 'Admin':
      return [...ALL_KEYS];
    case 'Technicien':
      return ['couvaisons', 'clients', 'machines', 'analyses'];
    case 'Réception/Caisse':
      return ['dashboard', 'couvaisons', 'clients', 'finances', 'factures', 'historique'];
    case 'Finance':
      return ['dashboard', 'finances', 'factures', 'historique'];
    case 'Comptable':
      return ['dashboard', 'finances', 'factures', 'analyses', 'historique'];
    case 'Logistique':
      return ['couvaisons', 'clients', 'machines'];
    default:
      return ['couvaisons'];
  }
}

function sanitizePermissions(arr: unknown): PermissionKey[] {
  if (!Array.isArray(arr)) return [];
  const valid = new Set(ALL_KEYS);
  return arr.filter((x): x is PermissionKey => typeof x === 'string' && valid.has(x as PermissionKey));
}

export function resolvePermissions(
  role: Role,
  fromProfile: string[] | undefined | null,
  isProjectAdmin?: boolean,
): PermissionKey[] {
  if (isProjectAdmin || role === 'Admin') return [...ALL_KEYS];
  const custom = sanitizePermissions(fromProfile);
  if (custom.length > 0) return custom;
  return defaultPermissionsForRole(role);
}

export function hasPermission(user: User | null, key: PermissionKey): boolean {
  if (!user?.actif) return false;
  const perms = user.permissions ?? resolvePermissions(user.role, undefined, user.isProjectAdmin);
  return perms.includes(key);
}

/** Mappe une réponse API (login / users_list) vers User */
export function enrichUserFromApi(raw: {
  id: string;
  nom: string;
  username: string;
  telephone?: string;
  passwordHash?: string;
  role?: string;
  actif?: boolean;
  permissions?: string[];
  profile?: { permissions?: string[] } | null;
  isProjectAdmin?: boolean;
}): User {
  const isProjectAdmin = Boolean(raw.isProjectAdmin);
  const role = normalizeRole(raw.role, isProjectAdmin);
  const fromProfile = raw.permissions ?? raw.profile?.permissions;
  const permissions = resolvePermissions(role, fromProfile, isProjectAdmin);

  return {
    id: raw.id,
    nom: raw.nom,
    username: raw.username,
    telephone: raw.telephone,
    passwordHash: raw.passwordHash ?? '',
    role,
    actif: raw.actif ?? true,
    permissions,
    isProjectAdmin,
  };
}
