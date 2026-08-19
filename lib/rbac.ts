import { Role } from "./enums";

export const STAFF_ROLES: Role[] = [
  Role.CENTRE_APPEL,
  Role.RECEPTIONNAIRE,
  Role.TECHNICIEN,
  Role.CHEF_ATELIER,
  Role.GESTIONNAIRE_PIECES,
  Role.PRICING,
  Role.RESPONSABLE_SAV,
  Role.DIRECTION_GROUPE,
  Role.ADMIN,
];

// Rôles avec visibilité sur tous les sites (pas de scoping siteId)
export const MULTI_SITE_ROLES: Role[] = [Role.DIRECTION_GROUPE, Role.ADMIN, Role.CENTRE_APPEL];

export const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Client",
  CENTRE_APPEL: "Centre d'appel",
  RECEPTIONNAIRE: "Conseiller / réceptionnaire",
  TECHNICIEN: "Technicien",
  CHEF_ATELIER: "Chef d'atelier",
  GESTIONNAIRE_PIECES: "Gestionnaire pièces",
  PRICING: "Pricing / chiffrage",
  RESPONSABLE_SAV: "Responsable SAV",
  DIRECTION_GROUPE: "Direction groupe",
  ADMIN: "Administrateur",
};

export function isStaff(role: Role) {
  return STAFF_ROLES.includes(role);
}

export function canSeeAllSites(role: Role) {
  return MULTI_SITE_ROLES.includes(role);
}

export function hasAnyRole(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}

export function defaultRouteForRole(role: Role) {
  if (role === Role.CLIENT) return "/dashboard";
  return "/dashboard";
}
