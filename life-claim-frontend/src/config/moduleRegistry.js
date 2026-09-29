/**
 * Module / feature registry (roadmap 1.3).
 *
 * Single source of truth mapping each feature MODULE to its nav entry and the
 * role(s) that may see/reach it. Both the sidebar (`AppLayout`) and the route
 * guards (`App.jsx`) are generated from this instead of hardcoded JSX arrays, so
 * a client can switch whole modules on or off with no code change.
 *
 * The on/off switch is `org_profile.ENABLED_MODULES` (migration 0003), served by
 * GET /api/org-profile and hydrated into `COMPANY.enabledModules`
 * (src/config/companyBrand.js). A module absent from that list is hidden from the
 * nav and its routes redirect. The default profile enables every module, so with
 * the shipped configuration behaviour is identical to before this registry.
 *
 * Access mapping is ROLE-based, mirroring the previous hardcoded values exactly —
 * `roles` drives nav visibility, `guardRoles` drives the route `requiredRole`
 * (they differ only for the superuser modules, matching the prior code).
 */
import {
  LayoutDashboard, Search, FileText, CheckSquare,
  Layers, ClipboardList, ScanSearch, BarChart3, ShieldCheck, Palette, SlidersHorizontal,
  Activity, ServerCog,
} from 'lucide-react'
import { SUPERUSER_LABEL, SUPERUSER_ROUTE_ROLES } from '../util/superuserRole'

// Nav module ids that a superuser-only user (no operational role) may see.
export const SUPERUSER_ONLY_NAV = ['superuser-overview', 'superuser-claims', 'audit-log', 'access-control', 'branding', 'form-fields', 'integration-health', 'it-admin']

/**
 * One entry per feature module. Fields mirror the former NAV_ITEMS verbatim:
 *   roles       — nav visibility (null = any authenticated operational user)
 *   guardRoles  — route requiredRole (defaults to roles; superuser modules use
 *                 SUPERUSER_ROUTE_ROLES exactly as the prior route guards did)
 *   operational — was gated by blockSuperUserOnly on its routes
 *   superuserNav— rendered in the superuser section of the nav
 */
