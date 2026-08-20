import { Role } from "./enums";

export type NavItem = { href: string; label: string };

export function navForRole(role: Role): NavItem[] {
  if (role === Role.CLIENT) {
    return [
      { href: "/dashboard", label: "Tableau de bord" },
      { href: "/dashboard/vehicules", label: "Mes véhicules" },
      { href: "/dashboard/rendez-vous", label: "Mes rendez-vous" },
      { href: "/dashboard/or", label: "Mes réparations" },
      { href: "/dashboard/factures", label: "Mes factures" },
      { href: "/dashboard/mes-enquetes", label: "Mes avis" },
      { href: "/dashboard/reclamations", label: "Réclamations" },
    ];
  }

  const common: NavItem[] = [{ href: "/dashboard", label: "Tableau de bord" }];

  switch (role) {
    case Role.CENTRE_APPEL:
      return [
        ...common,
        { href: "/dashboard/rendez-vous/nouveau", label: "Planifier un rendez-vous" },
        { href: "/dashboard/rendez-vous", label: "Rendez-vous" },
        { href: "/dashboard/clients", label: "Clients" },
        { href: "/dashboard/reclamations", label: "Réclamations" },
      ];
    case Role.RECEPTIONNAIRE:
      return [
        ...common,
        { href: "/dashboard/rendez-vous/nouveau", label: "Planifier un rendez-vous" },
        { href: "/dashboard/rendez-vous", label: "Rendez-vous" },
        { href: "/dashboard/or", label: "Ordres de réparation" },
        { href: "/dashboard/clients", label: "Clients" },
        { href: "/dashboard/reclamations", label: "Réclamations" },
      ];
    case Role.TECHNICIEN:
      return [
        ...common,
        // Le technicien doit voir les prestations attendues sur son atelier (§4.2 :
        // vue quotidienne consolidée par service), pas seulement les dossiers ouverts.
        { href: "/dashboard/rendez-vous", label: "Planning atelier" },
        { href: "/dashboard/or", label: "Mes interventions" },
      ];
    case Role.CHEF_ATELIER:
      return [
        ...common,
        { href: "/dashboard/or", label: "Ordres de réparation" },
        { href: "/dashboard/rendez-vous", label: "Planning atelier" },
        { href: "/dashboard/capacites", label: "Positions par service" },
      ];
    case Role.GESTIONNAIRE_PIECES:
      return [
        ...common,
        { href: "/dashboard/stock", label: "Stock pièces" },
        // Anticiper les pièces à sortir suppose de voir les prestations à venir.
        { href: "/dashboard/rendez-vous", label: "Planning atelier" },
        { href: "/dashboard/or", label: "Ordres de réparation" },
      ];
    case Role.PRICING:
      return [...common, { href: "/dashboard/or", label: "Devis à chiffrer" }];
    case Role.RESPONSABLE_SAV:
      return [
        ...common,
        { href: "/dashboard/kpis", label: "KPIs & pilotage" },
        { href: "/dashboard/or", label: "Ordres de réparation" },
        { href: "/dashboard/reclamations", label: "Réclamations" },
        { href: "/dashboard/satisfaction", label: "Satisfaction" },
        { href: "/dashboard/stock", label: "Stock pièces" },
        { href: "/dashboard/capacites", label: "Positions par service" },
      ];
    case Role.DIRECTION_GROUPE:
      return [
        ...common,
        { href: "/dashboard/kpis", label: "KPIs & pilotage" },
        { href: "/dashboard/sites", label: "Sites & marques" },
        { href: "/dashboard/reclamations", label: "Réclamations" },
        { href: "/dashboard/satisfaction", label: "Satisfaction" },
      ];
    case Role.ADMIN:
      return [
        ...common,
        { href: "/dashboard/kpis", label: "KPIs & pilotage" },
        { href: "/dashboard/or", label: "Ordres de réparation" },
        { href: "/dashboard/rendez-vous/nouveau", label: "Planifier un rendez-vous" },
        { href: "/dashboard/rendez-vous", label: "Rendez-vous" },
        { href: "/dashboard/clients", label: "Clients" },
        { href: "/dashboard/stock", label: "Stock pièces" },
        { href: "/dashboard/reclamations", label: "Réclamations" },
        { href: "/dashboard/satisfaction", label: "Satisfaction" },
        { href: "/dashboard/sites", label: "Sites & marques" },
        { href: "/dashboard/capacites", label: "Positions par service" },
        { href: "/dashboard/utilisateurs", label: "Utilisateurs" },
        { href: "/dashboard/catalogue", label: "Catalogue" },
      ];
    default:
      return common;
  }
}
