import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role, StatutOR, StatutDevis } from "@/app/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatMAD, oneOf } from "@/lib/utils";
import { DiagnosticForm } from "./diagnostic-form";
import { DevisEditor } from "./devis-editor";
import { ValidationDevisClient } from "./validation-devis-client";
import { InterventionForm } from "./intervention-form";
import { WorkflowActions } from "./workflow-actions";
import { PhotosEtatDesLieux } from "./photos-etat-des-lieux";

const ETAPES: { statut: StatutOR; label: string }[] = [
  { statut: StatutOR.ACCUEIL, label: "Accueil" },
  { statut: StatutOR.DIAGNOSTIC_EN_COURS, label: "Diagnostic" },
  { statut: StatutOR.DEVIS_EN_ATTENTE, label: "Chiffrage" },
  { statut: StatutOR.DEVIS_VALIDE, label: "Devis validé" },
  { statut: StatutOR.EN_REPARATION, label: "Réparation" },
  { statut: StatutOR.PRET_RESTITUTION, label: "Prêt" },
  { statut: StatutOR.CLOTURE, label: "Clôturé" },
];

export default async function OrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const or = await prisma.ordreReparation.findUnique({
    where: { id },
    include: {
      client: { include: { user: true } },
      vehicule: { include: { marque: true } },
      site: true,
      diagnostic: { include: { technicien: true } },
      devis: { include: { lignes: { include: { piece: true, forfait: true } }, creePar: true } },
      facture: true,
      lignesIntervention: { include: { technicien: true }, orderBy: { createdAt: "asc" } },
      reservationsPieces: { include: { piece: true } },
    },
  });

  if (!or) notFound();

  const [pieces, forfaits] = await Promise.all([
    prisma.piece.findMany({ orderBy: { designation: "asc" } }),
    prisma.forfait.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);

  // Cloisonnement : le client ne voit que ses dossiers ; le collaborateur, uniquement
  // ceux de son périmètre (son site, ou son enseigne s'il n'est pas rattaché à un site).
  if (session.role === Role.CLIENT) {
    if (or.client.userId !== session.userId) notFound();
  } else {
    if (session.siteId && or.siteId !== session.siteId) notFound();
    if (session.compagnieId && or.site.compagnieId !== session.compagnieId) notFound();
  }

  const etapeCourante = ETAPES.findIndex((e) => e.statut === or.statut);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{or.numero}</h1>
          <p className="text-sm text-muted">
            {or.vehicule.marque.nom} {or.vehicule.modele} — {or.vehicule.immatriculation} · {or.site.nom}
          </p>
        </div>
        <Badge variant="accent">{or.statut.replaceAll("_", " ")}</Badge>
      </div>

      {/* Fil d'avancement visible par le client (§4.3) */}
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          {ETAPES.map((e, i) => (
            <span
              key={e.statut}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i <= etapeCourante && etapeCourante >= 0
                  ? "bg-primary-700 text-white"
                  : "bg-black/5 text-muted"
              }`}
            >
              {e.label}
            </span>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Diagnostic */}
          <Card>
            <CardHeader>
              <CardTitle>Rapport de diagnostic</CardTitle>
            </CardHeader>
            <CardContent>
              {or.diagnostic ? (
                <div className="space-y-2 text-sm">
                  <p className="text-xs text-muted">
                    Réalisé par {or.diagnostic.technicien.prenom} {or.diagnostic.technicien.nom} le{" "}
                    {formatDate(or.diagnostic.dateRealisation)}
                  </p>
                  {or.diagnostic.mesures != null && (
                    <div className="grid gap-1 sm:grid-cols-2">
                      {Object.entries(or.diagnostic.mesures as Record<string, string>)
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <p key={k}>
                            <span className="text-muted capitalize">{k} :</span> {v}
                          </p>
                        ))}
                    </div>
                  )}
                  {or.diagnostic.anomaliesConstatees && (
                    <p>
                      <span className="text-muted">Anomalies :</span> {or.diagnostic.anomaliesConstatees}
                    </p>
                  )}
                  {or.diagnostic.piecesARemplacer && (
                    <p>
                      <span className="text-muted">Pièces à remplacer :</span> {or.diagnostic.piecesARemplacer}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">Aucun diagnostic enregistré pour ce dossier.</p>
              )}

              {oneOf(session.role, Role.TECHNICIEN, Role.CHEF_ATELIER, Role.ADMIN) && (
                <div className="mt-4 border-t border-border pt-4">
                  <DiagnosticForm ordreReparationId={or.id} existing={or.diagnostic} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Devis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Devis</CardTitle>
              {or.devis && <Badge variant={or.devis.statut === "VALIDE" ? "success" : "warning"}>{or.devis.statut}</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              {or.devis?.lignes.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted uppercase">
                      <tr>
                        <th className="py-2">Désignation</th>
                        <th className="py-2">Type</th>
                        <th className="py-2 text-right">Qté</th>
                        <th className="py-2 text-right">PU HT</th>
                        <th className="py-2 text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {or.devis.lignes.map((l) => (
                        <tr key={l.id} className="border-t border-border">
                          <td className="py-2">{l.designation}</td>
                          <td className="py-2 text-xs text-muted">{l.type.replaceAll("_", " ")}</td>
                          <td className="py-2 text-right">{l.quantite}</td>
                          <td className="py-2 text-right">{formatMAD(Number(l.prixUnitaireHT))}</td>
                          <td className="py-2 text-right">{formatMAD(Number(l.prixUnitaireHT) * l.quantite)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border font-semibold">
                        <td colSpan={4} className="py-2 text-right">
                          Total HT
                        </td>
                        <td className="py-2 text-right">{formatMAD(Number(or.devis.montantHT))}</td>
                      </tr>
                      <tr className="font-semibold text-primary-700">
                        <td colSpan={4} className="py-1 text-right">
                          Total TTC
                        </td>
                        <td className="py-1 text-right">{formatMAD(Number(or.devis.montantTTC))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted">Aucune ligne de devis pour le moment.</p>
              )}

              {oneOf(session.role, Role.PRICING, Role.RESPONSABLE_SAV, Role.ADMIN, Role.RECEPTIONNAIRE) && (
                <DevisEditor
                  ordreReparationId={or.id}
                  lignes={or.devis?.lignes.map((l) => ({ id: l.id, designation: l.designation })) ?? []}
                  peutPublier={
                    !!or.devis?.lignes.length &&
                    or.devis.statut === StatutDevis.BROUILLON &&
                    oneOf(session.role, Role.PRICING, Role.RESPONSABLE_SAV, Role.ADMIN)
                  }
                  pieces={pieces.map((p) => ({ id: p.id, label: `${p.designation} — ${formatMAD(Number(p.prixHT))}` }))}
                  forfaits={forfaits.map((f) => ({
                    id: f.id,
                    label: `${f.nom} — ${formatMAD(Number(f.prixFixeHT))}`,
                  }))}
                />
              )}

              {session.role === Role.CLIENT && or.devis?.statut === StatutDevis.PUBLIE && (
                <ValidationDevisClient ordreReparationId={or.id} montantTTC={Number(or.devis.montantTTC)} />
              )}
            </CardContent>
          </Card>

          {/* État des lieux photo (§4.3) */}
          <Card>
            <CardHeader>
              <CardTitle>État des lieux à la réception</CardTitle>
              <p className="text-xs text-muted">
                Rayures, chocs et anomalies constatés à l&apos;arrivée du véhicule.
              </p>
            </CardHeader>
            <CardContent>
              <PhotosEtatDesLieux
                ordreReparationId={or.id}
                photos={or.etatDesLieuxPhotos}
                peutModifier={oneOf(
                  session.role,
                  Role.RECEPTIONNAIRE,
                  Role.CHEF_ATELIER,
                  Role.RESPONSABLE_SAV,
                  Role.ADMIN
                )}
              />
            </CardContent>
          </Card>

          {/* Interventions */}
          <Card>
            <CardHeader>
              <CardTitle>Interventions atelier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {or.lignesIntervention.map((li) => (
                <div key={li.id} className="rounded-lg border border-border p-3 text-sm">
                  <p>{li.description}</p>
                  <p className="mt-1 text-xs text-muted">
                    {li.technicien.prenom} {li.technicien.nom} — {li.tempsPasseMin} min — {formatDate(li.createdAt)}
                  </p>
                </div>
              ))}
              {or.lignesIntervention.length === 0 && (
                <p className="text-sm text-muted">Aucune intervention saisie.</p>
              )}
              {oneOf(session.role, Role.TECHNICIEN, Role.CHEF_ATELIER, Role.ADMIN) && (
                <div className="border-t border-border pt-4">
                  <InterventionForm ordreReparationId={or.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dossier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>
                <span className="text-muted">Client :</span> {or.client.user.prenom} {or.client.user.nom}
              </p>
              <p>
                <span className="text-muted">Téléphone :</span> {or.client.user.telephone ?? "—"}
              </p>
              <p>
                <span className="text-muted">Motif :</span> {or.motifVisite.replaceAll("_", " ")}
              </p>
              <p>
                <span className="text-muted">Équipe :</span> {or.equipeAtelier?.replaceAll("_", " ") ?? "—"}
              </p>
              <p>
                <span className="text-muted">Ouvert le :</span> {formatDateTime(or.createdAt)}
              </p>
              {or.etatDesLieuxNotes && (
                <p>
                  <span className="text-muted">État des lieux :</span> {or.etatDesLieuxNotes}
                </p>
              )}
              {or.sinistre && (
                <>
                  <p className="pt-2 font-medium text-foreground">Dossier sinistre</p>
                  <p>
                    <span className="text-muted">Assurance :</span> {or.compagnieAssurance ?? "—"}
                  </p>
                  <p>
                    <span className="text-muted">Expertise :</span> {or.statutExpertise?.replaceAll("_", " ") ?? "—"}
                  </p>
                </>
              )}
              {or.controleQualiteOk !== null && (
                <p>
                  <span className="text-muted">Contrôle qualité :</span>{" "}
                  {or.controleQualiteOk ? "Conforme" : "Non conforme"}
                </p>
              )}
            </CardContent>
          </Card>

          {or.reservationsPieces.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pièces réservées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {or.reservationsPieces.map((r) => (
                  <div key={r.id} className="flex justify-between">
                    <span>
                      {r.piece.designation} × {r.quantite}
                    </span>
                    <Badge variant={r.statut === "UTILISEE" ? "success" : "warning"}>{r.statut}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {or.facture && (
            <Card>
              <CardHeader>
                <CardTitle>Facture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{or.facture.numero}</p>
                <p>{formatMAD(Number(or.facture.montantTTC))} TTC</p>
                <Badge variant={or.facture.statutPaiement === "PAYEE" ? "success" : "warning"}>
                  {or.facture.statutPaiement.replaceAll("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          )}

          {session.role !== Role.CLIENT && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowActions
                  ordreReparationId={or.id}
                  statut={or.statut}
                  role={session.role}
                  devisValide={or.devis?.statut === StatutDevis.VALIDE}
                  dejaFacture={!!or.facture}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
