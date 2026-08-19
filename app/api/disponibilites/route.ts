import { NextRequest, NextResponse } from "next/server";
import { getCreneauxDisponibles, getJoursDisponibles } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId");
  const serviceTypeId = searchParams.get("serviceTypeId");
  const date = searchParams.get("date");

  if (!siteId || !serviceTypeId) {
    return NextResponse.json({ error: "siteId et serviceTypeId requis." }, { status: 400 });
  }

  if (date) {
    const creneaux = await getCreneauxDisponibles(siteId, serviceTypeId, new Date(date));
    return NextResponse.json({ creneaux });
  }

  const jours = await getJoursDisponibles(siteId, serviceTypeId, new Date());
  return NextResponse.json({ jours });
}
