// Reseau Peugeot au Maroc — 7 points de service geolocalises.
//
// Source : OpenStreetMap, extraction via l'API Overpass (objets tagues shop=car et
// shop=car_repair, filtres sur la marque), puis villes et quartiers completes par
// geocodage inverse Nominatim. Donnees sous licence ODbL : reutilisables et stockables,
// contrairement aux resultats de l'API Google Places dont les conditions d'utilisation
// interdisent la conservation durable.
//
// Releve le 19/08/2026.
//
// Ce jeu sert a demontrer le fonctionnement multi-compagnies de la plateforme : il
// illustre une couverture reseau reelle, sans pretendre a l'exhaustivite du reseau
// officiel de la marque.

import type { SiteReseau } from "./types";

export const SITES_PEUGEOT: SiteReseau[] = [
  {"code":"PGT-AGAD01","nom":"Peugeot Agadir","ville":"Agadir","adresse":"Amsernate, Agadir","telephone":null,"latitude":30.416403,"longitude":-9.579209,"marques":["Peugeot"]},
  {"code":"PGT-OUJD01","nom":"Peugeot Oujda","ville":"Oujda","adresse":"Hay Ben Ramdan, Oujda","telephone":"+212 672528316","latitude":34.687559,"longitude":-1.916728,"marques":["Peugeot"]},
  {"code":"PGT-MEKN01","nom":"Peugeot Meknès","ville":"Meknès","adresse":"Zahwa, Meknès","telephone":null,"latitude":33.899574,"longitude":-5.520984,"marques":["Peugeot"]},
  {"code":"PGT-KENI01","nom":"Peugeot Kénitra","ville":"Kénitra","adresse":"Hay Maamora, Kénitra","telephone":"+212 5 37 36 86 27","latitude":34.241104,"longitude":-6.571823,"marques":["Peugeot"]},
  {"code":"PGT-CASA01","nom":"Peugeot Casablanca","ville":"Casablanca","adresse":"Arrondissement d'Anfa, Casablanca","telephone":null,"latitude":33.577845,"longitude":-7.672894,"marques":["Peugeot"]},
  {"code":"PGT-MARR01","nom":"Peugeot Marrakech","ville":"Marrakech","adresse":"Arrondissement de Gueliz, Marrakech","telephone":null,"latitude":31.66688,"longitude":-8.013309,"marques":["Peugeot"]},
  {"code":"PGT-TETO01","nom":"Citroën Peugeot","ville":"Tétouan","adresse":"Tanger-Tétouan-Al Hoceïma, Tétouan","telephone":null,"latitude":35.604652,"longitude":-5.334708,"marques":["Peugeot"]},
];
