import Link from "next/link";
import Image from "next/image";
import {
  Wrench,
  PaintBucket,
  CircleGauge,
  Snowflake,
  ShieldCheck,
  PackageSearch,
  Search,
  MapPin,
  Star,
} from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { SERVICE_TYPES, VILLES_COUVERTES } from "@/lib/constants";

const SERVICE_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  DIAGNOSTIC: Search,
  ENTRETIEN_REVISION: Wrench,
  MECANIQUE_ELECTRICITE: CircleGauge,
  CLIMATISATION_CONFORT: Snowflake,
  PNEUMATIQUE: CircleGauge,
  CARROSSERIE_ESTHETIQUE: PaintBucket,
  CONTROLE_TECHNIQUE: ShieldCheck,
  PIECES_RECHANGE: PackageSearch,
};

const STEPS = [
  {
    n: "01",
    title: "Choisissez votre service",
    body: "Diagnostic, entretien, mécanique, carrosserie, pneus, contrôle technique ou pièces de rechange.",
  },
  {
    n: "02",
    title: "Trouvez le centre le plus proche",
    body: "Le réseau Auto360 couvre les grandes villes du Maroc, avec de nouveaux centres ouverts régulièrement.",
  },
  {
    n: "03",
    title: "Réservez votre créneau",
    body: "Un calendrier de disponibilité propre à chaque service : vous ne voyez que les créneaux réellement libres.",
  },
  {
    n: "04",
    title: "Suivez votre dossier en temps réel",
    body: "Devis en ligne, validation à distance, avancement de l'intervention et facture, depuis votre espace client.",
  },
];

// Photos du réseau après-vente Auto Hall (source : autohall.ma, rubrique Service Après-Vente)
const METIERS = [
  {
    src: "/images/entretien.jpg",
    titre: "Entretien",
    texte: "Révisions périodiques, vidange et filtration par des techniciens certifiés.",
  },
  {
    src: "/images/mecanique.jpg",
    titre: "Mécanique & électricité",
    texte: "Diagnostic électronique et réparation mécanique sur outillage constructeur.",
  },
  {
    src: "/images/carrosserie.jpg",
    titre: "Carrosserie",
    texte: "Tôlerie, peinture et lustrage, avec prise en charge des dossiers assurance.",
  },
  {
    src: "/images/pieces-rechange.jpg",
    titre: "Pièces de rechange",
    texte: "Pièces d'origine disponibles au comptoir ou commandées sur référence.",
  },
];

const AVIS = [
  {
    quote: "Prise en charge rapide, devis clair, et ma voiture était prête dans les temps annoncés.",
    author: "Client Auto360 — Casablanca",
  },
  {
    quote: "J'ai réservé en ligne en deux minutes et j'ai eu un centre à deux pas de chez moi.",
    author: "Client Auto360 — Rabat",
  },
  {
    quote: "Techniciens sérieux, pièces d'origine, aucune mauvaise surprise à la facture.",
    author: "Client Auto360 — Marrakech",
  },
];

