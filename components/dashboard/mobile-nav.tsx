"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { LogoutButton } from "./logout-button";
import type { NavItem } from "@/lib/nav";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="grid h-9 w-9 place-items-center rounded-lg border border-border"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <div className="absolute top-11 right-0 z-40 w-56 rounded-xl bg-primary-900 shadow-lg" onClick={() => setOpen(false)}>
          <Sidebar items={items} />
          <div className="border-t border-white/10 p-1 pb-2">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
