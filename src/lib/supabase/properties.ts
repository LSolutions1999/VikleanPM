import { createClient } from "@/lib/supabase/server";
import { getPropertyById, getVisibleProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

type PropertyRecord = Property & {
  slug: string;
  owner_id: string;
};

type TenantRecord = {
  id: string;
  unit_id: string;
  property_slug: string;
  owner_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lease_start: string | null;
  lease_end: string | null;
  lease_file_name: string | null;
};

function mergePropertyRecord(base: Property, record: Partial<PropertyRecord>): Property {
  return {
    ...base,
    name: record.name ?? base.name,
    address: record.address ?? base.address,
    city: record.city ?? base.city,
    region: record.region ?? base.region,
    status: record.status ?? base.status,
    notes: record.notes ?? base.notes
  };
}

function hydrateTenants(baseProperty: Property, rows: TenantRecord[]) {
  const tenantsByUnitId = new Map(baseProperty.tenants.map((tenant) => [tenant.unitId, tenant]));

  rows
    .filter((tenant) => tenant.property_slug === baseProperty.id)
    .forEach((tenant) => {
      tenantsByUnitId.set(tenant.unit_id, {
        id: tenant.id,
        propertyId: tenant.property_slug,
        unitId: tenant.unit_id,
        name: tenant.name,
        phone: tenant.phone ?? "",
        email: tenant.email ?? "",
        leaseStart: tenant.lease_start ?? "",
        leaseEnd: tenant.lease_end ?? "",
        leaseFileName: tenant.lease_file_name ?? ""
      });
    });

  return Array.from(tenantsByUnitId.values());
}

function hydrateFromSupabase(baseProperties: Property[], rows: PropertyRecord[], tenantRows: TenantRecord[]) {
  const recordsBySlug = new Map(rows.map((row) => [row.slug, row]));

  return baseProperties.map((property) => {
    const record = recordsBySlug.get(property.id);
    const mergedProperty = record ? mergePropertyRecord(property, record) : property;

    return {
      ...mergedProperty,
      tenants: hydrateTenants(mergedProperty, tenantRows)
    };
  });
}

export async function getPropertyForDisplay(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("slug, name, address, city, region, status, notes, owner_id")
    .eq("slug", slug)
    .maybeSingle();
  const { data: tenantData } = await supabase
    .from("tenants")
    .select("id, unit_id, property_slug, owner_id, name, phone, email, lease_start, lease_end, lease_file_name")
    .eq("property_slug", slug);

  if (data && !error) {
    const baseProperty = getPropertyById(slug);

    if (!baseProperty) {
      return null;
    }

    return {
      ...mergePropertyRecord(baseProperty, data as PropertyRecord),
      tenants: hydrateTenants(baseProperty, (tenantData ?? []) as TenantRecord[])
    };
  }

  return getPropertyById(slug) ?? null;
}

export async function getVisiblePropertiesForDisplay(role: string) {
  const baseProperties = getVisibleProperties(role);
  const supabase = await createClient();
  const slugs = baseProperties.map((property) => property.id);

  if (!slugs.length) {
    return baseProperties;
  }

  const { data, error } = await supabase
    .from("properties")
    .select("slug, name, address, city, region, status, notes, owner_id")
    .in("slug", slugs);
  const { data: tenantData } = await supabase
    .from("tenants")
    .select("id, unit_id, property_slug, owner_id, name, phone, email, lease_start, lease_end, lease_file_name")
    .in("property_slug", slugs);

  if (!data || error) {
    return baseProperties;
  }

  return hydrateFromSupabase(baseProperties, data as PropertyRecord[], (tenantData ?? []) as TenantRecord[]);
}
