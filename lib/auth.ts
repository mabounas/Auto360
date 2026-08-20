import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@/app/generated/prisma/client";

const SESSION_COOKIE = "auto360_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-only-secret");

export type SessionPayload = {
  userId: string;
  role: Role;
  nom: string;
  prenom: string;
  // Périmètre de visibilité : site précis, sinon enseigne entière, sinon tout le parc.
  siteId: string | null;
  compagnieId: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
