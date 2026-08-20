import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role, TypeClient } from "@/app/generated/prisma/client";

const schema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().min(6),
  password: z.string().min(6),
  typeClient: z.enum(["PARTICULIER", "ENTREPRISE"]),
  raisonSociale: z.string().optional(),
  consentementRgpd: z.boolean(),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }
  const data = body.data;

  if (!data.consentementRgpd) {
    return NextResponse.json(
      { error: "Le consentement au traitement des données (loi 09-08) est requis." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      telephone: data.telephone,
      passwordHash,
      role: Role.CLIENT,
      nom: data.nom,
      prenom: data.prenom,
      clientProfile: {
        create: {
          typeClient: data.typeClient as TypeClient,
          raisonSociale: data.raisonSociale,
          consentementRgpd: data.consentementRgpd,
        },
      },
    },
  });

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
    nom: user.nom,
    prenom: user.prenom,
    siteId: user.siteId,
    compagnieId: user.compagnieId,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
