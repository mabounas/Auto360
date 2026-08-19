"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#centres", label: "Nos centres" },
  { href: "#avis", label: "Avis" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-primary-700">
          Auto360
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/80 hover:text-primary-700">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-primary-700">
            Se connecter
          </Link>
          <Button asChild size="sm" variant="accent">
            <Link href="/register">Réserver un service</Link>
          </Button>
        </div>
        <button
          className="grid h-9 w-9 place-items-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-border bg-white px-5 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <Link href="/login" className="text-sm font-medium">
              Se connecter
            </Link>
            <Button asChild size="sm" variant="accent">
              <Link href="/register">Réserver un service</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
