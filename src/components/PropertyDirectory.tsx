"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Property } from "@/lib/types";
type PropertyDirectoryProps = {
  properties: Property[];
  role: string;
};

export function PropertyDirectory({ properties }: PropertyDirectoryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return properties.filter((property) => {
      const matchesSearch =
        !query ||
        [property.name, property.address, property.city, property.region, property.tenants.map((tenant) => tenant.name).join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "All" || property.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  return (
    <section className="stack-lg">
      <div className="toolbar">
        <label className="search-field">
          <span>Search properties, units, or tenants</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Maple Court or Jordan Lee" />
        </label>

        <label className="select-field">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Needs review</option>
            <option>Vacant</option>
          </select>
        </label>
      </div>

      <div className="property-grid">
        {filtered.map((property) => {
          const occupiedUnits = property.units.filter((unit) => unit.status === "Occupied").length;
          const vacantUnits = property.units.filter((unit) => unit.status === "Vacant").length;

          return (
            <Link key={property.id} href={`/properties/${property.id}`} className="property-card">
              <div className="property-card-top">
                <div>
                  <p className="eyebrow">{property.status}</p>
                  <h3>{property.name}</h3>
                  <p className="muted">
                    {property.address}, {property.city}, {property.region}
                  </p>
                </div>
                <span className={`status-pill status-${property.status.toLowerCase().replace(/\s+/g, "-")}`}>{property.status}</span>
              </div>

              <div className="property-metrics">
                <div>
                  <strong>{property.units.length}</strong>
                  <span>Units</span>
                </div>
                <div>
                  <strong>{occupiedUnits}</strong>
                  <span>Occupied</span>
                </div>
                <div>
                  <strong>{vacantUnits}</strong>
                  <span>Vacant</span>
                </div>
              </div>

              <p className="card-note">{property.notes}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
