"use server";

import type { ComputedPanchangam, PanchangamLocation } from "@/lib/panchangam";
import { computePanchangamOnServer } from "@/lib/panchangam.server";

export async function getLivePanchangam(
  location: PanchangamLocation,
  dateIso?: string
): Promise<ComputedPanchangam> {
  const date = dateIso ? new Date(dateIso) : new Date();
  return computePanchangamOnServer(location, date);
}