export const MODULES = [
  { id: 'dashboard',          path: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard',                     roles: null,                    operational: true },
  { id: 'superuser-overview', path: '/superuser',             icon: BarChart3,       label: `${SUPERUSER_LABEL} Overview`,   roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
  { id: 'superuser-claims',   path: '/superuser/claim-search',icon: FileText,        label: 'Claim Assignment',              roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
  { id: 'policy',             path: '/policy-search',         icon: Search,          label: 'Policy Search',                 roles: ['Pre Assessor'],        operational: true },
  { id: 'claims',             path: '/claim-search',          icon: FileText,        label: 'Claim Search',                  roles: null,                    operational: true },
  { id: 'pool',               path: '/pool-selection',        icon: Layers,          label: 'Pool Selection',                roles: ['Assessor', 'Verifier'],operational: true },
  { id: 'tasks',              path: '/my-task',               icon: CheckSquare,     label: 'My Tasks',                      roles: ['Assessor', 'Verifier'],operational: true },
  { id: 'add',                path: '/add-screen',            icon: ScanSearch,      label: 'Advance Intelligence',          roles: ['Assessor', 'Verifier'],operational: true },
  { id: 'audit-log',          path: '/audit-log',             icon: ClipboardList,   label: 'Login Sessions',                roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
  { id: 'access-control',     path: '/superuser/access',      icon: ShieldCheck,     label: 'Access Control',                roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
  { id: 'branding',           path: '/superuser/branding',    icon: Palette,         label: 'Branding',                      roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
  { id: 'form-fields',        path: '/superuser/forms',       icon: SlidersHorizontal, label: 'Form Fields',                 roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
  { id: 'integration-health', path: '/superuser/health',      icon: Activity,        label: 'Integration Health',            roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
  { id: 'it-admin',           path: '/superuser/settings',    icon: ServerCog,       label: 'System Settings',               roles: ['superuser'], guardRoles: SUPERUSER_ROUTE_ROLES, superuserNav: true },
]

const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]))

/**
 * Every guarded app route → its module id. Used by the route guards to attach
 * module gating + the module's requiredRole. Routes NOT listed here (e.g.
 * /profile and the legacy redirects) are not module-gated.
 */
export const ROUTE_MODULE = {
  '/dashboard': 'dashboard',
  '/policy-search': 'policy',
  '/registration': 'policy',
  '/registration/:claimId': 'policy',
  '/claim-search': 'claims',
  '/claim-view/:claimId': 'claims',
  '/registration-fetch': 'claims',
  '/registration-fetch/:claimId': 'claims',
  '/pool-selection': 'pool',
  '/my-task': 'tasks',
  '/add-screen': 'add',
  '/add-case': 'add',
  '/case/:id': 'add',
  '/audit-log': 'audit-log',
  '/superuser': 'superuser-overview',
  '/superuser/workload': 'superuser-overview',
  '/superuser/claim-search': 'superuser-claims',
  '/superuser/access': 'access-control',
  '/superuser/branding': 'branding',
  '/superuser/forms': 'form-fields',
  '/superuser/health': 'integration-health',
  '/superuser/settings': 'it-admin',
}

// ---- runtime overlay from the DB (roadmap 1.5) -----------------------------
// The Access Control console persists per-module { enabled, allowedRoles } in
// the rbac_module table, served by GET /api/rbac/modules. hydrateModules() fills
// this map; when it's empty (unmigrated / not yet loaded) the built-in registry
// defaults + COMPANY.enabledModules apply — i.e. exactly the 1.3 behaviour.
const MODULE_CONFIG = new Map() // id -> { enabled: boolean, roles: string[]|null }

/** Overlay the DB module config (from GET /api/rbac/modules). Best-effort. */
export function hydrateModules(list) {
  if (!Array.isArray(list)) return false
  MODULE_CONFIG.clear()
  for (const m of list) {
    if (!m || !m.key) continue
    MODULE_CONFIG.set(m.key, {
      enabled: m.isEnabled !== false,
      roles: Array.isArray(m.allowedRoles) ? m.allowedRoles : null, // null = any operational
    })
  }
  return MODULE_CONFIG.size > 0
}

/** Effective nav roles for a module: DB override if present, else registry default. */
function effectiveRoles(id) {
  if (MODULE_CONFIG.has(id)) return MODULE_CONFIG.get(id).roles
  const m = MODULE_BY_ID[id]
  return m ? (m.roles || null) : null
}

/**
 * Is a module enabled for this deployment? An undefined/non-array list means the
 * org profile has not loaded (or is unset) — treat everything as enabled so the
 * app behaves exactly as before hydration (never hide the UI on a load miss).
 */
export function isModuleEnabled(id, enabledModules) {
  // DB module config (1.5) wins when loaded; else fall back to the org-profile
  // enabled list (1.3); else (nothing loaded) treat as enabled.
  if (MODULE_CONFIG.has(id)) return MODULE_CONFIG.get(id).enabled
  if (!Array.isArray(enabledModules)) return true
  return enabledModules.includes(id)
}

/**
 * Prop bundle a route guard spreads: `{ module, requiredRole?, blockSuperUserOnly? }`.
 * Reproduces the previous inline guard values exactly.
 */
export function moduleGuard(id) {
  const m = MODULE_BY_ID[id]
  if (!m) return { module: id }
  const guard = { module: id }
  // Superuser modules keep their static guardRoles; operational modules honor the
  // admin's DB role override (effectiveRoles) so route access tracks nav visibility.
  const roles = m.guardRoles || effectiveRoles(id)
  if (roles) guard.requiredRole = roles
  if (m.operational) guard.blockSuperUserOnly = true
  return guard
}

/**
 * The filtered nav list for the sidebar. Reproduces the former
 * AppLayout `visibleNav` logic and adds the enabled-module filter.
 *   hasRole       — from useAuth (accepts a string or array)
 *   superUserOnly — isSuperUserOnlyUser(user.roles, user.username)
 *   enabledModules— COMPANY.enabledModules
 */
export function visibleModules(hasRole, superUserOnly, enabledModules) {
  return MODULES.filter((n) => {
    if (!isModuleEnabled(n.id, enabledModules)) return false
    if (superUserOnly) return SUPERUSER_ONLY_NAV.includes(n.id)
    // superuser nav items: visible only with superuser access (hasRole('superuser')
    // resolves superuser realm role OR the superuser username, same as before).
    if (n.id === 'superuser-overview' || n.id === 'superuser-claims') return hasRole('superuser')
    const roles = effectiveRoles(n.id)
    if (roles && !roles.some((r) => hasRole(r))) return false
    return true
  })
}
