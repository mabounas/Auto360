const RAYON_TERRE_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Distance orthodromique (formule de haversine). Suffisamment précise à l'échelle
// du Maroc : l'écart avec une géodésique ellipsoïdale reste sous 0,5 %.
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// Lien d'itinéraire : ouvre l'app de cartographie du téléphone (Google Maps, Plans…).
export function lienItineraire(lat: number, lng: number, label?: string): string {
  const query = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export type AvecPosition = { latitude: number | null; longitude: number | null };

// Trie une liste de sites par éloignement d'un point ; les sites sans coordonnées
// sont rejetés en fin de liste plutôt qu'exclus.
export function trierParDistance<T extends AvecPosition>(
  sites: T[],
  depuisLat: number,
  depuisLng: number
): (T & { distanceKm: number | null })[] {
  return sites
    .map((s) => ({
      ...s,
      distanceKm:
        s.latitude != null && s.longitude != null
          ? distanceKm(depuisLat, depuisLng, s.latitude, s.longitude)
          : null,
    }))
    .sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
