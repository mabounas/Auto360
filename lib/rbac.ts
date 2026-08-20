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

// Le périmètre de visibilité ne dépend plus du rôle mais de l'affectation du
// collaborateur (site, enseigne, ou global) — voir `lib/portee.ts`.

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

export function hasAnyRole(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}

// Seuls ces profils pilotent un réseau entier et peuvent donc exister sans être
// rattachés à un centre de service. Tout le personnel opérationnel appartient à
// un centre précis : c'est lui qui détermine les dossiers qu'il peut traiter.
export const ROLES_SANS_CENTRE: Role[] = [Role.DIRECTION_GROUPE, Role.ADMIN];

export function exigeUnCentre(role: Role) {
  return !ROLES_SANS_CENTRE.includes(role);
}
