// Identification du véhicule, affichée partout de la même façon pour l'atelier.
//
// En réception comme en baie, l'immatriculation seule ne suffit pas : deux véhicules
// peuvent porter des plaques proches, et le numéro de châssis (VIN) est la référence
// qui figure sur la carte grise et les commandes de pièces. Les deux sont donc
// systématiquement rappelés sur les écrans du personnel.

export function VehiculeIdentite({
  immatriculation,
  vin,
  marque,
  modele,
  className = "",
}: {
  immatriculation: string;
  vin: string;
  marque?: string;
  modele?: string;
  className?: string;
}) {
  return (
    <span className={`block text-xs text-muted ${className}`}>
      {(marque || modele) && (
        <span className="text-foreground">
          {[marque, modele].filter(Boolean).join(" ")}
          {" — "}
        </span>
      )}
      <span className="font-medium text-foreground">{immatriculation}</span>
      {/* Espaces insécables autour du séparateur : sans eux les deux identifiants
          se collent et deviennent illisibles d'un coup d'œil en atelier. */}
      <span className="text-border">{" · "}</span>
      <span className="font-mono whitespace-nowrap" title="Numéro de châssis (VIN)">
        VIN&nbsp;{vin}
      </span>
    </span>
  );
}
