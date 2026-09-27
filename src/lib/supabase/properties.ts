import { createClient } from "@/lib/supabase/server";
import { getPropertyById, getVisibleProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

type PropertyRecord = {
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  status: Property["status"];
  property_owner: string | null;
  notes: string | null;
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

type UnitRecord = {
  source_unit_id: string | null;
  property_id: string;
  unit_number: string;
  unit_type: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  rent_amount: number | null;
  lease_term: "Standard" | "Monthly" | null;
  lease_start: string | null;
  lease_end: string | null;
  rent_due_day: number | null;
  utilities: string[] | null;
  status: string;
  notes: string | null;
};

function toDisplayUnitStatus(value: string) {
  if (value === "occupied") {
    return "Occupied";
  }

  if (value === "maintenance") {
    return "Maintenance";
  }

  return "Vacant";
}

function mergePropertyRecord(base: Property, record: Partial<PropertyRecord>): Property {
  return {
    ...base,
    name: record.name ?? base.name,
    address: record.address ?? base.address,
    city: record.city ?? base.city,
    region: record.region ?? base.region,
    propertyOwner: record.property_owner ?? base.propertyOwner ?? "",
    status: record.status ?? base.status,
    notes: record.notes ?? base.notes
  };
}

function propertyFromRecord(record: PropertyRecord): Property {
  return {
    id: record.slug,
    name: record.name,
    address: record.address ?? "",
    city: record.city ?? "",
    region: record.region ?? "",
    propertyOwner: record.property_owner ?? "",
    status: record.status,
    units: [],
    documents: [],
    tenants: [],
    notes: record.notes ?? ""
  };
}

function hydrateTenants(baseProperty: Property, rows: TenantRecord[]) {
  const propertyRows = rows.filter((tenant) => tenant.property_slug === baseProperty.id);
  const databaseUnitIds = new Set(propertyRows.map((tenant) => tenant.unit_id));
  const tenantsById = new Map(baseProperty.tenants.filter((tenant) => !databaseUnitIds.has(tenant.unitId)).map((tenant) => [tenant.id, tenant]));

  propertyRows.forEach((tenant) => {
    tenantsById.set(tenant.id, {
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

  return Array.from(tenantsById.values());
}

function hydrateUnits(baseProperty: Property, rows: UnitRecord[]) {
  const unitsBySourceId = new Map(baseProperty.units.map((unit) => [unit.id, unit]));

  rows
    .filter((unit) => unit.property_id === baseProperty.id)
    .forEach((unit) => {
      const sourceId = unit.source_unit_id ?? `${baseProperty.id}-${unit.unit_number}`;
      unitsBySourceId.set(sourceId, {
        id: sourceId,
        propertyId: baseProperty.id,
        number: unit.unit_number,
        type: unit.unit_type ?? (unit.bedrooms !== null && unit.bathrooms !== null ? `${unit.bedrooms} Bed ${unit.bathrooms} Bath` : ""),
        status: toDisplayUnitStatus(unit.status),
        notes: unit.notes ?? "",
        leaseTerm: unit.lease_term ?? "Standard",
        leaseStart: unit.lease_start ?? "",
        leaseEnd: unit.lease_end ?? "",
        rentAmount: unit.rent_amount,
        rentDueDay: unit.rent_due_day,
        utilities: unit.utilities ?? ["Water"],
        tenantId: baseProperty.tenants.find((tenant) => tenant.unitId === sourceId)?.id
      });
    });

  return Array.from(unitsBySourceId.values());
}

function hydrateFromSupabase(
  baseProperties: Property[],
  rows: PropertyRecord[],
  tenantRows: TenantRecord[],
  unitRows: UnitRecord[]
) {
  const recordsBySlug = new Map(rows.map((row) => [row.slug, row]));
  const baseBySlug = new Map(baseProperties.map((property) => [property.id, property]));
  const allProperties = [
    ...baseProperties,
    ...rows.filter((row) => !baseBySlug.has(row.slug)).map(propertyFromRecord)
  ];

  return allProperties.map((property) => {
    const record = recordsBySlug.get(property.id);
    const mergedProperty = record ? mergePropertyRecord(property, record) : property;

    return {
      ...mergedProperty,
      units: hydrateUnits(mergedProperty, unitRows),
      tenants: hydrateTenants(mergedProperty, tenantRows)
    };
  });
}

export async function getPropertyForDisplay(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("slug, name, address, city, region, property_owner, status, notes, owner_id")
    .eq("slug", slug)
    .maybeSingle();
  const { data: tenantData } = await supabase
    .from("tenants")
    .select("id, unit_id, property_slug, owner_id, name, phone, email, lease_start, lease_end, lease_file_name")
    .eq("property_slug", slug);
  const { data: unitData } = await supabase
    .from("units")
    .select("source_unit_id, property_id, unit_number, unit_type, address, bedrooms, bathrooms, square_feet, rent_amount, lease_term, lease_start, lease_end, rent_due_day, utilities, status, notes")
    .eq("property_id", slug);

  if (data && !error) {
    const record = data as PropertyRecord;
    const baseProperty = getPropertyById(slug) ?? propertyFromRecord(record);

    return {
      ...mergePropertyRecord(baseProperty, record),
      units: hydrateUnits(baseProperty, (unitData ?? []) as UnitRecord[]),
      tenants: hydrateTenants(baseProperty, (tenantData ?? []) as TenantRecord[])
    };
  }

  return getPropertyById(slug) ?? null;
}

export async function getVisiblePropertiesForDisplay(role: string) {
  const baseProperties = getVisibleProperties(role);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("slug, name, address, city, region, property_owner, status, notes, owner_id");

  if (!data || error) {
    return baseProperties;
  }

  const propertyRows = data as PropertyRecord[];
  const slugs = Array.from(new Set([...baseProperties.map((property) => property.id), ...propertyRows.map((row) => row.slug)]));
  const { data: tenantData } = await supabase
    .from("tenants")
    .select("id, unit_id, property_slug, owner_id, name, phone, email, lease_start, lease_end, lease_file_name")
    .in("property_slug", slugs);
  const { data: unitData } = await supabase
    .from("units")
    .select("source_unit_id, property_id, unit_number, unit_type, address, bedrooms, bathrooms, square_feet, rent_amount, lease_term, lease_start, lease_end, rent_due_day, utilities, status, notes")
    .in("property_id", slugs);

  return hydrateFromSupabase(
    baseProperties,
    propertyRows,
    (tenantData ?? []) as TenantRecord[],
    (unitData ?? []) as UnitRecord[]
  );
}
