import { createClient } from "@/lib/supabase/server";
import { getPropertyById } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

type PropertyRecord = Property & {
  slug: string;
  owner_id: string;
};

function recordToProperty(record: PropertyRecord): Property {
  return {
    id: record.slug,
    name: record.name,
    address: record.address ?? "",
    city: record.city ?? "",
    region: record.region ?? "",
    status: record.status,
    units: getPropertyById(record.slug)?.units ?? [],
    documents: getPropertyById(record.slug)?.documents ?? [],
    tenants: getPropertyById(record.slug)?.tenants ?? [],
    notes: record.notes ?? ""
  };
}

export async function getPropertyForDisplay(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("slug, name, address, city, region, status, notes, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (data && !error) {
    return recordToProperty(data as PropertyRecord);
  }

  return getPropertyById(slug) ?? null;
}
