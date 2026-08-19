// Reseau Renault au Maroc — 14 points de service geolocalises.
//
// Source : OpenStreetMap, extraction via l'API Overpass (objets tagues shop=car et
// shop=car_repair, filtres sur la marque), puis villes et quartiers completes par
// geocodage inverse Nominatim. Donnees sous licence ODbL : reutilisables et stockables,
// contrairement aux resultats de l'API Google Places dont les conditions d'utilisation
// interdisent la conservation durable.
//
// Releve le 19/08/2026. Deux points distants de moins de 150 m ont ete fusionnes (doublon OSM).
//
// Ce jeu sert a demontrer le fonctionnement multi-compagnies de la plateforme : il
// illustre une couverture reseau reelle, sans pretendre a l'exhaustivite du reseau
// officiel de la marque.

import type { SiteReseau } from "./types";

export const SITES_RENAULT: SiteReseau[] = [
  {"code":"RNL-CASA01","nom":"Renault Casablanca","ville":"Casablanca","adresse":"Arrondissement de Sidi Belyout, Casablanca","telephone":null,"latitude":33.591978,"longitude":-7.606707,"marques":["Renault","Dacia"]},
  {"code":"RNL-OUJD01","nom":"Auto Confiance","ville":"Oujda","adresse":"Hay Al Massira, Oujda","telephone":"+212 536684249","latitude":34.6853,"longitude":-1.914309,"marques":["Renault","Dacia"]},
  {"code":"RNL-MARR01","nom":"Renault Marrakech","ville":"Marrakech","adresse":"Arrondissement de Gueliz, Marrakech","telephone":null,"latitude":31.657302,"longitude":-8.018315,"marques":["Renault","Dacia"]},
  {"code":"RNL-MOHA01","nom":"Renault Mohammedia","ville":"Mohammedia","adresse":"Casablanca-Settat, Mohammedia","telephone":null,"latitude":33.683575,"longitude":-7.409801,"marques":["Renault","Dacia"]},
  {"code":"RNL-CASA02","nom":"Rahmouni Renault Dacia","ville":"Casablanca","adresse":"Arrondissement de Sidi Belyout, Casablanca","telephone":null,"latitude":33.599542,"longitude":-7.633527,"marques":["Renault","Dacia"]},
  {"code":"RNL-BERK01","nom":"Maison Renault Dacia","ville":"Berkane","adresse":"Douar El Mika Zalaka, Berkane","telephone":null,"latitude":34.931431,"longitude":-2.326849,"marques":["Renault","Dacia"]},
  {"code":"RNL-OUJD02","nom":"Renault Oujda","ville":"Oujda","adresse":"Hay Al Wahda, Oujda","telephone":null,"latitude":34.680368,"longitude":-1.934664,"marques":["Renault","Dacia"]},
  {"code":"RNL-CASA03","nom":"Renault Académie Maroc","ville":"Casablanca","adresse":"Arrondissement d'Aïn Sebaâ, Casablanca","telephone":null,"latitude":33.603321,"longitude":-7.534982,"marques":["Renault","Dacia"]},
  {"code":"RNL-AGAD01","nom":"Renault Agadir","ville":"Agadir","adresse":"Quartier Industriel, Agadir","telephone":null,"latitude":30.419225,"longitude":-9.578949,"marques":["Renault","Dacia"]},
  {"code":"RNL-CASA04","nom":"Renault Casablanca","ville":"Casablanca","adresse":"Arrondissement du Maârif, Casablanca","telephone":null,"latitude":33.586677,"longitude":-7.638456,"marques":["Renault","Dacia"]},
  {"code":"RNL-CASA05","nom":"Showroom Renault-Dacia","ville":"Casablanca","adresse":"Arrondissement d'Aïn-Chock, Casablanca","telephone":null,"latitude":33.520591,"longitude":-7.652961,"marques":["Renault","Dacia"]},
  {"code":"RNL-CASA06","nom":"Renault Casablanca","ville":"Casablanca","adresse":"Arrondissement de Sidi Othmane, Casablanca","telephone":null,"latitude":33.563849,"longitude":-7.55506,"marques":["Renault","Dacia"]},
  {"code":"RNL-RABA01","nom":"Renault Rabat","ville":"Rabat","adresse":"Arrondissement Agdal-Riyad, Rabat","telephone":null,"latitude":33.994632,"longitude":-6.862487,"marques":["Renault","Dacia"]},
  {"code":"RNL-OUAR01","nom":"Renault Ouarzazate","ville":"Ouarzazate","adresse":"Fedragoum, Ouarzazate","telephone":null,"latitude":30.923433,"longitude":-6.928326,"marques":["Renault","Dacia"]},
];
