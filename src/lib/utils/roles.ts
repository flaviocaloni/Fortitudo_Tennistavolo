/**
 * Role utility functions
 */

export type UserRole = "superadmin" | "admin" | "agonista" | "amatore";

export function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(role: string | undefined): boolean {
  return role === "superadmin";
}

export function isAgonista(role: string | undefined): boolean {
  return role === "agonista";
}
