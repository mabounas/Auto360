# Auto360 — CRM & Service Après-Vente Automobile

Solution web de gestion de la relation client et du service après-vente pour un groupe de
concessions multi-marques / multi-sites au Maroc, développée à partir du
[cahier des charges](CPS/Cahier_des_Charges_CRM_SAV_Automobile.docx) fourni.

Le produit couvre le parcours SAV complet : prise de rendez-vous → réception atelier →
diagnostic → chiffrage → devis validé par le client → réparation → contrôle qualité →
restitution → facturation → enquête de satisfaction.

**Démonstration en ligne : https://auto360-kohl.vercel.app**

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS v4** avec une palette de marque inspirée de l'identité bleue d'Auto Hall
- **Prisma 7** + **PostgreSQL** (pattern driver-adapter `@prisma/adapter-pg`, compatible pooling serverless)
- Authentification maison par **JWT** (`jose`) en cookie httpOnly — pas de dépendance NextAuth
- Déploiement **Vercel** (serverless)

## Démarrage

```bash
npm install
```

Créez un `.env` à partir de `.env.example` :

```
DATABASE_URL=postgres://…
SHADOW_DATABASE_URL=postgres://…
AUTH_SECRET=<valeur aléatoire forte>
```

Pour une base locale jetable, `npx prisma dev --name auto360 --detach` démarre un Postgres
local et affiche les URLs à recopier.

```bash
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Comptes de démonstration

Mot de passe commun : `Passw0rd!`

| Email | Profil |
| --- | --- |
| `client@auto360.ma` | Client particulier (1 véhicule) |
| `admin@auto360.ma` | Administrateur |
| `direction@auto360.ma` | Direction groupe (multi-sites) |
| `centreappel@auto360.ma` | Centre d'appel |
| `sav.casa@auto360.ma` | Responsable SAV — Casablanca |
| `accueil.casa@auto360.ma` | Conseiller / réceptionnaire — Casablanca |
| `chefatelier.casa@auto360.ma` | Chef d'atelier — Casablanca |
| `technicien.casa@auto360.ma` | Technicien — Casablanca |
| `pieces.casa@auto360.ma` | Gestionnaire pièces — Casablanca |
| `pricing.casa@auto360.ma` | Pricing / chiffrage — Casablanca |

## Périmètre couvert

Référence entre parenthèses : section du cahier des charges.

- **CRM 360° client & véhicule** (§4.1) — fiche client unique, parc véhicules, VIN /
  immatriculation / kilométrage, segmentation, consentement loi 09-08, recherche staff par
  nom ou immatriculation.
- **Prise de rendez-vous multicanal** (§4.2) — parcours guidé véhicule → service → centre →
  créneau. **La disponibilité est calculée indépendamment par option de service** : chaque
  couple site × service a sa propre configuration de capacité et de durée de créneau, donc
  son propre calendrier. Bascule automatique en liste d'attente si le créneau est pris entre
  l'affichage et la confirmation.
- **Diagnostic** (§4.2bis) — service à part entière avec ses propres créneaux ; rapport
  multi-points (moteur, freinage, direction, niveaux, pneumatiques, électrique), anomalies et
  liste des pièces à remplacer, transmis au pricing **sans ressaisie**.
- **Ordres de réparation & devis** (§4.3) — qualification du motif de visite à l'accueil avec
  **routage automatique vers l'équipe compétente** (révision / mécanique générale /
  carrosserie), état des lieux, numérotation séquentielle par site (`OR-CASA01-000001`),
  chiffrage par l'équipe pricing (main d'œuvre, pièces du catalogue, forfaits), publication au
  portail client, **validation à distance valant signature électronique**, fil d'avancement
  visible par le client.
- **Pièces détachées & stock** (§4.4) — réservation automatique des pièces à la publication du
  devis, décrément du stock à la clôture, seuils d'alerte, vue multi-sites.
- **Facturation & paiement** (§4.5) — facture générée automatiquement à la clôture de l'OR,
  encaissement en ligne (carte / mobile) côté client ou sur place côté agence.
- **Carrosserie & sinistres** (§4.6bis) — circuit dédié, rattachement à une compagnie
  d'assurance et suivi du statut d'expertise.
- **Satisfaction & fidélisation** (§4.7) — enquête NPS/CSAT déclenchée automatiquement à la
  restitution, points de fidélité, détection des scores faibles pour SAV de récupération.
- **Réclamations** (§4.9) — création côté client ou centre d'appel, SLA de 48 h, suivi de
  statut et assignation.
- **Portail client** (§4.10) — véhicules, rendez-vous, réparations en temps réel, devis,
  factures, avis.
- **Application atelier** (§4.11) — saisie du temps passé et des observations techniques par
  intervention.
- **Reporting & pilotage** (§4.12, §7) — CA SAV, panier moyen, délai moyen d'intervention,
  taux de conversion devis, taux de rétention, NPS, comparatif inter-sites.
- **Multi-compagnies / multi-site / multi-marque** (§4.13) — la plateforme héberge
  plusieurs enseignes, chacune avec son réseau, ses marques et ses équipes. Une
  démonstration commerciale peut donc se faire sur le réseau réel du prospect.
- **Localisateur d'ateliers** (§4.14) — page publique `/centres` : recherche par enseigne,
  par ville ou par marque, et tri par **distance réelle** depuis la position du navigateur
  (formule de haversine), avec lien d'itinéraire. Le tunnel de réservation ne propose que
  les centres distribuant la marque du véhicule et sait les classer par proximité.
- **Forfaits à prix fixe** (§4.15) — forfaits Best-Cost par segment d'âge du véhicule et
  forfaits carrosserie.
- **RBAC** (§5.2) — 10 profils ; les rôles rattachés à un site ne voient que leur périmètre,
  direction / admin / centre d'appel ont la vision consolidée.

### Volontairement hors du présent périmètre

Ces points du cahier des charges nécessitent des contrats ou services tiers et ne sont pas
implémentés : interface bidirectionnelle temps réel avec le DMS constructeur (§4.16), envoi
réel SMS / e-mail / WhatsApp (§4.8), passerelle de paiement en ligne réelle (le règlement est
enregistré sans transaction bancaire), signature électronique certifiée, application mobile
native, interface arabe (§5.5), campagnes de rappel constructeur automatisées (§4.6 — le
modèle de données existe, l'écran d'administration reste à faire).

## Structure

```
app/
  page.tsx              page d'accueil publique
  login/ register/      authentification
  dashboard/            application (layout et navigation dépendants du rôle)
    or/[id]/            écran central du dossier atelier
  api/                  auth, disponibilités, rendez-vous
lib/
  availability.ts       calcul des créneaux par site × service
  rbac.ts               rôles et périmètres de visibilité
  numbering.ts          numérotation séquentielle par site
prisma/
  schema.prisma         modèle de données
  seed.ts               jeu de démonstration
```