const FAQ = [
  {
    q: "Comment réserver un service Auto360 ?",
    a: "Créez votre espace client, ajoutez votre véhicule, puis choisissez un service et un centre : vous ne verrez que les créneaux réellement disponibles pour cette prestation.",
  },
  {
    q: "Les devis sont-ils gratuits ?",
    a: "Oui. Après diagnostic, notre équipe de chiffrage établit un devis détaillé que vous validez en ligne avant toute intervention.",
  },
  {
    q: "Comment suivre l'avancement de ma réparation ?",
    a: "Votre espace client affiche le statut de votre ordre de réparation en temps réel, de l'accueil du véhicule jusqu'à sa restitution.",
  },
  {
    q: "Que se passe-t-il en cas de rappel constructeur ?",
    a: "Si votre véhicule est concerné par une campagne de rappel sécurité, vous êtes notifié automatiquement et invité à prendre rendez-vous.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold tracking-wide text-primary-700 uppercase">
            Réseau national de service après-vente
          </span>
          <h1 className="mt-4 max-w-xl text-4xl leading-[1.08] font-extrabold tracking-tight text-primary-900 sm:text-5xl">
            Votre voiture, entre de bonnes mains. Partout au Maroc.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
            Auto360 est notre réseau de centres de service après-vente pour l&apos;entretien, la
            réparation et l&apos;assistance automobile — prise de rendez-vous en ligne, devis
            transparent et suivi en temps réel.
          </p>

          <Card className="mt-8 max-w-xl p-4">
            <form action="/register" className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px] flex-1">
                <label className="mb-1 block text-xs font-medium text-muted">Service</label>
                <select
                  name="service"
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  defaultValue={SERVICE_TYPES[0].code}
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px] flex-1">
                <label className="mb-1 block text-xs font-medium text-muted">Ville</label>
                <input
                  name="ville"
                  placeholder="ex : Casablanca"
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                />
              </div>
              <Button type="submit" variant="accent">
                Réserver un créneau
              </Button>
            </form>
          </Card>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg lg:aspect-[3/2]">
          <Image
            src="/images/sav-hero.jpg"
            alt="Technicien réalisant un diagnostic électronique à bord d'un véhicule"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-10 sm:px-8 md:grid-cols-4">
          {[
            ["XX", "Centres partenaires"],
            ["XX", "Villes couvertes"],
            ["XX 000+", "Clients servis"],
            ["X.X/5", "Note moyenne clients"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-primary-700">{value}</p>
              <p className="mt-1 text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-6 text-xs text-muted italic sm:px-8">
          Chiffres à remplacer par vos données réelles une fois le réseau de centres renseigné.
        </p>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <span className="mb-6 block text-xs font-semibold tracking-wide text-accent-600 uppercase">
          Comment ça marche
        </span>
        <div className="divide-y divide-border border-t border-border">
          {STEPS.map((s) => (
            <div key={s.n} className="grid gap-3 py-6 sm:grid-cols-[70px_1fr_1.4fr] sm:items-baseline">
              <p className="text-sm font-extrabold text-primary-700">{s.n}</p>
              <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
              <p className="max-w-lg text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <span className="mb-2 block text-xs font-semibold tracking-wide text-accent-600 uppercase">
            Nos services
          </span>
          <h2 className="mb-8 text-2xl font-extrabold text-primary-900 sm:text-3xl">
            Tout l&apos;après-vente automobile, au même endroit
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_TYPES.map((s) => {
              const Icon = SERVICE_ICONS[s.code] ?? Wrench;
              return (
                <Card key={s.code} className="p-5">
                  <Icon size={26} className="text-accent-500" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{s.nom}</p>
                  <p className="mt-1 text-xs text-muted">{s.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Métiers en photos */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <span className="mb-2 block text-xs font-semibold tracking-wide text-accent-600 uppercase">
          Nos métiers
        </span>
        <h2 className="mb-8 text-2xl font-extrabold text-primary-900 sm:text-3xl">
          Des ateliers équipés, des techniciens certifiés
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {METIERS.map((m) => (
            <figure key={m.titre} className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image
                  src={m.src}
                  alt={m.titre}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-4">
                <p className="text-sm font-semibold text-foreground">{m.titre}</p>
                <p className="mt-1 text-xs text-muted">{m.texte}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Centres */}
      <section id="centres" className="bg-primary-50/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[5fr_7fr]">
          <div>
            <span className="mb-2 block text-xs font-semibold tracking-wide text-accent-600 uppercase">
              Nos centres
            </span>
            <h2 className="mb-4 text-2xl font-extrabold text-primary-900">
              Un réseau présent dans toutes les villes du Maroc
            </h2>
            <p className="mb-5 max-w-md text-sm text-muted">
              Des centres Auto360 équipés et des techniciens certifiés, proches de chez vous où que
              vous soyez.
            </p>
            <div className="flex flex-wrap gap-2">
              {VILLES_COUVERTES.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded-full border border-primary-300 px-3 py-1 text-xs font-medium text-primary-700"
                >
                  <MapPin size={12} /> {v}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full border border-primary-300 px-3 py-1 text-xs font-medium text-primary-700">
                et bien d&apos;autres villes
              </span>
            </div>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border shadow-sm">
            <Image
              src="/images/atelier-tanger.jpg"
              alt="Centre de service après-vente du réseau, façade et parvis"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Avis */}
      <section id="avis" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <span className="mb-8 block text-xs font-semibold tracking-wide text-accent-600 uppercase">
          Avis clients
        </span>
        <div className="grid gap-5 sm:grid-cols-3">
          {AVIS.map((a) => (
            <Card key={a.author} className="p-5">
              <div className="mb-2 flex gap-0.5 text-accent-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="text-sm text-foreground">&laquo; {a.quote} &raquo;</p>
              <p className="mt-3 text-xs font-medium text-muted">{a.author}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Espace client CTA */}
      <section className="bg-primary-50/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-12 sm:px-8">
          <div>
            <h2 className="mb-1 text-xl font-extrabold text-primary-900">
              Gérez vos rendez-vous depuis votre espace client
            </h2>
            <p className="max-w-md text-sm text-muted">
              Historique véhicule, devis, factures et messagerie avec votre centre, accessibles à
              tout moment.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="secondary">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild variant="accent">
              <Link href="/register">Créer mon espace client</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <span className="mb-6 block text-xs font-semibold tracking-wide text-accent-600 uppercase">
          Questions fréquentes
        </span>
        <div className="divide-y divide-border border-t border-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="cursor-pointer list-none text-sm font-bold text-foreground marker:content-none">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary-700">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-14 sm:px-8">
          <h2 className="max-w-xl text-2xl font-extrabold text-white sm:text-3xl">
            Réservez votre service Auto360 dès maintenant.
          </h2>
          <Button asChild size="lg" className="border border-white bg-transparent text-white hover:bg-white/10">
            <Link href="/register">Réserver un service</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-8 px-5 py-10 text-sm text-muted sm:px-8">
        <div>
          <p className="mb-1 font-extrabold text-primary-900">Auto360</p>
          <p>Réseau national de service après-vente automobile.</p>
        </div>
        <div className="flex flex-wrap gap-10">
          <div>
            <p className="mb-2 font-medium text-foreground">Contact</p>
            <p>contact@auto360.ma</p>
            <p>+212 5XX XX XX XX</p>
          </div>
          <div>
            <p className="mb-2 font-medium text-foreground">Liens</p>
            <p>
              <a href="#services" className="hover:text-primary-700">
                Services
              </a>
            </p>
            <p>
              <a href="#centres" className="hover:text-primary-700">
                Nos centres
              </a>
            </p>
            <p>
              <a href="#faq" className="hover:text-primary-700">
                FAQ
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
